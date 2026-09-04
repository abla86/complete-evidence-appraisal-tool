import type { EvidenceExtraction, AcademicClaim } from '../domain/academicEvidence';

export type SynthesisType = 'NARRATIVE' | 'META_ANALYSIS' | 'QUALITATIVE_THEMATIC' | 'META_AGGREGATION';

export interface SynthesisInput {
  id: string;
  studyId: string;
  appraisalSessionId: string;
  evidenceIds: string[];
  outcomeOrFinding: string;
  value?: number;
  standardError?: number;
  effectMeasure?: 'OR' | 'RR' | 'HR' | 'MD' | 'SMD' | 'RD' | 'CORRELATION' | 'OTHER';
  confidenceInterval?: { lower: number; upper: number };
  direction?: 'FAVOURS_INTERVENTION' | 'FAVOURS_COMPARATOR' | 'NO_DIFFERENCE' | 'MIXED' | 'NOT_APPLICABLE';
  eligible: boolean;
  notes?: string;
}

export interface SynthesisRecord {
  id: string;
  type: SynthesisType;
  question: string;
  inputs: SynthesisInput[];
  includedStudyIds: string[];
  createdBy: string;
  createdAt: string;
  locked: boolean;
  poolingMethod?: 'FIXED_EFFECT' | 'RANDOM_EFFECTS' | 'NOT_APPLICABLE';
  heterogeneity?: { i2?: number; tau2?: number; qPValue?: number };
}

export interface SynthesisValidation {
  provenance: Array<{ inputId:string; studyId:string; appraisalSessionId:string; evidenceIds:string[]; claimIds:string[] }>;
  valid: boolean;
  blockers: string[];
  warnings: string[];
}

