import type { Request, Response } from 'express';
import {
  buildResearchAppraisalPayload,
  getResearchEvidenceSummary,
} from './researchWorkflowService';
import {
  appraisalWorkflowStore,
  changeAppraisalInstrument,
  createAndAttachAppraisal,
  finalizeAppraisal,
  recordAppraisalResponse,
  validateAppraisal,
} from './appraisalWorkflowBridge';
import { researchWorkflowStore } from './researchWorkflowStore';
import { getQualityAssessmentsForSession } from './qualityAssessmentService';
import type { AppraisalItemResponse, AppraisalSession } from './universalAppraisalService';

function getWorkflowOrNull(studyId: string) {
  return researchWorkflowStore.get(studyId.trim());
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

function sameResponse(a: AppraisalItemResponse, b: AppraisalItemResponse): boolean {
  return JSON.stringify(a.answer) === JSON.stringify(b.answer)
    && String(a.rationale ?? '') === String(b.rationale ?? '')
    && JSON.stringify(a.evidence ?? null) === JSON.stringify(b.evidence ?? null);
}

export function registerAppraisalWorkflowApi(app: { get: Function; post: Function }): void {
  app.post('/api/research-workflow/:studyId/appraisal/session', async (req: Request, res: Response) => {
    try {
      const workflow = getWorkflowOrNull(req.params.studyId);
      if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });

      const reviewerId = String(req.body?.reviewerId ?? '').trim();
      if (!reviewerId) return res.status(400).json({ success: false, error: 'reviewerId is required' });

      const payload = buildResearchAppraisalPayload(workflow);
      const attached = await createAndAttachAppraisal(payload, reviewerId, session => {
        const current = getWorkflowOrNull(req.params.studyId);
        if (!current) throw new Error('Workflow not found');
        const now = new Date().toISOString();
        const screening = current.screening.some(item => item.reviewerId === reviewerId)
          ? current.screening.map(item => item.reviewerId === reviewerId
            ? { ...item, decision: 'INCLUDED' as const, updatedAt: now }
            : item)
          : [...current.screening, { studyId: current.studyId, reviewerId, decision: 'INCLUDED' as const, updatedAt: now }];

        const appraisalSessions = current.appraisalSessions.some(item => item.id === session.id)
          ? current.appraisalSessions.map(item => item.id === session.id ? session : item)
          : [...current.appraisalSessions, session];

        return researchWorkflowStore.save({
          ...current,
          screening,
          appraisalSessions,
        });
      });

      const response = sessionResponse(attached.record.session.id);
      return res.status(201).json({
        success: true,
        ...(response ?? {
          record: attached.record,
          session: attached.record.session,
          workflow: attached.workflow,
        }),
      });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Could not create appraisal session' });
    }
  });

  app.get('/api/research-workflow/:studyId/appraisal/sessions', (req: Request, res: Response) => {
    const studyId = req.params.studyId.trim();
    const workflow = getWorkflowOrNull(studyId);
    if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
    return res.json({
      success: true,
      sessions: appraisalWorkflowStore.listByStudy(studyId),
      workflow,
      research: getResearchEvidenceSummary(workflow),
    });
  });

  app.get('/api/appraisal/:sessionId', (req: Request, res: Response) => {
    const response = sessionResponse(req.params.sessionId);
    if (!response) return res.status(404).json({ success: false, error: 'Appraisal session not found' });
    return res.json({ success: true, ...response });
  });

  app.post('/api/appraisal/:sessionId/instrument', async (req: Request, res: Response) => {
    try {
      const reviewerId = String(req.body?.reviewerId ?? '').trim();
      const instrumentId = String(req.body?.instrumentId ?? '').trim();
      if (!reviewerId) return res.status(400).json({ success: false, error: 'reviewerId is required' });
      if (!instrumentId) return res.status(400).json({ success: false, error: 'instrumentId is required' });
      const record = await changeAppraisalInstrument(req.params.sessionId.trim(), instrumentId, reviewerId);
      const response = sessionResponse(record.session.id);
      return res.json({ success: true, ...(response ?? { record, session: record.session }) });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Could not change appraisal instrument' });
    }
  });

  app.post('/api/appraisal/:sessionId/sync', async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId.trim();
      const record = appraisalWorkflowStore.get(sessionId);
      if (!record) return res.status(404).json({ success: false, error: 'Appraisal session not found' });

      const incoming = req.body?.session as AppraisalSession | undefined;
      if (!incoming || incoming.id !== record.session.id) {
        return res.status(400).json({ success: false, error: 'A valid matching session is required' });
      }

      if (
        incoming.studyId !== record.session.studyId
        || incoming.instrumentId !== record.session.instrumentId
        || incoming.instrumentVersion !== record.session.instrumentVersion
        || incoming.reviewerId !== record.session.reviewerId
      ) {
        return res.status(409).json({ success: false, error: 'Session identity cannot be changed' });
      }

      if (record.session.locked) {
        return res.status(409).json({ success: false, error: 'Appraisal session is locked' });
      }

      if (!Array.isArray(incoming.responses)) {
        return res.status(400).json({ success: false, error: 'responses must be an array' });
      }

      let currentRecord = record;
      for (const response of incoming.responses) {
        const existing = currentRecord.session.responses.find(item => String(item.itemId) === String(response.itemId));
        if (existing && sameResponse(existing, response)) continue;
        currentRecord = await recordAppraisalResponse(sessionId, response);
      }

      const currentIds = new Set(incoming.responses.map(response => String(response.itemId)));
      const staleResponses = currentRecord.session.responses.filter(response => !currentIds.has(String(response.itemId)));
      if (staleResponses.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Sync cannot implicitly delete canonical appraisal responses; use an explicit response-delete operation.',
        });
      }

      const response = sessionResponse(sessionId);
      if (!response) return res.status(404).json({ success: false, error: 'Appraisal session not found' });
      return res.json({ success: true, ...response });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Could not sync appraisal session' });
    }
  });

  app.post('/api/appraisal/:sessionId/response', async (req: Request, res: Response) => {
    try {
      const response = req.body as AppraisalItemResponse;
      if (!response || response.itemId === undefined) {
        return res.status(400).json({ success: false, error: 'itemId is required' });
      }
      await recordAppraisalResponse(req.params.sessionId.trim(), response);
      const updated = sessionResponse(req.params.sessionId.trim());
      if (!updated) return res.status(404).json({ success: false, error: 'Appraisal session not found' });
      return res.json({ success: true, ...updated });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Could not record appraisal response' });
    }
  });

  app.get('/api/appraisal/:sessionId/validation', (req: Request, res: Response) => {
    try {
      return res.json({ success: true, validation: validateAppraisal(req.params.sessionId.trim()) });
    } catch (error) {
      return res.status(404).json({ success: false, error: error instanceof Error ? error.message : 'Appraisal session not found' });
    }
  });

  app.post('/api/appraisal/:sessionId/finalize', async (req: Request, res: Response) => {
    try {
      await finalizeAppraisal(req.params.sessionId.trim());
      const finalized = sessionResponse(req.params.sessionId.trim());
      if (!finalized) return res.status(404).json({ success: false, error: 'Appraisal session not found' });
      return res.json({ success: true, finalized: true, ...finalized });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Could not finalize appraisal' });
    }
  });
}