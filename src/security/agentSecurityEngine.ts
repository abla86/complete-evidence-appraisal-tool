import { AgentAuthorizationEngine } from './authorization';
import { ProvenanceGraph } from './provenance';
import { sha256 } from './hash';
import type { AuthorizationPolicy, SecurityAssessment, ToolRequest } from './types';

export class AgentSecurityEngine {
  readonly provenance = new ProvenanceGraph();
  readonly authorization: AgentAuthorizationEngine;

  constructor(policy: AuthorizationPolicy) {
    this.authorization = new AgentAuthorizationEngine(policy);
  }

  assess(requests: ToolRequest[]): SecurityAssessment {
    const decisions = requests.map(request =>
      this.authorization.evaluate(request, this.provenance.hasUntrustedPath(request.provenanceIds))
    );

    return {
      normalizedHash: sha256(JSON.stringify(requests)),
      provenance: this.provenance.all(),
      requests,
      decisions,
      blockedCount: decisions.filter(d => d.decision === 'DENY').length,
      confirmationCount: decisions.filter(d => d.decision === 'CONFIRM').length,
      allowedCount: decisions.filter(d => d.decision === 'ALLOW').length
    };
  }
}
