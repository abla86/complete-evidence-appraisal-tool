import type { Express, Request, Response } from 'express';
import { requireAuthenticatedUser } from './authApi';
import { loadSourceRecords, saveSourceRecords } from './sourceRecordServerStore';
import { validateSourceRecord } from './validateSourceRecord';
import type { SourceRecord } from '../domain/sourceRecord';

function sendError(res: Response, status: number, error: unknown) {
  return res.status(status).json({ success: false, error: error instanceof Error ? error.message : 'SourceRecord request failed.' });
}
function authorizeRecords(records: SourceRecord[], userId: string): void {
  for (const record of records) {
    const reviewerId = record.intake?.reviewerId?.trim();
    if (reviewerId && reviewerId !== userId) throw new Error('SourceRecord reviewer identity does not match the authenticated user.');
  }
}
export function registerSourceRecordApi(app: Express): void {
  app.get('/api/source-records', async (req: Request, res: Response) => {
    try { const user = requireAuthenticatedUser(req); return res.json({ success: true, records: await loadSourceRecords(user.sub) }); }
    catch (error) { return sendError(res, 401, error); }
  });
  app.put('/api/source-records', async (req: Request, res: Response) => {
    try {
      const user = requireAuthenticatedUser(req);
      if (!Array.isArray(req.body?.records)) return sendError(res, 400, 'records must be an array.');
      if (req.body.records.length > 5000) return sendError(res, 413, 'SourceRecord library contains too many records.');
      const records = req.body.records as SourceRecord[];
      for (const record of records) {
        const validation = validateSourceRecord(record);
        if (!validation.ok) return sendError(res, 400, 'Invalid SourceRecord ' + (record?.recordId ?? '') + ': ' + validation.errors.join('; '));
      }
      authorizeRecords(records, user.sub);
      const saved = await saveSourceRecords(user.sub, records);
      return res.json({ success: true, count: saved.length, records: saved });
    } catch (error) { return sendError(res, 400, error); }
  });
}
