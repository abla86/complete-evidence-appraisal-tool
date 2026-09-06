import type {
  EvidenceAgentContext,
  EvidenceAgentId,
  EvidenceAgentResult,
  EvidenceClaimCandidate,
  ResearchPlan,
  VerificationDecision,
} from './evidenceAgentContracts';
import { assertAgentOutputRequiresVerification } from './evidenceAgentContracts';

export interface EvidenceAgentAdapter {
  readonly id: EvidenceAgentId;
  run<T>(context: EvidenceAgentContext, input: unknown): Promise<EvidenceAgentResult<T>>;
}

function createRunId(agentId: EvidenceAgentId): string {
  return `${agentId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function result<T>(
  agentId: EvidenceAgentId,
  context: EvidenceAgentContext,
  value: T,
  warnings: string[] = [],
): EvidenceAgentResult<T> {
  const output: EvidenceAgentResult<T> = {
    agentId,
    runId: createRunId(agentId),
    createdAt: new Date().toISOString(),
    context,
    result: value,
    warnings,
    requiresHumanVerification: true,
  };
  assertAgentOutputRequiresVerification(output);
  return output;
}

function requireProjectId(context: EvidenceAgentContext): string {
  const projectId = context.projectId.trim();
  if (!projectId) throw new Error('projectId is required.');
  return projectId;
}

export class EvidenceAgentOrchestrator {
  async plan(context: EvidenceAgentContext, researchQuestion: string): Promise<EvidenceAgentResult<ResearchPlan>> {
    requireProjectId(context);
    const question = researchQuestion.trim();
    if (!question) throw new Error('researchQuestion is required.');

    return result('research-planner', context, {
      researchQuestion: question,
      objectives: [],
      sources: [],
      inclusionCriteria: [],
      exclusionCriteria: [],
      plannedSteps: [
        'Review and approve the research plan.',
        'Retrieve candidate sources.',
        'Verify candidate evidence against source locations.',
        'Perform human screening and critical appraisal.',
        'Synthesize verified evidence.',
        'Validate citations before reporting.',
      ],
    });
  }

  async retrieve(context: EvidenceAgentContext, candidates: EvidenceClaimCandidate[]): Promise<EvidenceAgentResult<EvidenceClaimCandidate[]>> {
    requireProjectId(context);
    return result(
      'evidence-retrieval',
      context,
      candidates.map(candidate => ({
        ...candidate,
        verificationState: 'UNVERIFIED' as const,
      })),
    );
  }

  async verify(context: EvidenceAgentContext, decisions: VerificationDecision[]): Promise<EvidenceAgentResult<VerificationDecision[]>> {
    requireProjectId(context);
    return result('verification', context, decisions);
  }
}
