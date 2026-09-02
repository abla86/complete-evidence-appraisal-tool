import type { AppraisalInstrument } from '../types';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';

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

function normalizeId(value: number | string): string {
  return String(value).trim();
}

export function getInstrumentOrNull(instrumentId: string): AppraisalInstrument | null {
  return MASTER_INSTRUMENTS_REGISTRY.find(item => item.id === instrumentId) ?? null;
}

export function createBlankAppraisalSession(
  studyId: string,
  instrumentId: string,
  reviewerId: string,
): AppraisalSession {
  const instrument = getInstrumentOrNull(instrumentId);
  if (!instrument) throw new Error(`Ukjent appraisal-instrument: ${instrumentId}`);
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    studyId,
    instrumentId,
    instrumentVersion: instrument.version,
    reviewerId,
    responses: [],
    createdAt: now,
    updatedAt: now,
    locked: false,
  };
}

export function upsertAppraisalResponse(
  session: AppraisalSession,
  response: AppraisalItemResponse,
): AppraisalSession {
  if (session.locked) throw new Error('Vurderingen er låst og kan ikke endres.');
  const existing = session.responses.findIndex(item => normalizeId(item.itemId) === normalizeId(response.itemId));
  const responses = [...session.responses];
  if (existing >= 0) responses[existing] = response;
  else responses.push(response);
  return { ...session, responses, updatedAt: new Date().toISOString() };
}

export function validateAppraisalSession(session: AppraisalSession): AppraisalSessionValidation {
  const instrument = getInstrumentOrNull(session.instrumentId);
  if (!instrument) return { valid: false, missingItemIds: [], missingRationales: [], issues: ['Instrumentet finnes ikke i MethodologyRegistry.'] };

  const expected = new Set((instrument.questions ?? []).map(q => normalizeId(q.id)));
  const actual = new Set(session.responses.map(r => normalizeId(r.itemId)));
  const missingItemIds = [...expected].filter(id => !actual.has(id));
  const missingRationales = session.responses
    .filter(r => r.answer !== null && r.answer !== '' && !String(r.rationale ?? '').trim())
    .map(r => normalizeId(r.itemId));
  const issues: string[] = [];

  if (missingItemIds.length) issues.push(`${missingItemIds.length} vurderingspunkt mangler svar.`);
  if (missingRationales.length) issues.push(`${missingRationales.length} besvarte vurderingspunkt mangler begrunnelse.`);

  return { valid: issues.length === 0, missingItemIds, missingRationales, issues };
}

export function lockAppraisalSession(session: AppraisalSession): AppraisalSession {
  const validation = validateAppraisalSession(session);
  if (!validation.valid) throw new Error(`Kan ikke låse vurderingen: ${validation.issues.join(' ')}`);
  return { ...session, locked: true, updatedAt: new Date().toISOString() };
}

export function decideAppraisalLaunch(
  studyDesign: string,
  instrumentId: string,
  allowAlternative: boolean = true,
): AppraisalLaunchDecision {
  const instrument = getInstrumentOrNull(instrumentId);
  if (!instrument) return { instrument: null, allowed: false, warnings: ['Ukjent instrument.'], reason: 'Instrumentet finnes ikke.' };

  const design = studyDesign.trim().toLowerCase();
  const compatible = instrument.targetStudyDesign.some(target => {
    const normalized = target.toLowerCase();
    return normalized.includes(design) || design.includes(normalized);
  });

  if (compatible || allowAlternative) {
    return {
      instrument,
      allowed: true,
      warnings: compatible ? [] : [`Instrumentet er ikke et direkte design-treff for «${studyDesign}». Vurder metodisk begrunnelse før bruk.`],
      reason: compatible ? 'Instrumentet er kompatibelt med registrert studiedesign.' : 'Instrumentet kan brukes som eksplisitt valgt alternativ.'
    };
  }

  return { instrument, allowed: false, warnings: ['Studiedesign og valgt instrument er metodisk inkompatible.'], reason: 'Bytt instrument eller dokumenter eksplisitt hvorfor avviket er faglig forsvarlig.' };
}
