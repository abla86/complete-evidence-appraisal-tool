export type DocumentSourceType = 'pdf' | 'docx' | 'txt' | 'markdown' | 'web' | 'unknown';

export type VerificationStatus = 'UNVERIFIED' | 'AI_CANDIDATE' | 'HUMAN_VERIFIED' | 'REJECTED';
export type EvidenceStatus = 'AI_CANDIDATE' | 'HUMAN_VERIFIED' | 'MANUAL' | 'REJECTED';

export type EvidenceLocation = {
  documentId: string;
  fileName: string;
  page?: string;
  section?: string;
  table?: string;
  figure?: string;
  location: string;
  quote: string;
};

export type ResearchDocument = {
  id: string;
  fileName: string;
  mimeType?: string;
  sourceType: DocumentSourceType;
  text: string;
  createdAt: string;
  verification: VerificationStatus;
  wordCount: number;
  estimatedPages: number;
};

export type EvidenceClaim = {
  id: string;
  claim: string;
  documentId?: string;
  location?: string;
  quote?: string;
  status: 'candidate' | 'verified' | 'rejected';
  createdAt: string;
};

export type ResearchAnswer = {
  answer: string;
  evidence: EvidenceLocation[];
  uncertainties: string[];
  mode: 'ai' | 'fallback';
};

export type CitationMetadata = {
  doi?: string;
  pmid?: string;
  title: string;
  authors: string[];
  year?: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  url?: string;
  verified?: boolean;
};

export type CitationRecord = CitationMetadata & {
  id: string;
  createdAt: string;
  status: VerificationStatus;
};

export type ResearchEngineHealth = {
  service: 'academic-research-engine';
  version: string;
  status: 'ok' | 'degraded';
  capabilities: string[];
};

export type EvidenceHandoff = {
  contractVersion: '1.0.0';
  source: 'academic-research-engine';
  document: ResearchDocument;
  evidence: EvidenceLocation[];
  citation?: {
    apa7?: string;
    vancouver?: string;
  };
};
