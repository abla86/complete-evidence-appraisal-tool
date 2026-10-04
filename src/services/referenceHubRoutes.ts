import type { Express, Request, Response } from 'express';
import { requireProUser } from './stripeEntitlement';
import { loadReferenceHub, saveReferenceHub } from './referenceHubServerStore';
import type { ReferenceRecord } from './referenceHubService';

function sendError(res: Response, status: number, error: unknown) {
  return res.status(status).json({ success: false, error: error instanceof Error ? error.message : 'Reference Hub request failed.' });
}

export function registerReferenceHubApi(app: Express): void {
  app.get('/api/reference-hub', async (req: Request, res: Response) => {
    try {
      const user = requireProUser(req);
      const records = await loadReferenceHub(user.sub);
      return res.json({ success: true, records });
    } catch (error) {
      return sendError(res, 401, error);
    }
  });

  app.put('/api/reference-hub', async (req: Request, res: Response) => {
    try {
      const user = requireProUser(req);
      if (!Array.isArray(req.body?.records)) return sendError(res, 400, 'records must be an array.');
      if (req.body.records.length > 5000) return sendError(res, 413, 'Reference Hub contains too many records.');
      const records = await saveReferenceHub(user.sub, req.body.records as ReferenceRecord[]);
      return res.json({ success: true, count: records.length, records });
    } catch (error) {
      return sendError(res, 400, error);
    }
  });
}
