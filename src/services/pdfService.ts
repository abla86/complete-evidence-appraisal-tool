import * as pdfjs from 'pdfjs-dist';
export class PdfService {
  public async extractText(file: File): Promise<{text: string, status: string}> {
    try {
      const buf = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buf }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((it: any) => it.str).join(' ') + '\n';
      }
      return text.trim().length > 100 ? { text, status: 'PARSED' } : { text: '', status: 'IMAGE_ONLY' };
    } catch (e) { return { text: '', status: 'ERROR' }; }
  }
}
