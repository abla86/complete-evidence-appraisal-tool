import React from 'react';
import { ArticleAnalysis, ArticleData } from '../types';
import { FileText, Download, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ReportViewProps {
  analysis: ArticleAnalysis | null;
  article: ArticleData;
}

export const ReportView: React.FC<ReportViewProps> = ({ analysis, article }) => {
  if (!analysis) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
          <FileText className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Ingen rapport tilgjengelig</h3>
          <p className="text-slate-600">Vennligst utfør en analyse først for å generere den komplette evalueringsrapporten.</p>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${article.title}</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h1>${article.title}</h1>
        <p><b>Forfattere:</b> ${article.authors} (${article.year})</p>
        <p><b>Tidsskrift:</b> ${article.journal}</p>
        <hr/>
        <h2>1. Klassifisering & Teori</h2>
        <p><b>Type:</b> ${analysis.articleType}</p>
        <p><b>Begrunnelse:</b> ${analysis.typeJustification}</p>
        <p><b>Teoretisk rammeverk:</b> ${analysis.theoreticalFramework}</p>
        
        <h2>2. Strukturert Sammendrag</h2>
        <p><b>Bakgrunn:</b> ${analysis.summary.background}</p>
        <p><b>Hensikt:</b> ${analysis.summary.objective}</p>
        <p><b>Metode:</b> ${analysis.summary.methods}</p>
        <p><b>Hovedfunn:</b> ${analysis.summary.results}</p>
        <p><b>Konklusjon:</b> ${analysis.summary.conclusion}</p>

        <h2>3. Sjekkliste</h2>
        ${analysis.checklists.map((c, i) => `<p><b>${i + 1}. ${c.question}</b><br/>Svar: ${c.answer}<br/>Begrunnelse: ${c.justification}<br/><i>Bevis: "${c.evidenceQuote}"</i></p>`).join('<hr/>')}

        <h2>4. Styrker og Begrensninger</h2>
        <p><b>Styrker:</b></p>
        <ul>${analysis.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
        <p><b>Begrensninger:</b></p>
        <ul>${analysis.limitations.map(l => `<li>${l}</li>`).join('')}</ul>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Analyse_${article.id}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs gap-3 no-print">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-bold text-slate-950">Komplett Kritisk Vurderingsrapport</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportWord}
            className="px-4 py-2 bg-slate-800 text-white font-medium rounded-lg text-sm hover:bg-slate-900 transition-colors flex items-center space-x-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Eksporter til Word (.doc)</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg text-sm hover:bg-indigo-700 transition-colors flex items-center space-x-2 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Skriv ut / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document */}
      <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-8 print-container print:shadow-none print:border-none">
        <div className="border-b border-slate-200 pb-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 mb-3">
            {analysis.articleType}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">{article.title}</h1>
          <p className="text-sm text-slate-600 mt-2 font-medium">{article.authors} — <span className="italic">{article.journal} ({article.year})</span></p>
          {article.doi && <p className="text-xs text-slate-400 font-mono mt-1">DOI: {article.doi}</p>}
        </div>

        {/* Section 1: Classification & Theory */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">1. Klassifisering & Teoretisk Rammeverk</h2>
          <p className="text-sm text-slate-700 leading-relaxed"><strong>Klassifisering:</strong> {analysis.articleType}</p>
          <p className="text-sm text-slate-700 leading-relaxed"><strong>Begrunnelse:</strong> {analysis.typeJustification}</p>
          <p className="text-sm text-slate-700 leading-relaxed"><strong>Teoretisk rammeverk:</strong> {analysis.theoreticalFramework}</p>
        </div>

        {/* Section 2: Summary */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">2. Strukturert Sammendrag</h2>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <p><strong>Bakgrunn:</strong> {analysis.summary.background}</p>
            <p><strong>Hensikt:</strong> {analysis.summary.objective}</p>
            <p><strong>Metode:</strong> {analysis.summary.methods}</p>
            <p><strong>Hovedfunn:</strong> {analysis.summary.results}</p>
            <p><strong>Konklusjon:</strong> {analysis.summary.conclusion}</p>
          </div>
        </div>

        {/* Section 3: Checklist Appraisal */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">3. Sjekklistebasert Vurdering (CASP / COREQ)</h2>
          <div className="space-y-3">
            {analysis.checklists.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
                <div className="flex justify-between font-bold">
                  <span>{idx + 1}. {item.question}</span>
                  <span className="text-indigo-600">Svar: {item.answer}</span>
                </div>
                <p className="text-slate-700"><strong>Begrunnelse:</strong> {item.justification}</p>
                {item.evidenceQuote && (
                  <p className="text-xs text-slate-500 italic">Bevis: "{item.evidenceQuote}"</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Strengths & Limitations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-emerald-800 mb-2">Styrker</h3>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-800 mb-2">Begrensninger</h3>
            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
              {analysis.limitations.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </div>
        </div>

        {/* Section 5: Practical Implications */}
        <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 text-sm text-indigo-900">
          <h3 className="font-bold mb-1">Praktiske Implikasjoner for Fagfeltet:</h3>
          <p>{analysis.practicalImplications}</p>
        </div>
      </div>
    </div>
  );
};
