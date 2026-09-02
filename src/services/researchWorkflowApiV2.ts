import type { Request, Response } from 'express';
import type { DocumentClassificationResult } from '../types';
import {
  createResearchWorkflowFromText,
  getResearchEvidenceSummary,
  buildResearchAppraisalPayload,
  selectResearchInstrument,
  updateResearchClassification,
  verifyResearchClassification,
  verifyResearchEvidence,
  includeStudyAndCreateAppraisal,
  type WorkflowState,
} from './researchWorkflowService';

const workflows = new Map<string, WorkflowState>();

function requireWorkflow(studyId: string): WorkflowState {
  const value = workflows.get(studyId);
  if (!value) throw new Error(`Research workflow not found: ${studyId}`);
  return value;
}

function store(workflow: WorkflowState): WorkflowState {
  workflows.set(workflow.studyId, workflow);
  return workflow;
}

export function registerResearchWorkflowApiV2(app: {
  get: Function;
  post: Function;
}): void {
  app.post('/api/research-workflow/v2/create', (req: Request, res: Response) => {
    try {
      const { text, fileName, studyId } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ success: false, error: 'text is required' });
      }
      const workflow = store(createResearchWorkflowFromText(text, fileName || 'document.txt', studyId));
      return res.status(201).json({ success: true, workflow, evidenceSummary: getResearchEvidenceSummary(workflow) });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Workflow creation failed' });
    }
  });

  app.get('/api/research-workflow/v2/:studyId', (req: Request, res: Response) => {
    try {
      const workflow = requireWorkflow(req.params.studyId);
      return res.json({ success: true, workflow, evidenceSummary: getResearchEvidenceSummary(workflow) });
    } catch (error) {
      return res.status(404).json({ success: false, error: error instanceof Error ? error.message : 'Workflow not found' });
    }
  });

  app.post('/api/research-workflow/v2/:studyId/classification', (req: Request, res: Response) => {
    try {
      const current = requireWorkflow(req.params.studyId);
      const classification = req.body?.classification as DocumentClassificationResult | undefined;
      if (!classification?.documentType || !classification.recommendedInstrumentId) {
        return res.status(400).json({ success: false, error: 'classification with documentType and recommendedInstrumentId is required' });
      }
      const workflow = store(updateResearchClassification(current, classification));
      return res.json({ success: true, workflow });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Classification update failed' });
    }
  });

  app.post('/api/research-workflow/v2/:studyId/classification/verify', (req: Request, res: Response) => {
    try {
      const reviewerId = String(req.body?.reviewerId || '').trim();
      if (!reviewerId) return res.status(400).json({ success: false, error: 'reviewerId is required' });
      const workflow = store(verifyResearchClassification(requireWorkflow(req.params.studyId), reviewerId, req.body?.approved === true));
      return res.json({ success: true, workflow });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Classification verification failed' });
    }
  });

  app.post('/api/research-workflow/v2/:studyId/evidence/:evidenceId/verify', (req: Request, res: Response) => {
    try {
      const workflow = store(verifyResearchEvidence(requireWorkflow(req.params.studyId), req.params.evidenceId, req.body?.verified === true));
      return res.json({ success: true, workflow, evidenceSummary: getResearchEvidenceSummary(workflow) });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Evidence verification failed' });
    }
  });

  app.post('/api/research-workflow/v2/:studyId/instrument', (req: Request, res: Response) => {
    try {
      const instrumentId = String(req.body?.instrumentId || '').trim();
      if (!instrumentId) return res.status(400).json({ success: false, error: 'instrumentId is required' });
      const workflow = store(selectResearchInstrument(requireWorkflow(req.params.studyId), instrumentId));
      return res.json({ success: true, workflow });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Instrument selection failed' });
    }
  });

  app.post('/api/research-workflow/v2/:studyId/appraisal/start', (req: Request, res: Response) => {
    try {
      const reviewerId = String(req.body?.reviewerId || '').trim();
      const instrumentId = String(req.body?.instrumentId || '').trim();
      if (!reviewerId || !instrumentId) {
        return res.status(400).json({ success: false, error: 'reviewerId and instrumentId are required' });
      }
      const workflow = store(includeStudyAndCreateAppraisal(requireWorkflow(req.params.studyId), { reviewerId, instrumentId }));
      return res.json({ success: true, workflow, appraisal: workflow.appraisalSessions.at(-1) });
    } catch (error) {
      return res.status(409).json({ success: false, error: error instanceof Error ? error.message : 'Appraisal start failed' });
    }
  });

  app.get('/api/research-workflow/v2/:studyId/appraisal/payload', (req: Request, res: Response) => {
    try {
      const workflow = requireWorkflow(req.params.studyId);
      return res.json({ success: true, payload: buildResearchAppraisalPayload(workflow) });
    } catch (error) {
      return res.status(409).json({ success: false, error: error instanceof Error ? error.message : 'Appraisal payload unavailable' });
    }
  });
}
