export type ConsensusDecision='INCLUDE'|'EXCLUDE'|'UNCLEAR';
export interface ReviewerDecision{reviewerId:string;itemId:string;decision:ConsensusDecision;rationale?:string;}
export interface LockedConsensus{itemId:string;decision:ConsensusDecision;rationale:string;arbiterId:string;lockedAt:string;}
export interface ConsensusResult{total:number;agreements:number;disagreements:number;percentAgreement:number;cohensKappa:number;conflicts:string[];}
export function calculateConsensus(a:ReviewerDecision[],b:ReviewerDecision[]):ConsensusResult{
  const A=new Map(a.map(x=>[x.itemId,x.decision])),B=new Map(b.map(x=>[x.itemId,x.decision]));
  const ids=[...new Set([...A.keys(),...B.keys()])];const pairs=ids.map(id=>[A.get(id),B.get(id)] as const).filter((p):p is [ConsensusDecision,ConsensusDecision]=>Boolean(p[0]&&p[1]));
  const agreements=pairs.filter(([x,y])=>x===y).length,total=pairs.length,po=total?agreements/total:0;
  const cats:ConsensusDecision[]=['INCLUDE','EXCLUDE','UNCLEAR'];const pe=cats.reduce((s,c)=>s+(pairs.filter(([x])=>x===c).length/Math.max(total,1))*(pairs.filter(([,y])=>y===c).length/Math.max(total,1)),0);
  return{total,agreements,disagreements:total-agreements,percentAgreement:po*100,cohensKappa:1-pe===0?1:(po-pe)/(1-pe),conflicts:ids.filter(id=>A.get(id)!==B.get(id))};
}
export function lockConsensus(itemId:string,decision:ConsensusDecision,rationale:string,arbiterId:string):LockedConsensus{
  if(!itemId.trim()||!rationale.trim()||!arbiterId.trim())throw new Error('Konsensus krever item, beslutning, begrunnelse og arbiter.');
  return{itemId,decision,rationale:rationale.trim(),arbiterId:arbiterId.trim(),lockedAt:new Date().toISOString()};
}
