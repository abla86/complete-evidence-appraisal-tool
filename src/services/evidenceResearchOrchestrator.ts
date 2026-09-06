import type {
  EvidenceAgentContext,
  EvidenceAgentResult,
  EvidenceClaimCandidate,
  ResearchPlan,
} from '../agents/evidenceAgentContracts';
import { EvidenceAgentOrchestrator } from '../agents/evidenceAgentOrchestrator';
import {
  createResearchWorkflowFromText,
  recordScreeningDecision,
  selectResearchInstrument,
  updateResearchClassification,
  verifyResearchClassification,
  verifyResearchEvidence,
  type WorkflowState,
} from './researchWorkflowService';
import type { DocumentClassificationResult } from '../types';
import { evidenceAppraisalOrchestrator, type EvidenceAppraisalContext } from './evidenceAppraisalOrchestrator';

export interface EvidenceResearchRun {
  workflow: WorkflowState;
  plan?: EvidenceAgentResult<ResearchPlan>;
  evidenceCandidates?: EvidenceAgentResult<EvidenceClaimCandidate[]>;
  appraisal?: EvidenceAppraisalContext;
}

/**
 * Canonical application-level facade.
 *
 * Existing workflow services remain authoritative for state changes and gates.
 * Agent output is candidate work and cannot promote evidence automatically.
 */
export class EvidenceResearchOrchestrator {
  private readonly agents = new EvidenceAgentOrchestrator();

  createFromText(text: string, fileName: string, studyId?: string): WorkflowState {
    return createResearchWorkflowFromText(text, fileName, studyId);
  }

  plan(workflow: WorkflowState, researchQuestion: string, projectId = workflow.studyId): Promise<EvidenceAgentResult<ResearchPlan>> {
    return this.agents.plan(this.context(workflow, projectId), researchQuestion);
  }

  prepareEvidenceCandidates(workflow: WorkflowState, candidates: EvidenceClaimCandidate[], projectId = workflow.studyId): Promise<EvidenceAgentResult<EvidenceClaimCandidate[]>> {
    return this.agents.retrieve(this.context(workflow, projectId), candidates);
  }

  applyClassification(workflow: WorkflowState, classification: DocumentClassificationResult): WorkflowState {
    return updateResearchClassification(workflow, classification);
  }

  verifyClassification(workflow: WorkflowState, reviewerId: string, approved: boolean): WorkflowState {
    return verifyResearchClassification(workflow, reviewerId, approved);
  }

  verifyEvidence(workflow: WorkflowState, evidenceId: string, approved: boolean, reviewerId: string): WorkflowState {
    return verifyResearchEvidence(workflow, evidenceId, approved, reviewerId);
  }

  recordScreening(workflow: WorkflowState, reviewerId: string, decision: 'INCLUDED' | 'EXCLUDED', reason?: string): WorkflowState {
    return recordScreeningDecision(workflow, reviewerId, decision, reason);
  }

  selectInstrument(workflow: WorkflowState, instrumentId: string): WorkflowState {
    return selectResearchInstrument(workflow, instrumentId);
  }

  startAppraisal(workflow: WorkflowState, reviewerId: string): Promise<EvidenceAppraisalContext> {
    return evidenceAppraisalOrchestrator.start(workflow, reviewerId);
  }

  private context(workflow: WorkflowState, projectId: string): EvidenceAgentContext {
    const sourceIds = workflow.research?.evidenceBundle.evidence.map(evidence => evidence.id) ?? [];
    return {
      projectId: projectId.trim() || workflow.studyId,
      studyId: workflow.studyId,
      sourceIds,
    };
  }
}

export const evidenceResearchOrchestrator = new EvidenceResearchOrchestrator();
