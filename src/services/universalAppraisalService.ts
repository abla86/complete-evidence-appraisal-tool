import type { AppraisalInstrument } from '../types';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';

const randomUUID = (): string => {
  const webCrypto = globalThis.crypto;
  if (typeof webCrypto?.randomUUID === 'function') return webCrypto.randomUUID();
  if (typeof webCrypto?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    webCrypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }
  throw new Error('Secure UUID generation is unavailable in this runtime.');
};

export type AppraisalAnswer = string | number | boolean | null;

export interface AppraisalEvidenceLink {
  quote?: string;
  page?: string;
  section?: string;
  table?: string;
  figure?: string;
  url?: string;
  sourceId?: string;
}

export interface AppraisalItemResponse {
  itemId: number | string;
  answer: AppraisalAnswer;
  rationale: string;
  evidence?: AppraisalEvidenceLink;
}

export interface AppraisalSession {
  id: string;
  studyId: string;
  instrumentId: string;
  instrumentVersion: string;
  reviewerId: string;
  responses: AppraisalItemResponse[];
  overallJudgement?: string;
  overallRationale?: string;
  createdAt: string;
  updatedAt: string;
  locked: boolean;
}

export interface AppraisalSessionValidation {
  valid: boolean;
  missingItemIds: string[];
  missingRationales: string[];
  issues: string[];
}

export interface AppraisalLaunchDecision {
  instrument: AppraisalInstrument | null;
  allowed: boolean;
  warnings: string[];
  reason: string;
}

function normalizeId(value: number | string): string { return String(value).trim(); }

export function getInstrumentOrNull(instrumentId: string): AppraisalInstrument | null {
  const normalized = instrumentId.trim().toLowerCase();
  if (!normalized) return null;
  return MASTER_INSTRUMENTS_REGISTRY.find(item => item.id.trim().toLowerCase() === normalized) ?? null;
}

export function createBlankAppraisalSession(studyId: string, instrumentId: string, reviewerId: string): AppraisalSession {
  const normalizedStudyId = studyId.trim();
  const normalizedReviewerId = reviewerId.trim();
  const instrument = getInstrumentOrNull(instrumentId);
  if (!normalizedStudyId) throw new Error('studyId is required.');
  if (!normalizedReviewerId) throw new Error('reviewerId is required.');
  if (!instrument) throw new Error(`Ukjent appraisal-instrument: ${instrumentId}`);
  const now = new Date().toISOString();
  return { id: randomUUID(), studyId: normalizedStudyId, instrumentId: instrument.id, instrumentVersion: instrument.version, reviewerId: normalizedReviewerId, responses: [], createdAt: now, updatedAt: now, locked: false };
}

export function upsertAppraisalResponse(session: AppraisalSession, response: AppraisalItemResponse): AppraisalSession {
  if (session.locked) throw new Error('Vurderingen er låst og kan ikke endres.');
  const instrument = getInstrumentOrNull(session.instrumentId);
  if (!instrument) throw new Error(`Ukjent appraisal-instrument: ${session.instrumentId}`);
  const normalizedItemId = normalizeId(response.itemId);
  if (!normalizedItemId) throw new Error('Vurderingspunkt-ID er påkrevd.');
  const question = (instrument.questions ?? []).find(q => normalizeId(q.id) === normalizedItemId);
  if (!question) throw new Error(`Vurderingspunkt ${normalizedItemId} finnes ikke i ${instrument.id} versjon ${instrument.version}.`);
  const answerPresent = response.answer !== null && response.answer !== undefined && String(response.answer).trim() !== '';
  if (answerPresent && !String(response.rationale ?? '').trim()) throw new Error(`Begrunnelse er påkrevd for vurderingspunkt ${normalizedItemId}.`);
  const allowedAnswers = question.allowedAnswers ?? instrument.allowedAnswers ?? [];
  if (allowedAnswers.length > 0 && answerPresent && !allowedAnswers.map(String).includes(String(response.answer))) throw new Error(`Svarverdien for vurderingspunkt ${normalizedItemId} er ikke tillatt av instrumentet.`);
  const normalizedResponse: AppraisalItemResponse = {
    ...response,
    itemId: question.id,
    rationale: String(response.rationale ?? '').trim(),
    evidence: response.evidence ? {
      ...response.evidence,
      quote: response.evidence.quote?.trim(), page: response.evidence.page?.trim(), section: response.evidence.section?.trim(), table: response.evidence.table?.trim(), figure: response.evidence.figure?.trim(), url: response.evidence.url?.trim(), sourceId: response.evidence.sourceId?.trim(),
    } : undefined,
  };
  const existing = session.responses.findIndex(item => normalizeId(item.itemId) === normalizedItemId);
  const responses = [...session.responses];
  if (existing >= 0) responses[existing] = normalizedResponse; else responses.push(normalizedResponse);
  return { ...session, responses, updatedAt: new Date().toISOString() };
}

