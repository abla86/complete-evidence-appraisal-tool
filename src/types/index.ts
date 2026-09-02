export type VerificationStatus='unverified'|'candidate'|'verified';
export type ResearchDocument={id:string;fileName:string;mimeType?:string;sourceType:string;text:string;createdAt:string;verification:VerificationStatus};
export type EvidenceLocation={documentId:string;fileName:string;location:string;quote:string};
export type EvidenceClaim={id:string;claim:string;documentId?:string;location?:string;quote?:string;status:'candidate'|'verified'|'rejected';createdAt:string};
export type ResearchAnswer={answer:string;evidence:EvidenceLocation[];uncertainties:string[];mode:'ai'|'fallback'};
export type CitationMetadata={doi?:string;pmid?:string;title:string;authors:string[];year?:number;journal?:string;volume?:string;issue?:string;pages?:string;url?:string;verified?:boolean};
