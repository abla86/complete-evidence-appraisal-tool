import type {
  EvidenceAgentContext,
  EvidenceAgentResult,
  EvidenceClaimCandidate,
  ResearchPlan,
  VerificationDecision,
} from './evidenceAgentContracts';
import { EvidenceAgentOrchestrator } from './evidenceAgentOrchestrator';
import {
  createResearchWorkflowFromText,
  recordScreeningDecision,
  selectResearchInstrument,
  updateResearchClassification,
  verifyResearchClassification,
  verifyResearchEvidence,
  type WorkflowState,
} from '../services/researchWorkflowService';
import type { DocumentClassificationResult } from '../types';
import { evidenceAppraisalOrchestrator, type EvidenceAppraisalContext } from '../services/evidenceAppraisalOrchestrator';

export interface EvidenceResearchRun {
  workflow: WorkflowState;
  plan?: EvidenceAgentResult<ResearchPlan>;
  evidenceCandidates?: EvidenceAgentResult<EvidenceClaimCandidate[]>;
  appraisal?: EvidenceAppraisalContext;
}

/**
 * Canonical application-level facade.
 *
 * It deliberately orchestrates existing workflow services rather than
 * duplicating business rules. AI work remains candidate work until the
 * existing human verification gates are satisfied.
 */
export class EvidenceResearchOrchestrator {
  private readonly agents = new EvidenceAgentOrchestrator();

  createFromText(text: string, fileName: string, studyId?: string): WorkflowState {
    return createResearchWorkflowFromText(text, fileName, studyId);
  }

  plan(
    workflow: WorkflowState,
    researchQuestion: string,
    projectId = workflow.studyId,
  ): Promise<EvidenceAgentResult<ResearchPlan>> {
    return this.agents.plan(
      this.context(workflow, projectId),
      researchQuestion,
    );
  }

  prepareEvidenceCandidates(
    workflow: WorkflowState,
    candidates: EvidenceClaimCandidate[],
    projectId = workflow.studyId,
  ): Promise<EvidenceAgentResult<EvidenceClaimCandidate[]>> {
    return this.agents.retrieve(
      this.context(workflow, projectId),
      candidates,
    );
  }

  applyClassification(
    workflow: WorkflowState,
    classification: DocumentClassificationResult,
  ): WorkflowState {
    return updateResearchClassification(workflow, classification);
  }

  verifyClassification(
    workflow: WorkflowState,
    reviewerId: string,
    approved: boolean,
  ): WorkflowState {
    return verifyResearchClassification(workflow, reviewerId, approved);
  }

  verifyEvidence(
    workflow: WorkflowState,
    evidenceId: string,
    approved: boolean,
    reviewerId: string,
  ): WorkflowState {
    return verifyResearchEvidence(workflow, evidenceId, approved, reviewerId);
  }

  recordScreening(
    workflow: WorkflowState,
    reviewerId: string,
    decision: 'INCLUDED' | 'EXCLUDED',
    reason?: string,
  ): WorkflowState {
    return recordScreeningDecision(workflow, reviewerId, decision, reason);
  }

  selectInstrument(workflow: WorkflowState, instrumentId: string): WorkflowState {
    return selectResearchInstrument(workflow, instrumentId);
  }

  startAppraisal(
    workflow: WorkflowState,
    reviewerId: string,
  ): Promise<EvidenceAppraisalContext> {
    return evidenceAppraisalOrchestrator.start(workflow, reviewerId);
  }

  private context(
    workflow: WorkflowState,
    projectId: string,
  ): EvidenceAgentContext {
    const sourceIds = workflow.research?.evidenceBundle.evidence.map(
      evidence => evidence.id,
    ) ?? [];

    return {
      projectId: projectId.trim() || workflow.studyId,
      studyId: workflow.studyId,
      sourceIds,
    };
  }
}

export const evidenceResearchOrchestrator = new EvidenceResearchOrchestrator();
