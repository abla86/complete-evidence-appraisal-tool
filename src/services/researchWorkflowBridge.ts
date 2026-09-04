import { getInstrumentOrNull, type AppraisalSession } from './universalAppraisalService';
import { appraisalWorkflowStore } from './appraisalWorkflowBridge';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';
import type { PICO, ScreeningDecision, ReviewComparison, ReviewInstance, ResolvedAppraisal, DualReviewConfig, PRISMAFlow } from '../types/researchWorkflow';
import { AuditTrailService } from './auditTrailService';
import type { Actor } from './sourceIntakeService';

export interface ScreeningToAppraisalResult {
  studyId: string;
  decision: ScreeningDecision;
  appraisalSession: AppraisalSession;
  instrumentId: string;
  auditEntryId?: string;
}

export function inferInstrumentId(studyDesign: string): string {
  const design = studyDesign.trim().toLowerCase();
  if (/(systematisk|systematic|meta-analyse|meta analysis|systematic review)/i.test(design)) return 'amstar-2';
  if (/(retningslinje|guideline|clinical practice guideline)/i.test(design)) return 'agree-ii';
  if (/(rct|randomisert|randomized)/i.test(design)) return 'rob-2';
  if (/(ikke-randomisert intervensjon|non-randomized intervention|quasi-experimental)/i.test(design)) return 'robins-i';
  if (/(kvalitativ|qualitative)/i.test(design)) return 'jbi-qualitative-2017';
  return MASTER_INSTRUMENTS_REGISTRY[0]?.id ?? 'jbi-qualitative-2017';
}

export function createScreeningDecision(input: Omit<ScreeningDecision, 'timestamp'>): ScreeningDecision {
  return { ...input, timestamp: new Date().toISOString() };
}

export async function triggerAppraisalForIncludedStudy(args: {
  studyId: string;
  studyDesign: string;
  screening: ScreeningDecision;
  reviewerId: string;
  audit?: AuditTrailService;
  actor?: Actor;
}): Promise<ScreeningToAppraisalResult> {
  if (args.screening.studyId !== args.studyId) throw new Error('Screening og studie-ID samsvarer ikke.');
  if (args.screening.decision !== 'include') throw new Error('Kun inkluderte studier kan sendes til appraisal.');
  if (!args.reviewerId.trim()) throw new Error('Reviewer ID er påkrevd.');

  const instrumentId = inferInstrumentId(args.studyDesign);
  const instrument = getInstrumentOrNull(instrumentId);
  if (!instrument) throw new Error(`Ingen appraisal-instrument funnet for design: ${args.studyDesign}`);

  const existing = appraisalWorkflowStore.listByStudy(args.studyId)
    .find(item => item.instrumentId === instrumentId && item.session.reviewerId === args.reviewerId && !item.session.locked);
  if (existing) {
    return {
      studyId: args.studyId,
      decision: args.screening,
      appraisalSession: existing.session,
      instrumentId,
    };
  }

  throw new Error('Studien må sendes gjennom canonical research-to-appraisal workflow før appraisal-session kan opprettes.');
}

export function compareReviewInstances(first: ReviewInstance, second: ReviewInstance, threshold = 0.3): ReviewComparison {
  if (first.studyId !== second.studyId || first.instrumentId !== second.instrumentId) {
    throw new Error('Reviewerinstansene må gjelde samme studie og instrument.');
  }
  const itemIds = [...new Set([...Object.keys(first.responses), ...Object.keys(second.responses)])];
  const items = itemIds.map(itemId => ({
    itemId,
    reviewer1Score: first.responses[itemId] ?? null,
    reviewer2Score: second.responses[itemId] ?? null,
    disagreement: first.responses[itemId] !== second.responses[itemId]
  }));
  const disagreements = items.filter(item => item.disagreement).length;
  const overallDisagreement = itemIds.length ? disagreements / itemIds.length : 0;
  return { overallDisagreement, items, requiresArbitration: overallDisagreement >= threshold };
}

export function resolveReviewComparison(args: {
  appraisalId: string;
  comparison: ReviewComparison;
  method: DualReviewConfig['arbitrationMethod'];
  resolvedBy: string;
  first: ReviewInstance;
  second: ReviewInstance;
  rationale?: string;
}): ResolvedAppraisal {
  const consensusResponses: Record<string, string | number | boolean | null> = {};
  const itemIds = [...new Set([...Object.keys(args.first.responses), ...Object.keys(args.second.responses)])];
  for (const itemId of itemIds) {
    const a = args.first.responses[itemId] ?? null;
    const b = args.second.responses[itemId] ?? null;
    if (a === b) consensusResponses[itemId] = a;
    else consensusResponses[itemId] = null;
  }
  if (args.comparison.requiresArbitration && !args.rationale?.trim()) throw new Error('Adjudication krever begrunnelse.');
  if (args.comparison.requiresArbitration && args.method === 'autoResolve') throw new Error('autoResolve er ikke tillatt ved uenighet i appraisal.');
  if (args.comparison.requiresArbitration && itemIds.some(itemId => consensusResponses[itemId] === null)) throw new Error('Alle konfliktitems må ha eksplisitt consensus-respons.');
  return {
    appraisalId: args.appraisalId,
    status: 'resolved',
    resolutionMethod: args.method,
    resolvedBy: args.resolvedBy,
    resolvedAt: new Date().toISOString(),
    disagreements: args.comparison.items,
    consensusResponses,
    proposedResponses: { ...consensusResponses }
  };
}

