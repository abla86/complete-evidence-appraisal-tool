import { FullAppraisalRecord, FullAppraisalRecordSchema } from '@/schemas/appraisal.schema';
import { Study } from '@/schemas/study.schema';

export interface ExportPayload {
  appraisal: FullAppraisalRecord;
  study?: Study;
  exportedAt: string;
  version: string;
}

export function exportAppraisalToJson(appraisal: FullAppraisalRecord, study?: Study): string {
  // Validate schema before export
  const parsed = FullAppraisalRecordSchema.safeParse(appraisal);
  if (!parsed.success) {
    console.warn('Appraisal validering ga advarsler:', parsed.error.format());
  }

  const payload: ExportPayload = {
    appraisal,
    study,
    exportedAt: new Date().toISOString(),
    version: '1.0.0 (CritiqEvidence)',
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const fileName = `critiq-${appraisal.framework.toLowerCase()}-${appraisal.studyId.slice(0, 8)}.json`;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return jsonString;
}
