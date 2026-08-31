export type TrustLevel = 'TRUSTED' | 'UNTRUSTED' | 'DERIVED';
export type ActionRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProvenanceNode {
  id: string;
  sourceType: 'USER' | 'SYSTEM' | 'TOOL' | 'WEB' | 'DOCUMENT' | 'MEMORY' | 'MODEL';
  sourceId: string;
  trust: TrustLevel;
  contentHash: string;
  parentIds: string[];
}

export interface ToolRequest {
  toolId: string;
  action: string;
  arguments: Record<string, unknown>;
  requestedBy: string;
  provenanceIds: string[];
  risk: ActionRisk;
  requiresConfirmation: boolean;
}

export interface AuthorizationPolicy {
  allowedTools: string[];
  deniedActions: string[];
  maxRisk: ActionRisk;
  requireConfirmationAbove: ActionRisk;
  allowUntrustedProvenance: boolean;
}

export interface SecurityDecision {
  decision: 'ALLOW' | 'DENY' | 'CONFIRM';
  reasonCodes: string[];
  risk: ActionRisk;
  policyVersion: string;
  requestHash: string;
  timestamp: string;
}

export interface SecurityAssessment {
  normalizedHash: string;
  provenance: ProvenanceNode[];
  requests: ToolRequest[];
  decisions: SecurityDecision[];
  blockedCount: number;
  confirmationCount: number;
  allowedCount: number;
}