export interface DeduplicationCandidate { studyId:string; matchedStudyId:string; key:'doi'|'pmid'|'title'; value:string; }

export function findDuplicateStudies(records: Array<{studyId:string; doi?:string; pmid?:string; title?:string}>): DeduplicationCandidate[] {
  const seen = new Map<string, {studyId:string;key:'doi'|'pmid'|'title';value:string}>();
  const duplicates: DeduplicationCandidate[] = [];
  for (const record of records) {
    const keys:Array<{key:'doi'|'pmid'|'title';value:string}> = [];
    if (record.doi?.trim()) keys.push({key:'doi',value:record.doi.trim().toLowerCase()});
    if (record.pmid?.trim()) keys.push({key:'pmid',value:record.pmid.trim()});
    if (record.title?.trim()) keys.push({key:'title',value:record.title.trim().toLowerCase().replace(/\\s+/g,' ')});
    for (const candidate of keys) {
      const composite = candidate.key + ':' + candidate.value;
      const previous = seen.get(composite);
      if (previous && previous.studyId !== record.studyId) duplicates.push({studyId:record.studyId,matchedStudyId:previous.studyId,key:candidate.key,value:candidate.value});
      else seen.set(composite,{studyId:record.studyId,...candidate});
    }
  }
  return duplicates;
}

export interface DeduplicationDecision {
  recordId: string;
  canonicalStudyId: string;
  duplicateOfRecordId?: string;
  reason: 'doi' | 'pmid' | 'title';
  reviewerId: string;
  timestamp: string;
}

export function applyDeduplicationDecisions(
  records: Array<{studyId:string; doi?:string; pmid?:string; title?:string}>,
  decisions: DeduplicationDecision[],
): { canonicalRecords: typeof records; unresolved: typeof records; duplicatesRemoved: number } {
  const duplicateIds = new Set(decisions.filter(d => d.duplicateOfRecordId).map(d => d.recordId));
  const canonicalIds = new Set(records.map(r => r.studyId));
  const invalid = decisions.filter(d => !canonicalIds.has(d.recordId) || !canonicalIds.has(d.canonicalStudyId) || (d.duplicateOfRecordId && !canonicalIds.has(d.duplicateOfRecordId)));
  if (invalid.length) throw new Error('Deduplication contains references to unknown records.');
  const canonicalRecords = records.filter(r => !duplicateIds.has(r.studyId));
  return { canonicalRecords, unresolved: canonicalRecords.filter(r => !decisions.some(d => d.recordId === r.studyId)), duplicatesRemoved: duplicateIds.size };
}

export function buildPrismaFlow(store: {
  screening: ScreeningDecision[];
  appraisalSessions: AppraisalSession[];
  duplicatesRemoved?: number;
}): PRISMAFlow {
  const screening = store.screening;
  const included = screening.filter(item => item.decision === 'include');
  const excluded = screening.filter(item => item.decision === 'exclude');
  const reasonCounts = new Map<string, number>();
  for (const item of excluded) {
    const reason = item.reason?.trim() || 'Ikke spesifisert';
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
  }
  const assessedIds = new Set(store.appraisalSessions.map(session => session.studyId));
  const includedStudyIds = new Set(included.map(item => item.studyId));
  const invalidAppraisals = [...assessedIds].filter(id => !includedStudyIds.has(id));
  if (invalidAppraisals.length) throw new Error(`PRISMA integrity violation: excluded/unknown studies have appraisal sessions: ${invalidAppraisals.join(', ')}`);
  const completedIds = new Set(store.appraisalSessions.filter(session => session.locked).map(session => session.studyId));

  return {
    identification: {
      recordsFromDatabases: screening.length,
      recordsFromOtherSources: 0,
      totalIdentified: screening.length,
      duplicatesRemoved: store.duplicatesRemoved ?? 0
    },
    screening: {
      recordsScreened: screening.length,
      recordsExcluded: excluded.length
    },
    eligibility: {
      fullTextsAssessed: assessedIds.size,
      fullTextsExcluded: [...reasonCounts.entries()].map(([reason, count]) => ({ reason, count }))
    },
    included: {
      studiesFinalSynthesis: included.length,
      studiesQualityAssessment: completedIds.size
    }
  };
}

export function buildPicoQuery(pico: PICO): string {
  return [
    pico.population ? `(${pico.population})` : '',
    pico.intervention ? `AND (${pico.intervention})` : '',
    pico.comparator ? `AND (${pico.comparator})` : '',
    pico.outcome ? `AND (${pico.outcome})` : ''
  ].filter(Boolean).join(' ').trim();
}