export function validateSynthesis(
  synthesis: SynthesisRecord,
  appraisals: Array<{ id:string; studyId:string; locked:boolean }>,
  evidence: EvidenceExtraction[],
  claims: AcademicClaim[],
): SynthesisValidation {
  const blockers:string[]=[]; const warnings:string[]=[];
  const provenance = synthesis.inputs.map(input => ({ inputId: input.id, studyId: input.studyId, appraisalSessionId: input.appraisalSessionId, evidenceIds: [...input.evidenceIds], claimIds: claims.filter(c => c.supportingEvidenceIds.some(id => input.evidenceIds.includes(id))).map(c => c.id) }));
  if (!synthesis.question.trim()) blockers.push('Syntesen mangler forskningsspørsmål.');
  if (!synthesis.inputs.length) blockers.push('Syntesen har ingen inkluderte input-enheter.');
  if (synthesis.type === 'META_ANALYSIS' && !synthesis.poolingMethod) blockers.push('Meta-analysen mangler pooling method.');
  if (synthesis.type === 'META_ANALYSIS' && synthesis.poolingMethod === 'NOT_APPLICABLE') blockers.push('Meta-analyse kan ikke merkes NOT_APPLICABLE for pooling.');
  if (synthesis.heterogeneity?.i2 !== undefined && (!Number.isFinite(synthesis.heterogeneity.i2) || synthesis.heterogeneity.i2 < 0 || synthesis.heterogeneity.i2 > 100)) blockers.push('I² må være mellom 0 og 100.');
  if (synthesis.heterogeneity?.tau2 !== undefined && (!Number.isFinite(synthesis.heterogeneity.tau2) || synthesis.heterogeneity.tau2 < 0)) blockers.push('Tau² kan ikke være negativ.');

  const appraisalIds=new Set(appraisals.filter(a=>a.locked).map(a=>a.id));
  const evidenceIds=new Set(evidence.map(e=>e.id));
  const claimEvidence=new Set(claims.flatMap(c=>c.supportingEvidenceIds));
  const evidenceById = new Map(evidence.map(e => [e.id, e]));
  const claimById = new Map(claims.map(c => [c.id, c]));
  for(const input of synthesis.inputs){
    if(!input.eligible) blockers.push(`Synteseinput ${input.id} er ikke eligible.`);
    if(!input.outcomeOrFinding.trim()) blockers.push(`Synteseinput ${input.id} mangler outcome/finding.`);
    if((synthesis.type === 'QUALITATIVE_THEMATIC' || synthesis.type === 'META_AGGREGATION') && input.evidenceIds.length === 0) blockers.push(`Kvalitativt synteseinput ${input.id} må ha minst én evidenskilde.`);
    if((synthesis.type === 'QUALITATIVE_THEMATIC' || synthesis.type === 'META_AGGREGATION') && (input.value !== undefined || input.standardError !== undefined || input.confidenceInterval !== undefined)) warnings.push(`Kvalitativt synteseinput ${input.id} inneholder kvantitativt metadata; kontroller at dette ikke blandes inn i kvalitativ syntese.`);
    if(!appraisalIds.has(input.appraisalSessionId)) blockers.push(`Synteseinput ${input.id} mangler låst appraisal.`);
    const appraisal = appraisals.find(a => a.id === input.appraisalSessionId);
    if (appraisal && appraisal.studyId !== input.studyId) blockers.push(`Synteseinput ${input.id} har studyId som ikke samsvarer med appraisal.`);
    for(const id of input.evidenceIds){
      if(!evidenceIds.has(id)) blockers.push(`Synteseinput ${input.id} peker til ukjent evidens ${id}.`);
      else {
        if(!claimEvidence.has(id)) warnings.push(`Evidens ${id} er ikke knyttet til en akademisk påstand.`);
        const extraction = evidenceById.get(id);
        if (extraction && !claims.some(claim => claim.supportingEvidenceIds.includes(id))) blockers.push(`Evidens ${id} kan ikke inngå i syntesen uten en støttende akademisk påstand.`);
      }
    }
    if(synthesis.type==='META_ANALYSIS' && (input.value===undefined || input.standardError===undefined)) blockers.push(`Meta-analyseinput ${input.id} mangler effect estimate eller standard error.`);
    if(synthesis.type==='META_ANALYSIS' && input.standardError !== undefined && (!Number.isFinite(input.standardError) || input.standardError <= 0)) blockers.push(`Meta-analyseinput ${input.id} har ugyldig standard error.`);
    if(synthesis.type==='META_ANALYSIS' && input.value !== undefined && !Number.isFinite(input.value)) blockers.push(`Meta-analyseinput ${input.id} har ugyldig effect estimate.`);
    if(synthesis.type==='META_ANALYSIS' && !input.effectMeasure) blockers.push(`Meta-analyseinput ${input.id} mangler effect measure.`);
    if(synthesis.type==='META_ANALYSIS' && input.confidenceInterval) {
      const { lower, upper } = input.confidenceInterval;
      if(!Number.isFinite(lower) || !Number.isFinite(upper) || lower > upper) blockers.push(`Meta-analyseinput ${input.id} har ugyldig konfidensintervall.`);
      if(input.value !== undefined && (input.value < lower || input.value > upper)) blockers.push(`Meta-analyseinput ${input.id} har effect estimate utenfor konfidensintervallet.`);
    }
  }
  for (const claim of claims) for (const evidenceId of claim.supportingEvidenceIds) if (!evidenceIds.has(evidenceId)) blockers.push(`Claim ${claim.id} peker til ukjent evidens ${evidenceId}.`);
  for (const input of synthesis.inputs) for (const evidenceId of input.evidenceIds) { const extraction = evidenceById.get(evidenceId); if (extraction && extraction.sourceRecordId.trim() === '') blockers.push(`Evidens ${evidenceId} mangler sourceRecordId.`); }
  if (synthesis.type === 'META_ANALYSIS') {
    const measures = new Set(synthesis.inputs.map(input => input.effectMeasure).filter(Boolean));
    if (measures.size > 1) blockers.push('Meta-analysen blander ulike effect measures. Eksplisitt harmonisering/transformasjon må dokumenteres før pooling.');
  }
  if(new Set(synthesis.inputs.map(i=>i.studyId)).size<2) warnings.push('Syntesen bygger foreløpig på færre enn to studier.');
  return {provenance,valid:blockers.length===0,blockers:[...new Set(blockers)],warnings:[...new Set(warnings)]};
}

export function createSynthesisRecord(input: Omit<SynthesisRecord,'createdAt'|'locked'>): SynthesisRecord {
  if(!input.createdBy.trim()) throw new Error('createdBy er påkrevd.');
  return {...input,createdAt:new Date().toISOString(),locked:false};
}

export function lockSynthesis(synthesis:SynthesisRecord, validation:SynthesisValidation, lockedBy:string):SynthesisRecord {
  if(synthesis.inputs.some(input => !input.studyId.trim() || !input.appraisalSessionId.trim())) throw new Error('Alle synteseinputs må ha studyId og appraisalSessionId før låsing.');
  if(!validation.valid) throw new Error(`Synthesis kan ikke låses: ${validation.blockers.join(' | ')}`);
  if(!lockedBy.trim()) throw new Error('lockedBy er påkrevd.');
  return {...synthesis,locked:true};
}
