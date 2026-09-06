export interface PdfAttachment {
  id: string;
  referenceId: string;
  name: string;
  mimeType: 'application/pdf';
  size: number;
  sha256?: string;
  addedAt: string;
  sourceUrl?: string;
}

export interface PdfAnnotation {
  id: string;
  attachmentId: string;
  page: number;
  type: 'HIGHLIGHT' | 'NOTE';
  text: string;
  note?: string;
  createdAt: string;
  createdBy: string;
}

export async function sha256Blob(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

export async function createPdfAttachment(file: File, referenceId: string): Promise<PdfAttachment> {
  if (file.type !== 'application/pdf') throw new Error('Bare PDF-filer kan legges til i PDF-biblioteket.');
  return {
    id: crypto.randomUUID(),
    referenceId,
    name: file.name,
    mimeType: 'application/pdf',
    size: file.size,
    sha256: await sha256Blob(file),
    addedAt: new Date().toISOString(),
  };
}

