import crypto from 'node:crypto';

export type ResearchDocument = {
  id: string;
  fileName: string;
  mimeType?: string;
  text: string;
  createdAt: string;
};

export type EvidenceClaim = {
  id: string;
  claim: string;
  documentId?: string;
  location?: string;
  quote?: string;
  confidence: 'candidate' | 'verified';
};

const documents = new Map<string, ResearchDocument>();
const claims = new Map<string, EvidenceClaim>();

export class ResearchWorkspaceService {
  static addDocument(input: Omit<ResearchDocument, 'id' | 'createdAt'>) {
    const id = crypto.randomUUID();
    const doc: ResearchDocument = { ...input, id, createdAt: new Date().toISOString() };
    documents.set(id, doc);
    return doc;
  }

  static listDocuments() {
    return [...documents.values()].map(d => ({
      id: d.id, fileName: d.fileName, mimeType: d.mimeType,
      characters: d.text.length, createdAt: d.createdAt
    }));
  }

  static getDocument(id: string) { return documents.get(id); }

  static search(query: string, documentIds?: string[]) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const allowed = documentIds?.length ? new Set(documentIds) : undefined;
    return [...documents.values()].filter(d => !allowed || allowed.has(d.id)).flatMap(d => {
      const text = d.text;
      const lower = text.toLowerCase();
      const hits: Array<{documentId:string;fileName:string;location:string;snippet:string}> = [];
      let from = 0;
      while (hits.length < 20) {
        const positions = terms.map(t => lower.indexOf(t, from)).filter(p => p >= 0);
        if (!positions.length) break;
        const at = Math.min(...positions);
        hits.push({
          documentId: d.id, fileName: d.fileName, location: 'character:' + at,
          snippet: text.slice(Math.max(0, at - 220), Math.min(text.length, at + 500))
        });
        from = at + 1;
      }
      return hits;
    });
  }

  static createClaim(input: Omit<EvidenceClaim, 'id'>) {
    const claim = { ...input, id: crypto.randomUUID() };
    claims.set(claim.id, claim);
    return claim;
  }

  static listClaims() { return [...claims.values()]; }
}
