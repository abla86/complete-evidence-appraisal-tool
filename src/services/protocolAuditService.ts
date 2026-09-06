export interface ProtocolRecord{id:string;title:string;reviewQuestion:string;population:string;intervention:string;comparator:string;outcomes:string;searchStrategy:string;inclusionCriteria:string;exclusionCriteria:string;riskOfBiasTool:string;synthesisMethod:string;}
export interface AuditEvent{id:string;timestamp:string;action:string;actor:string;payloadHash:string;previousHash:string;eventHash:string;}
async function sha256(value:string):Promise<string>{const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(d)).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function appendAuditEvent(events:AuditEvent[],action:string,actor:string,payload:unknown):Promise<AuditEvent[]>{
  const previousHash=events.at(-1)?.eventHash??'GENESIS',timestamp=new Date().toISOString(),payloadHash=await sha256(JSON.stringify(payload));
  const eventHash=await sha256([previousHash,timestamp,action,actor,payloadHash].join('|'));
  return [...events,{id:crypto.randomUUID(),timestamp,action,actor,payloadHash,previousHash,eventHash}];
}
export async function verifyAuditChain(events:AuditEvent[]):Promise<boolean>{let previous='GENESIS';for(const event of events){const expected=await sha256([previous,event.timestamp,event.action,event.actor,event.payloadHash].join('|'));if(event.previousHash!==previous||event.eventHash!==expected)return false;previous=event.eventHash;}return true;}
export function protocolToCsv(protocol:ProtocolRecord):string{return Object.values(protocol).map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',');}


