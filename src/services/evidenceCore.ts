import { createHash, randomUUID } from 'node:crypto';

export type Lifecycle = 'DRAFT' | 'IN_REVIEW' | 'FINALIZED' | 'REOPENED' | 'AMENDED';
export type Answer = string;
export interface EvidenceLocation { page?: string; section?: string; table?: string; figure?: string; }
export interface EvidenceItem { itemId: string; answer: Answer; rationale: string; evidenceText?: string; location?: EvidenceLocation; reviewerId: string; aiSuggested?: boolean; aiVerified?: boolean; }
export interface Assessment { id: string; studyId: string; studyTitle: string; instrumentId: string; instrumentVersion: string; instrumentChecksum: string; reviewerId: string; lifecycle: Lifecycle; items: EvidenceItem[]; createdAt: string; updatedAt: string; finalizedAt?: string; finalizedBy?: string; immutableHash?: string; }
export interface AuditEvent { id: string; assessmentId: string; actorId: string; action: string; timestamp: string; payloadHash: string; previousEventHash: string | null; eventHash: string; }

function canonical(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
    .join(',')}}`;
}

const sha256 = (value: unknown): string => createHash('sha256').update(canonical(value), 'utf8').digest('hex');

export function createAssessment(input: Omit<Assessment, 'id'|'createdAt'|'updatedAt'|'lifecycle'>): Assessment {
  if (!input.studyId.trim() || !input.studyTitle.trim() || !input.instrumentId.trim() || !input.instrumentVersion.trim() || !input.reviewerId.trim()) throw new Error('studyId, studyTitle, instrumentId, instrumentVersion og reviewerId er påkrevd.');
  return { ...input, id: randomUUID(), lifecycle: 'DRAFT', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export function validateAssessment(a: Assessment): string[] {
  const errors: string[] = [];
  if (!a.id || !a.studyId || !a.instrumentId || !a.instrumentVersion || !a.instrumentChecksum) errors.push('Assessment mangler identifikator eller versjonsbinding.');
  if (!a.reviewerId) errors.push('Reviewer er påkrevd.');
  const seen = new Set<string>();
  for (const item of a.items) {
    if (seen.has(item.itemId)) errors.push(`Duplikat item: ${item.itemId}`);
    seen.add(item.itemId);
    if (!item.answer.trim()) errors.push(`Item ${item.itemId} mangler svar.`);
    if (!item.rationale.trim()) errors.push(`Item ${item.itemId} mangler begrunnelse.`);
    if (item.aiSuggested && !item.aiVerified) errors.push(`AI-forslag ${item.itemId} krever menneskelig verifikasjon før finalisering.`);
  }
  return errors;
}

export function finalizeAssessment(a: Assessment, actorId: string): Assessment {
  if (a.lifecycle === 'FINALIZED') throw new Error('Assessment er allerede finalisert.');
  if (!actorId.trim()) throw new Error('Finaliserende bruker er påkrevd.');
  const errors = validateAssessment(a);
  if (errors.length) throw new Error(errors.join(' '));
  const finalized: Assessment = { ...a, lifecycle: 'FINALIZED', finalizedAt: new Date().toISOString(), finalizedBy: actorId, updatedAt: new Date().toISOString() };
  finalized.immutableHash = sha256({ ...finalized, immutableHash: undefined });
  return finalized;
}

export function verifyImmutableAssessment(a: Assessment): boolean {
  return a.lifecycle === 'FINALIZED' && !!a.immutableHash && sha256({ ...a, immutableHash: undefined }) === a.immutableHash;
}

export function appendAuditEvent(events: AuditEvent[], assessmentId: string, actorId: string, action: string, payload: unknown): AuditEvent {
  if (!assessmentId.trim() || !actorId.trim() || !action.trim()) throw new Error('Audit event mangler identifikator, aktør eller handling.');
  const previousEventHash = events.length ? events[events.length - 1].eventHash : null;
  const payloadHash = sha256(payload);
  const timestamp = new Date().toISOString();
  const eventHash = sha256({ assessmentId, actorId, action, timestamp, payloadHash, previousEventHash });
  const event: AuditEvent = { id: randomUUID(), assessmentId, actorId, action, timestamp, payloadHash, previousEventHash, eventHash };
  events.push(event);
  return event;
}

export function verifyAuditChain(events: AuditEvent[]): boolean {
  let previous: string | null = null;
  for (const event of events) {
    if (event.previousEventHash !== previous) return false;
    const expected = sha256({ assessmentId: event.assessmentId, actorId: event.actorId, action: event.action, timestamp: event.timestamp, payloadHash: event.payloadHash, previousEventHash: event.previousEventHash });
    if (expected !== event.eventHash) return false;
    previous = event.eventHash;
  }
  return true;
}

export function classifyInput(text: string): 'PUBLIC_RESEARCH_DATA'|'PERSONAL_DATA_RISK'|'UNKNOWN' {
  const t = text.toLowerCase();
  if (/fødselsnummer|personnummer|social security|national id|phone|telefonnummer|adresse|address|email|e-post/.test(t)) return 'PERSONAL_DATA_RISK';
  if (/doi|abstract|randomized|randomisert|systematic review|systematisk oversikt|guideline|retningslinje/.test(t)) return 'PUBLIC_RESEARCH_DATA';
  return 'UNKNOWN';
}

export function enforceAiBoundary<T extends Record<string, unknown>>(proposal: T): T & { _status: 'AI_CANDIDATE' } {
  return { ...proposal, _status: 'AI_CANDIDATE' };
}
