/**
 * Private product boundary for Evidence's agent layer.
 *
 * Agents may propose work; they do not silently change verified research state.
 * Every agent result carries provenance and an explicit verification state.
 */

export type EvidenceAgentId =
  | 'research-planner'
  | 'evidence-retrieval'
  | 'critical-appraisal'
  | 'verification'
  | 'synthesis'
  | 'citation';

export type AgentVerificationState =
  | 'UNVERIFIED'
  | 'HUMAN_VERIFIED'
  | 'REJECTED';

export interface EvidenceProvenance {
  sourceId: string;
  sourceType: 'USER_DOCUMENT' | 'DATABASE_RECORD' | 'PUBLISHED_SOURCE' | 'SYSTEM';
  locator?: {
    page?: number;
    section?: string;
    paragraph?: number;
    table?: string;
    figure?: string;
  };
  retrievedAt: string;
}

export interface EvidenceClaimCandidate {
  id: string;
  claim: string;
  quote?: string;
  provenance: EvidenceProvenance[];
  verificationState: AgentVerificationState;
  confidence?: number;
  rationale?: string;
}

export interface EvidenceAgentContext {
  projectId: string;
  studyId?: string;
  reviewerId?: string;
  sourceIds: string[];
  methodologyVersion?: string;
}

export interface EvidenceAgentResult<T> {
  agentId: EvidenceAgentId;
  runId: string;
  createdAt: string;
  context: EvidenceAgentContext;
  result: T;
  warnings: string[];
  requiresHumanVerification: boolean;
}

export interface ResearchPlan {
  researchQuestion: string;
  objectives: string[];
  population?: string;
  interventionOrExposure?: string;
  comparator?: string;
  outcomes?: string[];
  studyDesigns?: string[];
  sources: string[];
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  plannedSteps: string[];
}

export interface VerificationDecision {
  candidateId: string;
  status: 'VERIFIED' | 'REJECTED' | 'NEEDS_REVIEW';
  reviewerId: string;
  verifiedAt: string;
  rationale: string;
}

/**
 * Non-negotiable agent rule:
 * AI output is a candidate until a researcher verifies it.
 */
export function assertAgentOutputRequiresVerification<T>(
  output: EvidenceAgentResult<T>,
): void {
  if (!output.requiresHumanVerification) {
    throw new Error(
      'Evidence agent output must require human verification before it can affect verified research state.',
    );
  }
}
