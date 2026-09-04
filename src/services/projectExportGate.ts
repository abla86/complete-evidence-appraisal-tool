import { evaluateAcademicIntegrity, type AcademicClaim, type EvidenceExtraction } from '../domain/academicEvidence';
import type { ReferenceRecord } from './referenceHubService';
import type { AppraisalSession } from './universalAppraisalService';
import type { StoredQualityAssessment } from './qualityAssessmentService';
import type { SynthesisRecord } from './synthesisIntegrityService';
import { validateSynthesis } from './synthesisIntegrityService';
import { evaluateCitationExportGate } from './citationExportGate';
import { canExportProject, type ProjectAccess } from './projectAccessService';

export interface ProjectExportGateInput {
  claims: AcademicClaim[];
  evidence: EvidenceExtraction[];
  references: ReferenceRecord[];
  appraisal: AppraisalSession[];
  quality: StoredQualityAssessment[];
  projectAccess?: ProjectAccess;
  synthesis?: SynthesisRecord[];
}

export interface ProjectExportGateResult {
  canExport: boolean;
  blockers: string[];
  warnings: string[];
}

export function evaluateProjectExportGate(input: ProjectExportGateInput): ProjectExportGateResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (input.projectAccess && !canExportProject(input.projectAccess)) {
    blockers.push('Brukeren har ikke EXPORT-tillatelse for prosjektet.');
  }

  const citationGate = evaluateCitationExportGate(input.claims, input.evidence, input.references);
  blockers.push(...citationGate.blockingReasons);
  if (!citationGate.allowed && citationGate.blockingReasons.length === 0) {
    blockers.push('Citation/evidence-integrity gate blokkerte eksport.');
  }
  for (const synthesis of input.synthesis ?? []) {
    const validation = validateSynthesis(synthesis, input.appraisal.map(item => ({ id:item.id, studyId:item.studyId, locked:item.locked })), input.evidence, input.claims);
    blockers.push(...validation.blockers);
    warnings.push(...validation.warnings);
    if (!synthesis.locked) blockers.push(`Syntese ${synthesis.id} er ikke låst.`);
  }

  const verifiedSourceIds = new Set(
    input.references.filter(reference => reference.verification === 'VALIDATED').map(reference => reference.id),
  );

  const integrity = evaluateAcademicIntegrity(input.claims, input.evidence, verifiedSourceIds);
  blockers.push(...integrity.issues.filter(issue => issue.severity === 'ERROR').map(issue => issue.message));
  warnings.push(...integrity.issues.filter(issue => issue.severity === 'WARNING').map(issue => issue.message));

  const appraisalById = new Map(input.appraisal.map(session => [session.id, session]));
  const appraisalStudyIds = new Set(input.appraisal.map(session => session.studyId));
  for (const item of input.quality) {
    const session = appraisalById.get(item.appraisalSessionId);
    if (session && session.reviewerId !== item.reviewerId) blockers.push(`Quality-vurdering ${item.id} har annen reviewer enn appraisal-session.`);
    if (session && !appraisalStudyIds.has(session.studyId)) blockers.push(`Quality-vurdering ${item.id} har ugyldig studieproveniens.`);
  }
  const openAppraisals = input.appraisal.filter(item => !item.locked);
  if (openAppraisals.length > 0) blockers.push(`${openAppraisals.length} appraisal-sesjon(er) er ikke låst.`);

  const evidenceIds = new Set(input.evidence.map(item => item.id));
  const appraisalIds = new Set(input.appraisal.map(item => item.id));
  const invalidQualityLinks = input.quality.filter(item => !evidenceIds.has(item.evidenceId) || !appraisalIds.has(item.appraisalSessionId));
  if (invalidQualityLinks.length > 0) blockers.push(`${invalidQualityLinks.length} quality-vurdering(er) peker til manglende evidence eller appraisal-session.`);

  const openQuality = input.quality.filter(item => !item.locked);
  if (openQuality.length > 0) blockers.push(`${openQuality.length} GRADE/CERQual-vurdering(er) er ikke låst.`);

  const orphanQuality = input.quality.filter(item => {
    const session = appraisalById.get(item.appraisalSessionId);
    return !session || session.studyId.trim() === '' || session.reviewerId !== item.reviewerId;
  });
  if (orphanQuality.length > 0) {
    blockers.push(`${orphanQuality.length} quality-vurdering(er) er ikke konsistent knyttet til en appraisal-session.`);
  }

  const duplicatedQualityIds = new Set<string>();
  for (const item of input.quality) {
    const key = `${item.appraisalSessionId}:${item.evidenceId}:${item.kind}:${item.outcomeOrFinding.trim().toLowerCase()}`;
    if (duplicatedQualityIds.has(key)) {
      blockers.push('Dupliserte GRADE/CERQual-vurderinger må ryddes før eksport.');
      break;
    }
    duplicatedQualityIds.add(key);
  }

  return { canExport: blockers.length === 0, blockers, warnings };
}
