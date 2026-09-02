import type { Request, Response } from 'express';
import {
  buildResearchAppraisalPayload,
  getResearchEvidenceSummary,
} from './researchWorkflowService';
import {
  appraisalWorkflowStore,
  createAppraisalFromResearch,
  finalizeAppraisal,
  recordAppraisalResponse,
  validateAppraisal,
} from './appraisalWorkflowBridge';
import { researchWorkflowStore } from './researchWorkflowStore';
import type { AppraisalItemResponse } from './universalAppraisalService';

export function registerAppraisalWorkflowApi(app: { get: Function; post: Function }): void {
  app.post('/api/research-workflow/:studyId/appraisal/session', async (req: Request, res: Response) => {
    try {
      const workflow = researchWorkflowStore.get(req.params.studyId);
      if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
      const reviewerId = String(req.body?.reviewerId || '').trim();
      if (!reviewerId) return res.status(400).json({ success: false, error: 'reviewerId is required' });
      const payload = buildResearchAppraisalPayload(workflow);
      const record = await createAppraisalFromResearch(payload, reviewerId);
      return res.status(201).json({ success: true, session: record.session, research: getResearchEvidenceSummary(workflow) });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Could not create appraisal session' });
    }
  });

  app.get('/api/research-workflow/:studyId/appraisal/sessions', (req: Request, res: Response) => {
    const workflow = researchWorkflowStore.get(req.params.studyId);
    if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
    return res.json({ success: true, sessions: appraisalWorkflowStore.listByStudy(req.params.studyId) });
  });

  app.get('/api/appraisal/:sessionId', (req: Request, res: Response) => {
    const record = appraisalWorkflowStore.get(req.params.sessionId);
    if (!record) return res.status(404).json({ success: false, error: 'Appraisal session not found' });
    return res.json({ success: true, ...record });
  });

  app.post('/api/appraisal/:sessionId/response', async (req: Request, res: Response) => {
    try {
      const response = req.body as AppraisalItemResponse;
      if (response == null || response.itemId === undefined) return res.status(400).json({ success: false, error: 'itemId is required' });
      const record = await recordAppraisalResponse(req.params.sessionId, response);
      return res.json({ success: true, session: record.session });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Could not record appraisal response' });
    }
  });

  app.get('/api/appraisal/:sessionId/validation', (req: Request, res: Response) => {
    try {
      return res.json({ success: true, validation: validateAppraisal(req.params.sessionId) });
    } catch (error) {
      return res.status(404).json({ success: false, error: error instanceof Error ? error.message : 'Appraisal session not found' });
    }
  });

  app.post('/api/appraisal/:sessionId/finalize', async (req: Request, res: Response) => {
    try {
      const record = await finalizeAppraisal(req.params.sessionId);
      return res.json({ success: true, finalized: true, session: record.session });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Could not finalize appraisal' });
    }
  });
}
