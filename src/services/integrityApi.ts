import type { Express, Request, Response } from 'express';
import {
  appendAuditEvent,
  createAssessment,
  enforceAiBoundary,
  finalizeAssessment,
  verifyAuditChain,
  verifyImmutableAssessment,
  type Assessment,
} from './evidenceCore';
import { EvidenceStore } from './evidenceStore';

const store = new EvidenceStore();

function actor(req: Request): string {
  const value = String(req.header('x-reviewer-id') || '').trim();
  if (!value) throw new Error('x-reviewer-id er påkrevd.');
  return value.slice(0, 128);
}

function sendError(res: Response, error: unknown, status = 400) {
  res.status(status).json({ success: false, error: error instanceof Error ? error.message : 'Ukjent feil.' });
}

export function registerIntegrityApi(app: Express) {
  app.get('/api/integrity/health', async (_req, res) => {
    try {
      res.json({ success: true, assessments: await store.countAssessments(), auditChains: await store.countAuditChains(), persistence: 'durable-local-store' });
    } catch (e) { sendError(res, e, 503); }
  });

  app.post('/api/integrity/assessments', async (req, res) => {
    try {
      const reviewerId = actor(req);
      const assessment = createAssessment({ ...req.body, reviewerId });
      await store.saveAssessment(assessment);
      const events = await store.getAudit(assessment.id) || [];
      const event = appendAuditEvent(events, assessment.id, reviewerId, 'ASSESSMENT_CREATED', { instrumentId: assessment.instrumentId, instrumentVersion: assessment.instrumentVersion });
      await store.appendAudit(assessment.id, event);
      res.status(201).json({ success: true, assessment });
    } catch (e) { sendError(res, e); }
  });

  app.get('/api/integrity/assessments/:id', async (req, res) => {
    try {
      const assessment = await store.getAssessment(req.params.id);
      if (!assessment) return res.status(404).json({ success: false, error: 'Assessment ikke funnet.' });
      const events = await store.getAudit(assessment.id) || [];
      res.json({ success: true, assessment, immutableVerified: verifyImmutableAssessment(assessment), auditChainVerified: verifyAuditChain(events) });
    } catch (e) { sendError(res, e, 503); }
  });

  app.post('/api/integrity/assessments/:id/finalize', async (req, res) => {
    try {
      const current = await store.getAssessment(req.params.id);
      if (!current) return res.status(404).json({ success: false, error: 'Assessment ikke funnet.' });
      const reviewerId = actor(req);
      const finalized = finalizeAssessment(current, reviewerId);
      await store.saveAssessment(finalized);
      const events = await store.getAudit(finalized.id) || [];
      const event = appendAuditEvent(events, finalized.id, reviewerId, 'ASSESSMENT_FINALIZED', { immutableHash: finalized.immutableHash });
      await store.appendAudit(finalized.id, event);
      res.json({ success: true, assessment: finalized, immutableVerified: verifyImmutableAssessment(finalized) });
    } catch (e) { sendError(res, e); }
  });

  app.get('/api/integrity/assessments/:id/audit', async (req, res) => {
    try {
      const assessment = await store.getAssessment(req.params.id);
      if (!assessment) return res.status(404).json({ success: false, error: 'Assessment ikke funnet.' });
      const events = await store.getAudit(req.params.id) || [];
      res.json({ success: true, valid: verifyAuditChain(events), events });
    } catch (e) { sendError(res, e, 503); }
  });

  app.post('/api/integrity/ai-candidate', (req, res) => {
    try {
      actor(req);
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new Error('AI candidate må være et JSON-objekt.');
      res.json({ success: true, candidate: enforceAiBoundary(req.body) });
    } catch (e) { sendError(res, e); }
  });
}
