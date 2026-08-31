import { sha256, stableJson } from './hash';
import type { ActionRisk, AuthorizationPolicy, SecurityDecision, ToolRequest } from './types';

const rank: Record<ActionRisk, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

export class AgentAuthorizationEngine {
  constructor(
    private readonly policy: AuthorizationPolicy,
    private readonly policyVersion = '1.1.0'
  ) {}

  evaluate(request: ToolRequest, hasUntrustedProvenance: boolean): SecurityDecision {
    const reasons: string[] = [];

    // Fail closed: a tool must be explicitly allowed.
    if (!this.policy.allowedTools.includes(request.toolId)) {
      reasons.push('TOOL_NOT_ALLOWLISTED');
    }

    // Exact action deny rules take precedence over all positive permissions.
    if (this.policy.deniedActions.includes(request.action)) {
      reasons.push('ACTION_DENIED_BY_POLICY');
    }

    if (!(request.risk in rank) || rank[request.risk] > rank[this.policy.maxRisk]) {
      reasons.push('RISK_EXCEEDS_POLICY');
    }

    // Missing/unknown provenance is handled as unsafe by ProvenanceGraph.
    if (hasUntrustedProvenance && !this.policy.allowUntrustedProvenance) {
      reasons.push('UNTRUSTED_PROVENANCE');
    }

    let decision: SecurityDecision['decision'] = 'ALLOW';

    if (reasons.length > 0) {
      decision = 'DENY';
    } else if (
      request.requiresConfirmation ||
      rank[request.risk] >= rank[this.policy.requireConfirmationAbove]
    ) {
      decision = 'CONFIRM';
      reasons.push('HUMAN_CONFIRMATION_REQUIRED');
    }

    return {
      decision,
      reasonCodes: reasons,
      risk: request.risk,
      policyVersion: this.policyVersion,
      requestHash: sha256(stableJson(request)),
      timestamp: new Date().toISOString()
    };
  }
}
