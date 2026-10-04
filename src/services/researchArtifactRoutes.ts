import type { Express, Request, Response } from 'express';
import { requireProUser } from './stripeEntitlement';
import { loadResearchArtifacts, saveResearchArtifacts } from './researchArtifactServerStore';
import type { SourceRecord } from '../domain/sourceRecord';
import type { SearchQueryRecord } from './evidenceIntelligenceService';

function error(res: Response, status: number, value: unknown) {
  return res.status(status).json({ success: false, error: value instanceof Error ? value.message : 'Research artifact request failed.' });
}

export function registerResearchArtifactApi(app: Express): void {
  app.get('/api/research-artifacts', async (req: Request, res: Response) => {
    try {
      const user = requireProUser(req);
      return res.json({ success: true, ...(await loadResearchArtifacts(user.sub)) });
    } catch (err) {
      return error(res, 401, err);
    }
  });

  app.put('/api/research-artifacts', async (req: Request, res: Response) => {
    try {
      const user = requireProUser(req);
      const searchRecords = req.body?.searchRecords;
      const sourceRecords = req.body?.sourceRecords;
      if (!Array.isArray(searchRecords) || !Array.isArray(sourceRecords)) return error(res, 400, 'searchRecords and sourceRecords must be arrays.');
      if (searchRecords.length > 200) return error(res, 413, 'Too many search records.');
      if (sourceRecords.length > 5000) return error(res, 413, 'Too many SourceRecords.');
      const saved = await saveResearchArtifacts(user.sub, {
        searchRecords: searchRecords as SearchQueryRecord[],
        sourceRecords: sourceRecords as SourceRecord[],
      });
      return res.json({ success: true, ...saved });
    } catch (err) {
      return error(res, 400, err);
    }
  });
}