export function validateAppraisalSession(session: AppraisalSession): AppraisalSessionValidation {
  const instrument = getInstrumentOrNull(session.instrumentId);
  if (!instrument) return { valid: false, missingItemIds: [], missingRationales: [], issues: ['Instrumentet finnes ikke i MethodologyRegistry.'] };
  const expected = new Set((instrument.questions ?? []).map(q => normalizeId(q.id)));
  const responseIds = session.responses.map(response => normalizeId(response.itemId));
  const actual = new Set(responseIds);
  const missingItemIds = [...expected].filter(id => !actual.has(id));
  const unexpectedItemIds = [...new Set(responseIds.filter(id => !expected.has(id)))];
  const duplicateItemIds = [...new Set(responseIds.filter((id, index) => responseIds.indexOf(id) !== index))];
  const missingRationales = session.responses.filter(response => response.answer !== null && response.answer !== undefined && String(response.answer).trim() !== '' && !String(response.rationale ?? '').trim()).map(response => normalizeId(response.itemId));
  const invalidAnswerValues: string[] = [];
  for (const response of session.responses) {
    const question = (instrument.questions ?? []).find(q => normalizeId(q.id) === normalizeId(response.itemId));
    if (!question) continue;
    const allowedAnswers = question.allowedAnswers ?? instrument.allowedAnswers ?? [];
    if (allowedAnswers.length > 0 && response.answer !== null && response.answer !== undefined && String(response.answer).trim() !== '' && !allowedAnswers.map(String).includes(String(response.answer))) invalidAnswerValues.push(normalizeId(response.itemId));
  }
  const issues: string[] = [];
  if (!session.id.trim()) issues.push('Session-ID mangler.');
  if (!session.studyId.trim()) issues.push('studyId mangler.');
  if (!session.reviewerId.trim()) issues.push('reviewerId mangler.');
  if (session.instrumentVersion !== instrument.version) issues.push(`Instrumentversjonen i sesjonen (${session.instrumentVersion}) avviker fra registry (${instrument.version}). Sesjonen må migreres eller vurderes på nytt.`);
  if (missingItemIds.length > 0) issues.push(`${missingItemIds.length} vurderingspunkt mangler svar.`);
  if (unexpectedItemIds.length > 0) issues.push(`${unexpectedItemIds.length} svar peker til vurderingspunkt som ikke finnes i valgt instrumentversjon.`);
  if (duplicateItemIds.length > 0) issues.push(`Dupliserte svar finnes for vurderingspunkt: ${duplicateItemIds.join(', ')}.`);
  if (missingRationales.length > 0) issues.push(`${missingRationales.length} besvarte vurderingspunkt mangler begrunnelse.`);
  if (invalidAnswerValues.length > 0) issues.push(`${invalidAnswerValues.length} svar bruker en verdi som ikke er tillatt av instrumentet.`);
  return { valid: issues.length === 0, missingItemIds, missingRationales, issues };
}

export function assertInstrumentIntegrity(session: AppraisalSession): void {
  const instrument = getInstrumentOrNull(session.instrumentId);
  if (!instrument) throw new Error('INSTRUMENT_INTEGRITY: instrument not found in MethodologyRegistry.');
  if (session.instrumentVersion !== instrument.version) throw new Error(`INSTRUMENT_INTEGRITY: session version ${session.instrumentVersion} does not match registry version ${instrument.version}.`);
  const expected = new Set((instrument.questions ?? []).map(q => normalizeId(q.id)));
  const actual = new Set(session.responses.map(r => normalizeId(r.itemId)));
  if (expected.size !== actual.size || [...expected].some(id => !actual.has(id))) throw new Error('INSTRUMENT_INTEGRITY: session responses do not match the selected instrument question set.');
}

export function lockAppraisalSession(session: AppraisalSession): AppraisalSession {
  if (session.locked) return session;
  assertInstrumentIntegrity(session);
  const validation = validateAppraisalSession(session);
  if (!validation.valid) throw new Error(`Kan ikke låse vurderingen: ${validation.issues.join(' ')}`);
  return { ...session, locked: true, updatedAt: new Date().toISOString() };
}

export function decideAppraisalLaunch(studyDesign: string, instrumentId: string, allowAlternative = false): AppraisalLaunchDecision {
  const instrument = getInstrumentOrNull(instrumentId);
  if (!instrument) return { instrument: null, allowed: false, warnings: ['Ukjent instrument.'], reason: 'Instrumentet finnes ikke.' };
  const design = studyDesign.trim().toLowerCase();
  if (!design) return { instrument, allowed: false, warnings: ['Studiedesign mangler.'], reason: 'Registrer studiedesign før appraisal-instrument velges.' };
  const compatible = instrument.targetStudyDesign.some(target => {
    const normalizedTarget = target.trim().toLowerCase();
    return normalizedTarget === design || normalizedTarget.includes(design) || design.includes(normalizedTarget);
  });
  if (compatible) return { instrument, allowed: true, warnings: [], reason: 'Instrumentet er kompatibelt med registrert studiedesign.' };
  if (allowAlternative) return { instrument, allowed: true, warnings: [`Instrumentet er ikke et direkte design-treff for «${studyDesign}». Bruk krever eksplisitt metodisk begrunnelse.`], reason: 'Instrumentet er valgt som eksplisitt alternativ.' };
  return { instrument, allowed: false, warnings: ['Studiedesign og valgt instrument er metodisk inkompatible.'], reason: 'Bytt instrument eller åpne en eksplisitt alternativ vurdering med dokumentert faglig begrunnelse.' };
}
