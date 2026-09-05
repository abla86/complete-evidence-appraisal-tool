import { CandidateEvidence } from '../types';
import type { ResearchEngineDocument } from './researchEngineGateway';

export type ResearchEvidenceVerification = 'AI_CANDIDATE'|'HUMAN_VERIFIED'|'REJECTED'|'MANUAL';
export interface ResearchEvidenceRecord { id:string; studyId:string; documentId:string; location:{page?:string;section?:string;table?:string;figure?:string}; quote:string; source:ResearchEvidenceVerification; verifiedByResearcher:boolean; verifiedAt?:string; verifiedBy?:string; questionId?:number; suggestedStatus?:string; relevanceScore:number; confidenceReason:string; }
export interface ResearchToAppraisalBundle { contractVersion:string; document:ResearchEngineDocument; classification?:import('../types').DocumentClassificationResult; evidence:ResearchEvidenceRecord[]; readyForAppraisal:boolean; gating:{classificationRequired:true;humanVerificationRequired:true;instrumentRecommendation:string}; }

export class ResearchEvidenceBridge {
  public static buildBundle(document:ResearchEngineDocument,classification?:import('../types').DocumentClassificationResult,studyId=document.id):ResearchToAppraisalBundle {
    const normalizedStudyId=studyId.trim(); if(!normalizedStudyId) throw new Error('studyId is required.');
    const evidence=(document.candidateEvidence??[]).map((candidate,index)=>({id:`research-evidence-${document.id}-${index+1}`,studyId:normalizedStudyId,documentId:document.id,location:{page:candidate.suggestedLocation.page===undefined?undefined:String(candidate.suggestedLocation.page),section:candidate.suggestedLocation.section,table:candidate.suggestedLocation.table,figure:candidate.suggestedLocation.figure},quote:candidate.extractedSnippet,source:'AI_CANDIDATE' as const,verifiedByResearcher:false,questionId:candidate.questionId,suggestedStatus:candidate.suggestedStatus,relevanceScore:candidate.relevanceScore,confidenceReason:candidate.confidenceReason}));
    const recommendedInstrument=classification?.recommendedInstrumentId?.trim()??document.metadata.recommendedInstrumentId?.trim()??'';
    const classificationApproved=classification?.humanDecision?.status==='APPROVED';
    return{contractVersion:'1.0.0',document,classification,evidence,readyForAppraisal:classificationApproved&&Boolean(recommendedInstrument),gating:{classificationRequired:true,humanVerificationRequired:true,instrumentRecommendation:recommendedInstrument}};
  }
  public static verifyEvidence(bundle:ResearchToAppraisalBundle,evidenceId:string,verified:boolean,reviewerId:string):ResearchToAppraisalBundle {
    const id=evidenceId.trim(),reviewer=reviewerId.trim(); if(!id)throw new Error('Evidence ID is required.'); if(!reviewer)throw new Error('Reviewer ID is required.');
    let found=false; const now=new Date().toISOString(); const evidence=bundle.evidence.map(item=>{if(item.id!==id)return item;found=true;return{...item,source:verified?'HUMAN_VERIFIED':'REJECTED',verifiedByResearcher:verified,verifiedAt:now,verifiedBy:reviewer};});
    if(!found)throw new Error(`Evidence finnes ikke: ${id}`); return{...bundle,evidence};
  }
  public static toAppraisalLocation(location:CandidateEvidence['suggestedLocation']){return{page:location.page===undefined?undefined:String(location.page),section:location.section,table:location.table,figure:location.figure};}
}
export default ResearchEvidenceBridge;
