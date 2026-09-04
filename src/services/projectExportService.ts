import { loadAppraisalSessions } from './appraisalSessionStore';
import { loadQualityAssessments } from './appraisalSessionStore';
import { loadReferenceLibrary } from './referenceLibraryStore';
import { calculatePRISMA, type PRISMAStages } from './prismaCalculator';
import { AuditTrailService, type AuditEntry } from './auditTrailService';
import type { ReferenceRecord } from './referenceHubService';
import type { AppraisalSession } from './universalAppraisalService';
import type { AcademicClaim, EvidenceExtraction } from '../domain/academicEvidence';
import type { StoredQualityAssessment } from './qualityAssessmentService';
import type { EvidencePipelineState } from './evidencePipelineService';
import type { SynthesisRecord } from './synthesisIntegrityService';
import { requireProjectScope } from './projectScopeService';
import type { ProjectAccess } from './projectAccessService';

export interface ProjectExportPackage {
  projectId: string;
  exportedAt: string;
  pipeline?: EvidencePipelineState;
  appraisal: AppraisalSession[];
  quality: StoredQualityAssessment[];
  claims: AcademicClaim[];
  evidence: EvidenceExtraction[];
  references: ReferenceRecord[];
  synthesis: SynthesisRecord[];
  prisma: ReturnType<typeof calculatePRISMA>;
  audit: readonly AuditEntry[];
}

export function buildProjectExportPackage(input: {
  projectId: string;
  pipeline?: EvidencePipelineState;
  prismaStages: PRISMAStages;
  claims?: AcademicClaim[];
  evidence?: EvidenceExtraction[];
  quality?: StoredQualityAssessment[];
  references?: ReferenceRecord[];
  auditTrail?: AuditTrailService;
  synthesis?: SynthesisRecord[];
  projectAccess?: ProjectAccess;
}): ProjectExportPackage {
  const projectId = input.projectId.trim();
  if (!projectId) throw new Error('projectId is required.');
  if (input.projectAccess) requireProjectScope({ projectId, actor: input.projectAccess }, 'EXPORT');

  const references = input.references ?? loadReferenceLibrary([]);
  const referenceIds = new Set(references.map(r => r.id));
  const appraisal = loadAppraisalSessions().filter(
    session => session.studyId === projectId,
  );
  const appraisalIds = new Set(appraisal.map(session => session.id));
  const storedQuality = loadQualityAssessments().filter(item =>
    appraisalIds.has(item.appraisalSessionId),
  );

  // Explicit quality data is accepted only when it belongs to this project's
  // canonical appraisal sessions. This prevents cross-project leakage.
  const quality = (input.quality ?? storedQuality).filter(item =>
    appraisalIds.has(item.appraisalSessionId),
  );

  const packageData: ProjectExportPackage = {
    projectId,
    exportedAt: new Date().toISOString(),
    pipeline: input.pipeline,
    appraisal,
    quality,
    claims: input.claims ?? [],
    evidence: input.evidence ?? [],
    references,
    synthesis: input.synthesis ?? [],
    prisma: calculatePRISMA(input.prismaStages),
    audit: input.auditTrail?.list() ?? [],
  };
  assertProjectExportIntegrity(packageData);
  return packageData;
}

export function assertProjectExportIntegrity(pkg: ProjectExportPackage): void {
  if (!pkg.projectId.trim()) throw new Error('EXPORT_BLOCKED: projectId is required.');
  const appraisalIds = new Set(pkg.appraisal.map(a => a.id));
  if (pkg.appraisal.some(a => !a.locked)) throw new Error('EXPORT_BLOCKED: all appraisal sessions must be locked.');
  if (pkg.quality.some(q => !q.locked)) throw new Error('EXPORT_BLOCKED: all quality assessments must be locked.');
  const evidenceIds = new Set(pkg.evidence.map(e => e.id));
  for (const claim of pkg.claims) {
    const missing = claim.supportingEvidenceIds.filter(id => !evidenceIds.has(id));
    if (missing.length) throw new Error(`EXPORT_BLOCKED: claim ${claim.id} has unknown evidence: ${missing.join(', ')}`);
    if (claim.status === 'SUPPORTED' && claim.supportingEvidenceIds.length === 0) throw new Error(`EXPORT_BLOCKED: supported claim ${claim.id} has no evidence.`);
  }
  for (const evidence of pkg.evidence) {
    if (!evidence.sourceRecordId.trim()) throw new Error(`EXPORT_BLOCKED: evidence ${evidence.id} has no sourceRecordId.`);
    if (!evidence.researcherVerified) throw new Error(`EXPORT_BLOCKED: evidence ${evidence.id} is not researcher verified.`);
  }
  const referenceIds = new Set(pkg.references.map(r => r.id));
  for (const evidence of pkg.evidence) {
    if (evidence.referenceId && !referenceIds.has(evidence.referenceId)) throw new Error(`EXPORT_BLOCKED: evidence ${evidence.id} has unknown reference.`);
  }
  for (const synthesis of pkg.synthesis) {
    if (!synthesis.locked) throw new Error(`EXPORT_BLOCKED: synthesis ${synthesis.id} is not locked.`);
  }
}

export function serializeProjectExport(
  packageData: ProjectExportPackage,
  format: 'json' | 'csv' = 'json',
): string {
  if (format === 'json') return JSON.stringify(packageData, null, 2);

  const rows = [
    ['type', 'id', 'label', 'status'],
    ...packageData.appraisal.map(item => [
      'appraisal',
      item.id,
      item.instrumentId,
      item.locked ? 'locked' : 'open',
    ]),
    ...packageData.quality.map(item => [
      'quality',
      item.id,
      item.kind,
      item.locked ? 'locked' : 'open',
    ]),
    ...packageData.references.map(item => [
      'reference',
      item.id,
      item.title,
      item.verification ?? 'unknown',
    ]),
    ...packageData.claims.map(item => [
      'claim',
      item.id,
      item.text,
      item.status,
    ]),
    ...packageData.evidence.map(item => [
      'evidence',
      item.id,
      item.excerpt,
      item.researcherVerified ? 'verified' : 'unverified',
    ]),
  ];

  return '\uFEFF' + rows
    .map(row =>
      row
        .map(value => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(';'),
    )
    .join('\n');
}
