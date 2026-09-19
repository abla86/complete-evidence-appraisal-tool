export type ModuleId =
  | 'overview'
  | 'evidence-review'
  | 'papers'
  | 'knowledge-graph'
  | 'health-flow'
  | 'architecture'
  | 'ai-assistant'
  | 'devops-audit';

export type UserRole = 'FOUNDER' | 'PRINCIPAL_INVESTIGATOR' | 'REVIEWER' | 'AUDITOR';

export interface ProjectContext {
  id: string;
  name: string;
  question: string;
  domain: 'HEALTHCARE' | 'CLINICAL_INFORMATICS' | 'SYSTEMS_ARCHITECTURE';
  tenantId: string;
  version: string;
  createdAt: string;
}

export interface PicoData {
  population: string;
  intervention: string;
  comparison: string;
  outcome: string;
  studyType: string;
}

export interface CitationItem {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi: string;
  abstract: string;
  screeningStatus: 'UNSCREENED' | 'INCLUDED' | 'EXCLUDED' | 'MAYBE';
  exclusionReason?: string;
  robScore?: 'LOW' | 'SOME_CONCERNS' | 'HIGH';
  tags: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'ARTICLE' | 'CONCEPT' | 'METHOD' | 'CLINICAL_ENDPOINT' | 'AUTHOR';
  x: number;
  y: number;
  details?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface SyntheticPatientEvent {
  id: string;
  syntheticSubjectId: string;
  timestamp: string;
  stage: 'HENVISNING' | 'TRIAGE' | 'POLIKLINIKK' | 'BEHANDLING' | 'UTSKRIVELSE';
  title: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED';
  complianceStatus: 'VERIFIED' | 'WARNING' | 'FLAGGED';
  clinicalCategory: string;
}

export interface SecurityLayer {
  number: number;
  name: string;
  status: 'ACTIVE' | 'ENFORCED' | 'MONITORED';
  description: string;
  codeSnippet: string;
  category: 'IDENTITY' | 'DATA' | 'COST' | 'GOVERNANCE' | 'ISOLATION';
}

export interface ADR {
  id: string;
  title: string;
  status: 'ACCEPTED' | 'PROPOSED' | 'DEPRECATED';
  date: string;
  context: string;
  decision: string;
  consequences: string[];
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  tenantId: string;
  action: string;
  entity: string;
  details: string;
  hash: string;
}

export interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  category: string;
}

export interface PluginMeta {
  id: string;
  name: string;
  version: string;
  status: 'ONLINE' | 'ACTIVE' | 'SANDBOXED';
  permissions: string[];
  description: string;
}
