import type { Request, Response } from 'express';
import { buildResearchAppraisalPayload, getResearchEvidenceSummary } from './researchWorkflowService';
import { appraisalWorkflowStore, changeAppraisalInstrument, createAndAttachAppraisal, finalizeAppraisal, recordAppraisalResponse, validateAppraisal } from './appraisalWorkflowBridge';
import { researchWorkflowStore } from './researchWorkflowStore';
import { getQualityAssessmentsForSession } from './qualityAssessmentService';
import type { AppraisalItemResponse, AppraisalSession } from './universalAppraisalService';
import { reviewerIdForRequest } from './authApi';

function getWorkflowOrNull(studyId: string) { return researchWorkflowStore.get(studyId.trim()); }

function sessionResponse(sessionId: string) {
  const record = appraisalWorkflowStore.get(sessionId);
  if (!record) return null;
  const workflow = getWorkflowOrNull(record.researchStudyId);
  return { record, session: record.session, workflow, qualityAssessments: getQualityAssessmentsForSession(sessionId), research: workflow ? getResearchEvidenceSummary(workflow) : null };
}

function sameResponse(a: AppraisalItemResponse, b: AppraisalItemResponse): boolean {
  return JSON.stringify(a.answer) === JSON.stringify(b.answer)
    && String(a.rationale ?? '') === String(b.rationale ?? '')
    && JSON.stringify(a.evidence ?? null) === JSON.stringify(b.evidence ?? null);
}

function requireReviewer(req: Request): string { return reviewerIdForRequest(req); }

function assertSessionReviewer(session: AppraisalSession, reviewerId: string): void {
  if (session.reviewerId !== reviewerId.trim()) throw new Error('Reviewer stemmer ikke med appraisal-sesjonen.');
}

