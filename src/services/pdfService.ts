import * as pdfjs from 'pdfjs-dist';
export class PdfService {
  public async extractText(file: File): Promise<{text: string, status: string}> {
    try {
      const pdf = await pdfjs.getDocument(await file.arrayBuffer()).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        text += (await page.getTextContent()).items.map((it: any) => it.str).join(' ') + '\n';
      }
      return text.trim().length > 100 ? { text, status: 'PARSED' } : { text: '', status: 'IMAGE_ONLY' };
    } catch (e) { return { text: '', status: 'ERROR' }; }
  }
}
