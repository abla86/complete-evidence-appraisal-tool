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
}): ProjectExportPackage {
  const projectId = input.projectId.trim();
  if (!projectId) throw new Error('projectId is required.');

  const references = input.references ?? loadReferenceLibrary([]);
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

  return {
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
