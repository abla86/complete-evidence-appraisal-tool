import { Request, Response } from 'express';
import ResearchEngineGateway from './researchEngineGateway';
import { requireAuthenticatedUser } from './authApi';

export function registerResearchEngineIntegration(app: { get: Function; post: Function }): void {
  app.get('/api/research-engine/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      service: 'complete-evidence-appraisal-tool',
      researchEngine: 'local-canonical',
      contractVersion: '1.0.0',
      capabilities: ['document-parsing', 'document-analysis', 'evidence-handoff'],
    });
  });

  app.post('/api/research-engine/analyze-text', (req: Request, res: Response) => {
    try {
      requireAuthenticatedUser(req);
      const { text, fileName } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ success: false, error: 'text is required' });
      }
      const result = ResearchEngineGateway.analyzeText(text, fileName || 'document.txt');
      return res.json({ success: true, result });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Research analysis failed',
      });
    }
  });

  app.get('/api/research-engine/contract', (_req: Request, res: Response) => {
    res.json({
      success: true,
      contractVersion: '1.0.0',
      ownership: {
        researchEngine: 'document/search/evidence/citation layer',
        evidenceAppraisal: 'methodology gating/appraisal/scoring/review/validation/audit',
      },
    });
  });
}


