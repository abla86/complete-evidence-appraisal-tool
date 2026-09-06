import type { PRISMAFlow } from '../types/researchWorkflow';

export interface PRISMAValidation { valid: boolean; errors: string[]; warnings: string[]; totals: { identified: number; screened: number; eligible: number; included: number }; }

export function validatePRISMAFlow(flow: PRISMAFlow): PRISMAValidation {
  const errors:string[]=[]; const warnings:string[]=[];
  const id=flow.identification, s=flow.screening, e=flow.eligibility, i=flow.included;
  const identified=id.totalIdentified;
  if (identified !== id.recordsFromDatabases + id.recordsFromOtherSources) errors.push('totalIdentified mÃ¥ vÃ¦re summen av database- og Ã¸vrige kilder.');
  if (id.duplicatesRemoved > identified) errors.push('duplicatesRemoved kan ikke overstige identifiserte poster.');
  if (s.recordsScreened !== identified - id.duplicatesRemoved) errors.push('recordsScreened mÃ¥ samsvare med identifiserte poster etter deduplisering.');
  if (s.recordsExcluded > s.recordsScreened) errors.push('recordsExcluded kan ikke overstige recordsScreened.');
  if (e.fullTextsAssessed !== s.recordsScreened - s.recordsExcluded) errors.push('fullTextsAssessed mÃ¥ samsvare med poster etter title/abstract-screening.');
  const excludedFullText= e.fullTextsExcluded.reduce((sum,x)=>sum+x.count,0);
  if (excludedFullText > e.fullTextsAssessed) errors.push('Summerte fulltekst-eksklusjoner kan ikke overstige fulltekstvurderinger.');
  if (i.studiesFinalSynthesis > i.studiesQualityAssessment) warnings.push('studiesFinalSynthesis er stÃ¸rre enn studiesQualityAssessment; kontroller om alle inkluderte studier faktisk er kvalitetsvurdert.');
  if (i.studiesFinalSynthesis > e.fullTextsAssessed) errors.push('studiesFinalSynthesis kan ikke overstige fulltekstvurderinger.');
  return { valid: errors.length===0, errors, warnings, totals:{identified,screened:s.recordsScreened,eligible:e.fullTextsAssessed,included:i.studiesFinalSynthesis} };
}


