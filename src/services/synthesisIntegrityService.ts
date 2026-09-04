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
  const appraisalIds=new Set(appraisals.filter(a=>a.locked).map(a=>a.id));
  const evidenceIds=new Set(evidence.map(e=>e.id));
  const claimEvidence=new Set(claims.flatMap(c=>c.supportingEvidenceIds));
  const evidenceById = new Map(evidence.map(e => [e.id, e]));
  const claimById = new Map(claims.map(c => [c.id, c]));
  for(const input of synthesis.inputs){
    if(!input.eligible) blockers.push(`Synteseinput ${input.id} er ikke eligible.`);
    if(!appraisalIds.has(input.appraisalSessionId)) blockers.push(`Synteseinput ${input.id} mangler låst appraisal.`);
    for(const id of input.evidenceIds){
      if(!evidenceIds.has(id)) blockers.push(`Synteseinput ${input.id} peker til ukjent evidens ${id}.`);
      else {
        if(!claimEvidence.has(id)) warnings.push(`Evidens ${id} er ikke knyttet til en akademisk påstand.`);
        const extraction = evidenceById.get(id);
        if (extraction && !claims.some(claim => claim.supportingEvidenceIds.includes(id))) blockers.push(`Evidens ${id} kan ikke inngå i syntesen uten en støttende akademisk påstand.`);
      }
    }
    if(synthesis.type==='META_ANALYSIS' && (input.value===undefined || input.standardError===undefined)) blockers.push(`Meta-analyseinput ${input.id} mangler effect estimate eller standard error.`);
  }
  for (const claim of claims) for (const evidenceId of claim.supportingEvidenceIds) if (!evidenceIds.has(evidenceId)) blockers.push(`Claim ${claim.id} peker til ukjent evidens ${evidenceId}.`);
  for (const input of synthesis.inputs) for (const evidenceId of input.evidenceIds) { const extraction = evidenceById.get(evidenceId); if (extraction && extraction.sourceRecordId.trim() === '') blockers.push(`Evidens ${evidenceId} mangler sourceRecordId.`); }
  if(new Set(synthesis.inputs.map(i=>i.studyId)).size<2) warnings.push('Syntesen bygger foreløpig på færre enn to studier.');
  return {provenance,valid:blockers.length===0,blockers:[...new Set(blockers)],warnings:[...new Set(warnings)]};
}

export function createSynthesisRecord(input: Omit<SynthesisRecord,'createdAt'|'locked'>): SynthesisRecord {
  if(!input.createdBy.trim()) throw new Error('createdBy er påkrevd.');
  return {...input,createdAt:new Date().toISOString(),locked:false};
}

export function lockSynthesis(synthesis:SynthesisRecord, validation:SynthesisValidation, lockedBy:string):SynthesisRecord {
  if(!validation.valid) throw new Error(`Synthesis kan ikke låses: ${validation.blockers.join(' | ')}`);
  if(!lockedBy.trim()) throw new Error('lockedBy er påkrevd.');
  return {...synthesis,locked:true};
}
