import type { Express, Request, Response } from 'express';
import {
  appendAuditEvent,
  createAssessment,
  enforceAiBoundary,
  finalizeAssessment,
  verifyAuditChain,
  verifyImmutableAssessment,
  type Assessment,
  type AuditEvent,
} from './evidenceCore';

const assessments = new Map<string, Assessment>();
const audit = new Map<string, AuditEvent[]>();

function actor(req: Request): string {
  const value = String(req.header('x-reviewer-id') || '').trim();
  if (!value) throw new Error('x-reviewer-id er påkrevd.');
  return value.slice(0, 128);
}

function sendError(res: Response, error: unknown, status = 400) {
  res.status(status).json({ success: false, error: error instanceof Error ? error.message : 'Ukjent feil.' });
}

export function registerIntegrityApi(app: Express) {
  app.get('/api/integrity/health', (_req, res) => {
    res.json({ success: true, assessments: assessments.size, auditChains: audit.size });
  });

  app.post('/api/integrity/assessments', (req, res) => {
    try {
      const reviewerId = actor(req);
      const assessment = createAssessment({ ...req.body, reviewerId });
      assessments.set(assessment.id, assessment);
      audit.set(assessment.id, []);
      appendAuditEvent(audit.get(assessment.id)!, assessment.id, reviewerId, 'ASSESSMENT_CREATED', { instrumentId: assessment.instrumentId, instrumentVersion: assessment.instrumentVersion });
      res.status(201).json({ success: true, assessment });
    } catch (e) { sendError(res, e); }
  });

  app.get('/api/integrity/assessments/:id', (req, res) => {
    const assessment = assessments.get(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, error: 'Assessment ikke funnet.' });
    res.json({ success: true, assessment, immutableVerified: verifyImmutableAssessment(assessment), auditChainVerified: verifyAuditChain(audit.get(assessment.id) || []) });
  });

  app.post('/api/integrity/assessments/:id/finalize', (req, res) => {
    try {
      const current = assessments.get(req.params.id);
      if (!current) return res.status(404).json({ success: false, error: 'Assessment ikke funnet.' });
      const reviewerId = actor(req);
      const finalized = finalizeAssessment(current, reviewerId);
      assessments.set(finalized.id, finalized);
      appendAuditEvent(audit.get(finalized.id)!, finalized.id, reviewerId, 'ASSESSMENT_FINALIZED', { immutableHash: finalized.immutableHash });
      res.json({ success: true, assessment: finalized, immutableVerified: verifyImmutableAssessment(finalized) });
    } catch (e) { sendError(res, e); }
  });

  app.get('/api/integrity/assessments/:id/audit', (req, res) => {
    const events = audit.get(req.params.id);
    if (!events) return res.status(404).json({ success: false, error: 'Assessment ikke funnet.' });
    res.json({ success: true, valid: verifyAuditChain(events), events });
  });

  app.post('/api/integrity/ai-candidate', (req, res) => {
    try {
      actor(req);
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new Error('AI candidate må være et JSON-objekt.');
      res.json({ success: true, candidate: enforceAiBoundary(req.body) });
    } catch (e) { sendError(res, e); }
  });
}
