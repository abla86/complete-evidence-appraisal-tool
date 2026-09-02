import { evaluateAcademicIntegrity, type AcademicClaim, type EvidenceExtraction } from '../domain/academicEvidence';
import type { ReferenceRecord } from './referenceHubService';
import type { AppraisalSession } from './universalAppraisalService';
import type { StoredQualityAssessment } from './qualityAssessmentService';

export interface ProjectExportGateInput {
  claims: AcademicClaim[];
  evidence: EvidenceExtraction[];
  references: ReferenceRecord[];
  appraisal: AppraisalSession[];
  quality: StoredQualityAssessment[];
}

export interface ProjectExportGateResult {
  canExport: boolean;
  blockers: string[];
  warnings: string[];
}

export function evaluateProjectExportGate(input: ProjectExportGateInput): ProjectExportGateResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const verifiedSourceIds = new Set(
    input.references.filter(reference => reference.verification === 'VALIDATED').map(reference => reference.id),
  );

  const integrity = evaluateAcademicIntegrity(input.claims, input.evidence, verifiedSourceIds);
  blockers.push(...integrity.issues.filter(issue => issue.severity === 'ERROR').map(issue => issue.message));
  warnings.push(...integrity.issues.filter(issue => issue.severity === 'WARNING').map(issue => issue.message));

  const openAppraisals = input.appraisal.filter(item => !item.locked);
  if (openAppraisals.length > 0) {
    blockers.push(`${openAppraisals.length} appraisal-sesjon(er) er ikke låst.`);
  }

  const openQuality = input.quality.filter(item => !item.locked);
  if (openQuality.length > 0) {
    blockers.push(`${openQuality.length} GRADE/CERQual-vurdering(er) er ikke låst.`);
  }

  return { canExport: blockers.length === 0, blockers, warnings };
}
