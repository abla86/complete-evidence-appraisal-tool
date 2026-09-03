import type { AppraisalSession } from '../services/universalAppraisalService';

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[\r\n]+/g, ' ');
}

function buildPdfBytes(lines: string[]): Uint8Array {
  const objects: string[] = [];
  const content = ['BT', '/F1 10 Tf', '50 790 Td', ...lines.flatMap((line, index) => [index ? '0 -16 Td' : '', `(${escapePdfText(line)}) Tj`]).filter(Boolean), 'ET'].join('\n');

  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

  const chunks = ['%PDF-1.4\n'];
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(chunks.join('').length);
    chunks.push(`${i + 1} 0 obj\n${objects[i]}\nendobj\n`);
  }
  const xrefOffset = chunks.join('').length;
  chunks.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  for (let i = 1; i <= objects.length; i += 1) chunks.push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return new TextEncoder().encode(chunks.join(''));
}

export function createAppraisalPdf(session: AppraisalSession): Blob {
  const lines = [
    'Appraisal Report',
    `Study: ${session.studyId}`,
    `Reviewer: ${session.reviewerId}`,
    `Instrument: ${session.instrumentId} v${session.instrumentVersion}`,
    `Status: ${session.locked ? 'Locked' : 'Open'}`,
    '',
    ...session.responses.flatMap(response => [
      `Question ${response.itemId}: ${String(response.answer ?? '')}`,
      `Rationale: ${response.rationale || '(none)'}`,
      response.evidence?.page ? `Page: ${response.evidence.page}` : '',
      response.evidence?.section ? `Section: ${response.evidence.section}` : '',
      '',
    ]).filter(Boolean),
  ];
  return new Blob([buildPdfBytes(lines)], { type: 'application/pdf' });
}

export function downloadAppraisalPdf(session: AppraisalSession, fileName = 'appraisal.pdf'): void {
  const url = URL.createObjectURL(createAppraisalPdf(session));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
