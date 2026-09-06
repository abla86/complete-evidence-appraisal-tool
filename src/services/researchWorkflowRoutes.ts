import type { Request, Response } from 'express';
import {
  createResearchWorkflowFromText,
  getResearchEvidenceSummary,
  buildResearchAppraisalPayload,
  selectResearchInstrument,
  updateResearchClassification,
  verifyResearchClassification,
  verifyResearchEvidence,
  type WorkflowState,
} from './researchWorkflowService';
import { researchWorkflowStore } from './researchWorkflowStore';
import { createAndAttachAppraisal } from './appraisalWorkflowBridge';
import type { DocumentClassificationResult } from '../types';

function sendError(res: Response, status: number, error: unknown) {
  return res.status(status).json({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  });
}

function requireWorkflow(studyId: string, projectId?: string): WorkflowState {
  const normalizedStudyId = studyId.trim();
  if (!normalizedStudyId) throw new Error('studyId is required.');
  if (projectId !== undefined && !projectId.trim()) throw new Error('projectId is required when supplied.');

  const workflow = researchWorkflowStore.get(normalizedStudyId, projectId);
  if (!workflow) {
    throw new Error(`Research workflow not found: ${normalizedStudyId}`);
  }

  return workflow;
}

function save(workflow: WorkflowState): WorkflowState {
  return researchWorkflowStore.save(workflow);
}

export function registerResearchWorkflowRoutes(app: {
  get: Function;
  post: Function;
}): void {
  app.get('/api/research-workflows', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      workflows: researchWorkflowStore.list(),
    });
  });

  app.post('/api/research-workflows', (req: Request, res: Response) => {
    try {
      const text = req.body?.text;
      const fileName =
        typeof req.body?.fileName === 'string' &&
        req.body.fileName.trim()
          ? req.body.fileName
          : 'document.txt';

      if (typeof text !== 'string' || !text.trim()) {
        return sendError(res, 400, 'text is required');
      }

      const workflow = createResearchWorkflowFromText(
        text,
        fileName,
        req.body?.studyId,
      );

      const saved = save(workflow);

      return res.status(201).json({
        success: true,
        workflow: saved,
        evidenceSummary: getResearchEvidenceSummary(saved),
      });
    } catch (error) {
      return sendError(res, 400, error);
    }
  });

  app.get('/api/research-workflows/:studyId', (req: Request, res: Response) => {
    try {
      const workflow = requireWorkflow(req.params.studyId, typeof req.query?.projectId === 'string' ? req.query.projectId : undefined);
      return res.json({
        success: true,
        workflow,
        evidenceSummary: getResearchEvidenceSummary(workflow),
      });
    } catch (error) {
      return sendError(res, 404, error);
    }
  });

  app.post('/api/research-workflows/:studyId/classification', (req: Request, res: Response) => {
    try {
      const classification =
        req.body?.classification as DocumentClassificationResult | undefined;

      if (!classification) {
        return sendError(res, 400, 'classification is required');
      }

      const workflow = requireWorkflow(req.params.studyId, typeof req.body?.projectId === 'string' ? req.body.projectId : undefined);
      const updated = save(
        updateResearchClassification(
          workflow,
          classification,
        ),
      );

      return res.json({ success: true, workflow: updated });
    } catch (error) {
      return sendError(res, 400, error);
    }
  });

  app.post('/api/research-workflows/:studyId/classification/verify', (req: Request, res: Response) => {
    try {
      const reviewerId = String(req.body?.reviewerId ?? '').trim();
      if (!reviewerId) {
        return sendError(res, 400, 'reviewerId is required');
      }

      const workflow = requireWorkflow(req.params.studyId);
      const updated = save(
        verifyResearchClassification(
          workflow,
          reviewerId,
          req.body?.approved === true,
        ),
      );

      return res.json({ success: true, workflow: updated });
    } catch (error) {
      return sendError(res, 400, error);
    }
  });

  app.post('/api/research-workflows/:studyId/evidence/:evidenceId/verify', (req: Request, res: Response) => {
    try {
      const reviewerId = String(req.body?.reviewerId ?? '').trim();
      if (!reviewerId) {
        return sendError(res, 400, 'reviewerId is required');
      }

      const workflow = requireWorkflow(req.params.studyId);
      const updated = save(
        verifyResearchEvidence(
          workflow,
          req.params.evidenceId,
          req.body?.approved === true,
          reviewerId,
        ),
      );

      return res.json({
        success: true,
        workflow: updated,
        evidenceSummary: getResearchEvidenceSummary(updated),
      });
    } catch (error) {
      return sendError(res, 400, error);
    }
  });

  app.post('/api/research-workflows/:studyId/instrument', (req: Request, res: Response) => {
    try {
      const instrumentId = String(req.body?.instrumentId ?? '').trim();
      if (!instrumentId) {
        return sendError(res, 400, 'instrumentId is required');
      }

      const workflow = requireWorkflow(req.params.studyId);
      const updated = save(
        selectResearchInstrument(
          workflow,
          instrumentId,
        ),
      );

      return res.json({ success: true, workflow: updated });
    } catch (error) {
      return sendError(res, 400, error);
    }
  });

  app.post('/api/research-workflows/:studyId/appraisal/ready', (req: Request, res: Response) => {
    try {
      const workflow = requireWorkflow(req.params.studyId, typeof req.body?.projectId === 'string' ? req.body.projectId : undefined);
      const payload = buildResearchAppraisalPayload(workflow);

      return res.json({
        success: true,
        ready: true,
        instrumentId: payload.instrumentId,
        evidence: payload.evidence,
      });
    } catch (error) {
      return sendError(res, 409, error);
    }
  });

  app.post('/api/research-workflows/:studyId/appraisal/start', async (req: Request, res: Response) => {
    try {
      const reviewerId = String(req.body?.reviewerId ?? '').trim();
      if (!reviewerId) {
        return sendError(res, 400, 'reviewerId is required');
      }

      const workflow = requireWorkflow(req.params.studyId);
      const payload = buildResearchAppraisalPayload(workflow);
      const requestedInstrument = String(req.body?.instrumentId ?? '').trim();

      if (
        requestedInstrument &&
        requestedInstrument !== payload.instrumentId
      ) {
        return sendError(
          res,
          409,
          'instrumentId does not match the selected research workflow instrument',
        );
      }

      const attached = await createAndAttachAppraisal(
        payload,
        reviewerId,
        session => {
          const current = requireWorkflow(req.params.studyId, typeof req.body?.projectId === 'string' ? req.body.projectId : undefined);
          return save({
            ...current,
            appraisalSessions:
              current.appraisalSessions.some(
                item => item.id === session.id,
              )
                ? current.appraisalSessions.map(
                    item =>
                      item.id === session.id
                        ? session
                        : item,
                  )
                : [
                    ...current.appraisalSessions,
                    session,
                  ],
          });
        },
      );

      return res.status(201).json({
        success: true,
        workflow: attached.workflow,
        appraisal: attached.record.session,
        evidenceSummary:
          getResearchEvidenceSummary(
            attached.workflow,
          ),
      });
    } catch (error) {
      return sendError(res, 409, error);
    }
  });
}


