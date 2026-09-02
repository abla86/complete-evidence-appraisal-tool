import type { Request, Response } from 'express';
import {
  attachResearchDocument,
  createResearchWorkflowFromText,
  getResearchEvidenceSummary,
  includeStudyAndCreateAppraisal,
  selectResearchInstrument,
  setResearchClassification,
  verifyResearchClassification,
  verifyResearchEvidence,
  buildResearchAppraisalPayload,
  type WorkflowState,
} from './researchWorkflowService';
import type { DocumentClassificationResult } from '../types';

const workflows = new Map<string, WorkflowState>();

function getWorkflow(studyId: string): WorkflowState {
  const workflow = workflows.get(studyId);
  if (!workflow) throw new Error(`Research workflow not found: ${studyId}`);
  return workflow;
}

export function registerResearchWorkflowApi(app: { get: Function; post: Function }): void {
  app.post('/api/research-workflow/create', (req: Request, res: Response) => {
    try {
      const { text, fileName, studyId } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ success: false, error: 'text is required' });
      }
      const workflow = createResearchWorkflowFromText(text, fileName || 'document.txt', studyId);
      workflows.set(workflow.studyId, workflow);
      return res.json({ success: true, workflow, evidenceSummary: getResearchEvidenceSummary(workflow) });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Workflow creation failed' });
    }
  });

  app.post('/api/research-workflow/:studyId/document', (req: Request, res: Response) => {
    try {
      const current = getWorkflow(req.params.studyId);
      const { text, fileName } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ success: false, error: 'text is required' });
      }
      const workflow = attachResearchDocument(current, { text, fileName, studyId: current.studyId });
      workflows.set(current.studyId, workflow);
      return res.json({ success: true, workflow, evidenceSummary: getResearchEvidenceSummary(workflow) });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Document attach failed' });
    }
  });

  app.get('/api/research-workflow/:studyId', (req: Request, res: Response) => {
    try {
      const workflow = getWorkflow(req.params.studyId);
      return res.json({ success: true, workflow, evidenceSummary: getResearchEvidenceSummary(workflow) });
    } catch (error) {
      return res.status(404).json({ success: false, error: error instanceof Error ? error.message : 'Workflow not found' });
    }
  });

  app.post('/api/research-workflow/:studyId/classification', (req: Request, res: Response) => {
    try {
      const workflow = getWorkflow(req.params.studyId);
      const classification = req.body?.classification as DocumentClassificationResult;
      if (!classification?.documentType || !classification.recommendedInstrumentId) {
        return res.status(400).json({ success: false, error: 'classification with documentType and recommendedInstrumentId is required' });
      }
      const updated = setResearchClassification(workflow, classification);
      workflows.set(workflow.studyId, updated);
      return res.json({ success: true, workflow: updated });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Classification update failed' });
    }
  });

  app.post('/api/research-workflow/:studyId/classification/verify', (req: Request, res: Response) => {
    try {
      const workflow = getWorkflow(req.params.studyId);
      const reviewerId = String(req.body?.reviewerId || '').trim();
      const approved = req.body?.approved === true;
      if (!reviewerId) return res.status(400).json({ success: false, error: 'reviewerId is required' });
      const updated = verifyResearchClassification(workflow, reviewerId, approved);
      workflows.set(workflow.studyId, updated);
      return res.json({ success: true, workflow: updated });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Classification verification failed' });
    }
  });

  app.post('/api/research-workflow/:studyId/evidence/:evidenceId/verify', (req: Request, res: Response) => {
    try {
      const workflow = getWorkflow(req.params.studyId);
      const verified = req.body?.verified === true;
      const updated = verifyResearchEvidence(workflow, req.params.evidenceId, verified);
      workflows.set(workflow.studyId, updated);
      return res.json({ success: true, workflow: updated, evidenceSummary: getResearchEvidenceSummary(updated) });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Evidence verification failed' });
    }
  });

  app.post('/api/research-workflow/:studyId/instrument', (req: Request, res: Response) => {
    try {
      const workflow = getWorkflow(req.params.studyId);
      const instrumentId = String(req.body?.instrumentId || '').trim();
      const updated = selectResearchInstrument(workflow, instrumentId);
      workflows.set(workflow.studyId, updated);
      return res.json({ success: true, workflow: updated });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Instrument selection failed' });
    }
  });

  app.post('/api/research-workflow/:studyId/appraisal/start', (req: Request, res: Response) => {
    try {
      const workflow = getWorkflow(req.params.studyId);
      const reviewerId = String(req.body?.reviewerId || '').trim();
      const instrumentId = String(req.body?.instrumentId || '').trim();
      if (!reviewerId || !instrumentId) {
        return res.status(400).json({ success: false, error: 'reviewerId and instrumentId are required' });
      }
      const updated = includeStudyAndCreateAppraisal(workflow, { reviewerId, instrumentId });
      workflows.set(workflow.studyId, updated);
      return res.json({ success: true, workflow: updated, appraisal: updated.appraisalSessions.at(-1) });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Appraisal start failed' });
    }
  });

  app.get('/api/research-workflow/:studyId/appraisal/payload', (req: Request, res: Response) => {
    try {
      const workflow = getWorkflow(req.params.studyId);
      return res.json({ success: true, payload: buildResearchAppraisalPayload(workflow) });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Appraisal payload unavailable' });
    }
  });
}
