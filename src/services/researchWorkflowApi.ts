import type { Request, Response } from 'express';
import type { DocumentClassificationResult } from '../types';
import {
  createResearchWorkflowFromFile,
  createResearchWorkflowFromText,
  getResearchEvidenceSummary,
  selectResearchInstrument,
  updateResearchClassification,
  verifyResearchClassification,
  verifyResearchEvidence,
  buildResearchAppraisalPayload,
  type WorkflowState,
} from './researchWorkflowService';
import { researchWorkflowStore } from './researchWorkflowStore';
import { createAndAttachAppraisal } from './appraisalWorkflowBridge';

function requireWorkflow(studyId: string): WorkflowState {
  const workflow = researchWorkflowStore.get(studyId);
  if (!workflow) throw new Error(`Research workflow not found: ${studyId}`);
  return workflow;
}

function save(workflow: WorkflowState): WorkflowState {
  return researchWorkflowStore.save(workflow);
}

export function registerResearchWorkflowApi(app: { get: Function; post: Function }): void {
  app.post('/api/research-workflow/create', (req: Request, res: Response) => {
    try {
      const { text, fileName, studyId } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ success: false, error: 'text is required' });
      const workflow = save(createResearchWorkflowFromText(text, fileName || 'document.txt', studyId));
      return res.status(201).json({ success: true, workflow, evidenceSummary: getResearchEvidenceSummary(workflow) });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Workflow creation failed' });
    }
  });

  app.post('/api/research-workflow/create-from-file', async (req: Request, res: Response) => {
    try {
      const { name, size, type, content, studyId } = req.body ?? {};
      if (typeof name !== 'string' || !name.trim() || !Number.isFinite(Number(size)) || content === undefined) {
        return res.status(400).json({ success: false, error: 'name, size and content are required' });
      }
      const normalizedContent = typeof content === 'string' ? content : content instanceof ArrayBuffer ? content : Buffer.from(content, 'base64');
      const workflow = save(await createResearchWorkflowFromFile({ name, size: Number(size), type, content: normalizedContent }, studyId));
      return res.status(201).json({ success: true, workflow, evidenceSummary: getResearchEvidenceSummary(workflow) });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'File workflow creation failed' });
    }
  });

  app.get('/api/research-workflow', (_req: Request, res: Response) => res.json({ success: true, workflows: researchWorkflowStore.list() }));

  app.get('/api/research-workflow/:studyId', (req: Request, res: Response) => {
    try {
      const workflow = requireWorkflow(req.params.studyId);
      return res.json({ success: true, workflow, evidenceSummary: getResearchEvidenceSummary(workflow) });
    } catch (error) {
      return res.status(404).json({ success: false, error: error instanceof Error ? error.message : 'Workflow not found' });
    }
  });

  app.post('/api/research-workflow/:studyId/classification', (req: Request, res: Response) => {
    try {
      const classification = req.body?.classification as DocumentClassificationResult | undefined;
      if (!classification?.documentType || !classification.recommendedInstrumentId) return res.status(400).json({ success: false, error: 'classification with documentType and recommendedInstrumentId is required' });
      const workflow = save(updateResearchClassification(requireWorkflow(req.params.studyId), classification));
      return res.json({ success: true, workflow });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Classification update failed' });
    }
  });

  app.post('/api/research-workflow/:studyId/classification/verify', (req: Request, res: Response) => {
    try {
      const reviewerId = String(req.body?.reviewerId || '').trim();
      if (!reviewerId) return res.status(400).json({ success: false, error: 'reviewerId is required' });
      const workflow = save(verifyResearchClassification(requireWorkflow(req.params.studyId), reviewerId, req.body?.approved === true));
      return res.json({ success: true, workflow });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Classification verification failed' });
    }
  });

  app.post('/api/research-workflow/:studyId/evidence/:evidenceId/verify', (req: Request, res: Response) => {
    try {
      const reviewerId = String(req.body?.reviewerId || '').trim();
      if (!reviewerId) return res.status(400).json({ success: false, error: 'reviewerId is required' });
      const workflow = save(verifyResearchEvidence(requireWorkflow(req.params.studyId), req.params.evidenceId, req.body?.verified === true, reviewerId));
      return res.json({ success: true, workflow, evidenceSummary: getResearchEvidenceSummary(workflow) });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Evidence verification failed' });
    }
  });

  app.post('/api/research-workflow/:studyId/instrument', (req: Request, res: Response) => {
    try {
      const instrumentId = String(req.body?.instrumentId || '').trim();
      if (!instrumentId) return res.status(400).json({ success: false, error: 'instrumentId is required' });
      const workflow = save(selectResearchInstrument(requireWorkflow(req.params.studyId), instrumentId));
      return res.json({ success: true, workflow });
    } catch (error) {
      return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Instrument selection failed' });
    }
  });

  app.post('/api/research-workflow/:studyId/appraisal/start', async (req: Request, res: Response) => {
    try {
      const reviewerId = String(req.body?.reviewerId || '').trim();
      const instrumentId = String(req.body?.instrumentId || '').trim();
      if (!reviewerId || !instrumentId) return res.status(400).json({ success: false, error: 'reviewerId and instrumentId are required' });
      const workflow = requireWorkflow(req.params.studyId);
      const payload = buildResearchAppraisalPayload(workflow);
      if (payload.instrumentId !== instrumentId) return res.status(409).json({ success: false, error: 'instrumentId does not match the selected research workflow instrument' });

      const attached = createAndAttachAppraisal(payload, reviewerId, (session) => {
        const current = requireWorkflow(req.params.studyId);
        return save({
          ...current,
          screening: current.screening.some(item => item.reviewerId === reviewerId)
            ? current.screening.map(item => item.reviewerId === reviewerId ? { ...item, decision: 'INCLUDED' as const, updatedAt: new Date().toISOString() } : item)
            : [...current.screening, { studyId: current.studyId, reviewerId, decision: 'INCLUDED', updatedAt: new Date().toISOString() }],
          appraisalSessions: current.appraisalSessions.some(item => item.id === session.id)
            ? current.appraisalSessions.map(item => item.id === session.id ? session : item)
            : [...current.appraisalSessions, session],
        });
      });

      return res.status(201).json({ success: true, workflow: attached.workflow, appraisal: attached.record.session, evidenceSummary: getResearchEvidenceSummary(attached.workflow) });
    } catch (error) {
      return res.status(409).json({ success: false, error: error instanceof Error ? error.message : 'Appraisal start failed' });
    }
  });

  app.get('/api/research-workflow/:studyId/appraisal/payload', (req: Request, res: Response) => {
    try {
      return res.json({ success: true, payload: buildResearchAppraisalPayload(requireWorkflow(req.params.studyId)) });
    } catch (error) {
      return res.status(409).json({ success: false, error: error instanceof Error ? error.message : 'Appraisal payload unavailable' });
    }
  });
}
