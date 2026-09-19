import { ArticleAnalysis } from '../types';

export class ExportPdfUtil {
  /**
   * Triggers browser print/PDF generation with locked integrity check verification.
   */
  public static exportToPdf(analysis: ArticleAnalysis, isLockedForExport: boolean): void {
    if (isLockedForExport) {
      alert('Eksport nektet: Evidensgrunnlaget er ikke fullt ut verifisert mot kildedokumentet. Sjekk at alle sitater finnes ordrett uten forkortelser (...).');
      return;
    }

    // Trigger window print which utilizes print-container styles
    window.print();
  }

  public static exportToJson(analysis: ArticleAnalysis): void {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysis, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kbp-vurdering-${analysis.articleId || 'rapport'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}
