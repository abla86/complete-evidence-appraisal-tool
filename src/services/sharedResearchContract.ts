export type ResearchSource = {
  id: string;
  fileName: string;
  sourceType: string;
  text: string;
  verification: 'unverified' | 'candidate' | 'verified';
};

export type EvidenceProvenance = {
  sourceId: string;
  location: string;
  quote: string;
};

export type ResearchHandoff = {
  studyId?: string;
  title?: string;
  sources: ResearchSource[];
  evidence: EvidenceProvenance[];
  claims: Array<{
    id: string;
    claim: string;
    status: 'candidate' | 'verified' | 'rejected';
  }>;
};

export function createResearchHandoff(input: ResearchHandoff): ResearchHandoff {
  return {
    ...input,
    sources: [...input.sources],
    evidence: [...input.evidence],
    claims: [...input.claims]
  };
}

