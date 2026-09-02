export type EvidenceHighlightTag = 'claim' | 'data' | 'methodology' | 'limitation' | 'population' | 'intervention' | 'comparator' | 'outcome';

export interface PDFBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PDFHighlight {
  id: string;
  documentId: string;
  sha256: string;
  content: string;
  annotation?: string;
  position: {
    pageNumber: number;
    boundingBox: PDFBoundingBox;
  };
  createdAt: string;
  createdBy: string;
}

export interface HighlightEvidenceLink {
  highlightId: string;
  evidenceId: string;
  confidence: number;
  tag?: EvidenceHighlightTag;
  createdAt: string;
  createdBy: string;
}

export interface EvidencePassage {
  id: string;
  documentId: string;
  sourceRecordId?: string;
  highlightIds: string[];
  text: string;
  pageNumber?: number;
  section?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}
