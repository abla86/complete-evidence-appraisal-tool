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
    private readonly policyVersion = '1.0.0'
  ) {}

  evaluate(request: ToolRequest, hasUntrustedProvenance: boolean): SecurityDecision {
    const reasons: string[] = [];

    if (!this.policy.allowedTools.includes(request.toolId)) {
      reasons.push('TOOL_NOT_ALLOWLISTED');
    }
    if (this.policy.deniedActions.includes(request.action)) {
      reasons.push('ACTION_DENIED_BY_POLICY');
    }
    if (rank[request.risk] > rank[this.policy.maxRisk]) {
      reasons.push('RISK_EXCEEDS_POLICY');
    }
    if (hasUntrustedProvenance && !this.policy.allowUntrustedProvenance) {
      reasons.push('UNTRUSTED_PROVENANCE');
    }

    let decision: SecurityDecision['decision'] = 'ALLOW';
    if (reasons.length) decision = 'DENY';
    else if (request.requiresConfirmation || rank[request.risk] >= rank[this.policy.requireConfirmationAbove]) {
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
