export type ReportingStatus='NOT_ASSESSED'|'INCOMPLETE'|'COMPLETE';
export interface ReportingCheck { id:string; label:string; required:boolean; status:ReportingStatus; evidence?:string; location?:string; note?:string; }
export interface ReportingAssessment { guidelineId:string; version:string; checks:ReportingCheck[]; completionPercent:number; ready:boolean; }

export function evaluateReportingAssessment(guidelineId:string, version:string, checks:ReportingCheck[]):ReportingAssessment {
  if(!guidelineId.trim()||!version.trim()) throw new Error('Guideline ID og versjon er påkrevd.');
  const required=checks.filter(c=>c.required); const complete=required.filter(c=>c.status==='COMPLETE').length;
  return { guidelineId, version, checks, completionPercent:required.length?Math.round(complete/required.length*100):0, ready:required.length>0&&complete===required.length };
}
