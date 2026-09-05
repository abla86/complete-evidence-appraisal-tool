export type EffectMeasure = 'MEAN_DIFFERENCE' | 'STANDARDIZED_MEAN_DIFFERENCE' | 'RISK_RATIO' | 'ODDS_RATIO' | 'MEAN' | 'SE' | 'EVENT_COUNT';

export interface QuantitativeOutcome {
  id: string; name: string; timepoint?: string;
  interventionN?: number; controlN?: number;
  interventionMean?: number; interventionSd?: number; interventionSe?: number;
  controlMean?: number; controlSd?: number; controlSe?: number;
  interventionEvents?: number; controlEvents?: number;
  effectMeasure?: EffectMeasure; effect?: number; ci95?: [number, number]; pValue?: number;
}
export interface QualitativeFinding {
  id: string; phenomenon: string; context: string; theoreticalFramework?: string;
  theme: string; quote?: string; pageOrSection?: string;
}
export interface ExtractionMatrix {
  studyId: string; title: string; design: string;
  population: { totalN?: number; interventionN?: number; controlN?: number; baseline?: string };
  intervention?: string; comparator?: string;
  primaryOutcomes: QuantitativeOutcome[]; secondaryOutcomes: QuantitativeOutcome[];
  qualitativeFindings: QualitativeFinding[]; notes?: string;
}
export interface ExtractionValidation { valid: boolean; errors: string[]; warnings: string[]; }

export function validateExtraction(matrix: ExtractionMatrix): ExtractionValidation {
  const errors:string[]=[]; const warnings:string[]=[];
  const {totalN,interventionN,controlN}=matrix.population;
  if(!matrix.studyId.trim()) errors.push('studyId is required.');
  if(!matrix.title.trim()) errors.push('title is required.');
  if([totalN,interventionN,controlN].some(v=>v!==undefined && (!Number.isFinite(v)||v<0))) errors.push('Utvalgsstørrelser må være ikke-negative, endelige tall.');
  if(totalN!==undefined&&interventionN!==undefined&&controlN!==undefined&&interventionN+controlN!==totalN) errors.push('Intervention- og kontrollutvalg summerer ikke til total N.');
  for(const outcome of [...matrix.primaryOutcomes,...matrix.secondaryOutcomes]){
    if(!outcome.name.trim()) errors.push('Utfall mangler navn.');
    if(outcome.ci95 && outcome.ci95[0]>outcome.ci95[1]) errors.push('95 % KI har ugyldig rekkefølge.');
    if(outcome.pValue!==undefined&&(outcome.pValue<0||outcome.pValue>1)) errors.push('p-verdi må være mellom 0 og 1.');
  }
  if(!matrix.primaryOutcomes.length&&!matrix.qualitativeFindings.length) warnings.push('Ingen utfall eller kvalitative funn er registrert.');
  return {valid:errors.length===0,errors,warnings};
}
export function createEmptyExtraction(studyId:string,title:string):ExtractionMatrix {
  return {studyId,title,design:'RCT',population:{},primaryOutcomes:[],secondaryOutcomes:[],qualitativeFindings:[]};
}
