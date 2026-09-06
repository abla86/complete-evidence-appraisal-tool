/**
 * Compatibility facade. The canonical workflow implementation lives in
 * researchWorkflowService.ts. Appraisal creation is owned by appraisalWorkflowBridge.ts.
 */
export {
  createResearchWorkflow,
  createResearchWorkflowFromFile,
  createResearchWorkflowFromText,
  updateResearchClassification,
  verifyResearchClassification,
  verifyResearchEvidence,
  selectResearchInstrument,
  assertReadyForAppraisal,
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

