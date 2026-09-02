/**
 * Compatibility facade. The canonical workflow implementation lives in
 * researchWorkflowService.ts. No workflow logic belongs in this file.
 */
export {
  createResearchWorkflow,
  createResearchWorkflowFromFile,
  createResearchWorkflowFromText,
  updateResearchClassification,
  verifyResearchClassification,
  verifyResearchEvidence,
  verifyAllCandidateEvidence,
  selectResearchInstrument,
  assertReadyForAppraisal,
  includeStudyAndCreateAppraisal,
  buildResearchAppraisalPayload,
  getVerifiedResearchEvidence,
  getResearchEvidenceSummary,
  handoffWorkflow,
} from './researchWorkflowService';

export type {
  ScreeningDecision,
  ScreeningRecord,
  ResearchWorkflowContext,
  WorkflowState,
  ResearchAppraisalPayload,
} from './researchWorkflowService';
