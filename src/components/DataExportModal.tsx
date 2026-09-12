import React, { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  CheckCircle2,
  X,
  Sparkles,
  Settings2,
  Eye,
  Layers,
  BookOpen,
  Info,
  Check,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { StatisticalTestInfo, OutputInterpretation } from "../types";
import {
  exportToDocx,
  exportToPdf,
  exportToCsv,
  ApaExportPayload,
} from "../utils/apaExportEngine";

interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  testInfo: StatisticalTestInfo;
  results?: any;
  datasetName: string;
  apaNarrative: string;
  interpretation?: OutputInterpretation;
  assumptions?: {
    name: string;
    status: "met" | "warning" | "violated" | "passed";
    measuredValue?: string;
    threshold?: string;
    explanation: string;
  }[];
}

export const DataExportModal: React.FC<DataExportModalProps> = ({
  isOpen,
  onClose,
  testInfo,
  results,
  datasetName,
  apaNarrative,
  interpretation,
  assumptions,
}) => {
  // Config state
  const [reportType, setReportType] = useState<"analysis" | "interpretation" | "summary">("analysis");
  const [authorName, setAuthorName] = useState<string>("Student / Forsker");
  const [institution, setInstitution] = useState<string>("Institutt for samfunnsvitenskap");
  const [customTitle, setCustomTitle] = useState<string>(`Statistisk Forskningsrapport: ${testInfo.name}`);
  const [language, setLanguage] = useState<"no" | "en">("no");

  // Feature toggles
  const [includeTable, setIncludeTable] = useState<boolean>(true);
  const [includeInterpretation, setIncludeInterpretation] = useState<boolean>(true);
  const [includeAssumptions, setIncludeAssumptions] = useState<boolean>(true);
  const [includeSpssGuide, setIncludeSpssGuide] = useState<boolean>(true);

  // Exporting state
  const [isExporting, setIsExporting] = useState<"pdf" | "docx" | "csv" | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const getPayload = (): ApaExportPayload => ({
    reportType,
    testInfo,
    results,
    datasetName,
    apaNarrative,
    interpretation,
    assumptions,
    customTitle,
    authorName,
    institution,
    includeTable,
    includeInterpretation,
    includeAssumptions,
    includeSpssGuide,
    language,
  });

  const handleExportDocx = async () => {
    setIsExporting("docx");
    setDownloadSuccess(null);
    try {
      await exportToDocx(getPayload());
      setDownloadSuccess("Word-dokument (.docx) lastet ned!");
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error("Docx export error:", err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting("pdf");
    setDownloadSuccess(null);
    try {
      await exportToPdf(getPayload());
      setDownloadSuccess("PDF-rapport lastet ned!");
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error("Pdf export error:", err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportCsv = () => {
    setIsExporting("csv");
    setDownloadSuccess(null);
    try {
      exportToCsv(getPayload());
      setDownloadSuccess("CSV-fil lastet ned!");
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error("Csv export error:", err);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Data- og Rapporteksport (APA 7)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  Klient-generert
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Last ned resultater, tolkning og tabeller i PDF, Word (.docx) eller CSV formatering.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Format selection cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              1. Velg Eksportformat
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* PDF Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500/50 hover:shadow-xs transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                      PDF
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                      jsPDF
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 pt-1">
                    APA 7 PDF Rapport
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Klar for utskrift og innlevering med 1" marger, topptekst, APA-tabeller og side-nummerering.
                  </p>
                </div>
                <button
                  onClick={handleExportPdf}
                  disabled={isExporting !== null}
                  className="w-full inline-flex items-center justify-center space-x-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isExporting === "pdf" ? (
                    <span className="animate-spin text-xs">⏳ Genererer...</span>
                  ) : (
                    <>
                      <Printer className="w-3.5 h-3.5" />
                      <span>Last ned PDF</span>
                    </>
                  )}
                </button>
              </div>

              {/* Word Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500/50 hover:shadow-xs transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      DOCX
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                      Word XML
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 pt-1">
                    Redigerbar Word (.docx)
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Ekte binær .docx med redigerbare APA-tabeller (uten vertikale streker) og Times New Roman 12pt.
                  </p>
                </div>
                <button
                  onClick={handleExportDocx}
                  disabled={isExporting !== null}
                  className="w-full inline-flex items-center justify-center space-x-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isExporting === "docx" ? (
                    <span className="animate-spin text-xs">⏳ Genererer...</span>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>Last ned Word (.docx)</span>
                    </>
                  )}
                </button>
              </div>

              {/* CSV Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500/50 hover:shadow-xs transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                      CSV
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                      RFC 4180
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 pt-1">
                    Strukturert CSV Data
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Rå nøkkeltall og gruppestatistikk med UTF-8 BOM, kompatibelt med Excel, R, Stata og Python.
                  </p>
                </div>
                <button
                  onClick={handleExportCsv}
                  disabled={isExporting !== null}
                  className="w-full inline-flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isExporting === "csv" ? (
                    <span className="animate-spin text-xs">⏳ Genererer...</span>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Last ned CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Download success banner */}
            {downloadSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-xs text-emerald-800 font-medium animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{downloadSuccess}</span>
              </div>
            )}
          </div>

          {/* Report Customization Settings */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Settings2 className="w-4 h-4 text-slate-500" />
              <span>2. Tilpass Innhold & APA 7 Detaljer</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Dokumenttittel:
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Forfatter / Student:
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Institusjon / Universitet:
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Språk på overskrifter:
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "no" | "en")}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="no">Norsk (Bokmål)</option>
                  <option value="en">English (APA 7th standard)</option>
                </select>
              </div>
            </div>

            {/* Checklist of sections to include */}
            <div className="pt-3 border-t border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Inkluder følgende moduler i rapporten:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTable}
                    onChange={(e) => setIncludeTable(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>APA 7 Tabell (Table 1 med tre horisontale streker)</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeInterpretation}
                    onChange={(e) => setIncludeInterpretation(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Pedagogisk tolkning (Hva funnet betyr og IKKE betyr)</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAssumptions}
                    onChange={(e) => setIncludeAssumptions(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Forutsetningskontroll & Robusthetsvurdering</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSpssGuide}
                    onChange={(e) => setIncludeSpssGuide(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>SPSS Menysti og veiledning</span>
                </label>
              </div>
            </div>
          </div>

          {/* Live APA 7 Preview Box */}
          <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>3. Forhåndsvisning: APA 7 Formatert Avsnitt & Tabell</span>
              </div>
              <span className="text-[11px] text-slate-400 font-serif italic">
                Times New Roman • 12 pt • APA 7th
              </span>
            </div>

            {/* Preview Document Paper Mock */}
            <div className="p-4 sm:p-6 bg-slate-50/60 rounded-xl border border-slate-200/80 font-serif text-slate-900 text-xs sm:text-[13px] leading-relaxed space-y-4">
              <div className="text-center font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
                {customTitle}
              </div>

              {/* Table Preview */}
              {includeTable && (
                <div className="space-y-1 my-3">
                  <div className="font-bold text-xs text-slate-900">Table 1</div>
                  <div className="italic text-xs text-slate-700">
                    Descriptive Statistics and Test Results for {testInfo.name}
                  </div>
                  <div className="border-t-2 border-b-2 border-black py-1 my-1 overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs">
                      <thead>
                        <tr className="border-b border-black">
                          <th className="py-1">Mål</th>
                          <th className="py-1">Verdi</th>
                          <th className="py-1">95% CI</th>
                          <th className="py-1">p</th>
                          <th className="py-1">{testInfo.effectSizeMetric}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-1">{testInfo.name}</td>
                          <td className="py-1 font-semibold">
                            {results?.t ? `t = ${results.t.toFixed(2)}` : results?.f ? `F = ${results.f.toFixed(2)}` : results?.r ? `r = ${results.r.toFixed(2)}` : "Test observert"}
                          </td>
                          <td className="py-1">
                            {results?.ciLower !== undefined ? `[${results.ciLower.toFixed(2)}, ${results.ciUpper.toFixed(2)}]` : "–"}
                          </td>
                          <td className="py-1 font-semibold">
                            {results?.pValue !== undefined ? (results.pValue < 0.001 ? "< .001" : results.pValue.toFixed(3)) : "–"}
                          </td>
                          <td className="py-1">
                            {results?.cohensD !== undefined ? results.cohensD.toFixed(2) : results?.etaSquared !== undefined ? results.etaSquared.toFixed(2) : "–"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="text-[10px] italic text-slate-500 pt-0.5">
                    Note. M = gjennomsnitt; SD = standardavvik; CI = konfidensintervall. *p &lt; .05. **p &lt; .01.
                  </div>
                </div>
              )}

              {/* Narrative Preview */}
              <div className="italic text-slate-800 bg-white p-3 rounded-lg border border-slate-200">
                «{apaNarrative}»
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Klar for nedlasting i PDF, Word (.docx) og CSV
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
            >
              Lukk
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting !== null}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Last ned (Hurtigeksport)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
