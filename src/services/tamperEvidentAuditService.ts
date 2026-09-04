import { createHash } from 'node:crypto';

export interface AuditEvent {
  id: string;
  projectId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  occurredAt: string;
  payloadHash: string;
  previousHash: string;
  chainHash: string;
}

export function appendAuditEvent(events: readonly AuditEvent[], input: Omit<AuditEvent,'id'|'occurredAt'|'payloadHash'|'previousHash'|'chainHash'>): AuditEvent {
  const previousHash = events.at(-1)?.chainHash ?? 'GENESIS';
  const occurredAt = new Date().toISOString();
  const payloadHash = createHash('sha256').update(JSON.stringify({ ...input, occurredAt })).digest('hex');
  const chainHash = createHash('sha256').update(`${previousHash}:${payloadHash}`).digest('hex');
  return { ...input, id:`AUD-${Date.now()}-${events.length+1}`, occurredAt, payloadHash, previousHash, chainHash };
}

export function verifyAuditChain(events: readonly AuditEvent[]): { valid:boolean; firstBrokenIndex:number|null } {
  let previousHash='GENESIS';
  for(let i=0;i<events.length;i++){
    const event=events[i];
    if(event.previousHash!==previousHash) return {valid:false,firstBrokenIndex:i};
    const expected=createHash('sha256').update(`${event.previousHash}:${event.payloadHash}`).digest('hex');
    if(event.chainHash!==expected) return {valid:false,firstBrokenIndex:i};
    previousHash=event.chainHash;
  }
  return {valid:true,firstBrokenIndex:null};
}
