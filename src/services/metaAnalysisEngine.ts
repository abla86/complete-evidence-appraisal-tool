export type MetaModel='FIXED_INVERSE_VARIANCE'|'FIXED_MANTEL_HAENSZEL'|'RANDOM_DERSIMONIAN_LAIRD';
export interface MetaStudy {id:string;label:string;effect:number;standardError:number;}
export interface MetaAnalysisResult {
  model:MetaModel; pooledEffect:number; pooledStandardError:number; ci95:[number,number];
  studies:Array<MetaStudy&{weight:number;lower:number;upper:number}>;
  q:number; df:number; qPValue:number; i2:number; tau2:number;
}
function erf(x:number){const s=x<0?-1:1;const a1=.254829592,a2=-.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=.3275911;const t=1/(1+p*Math.abs(x));return s*(1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x));}
function normalCdf(z:number){return .5*(1+erf(z/Math.SQRT2));}
function chiSquareP(q:number,df:number){if(df<=0)return 1;const z=(Math.pow(q/df,1/3)-(1-2/(9*df)))/Math.sqrt(2/(9*df));return Math.max(0,Math.min(1,1-normalCdf(z)));}
export function runMetaAnalysis(studies:MetaStudy[],model:MetaModel='RANDOM_DERSIMONIAN_LAIRD'):MetaAnalysisResult{
  if(studies.length<2)throw new Error('Meta-analysis requires at least two studies.');
  if(studies.some(s=>!Number.isFinite(s.effect)||!Number.isFinite(s.standardError)||s.standardError<=0))throw new Error('Study effect and standard error must be finite; standard error must be > 0.');
  const fixed=studies.map(s=>1/(s.standardError*s.standardError));const sumFixed=fixed.reduce((a,b)=>a+b,0);
  const fixedEffect=studies.reduce((a,s,i)=>a+fixed[i]*s.effect,0)/sumFixed;
  const q=studies.reduce((a,s,i)=>a+fixed[i]*(s.effect-fixedEffect)**2,0);const df=studies.length-1;
  const c=sumFixed-fixed.reduce((a,w)=>a+w*w,0)/sumFixed;
  const tau2=model==='RANDOM_DERSIMONIAN_LAIRD'?Math.max(0,(q-df)/Math.max(c,Number.EPSILON)):0;
  const weights=studies.map((s,i)=>model==='RANDOM_DERSIMONIAN_LAIRD'?1/(s.standardError*s.standardError+tau2):fixed[i]);
  const sumW=weights.reduce((a,b)=>a+b,0);const pooledEffect=studies.reduce((a,s,i)=>a+weights[i]*s.effect,0)/sumW;
  const pooledStandardError=Math.sqrt(1/sumW);const ci95:[number,number]=[pooledEffect-1.96*pooledStandardError,pooledEffect+1.96*pooledStandardError];
  const i2=q>0?Math.max(0,Math.min(100,(q-df)/q*100)):0;const maxW=Math.max(...weights);
  return {model,pooledEffect,pooledStandardError,ci95,q,df,qPValue:chiSquareP(q,df),i2,tau2,studies:studies.map((s,i)=>({...s,weight:weights[i]/maxW,lower:s.effect-1.96*s.standardError,upper:s.effect+1.96*s.standardError}))};
}
function esc(v:string){return v.replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]!));}
export function createForestPlotSvg(result:MetaAnalysisResult,width=900,rowHeight=44):string{
  const height=(result.studies.length+2)*rowHeight;const values=result.studies.flatMap(s=>[s.lower,s.upper]);values.push(...result.ci95);
  const min=Math.min(...values),max=Math.max(...values),pad=260,plotW=width-pad-40,scale=(x:number)=>pad+(x-min)/(max-min||1)*plotW;
  const zero=scale(0);
  const rows=result.studies.map((s,i)=>{const y=(i+1)*rowHeight,x=scale(s.effect),size=5+16*s.weight;return '<g><text x="10" y="'+(y+5)+'" font-size="12">'+esc(s.label)+'</text><line x1="'+scale(s.lower)+'" x2="'+scale(s.upper)+'" y1="'+y+'" y2="'+y+'" stroke="currentColor"/><rect x="'+(x-size/2)+'" y="'+(y-size/2)+'" width="'+size+'" height="'+size+'" fill="currentColor"/></g>';}).join('');
  const y=(result.studies.length+1)*rowHeight,a=scale(result.ci95[0]),b=scale(result.ci95[1]),m=scale(result.pooledEffect);
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'"><text x="10" y="20" font-size="14">Forest plot</text><line x1="'+zero+'" x2="'+zero+'" y1="30" y2="'+(height-20)+'" stroke="currentColor" stroke-dasharray="4 4"/>'+rows+'<polygon points="'+a+','+y+' '+m+','+(y-10)+' '+b+','+y+' '+m+','+(y+10)+'" fill="currentColor"/></svg>';
}