export function registerAppraisalWorkflowApi(app: { get: Function; post: Function }): void {
  app.post('/api/research-workflow/:studyId/appraisal/session', async (req: Request, res: Response) => {
    try {
      const workflow = getWorkflowOrNull(req.params.studyId);
      if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
      const reviewerId = requireReviewer(req);
      const payload = buildResearchAppraisalPayload(workflow);
      const attached = await createAndAttachAppraisal(payload, reviewerId, session => {
        const current = getWorkflowOrNull(req.params.studyId);
        if (!current) throw new Error('Workflow not found');
        const appraisalSessions = current.appraisalSessions.some(item => item.id === session.id)
          ? current.appraisalSessions.map(item => item.id === session.id ? session : item)
          : [...current.appraisalSessions, session];
        return researchWorkflowStore.save({ ...current, appraisalSessions });
      });
      const response = sessionResponse(attached.record.session.id);
      return res.status(201).json({ success: true, ...(response ?? { record: attached.record, session: attached.record.session, workflow: attached.workflow }) });
    } catch (error) {
      return res.status(401).json({ success: false, error: error instanceof Error ? error.message : 'Could not create appraisal session' });
    }
  });

  app.get('/api/research-workflow/:studyId/appraisal/sessions', (req: Request, res: Response) => {
    try {
      const reviewerId = requireReviewer(req);
      const studyId = req.params.studyId.trim();
      const workflow = getWorkflowOrNull(studyId);
      if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
      const sessions = appraisalWorkflowStore.listByStudy(studyId).filter(record => record.session.reviewerId === reviewerId);
      return res.json({ success: true, sessions, workflow, research: getResearchEvidenceSummary(workflow) });
    } catch (error) { return res.status(401).json({ success: false, error: error instanceof Error ? error.message : 'Authentication required' }); }
  });

  app.get('/api/appraisal/:sessionId', (req: Request, res: Response) => {
    try {
      const reviewerId = requireReviewer(req);
      const response = sessionResponse(req.params.sessionId);
      if (!response) return res.status(404).json({ success: false, error: 'Appraisal session not found' });
      assertSessionReviewer(response.session, reviewerId);
      return res.json({ success: true, ...response });
    } catch (error) { return res.status(401).json({ success: false, error: error instanceof Error ? error.message : 'Authentication required' }); }
  });

  app.post('/api/appraisal/:sessionId/instrument', async (req: Request, res: Response) => {
    try {
      const reviewerId = requireReviewer(req);
      const instrumentId = String(req.body?.instrumentId ?? '').trim();
      if (!instrumentId) return res.status(400).json({ success: false, error: 'instrumentId is required' });
      const record = await changeAppraisalInstrument(req.params.sessionId.trim(), instrumentId, reviewerId);
      const response = sessionResponse(record.session.id);
      return res.json({ success: true, ...(response ?? { record, session: record.session }) });
    } catch (error) {
      const status = error instanceof Error && error.message === 'Authentication required.' ? 401 : 400;
      return res.status(status).json({ success: false, error: error instanceof Error ? error.message : 'Could not change appraisal instrument' });
    }
  });

  app.post('/api/appraisal/:sessionId/sync', async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId.trim();
      const record = appraisalWorkflowStore.get(sessionId);
      if (!record) return res.status(404).json({ success: false, error: 'Appraisal session not found' });
      const reviewerId = requireReviewer(req);
      assertSessionReviewer(record.session, reviewerId);

      const incoming = req.body?.session as AppraisalSession | undefined;
      if (!incoming || incoming.id !== record.session.id) return res.status(400).json({ success: false, error: 'A valid matching session is required' });
      if (incoming.studyId !== record.session.studyId || incoming.instrumentId !== record.session.instrumentId || incoming.instrumentVersion !== record.session.instrumentVersion || incoming.reviewerId !== record.session.reviewerId) return res.status(409).json({ success: false, error: 'Session identity cannot be changed' });
      if (record.session.locked) return res.status(409).json({ success: false, error: 'Appraisal session is locked' });
      if (!Array.isArray(incoming.responses)) return res.status(400).json({ success: false, error: 'responses must be an array' });

      let currentRecord = record;
      for (const response of incoming.responses) {
        const existing = currentRecord.session.responses.find(item => String(item.itemId) === String(response.itemId));
        if (existing && sameResponse(existing, response)) continue;
        currentRecord = await recordAppraisalResponse(sessionId, response, reviewerId);
      }
      const currentIds = new Set(incoming.responses.map(response => String(response.itemId)));
      const staleResponses = currentRecord.session.responses.filter(response => !currentIds.has(String(response.itemId)));
      if (staleResponses.length > 0) return res.status(409).json({ success: false, error: 'Sync cannot implicitly delete canonical appraisal responses; use an explicit response-delete operation.' });
      const response = sessionResponse(sessionId);
      if (!response) return res.status(404).json({ success: false, error: 'Appraisal session not found' });
      return res.json({ success: true, ...response });
    } catch (error) { return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Could not sync appraisal session' }); }
  });

  app.post('/api/appraisal/:sessionId/response', async (req: Request, res: Response) => {
    try {
      const reviewerId = requireReviewer(req);
      const response = req.body?.response as AppraisalItemResponse | undefined;
      if (!response || response.itemId === undefined) return res.status(400).json({ success: false, error: 'response.itemId is required' });
      await recordAppraisalResponse(req.params.sessionId.trim(), response, reviewerId);
      const updated = sessionResponse(req.params.sessionId.trim());
      if (!updated) return res.status(404).json({ success: false, error: 'Appraisal session not found' });
      return res.json({ success: true, ...updated });
    } catch (error) { return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Could not record appraisal response' }); }
  });

  app.get('/api/appraisal/:sessionId/validation', (req: Request, res: Response) => {
    try { const reviewerId = requireReviewer(req); const record = appraisalWorkflowStore.get(req.params.sessionId.trim()); if (!record) return res.status(404).json({ success: false, error: 'Appraisal session not found' }); assertSessionReviewer(record.session, reviewerId); return res.json({ success: true, validation: validateAppraisal(req.params.sessionId.trim()) }); }
    catch (error) { return res.status(401).json({ success: false, error: error instanceof Error ? error.message : 'Authentication required' }); }
  });

  app.post('/api/appraisal/:sessionId/finalize', async (req: Request, res: Response) => {
    try {
      const reviewerId = requireReviewer(req);
      const record = appraisalWorkflowStore.get(req.params.sessionId.trim());
      if (!record) return res.status(404).json({ success: false, error: 'Appraisal session not found' });
      assertSessionReviewer(record.session, reviewerId);
      await finalizeAppraisal(req.params.sessionId.trim());
      const finalized = sessionResponse(req.params.sessionId.trim());
      if (!finalized) return res.status(404).json({ success: false, error: 'Appraisal session not found' });
      return res.json({ success: true, finalized: true, ...finalized });
    } catch (error) { return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Could not finalize appraisal' }); }
  });
}
