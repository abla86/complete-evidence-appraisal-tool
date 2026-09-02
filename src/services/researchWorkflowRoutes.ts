import type { Request, Response } from 'express';
import { ResearchEngineGateway } from './researchEngineGateway';
import {
  applyClassification,
  buildVerifiedEvidencePayload,
  createResearchWorkflow,
  verifyClassification,
  verifyEvidence,
  type ResearchWorkflow,
  assertAppraisalReady,
} from './researchWorkflowCore';
import { researchWorkflowStore } from './researchWorkflowStore';
import type { DocumentClassificationResult } from '../types';

function sendError(res: Response, status: number, error: unknown) {
  return res.status(status).json({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  });
}

function requireWorkflow(studyId: string): ResearchWorkflow {
  const workflow = researchWorkflowStore.get(studyId);
  if (!workflow) throw new Error(`Research workflow not found: ${studyId}`);
  return workflow;
}

export function registerResearchWorkflowRoutes(app: {
  get: Function;
  post: Function;
  delete?: Function;
}): void {
  app.get('/api/research-workflows', (_req: Request, res: Response) => {
    res.json({ success: true, workflows: researchWorkflowStore.list() });
  });

  app.post('/api/research-workflows', async (req: Request, res: Response) => {
    try {
      const { studyId, text, fileName } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim()) {
        return sendError(res, 400, 'text is required');
      }

      const analysis = ResearchEngineGateway.analyzeText(
        text,
        typeof fileName === 'string' && fileName.trim() ? fileName : 'document.txt',
      );

      const document = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fileName: typeof fileName === 'string' && fileName.trim() ? fileName : 'document.txt',
        fileType: 'txt' as const,
        mimeType: 'text/plain',
        extractedText: text,
        wordCount: text.trim().split(/\s+/).length,
        estimatedPages: Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 500)),
        metadata: {
          title: typeof fileName === 'string' ? fileName.replace(/\.[^/.]+$/, '') : 'document',
          authors: '',
          year: new Date().getFullYear(),
          journal: '',
          doi: '',
          abstract: '',
          studyDesignDetected: '',
          recommendedInstrumentId: '',
        },
        sections: [],
        scanned: false,
        ocrNeeded: false,
        candidateEvidence: analysis.candidateEvidence,
      };

      const workflow = createResearchWorkflow(document, studyId || document.id);
      const saved = researchWorkflowStore.save(workflow);
      return res.status(201).json({ success: true, workflow: saved });
    } catch (error) {
      return sendError(res, 400, error);
    }
  });

  app.get('/api/research-workflows/:studyId', (req: Request, res: Response) => {
    try {
      return res.json({ success: true, workflow: requireWorkflow(req.params.studyId) });
    } catch (error) {
      return sendError(res, 404, error);
    }
  });

  app.post('/api/research-workflows/:studyId/classification', (req: Request, res: Response) => {
    try {
      const workflow = requireWorkflow(req.params.studyId);
      const classification = req.body?.classification as DocumentClassificationResult;
      if (!classification) return sendError(res, 400, 'classification is required');
      return res.json({
        success: true,
        workflow: researchWorkflowStore.save(applyClassification(workflow, classification)),
      });
    } catch (error) {
      return sendError(res, 400, error);
    }
  });

  app.post('/api/research-workflows/:studyId/classification/verify', (req: Request, res: Response) => {
    try {
      const workflow = requireWorkflow(req.params.studyId);
      const reviewerId = String(req.body?.reviewerId || '').trim();
      if (!reviewerId) return sendError(res, 400, 'reviewerId is required');
      const updated = verifyClassification(
        workflow,
        reviewerId,
        req.body?.approved === true,
      );
      return res.json({ success: true, workflow: researchWorkflowStore.save(updated) });
    } catch (error) {
      return sendError(res, 400, error);
    }
  });

  app.post('/api/research-workflows/:studyId/evidence/:evidenceId/verify', (req: Request, res: Response) => {
    try {
      const workflow = requireWorkflow(req.params.studyId);
      const reviewerId = String(req.body?.reviewerId || '').trim();
      if (!reviewerId) return sendError(res, 400, 'reviewerId is required');
      const updated = verifyEvidence(
        workflow,
        req.params.evidenceId,
        reviewerId,
        req.body?.approved === true,
      );
      return res.json({ success: true, workflow: researchWorkflowStore.save(updated) });
    } catch (error) {
      return sendError(res, 400, error);
    }
  });

  app.post('/api/research-workflows/:studyId/appraisal/ready', (req: Request, res: Response) => {
    try {
      const workflow = requireWorkflow(req.params.studyId);
      assertAppraisalReady(workflow);
      return res.json({
        success: true,
        ready: true,
        instrumentId: workflow.selectedInstrumentId,
        evidence: buildVerifiedEvidencePayload(workflow),
      });
    } catch (error) {
      return sendError(res, 409, error);
    }
  });

  app.post('/api/research-workflows/:studyId/instrument', (req: Request, res: Response) => {
    try {
      const workflow = requireWorkflow(req.params.studyId);
      const instrumentId = String(req.body?.instrumentId || '').trim();
      if (!instrumentId) return sendError(res, 400, 'instrumentId is required');
      const updated: ResearchWorkflow = {
        ...workflow,
        selectedInstrumentId: instrumentId,
      };
      return res.json({ success: true, workflow: researchWorkflowStore.save(updated) });
    } catch (error) {
      return sendError(res, 400, error);
    }
  });
}
