import { loadAppraisalSessions, loadQualityAssessments } from './appraisalSessionStore';
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
import type { ResearchProject } from '../domain/researchProject';

export interface ProjectExportPackage{projectId:string;studyIds?:string[];exportedAt:string;pipeline?:EvidencePipelineState;appraisal:AppraisalSession[];quality:StoredQualityAssessment[];claims:AcademicClaim[];evidence:EvidenceExtraction[];references:ReferenceRecord[];synthesis:SynthesisRecord[];prisma:ReturnType<typeof calculatePRISMA>;audit:readonly AuditEntry[];}
export function buildProjectExportPackage(input:{projectId:string;pipeline?:EvidencePipelineState;prismaStages:PRISMAStages;claims?:AcademicClaim[];evidence?:EvidenceExtraction[];quality?:StoredQualityAssessment[];references?:ReferenceRecord[];auditTrail?:AuditTrailService;synthesis?:SynthesisRecord[];projectAccess?:ProjectAccess;project?:ResearchProject}):ProjectExportPackage{const projectId=input.projectId.trim();if(!projectId)throw new Error('projectId is required.');if(input.projectAccess)requireProjectScope({projectId,actor:input.projectAccess},'EXPORT');const studyIds=[...new Set(input.project?.studyIds??[])];if(input.project&&input.project.id!==projectId)throw new Error('EXPORT_BLOCKED: project identity mismatch.');const references=input.references??loadReferenceLibrary([]);const appraisal=loadAppraisalSessions().filter(s=>studyIds.includes(s.studyId));const appraisalIds=new Set(appraisal.map(s=>s.id));const storedQuality=loadQualityAssessments().filter(q=>appraisalIds.has(q.appraisalSessionId));const quality=(input.quality??storedQuality).filter(q=>appraisalIds.has(q.appraisalSessionId));const pkg:ProjectExportPackage={projectId,studyIds,exportedAt:new Date().toISOString(),pipeline:input.pipeline,appraisal,quality,claims:input.claims??[],evidence:input.evidence??[],references,synthesis:input.synthesis??[],prisma:calculatePRISMA(input.prismaStages),audit:input.auditTrail?.list()??[]};assertProjectExportIntegrity(pkg);return pkg;}
export function assertProjectExportIntegrity(pkg: ProjectExportPackage): void {
  if (!pkg.projectId.trim()) throw new Error('EXPORT_BLOCKED: projectId is required.');
  if (pkg.appraisal.some(a => !a.locked)) throw new Error('EXPORT_BLOCKED: all appraisal sessions must be locked.');
  if (pkg.quality.some(q => !q.locked)) throw new Error('EXPORT_BLOCKED: all quality assessments must be locked.');
  if (pkg.synthesis.some(s => !s.locked)) throw new Error('EXPORT_BLOCKED: synthesis must be locked.');

  const evidenceIds = new Set(pkg.evidence.map(e => e.id));
  const referenceIds = new Set((pkg.references || []).map(r => r.id));

  for (const evidence of pkg.evidence) {
    if (evidence.researcherVerified !== true) {
      throw new Error(`EXPORT_BLOCKED: evidence ${evidence.id} is not researcher verified.`);
    }
    const linked = evidence.sourceRecordId?.trim() || evidence.referenceId?.trim() || (referenceIds.has(evidence.id) ? evidence.id : '');
    const hasSourceIdentifiers = Boolean(
      evidence.sourceIdentifiers &&
      Object.values(evidence.sourceIdentifiers).some(value => typeof value === 'string' && value.trim())
    );
    if (!linked && !hasSourceIdentifiers) {
      throw new Error(`EXPORT_BLOCKED: evidence ${evidence.id} has no source identifier.`);
    }
  }

  for (const claim of pkg.claims) {
    if (claim.supportingEvidenceIds.some(id => !evidenceIds.has(id))) {
      throw new Error(`EXPORT_BLOCKED: claim ${claim.id} contains a missing evidence link.`);
    }
    if (claim.status === 'SUPPORTED' && claim.supportingEvidenceIds.length === 0) {
      throw new Error(`EXPORT_BLOCKED: supported claim ${claim.id} has no evidence.`);
    }
  }

  for (const reference of pkg.references) {
    if (reference.verification === 'RETRACTED' || reference.retraction?.detected) {
      throw new Error(`EXPORT_BLOCKED: reference ${reference.id} is retracted or under concern.`);
    }
    if (reference.verification !== undefined && reference.verification !== 'VALIDATED') {
      throw new Error(`EXPORT_BLOCKED: reference ${reference.id} is not bibliographically validated.`);
    }
  }

  const studyIds = new Set(pkg.studyIds ?? []);
  for (const appraisal of pkg.appraisal) {
    if (studyIds.size && !studyIds.has(appraisal.studyId)) {
      throw new Error(`EXPORT_BLOCKED: appraisal ${appraisal.id} references a study outside the project.`);
    }
  }
  for (const synthesis of pkg.synthesis) {
    if (Array.isArray(synthesis.inputs)) {
      for (const input of synthesis.inputs) {
        if (studyIds.size && !studyIds.has(input.studyId)) {
          throw new Error(`EXPORT_BLOCKED: synthesis input ${input.id} references a study outside the project.`);
        }
      }
    }
  }
}
export function serializeProjectExport(packageData:ProjectExportPackage,format:'json'|'csv'='json'):string{assertProjectExportIntegrity(packageData);if(format==='json')return JSON.stringify(packageData,null,2);const rows=[['type','id','label','status'],...packageData.appraisal.map(i=>['appraisal',i.id,i.instrumentId,i.locked?'locked':'open']),...packageData.quality.map(i=>['quality',i.id,i.kind,i.locked?'locked':'open']),...packageData.references.map(i=>['reference',i.id,i.title,i.verification]),...packageData.claims.map(i=>['claim',i.id,i.text,i.status]),...packageData.evidence.map(i=>['evidence',i.id,i.excerpt,i.researcherVerified?'verified':'unverified'])];return'\uFEFF'+rows.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n');}
