import { AppraisalSession, ReferenceRecord, QualityAssessment, AcademicClaim, EvidenceExtraction } from '../domain/projectState';

export interface ProjectPackageData {
  appraisal: AppraisalSession[];
  quality: QualityAssessment[];
  references: ReferenceRecord[];
  claims: AcademicClaim[];
  evidence: EvidenceExtraction[];
}

export interface ProjectExportPackage {
  manifest: Record<string, unknown>;
  data: ProjectPackageData;
}

export function buildProjectExportPackage(packageData: ProjectPackageData): ProjectExportPackage {
  const manifest = {
    schemaVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    counts: {
      appraisal: packageData.appraisal.length,
      quality: packageData.quality.length,
      references: packageData.references.length,
      claims: packageData.claims.length,
      evidence: packageData.evidence.length,
    },
  };

  const rows = [
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

  return {
    manifest: { ...manifest, rows },
    data: packageData,
  };
}
