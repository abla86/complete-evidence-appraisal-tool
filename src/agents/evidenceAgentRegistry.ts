import type { EvidenceAgentId } from './evidenceAgentContracts';

export interface EvidenceAgentDefinition {
  id: EvidenceAgentId;
  name: string;
  purpose: string;
  mutatesVerifiedEvidence: false;
  requiresHumanVerification: true;
}

export const EVIDENCE_AGENT_REGISTRY: readonly EvidenceAgentDefinition[] = [
  {
    id: 'research-planner',
    name: 'Research Planner',
    purpose: 'Build an explicit research plan from a researcher-defined question.',
    mutatesVerifiedEvidence: false,
    requiresHumanVerification: true,
  },
  {
    id: 'evidence-retrieval',
    name: 'Evidence Retrieval',
    purpose: 'Find candidate evidence and preserve source provenance.',
    mutatesVerifiedEvidence: false,
    requiresHumanVerification: true,
  },
  {
    id: 'critical-appraisal',
    name: 'Critical Appraisal',
    purpose: 'Propose instrument-specific appraisal candidates without replacing researcher judgement.',
    mutatesVerifiedEvidence: false,
    requiresHumanVerification: true,
  },
  {
    id: 'verification',
    name: 'Verification',
    purpose: 'Check candidate claims against their cited source locations.',
    mutatesVerifiedEvidence: false,
    requiresHumanVerification: true,
  },
  {
    id: 'synthesis',
    name: 'Synthesis',
    purpose: 'Synthesize verified evidence while preserving uncertainty and conflicts.',
    mutatesVerifiedEvidence: false,
    requiresHumanVerification: true,
  },
  {
    id: 'citation',
    name: 'Citation',
    purpose: 'Validate citation completeness and provenance before reporting.',
    mutatesVerifiedEvidence: false,
    requiresHumanVerification: true,
  },
];

export function getEvidenceAgent(id: EvidenceAgentId): EvidenceAgentDefinition {
  const agent = EVIDENCE_AGENT_REGISTRY.find(item => item.id === id);
  if (!agent) throw new Error(`Unknown Evidence agent: ${id}`);
  return agent;
}
