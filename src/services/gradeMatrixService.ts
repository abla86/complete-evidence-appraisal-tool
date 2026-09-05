export type GradeLevel='High'|'Moderate'|'Low'|'Very Low';
export type GradeDomain='riskOfBias'|'inconsistency'|'indirectness'|'imprecision'|'publicationBias';
export interface GradeJudgement{domain:GradeDomain;downgrade:0|-1|-2;rationale:string;}
export interface GradeSoFState{outcome:string;participants:number;studies:number;judgements:GradeJudgement[];initial:GradeLevel;final:GradeLevel;}
const levels:GradeLevel[]=['Very Low','Low','Moderate','High'];
export function suggestRiskOfBiasDowngrade(risk:string):0|-1|-2{return /critical|high|serious/i.test(risk)?-2:/moderate|some concerns/i.test(risk)?-1:0;}
export function calculateGrade(input:Omit<GradeSoFState,'final'>):GradeSoFState{
  const start=levels.indexOf(input.initial);const total=input.judgements.reduce((s,j)=>s+j.downgrade,0);return{...input,final:levels[Math.max(0,Math.min(3,start+total))]};
}
export function exportGradeSoFHtml(state:GradeSoFState):string{
  const esc=(v:string)=>v.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]!));
  return '<table><thead><tr><th>Outcome</th><th>Participants</th><th>Studies</th><th>Certainty</th></tr></thead><tbody><tr><td>'+esc(state.outcome)+'</td><td>'+state.participants+'</td><td>'+state.studies+'</td><td>'+state.final+'</td></tr></tbody></table>';
}
