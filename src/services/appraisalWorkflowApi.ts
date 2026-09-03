import type { Request, Response } from 'express';
import {
  buildResearchAppraisalPayload,
  getResearchEvidenceSummary,
} from './researchWorkflowService';
import {
  appraisalWorkflowStore,
  createAndAttachAppraisal,
  finalizeAppraisal,
  recordAppraisalResponse,
  validateAppraisal,
} from './appraisalWorkflowBridge';
import { researchWorkflowStore } from './researchWorkflowStore';
import { getQualityAssessmentsForSession } from './qualityAssessmentService';
import type { AppraisalItemResponse } from './universalAppraisalService';

function getWorkflowOrNull(studyId: string) {
  return researchWorkflowStore.get(studyId);
}

function sessionResponse(sessionId: string) {
  const record = appraisalWorkflowStore.get(sessionId);
  if (!record) return null;
  const workflow = getWorkflowOrNull(record.researchStudyId);
  return {
    record,
    session: record.session,
    workflow,
    qualityAssessments: getQualityAssessmentsForSession(sessionId),
    research: workflow ? getResearchEvidenceSummary(workflow) : null,
  };
}

export function registerAppraisalWorkflowApi(app: { get: Function; post: Function }): void {
  app.post('/api/research-workflow/:studyId/appraisal/session', (req: Request, res: Response) => {
    try {
      const workflow = getWorkflowOrNull(req.params.studyId);
      if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
      const reviewerId = String(req.body?.reviewerId || '').trim();
      if (!reviewerId) return res.status(400).json({ success: false, error: 'reviewerId is required' });
      const payload = buildResearchAppraisalPayload(workflow);
      const attached = createAndAttachAppraisal(payload, reviewerId, (session) => {
        const current = getWorkflowOrNull(req.params.studyId);
        if (!current) throw new Error('Workflow not found');
        const now = new Date().toISOString();
        const screening = current.screening.some(item => item.reviewerId === reviewerId)
          ? current.screening.map(item => item.reviewerId === reviewerId ? { ...item, decision: 'INCLUDED' as const, updatedAt: now } : item)
          : [...current.screening, { studyId: current.studyId, reviewerId, decision: 'INCLUDED', updatedAt: now }];
        return researchWorkflowStore.save({
          ...current,
          screening,
          appraisalSessions: current.appraisalSessions.some(item => item.id === session.id)
            ? current.appraisalSessions.map(item => item.id === session.id ? session : item)
            : [...current.appraisalSessions, session],
        });
      });
      const response = sessionResponse(attached.record.session.id);
      return res.status(201).json({ success: true, ...(response ?? { record: attached.record, session: attached.record.session, workflow: attached.workflow }) });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Could not create appraisal session' });
    }
  });

  app.get('/api/research-workflow/:studyId/appraisal/sessions', (req: Request, res: Response) => {
    const workflow = getWorkflowOrNull(req.params.studyId);
    if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
    return res.json({
      success: true,
      sessions: appraisalWorkflowStore.listByStudy(req.params.studyId),
      workflow,
      research: getResearchEvidenceSummary(workflow),
    });
  });

  app.get('/api/appraisal/:sessionId', (req: Request, res: Response) => {
    const response = sessionResponse(req.params.sessionId);
    if (!response) return res.status(404).json({ success: false, error: 'Appraisal session not found' });
    return res.json({ success: true, ...response });
  });

  app.post('/api/appraisal/:sessionId/response', async (req: Request, res: Response) => {
    try {
      const response = req.body as AppraisalItemResponse;
      if (response == null || response.itemId === undefined) return res.status(400).json({ success: false, error: 'itemId is required' });
      await recordAppraisalResponse(req.params.sessionId, response);
      const updated = sessionResponse(req.params.sessionId);
      if (!updated) return res.status(404).json({ success: false, error: 'Appraisal session not found' });
      return res.json({ success: true, ...updated });
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
      await finalizeAppraisal(req.params.sessionId);
      const finalized = sessionResponse(req.params.sessionId);
      if (!finalized) return res.status(404).json({ success: false, error: 'Appraisal session not found' });
      return res.json({ success: true, finalized: true, ...finalized });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Could not finalize appraisal' });
    }
  });
}
