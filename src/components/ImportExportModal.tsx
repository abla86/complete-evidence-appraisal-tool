import React, { useState, useRef } from 'react';
import { ArticleAppraisal } from '../types';
import { 
  ImportExportService, 
  SupportedImportFormat, 
  SupportedExportFormat, 
  ImportResult, 
  ExportOptions 
} from '../services/importExportService';
import { useToast } from './Toast';
import { 
  Download, 
  Upload, 
  FileText, 
  Table, 
  Code, 
  Check, 
  Copy, 
  X, 
  FileCheck, 
  Layers, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  BookOpen, 
  Database,
  ArrowRight,
  RefreshCw,
  Eye,
  CheckCircle2,
  ListFilter
} from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: ArticleAppraisal[];
  onImportArticles: (imported: ArticleAppraisal[], mode: 'append' | 'replace') => void;
  selectedArticleId?: string;
  initialTab?: 'import' | 'export';
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  articles,
  onImportArticles,
  selectedArticleId,
  initialTab = 'export'
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'import' | 'export'>(initialTab);

  // Import states
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [pastedContent, setPastedContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importTargetMode, setImportTargetMode] = useState<'append' | 'replace'>('append');

  // Export states
  const [selectedExportFormat, setSelectedExportFormat] = useState<SupportedExportFormat>('excel');
  const [exportScope, setExportScope] = useState<'all' | 'included_only' | 'selected_only'>('all');
  const [includeJustifications, setIncludeJustifications] = useState(true);
  const [includeEvidenceQuotes, setIncludeEvidenceQuotes] = useState(true);
  const [includeAuditTrail, setIncludeAuditTrail] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  // Handle File Upload
  const handleFileUpload = async (file: File) => {
    setIsProcessingImport(true);
    try {
      let content: string | ArrayBuffer;
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith('.pdf') || lowerName.endsWith('.docx')) {
        content = await file.arrayBuffer();
      } else {
        content = await file.text();
      }

      const result = await ImportExportService.parseImport(content, file.name, articles);
      setImportResult(result);
      showToast(`Analyserte ${file.name}: Fant ${result.totalParsed} oppføringer.`);
    } catch (err: unknown) {
      showToast(`Feil under filimport: ${err instanceof Error ? err.message : 'Ukjent feil'}`, 'error');
    } finally {
      setIsProcessingImport(false);
    }
  };

  // Handle Text Paste Analysis
  const handleAnalyzePastedText = async () => {
    if (!pastedContent.trim()) {
      showToast('Vennligst lim inn innhold før import.', 'warning');
      return;
    }

    setIsProcessingImport(true);
    try {
      const result = await ImportExportService.parseImport(pastedContent, 'utklippstavle-tekst.txt', articles);
      setImportResult(result);
      showToast(`Fant ${result.totalParsed} oppføringer i teksten (${result.formatName}).`);
    } catch (err: unknown) {
      showToast(`Feil under parsing: ${err instanceof Error ? err.message : 'Ukjent feil'}`, 'error');
    } finally {
      setIsProcessingImport(false);
    }
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (!importResult || importResult.newArticles.length === 0) {
      showToast('Ingen artikler å importere.', 'warning');
      return;
    }

    onImportArticles(importResult.newArticles, importTargetMode);
    showToast(
      `Importerte ${importResult.newArticles.length} artikler (${importTargetMode === 'replace' ? 'Erstattet eksisterende' : 'Lagt til i biblioteket'}).`
    );
    onClose();
  };

  // Run Export
  const getExportData = () => {
    const options: ExportOptions = {
      scope: exportScope,
      selectedArticleId,
      includeJustifications,
      includeEvidenceQuotes,
      includeAuditTrail
    };

    return ImportExportService.exportData(articles, selectedExportFormat, options);
  };

  const handleDownloadExport = async () => {
    try {
      if (selectedExportFormat === 'zip') {
        const options: ExportOptions = {
          scope: exportScope,
          selectedArticleId,
          includeJustifications,
          includeEvidenceQuotes,
          includeAuditTrail
        };
        const zipResult = await ImportExportService.generateZipBundle(articles, options);
        const url = URL.createObjectURL(zipResult.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = zipResult.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Lastet ned komplett ZIP-arkiv: ${zipResult.filename}`, 'success');
        return;
      }

      const data = getExportData();
      const blob = new Blob([data.content], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`Lastet ned fil: ${data.filename}`);
    } catch (err: unknown) {
      showToast(`Feil under eksport: ${err instanceof Error ? err.message : 'Ukjent feil'}`, 'error');
    }
  };

  const handleCopyToClipboard = () => {
    try {
      if (selectedExportFormat === 'zip') {
        showToast('ZIP-arkiv kan kun lastes ned som binærfil.', 'info');
        return;
      }
      const data = getExportData();
      navigator.clipboard.writeText(data.content);
      showToast(`Innhold kopiert til utklippstavlen (${selectedExportFormat.toUpperCase()})!`);
    } catch (err: unknown) {
      showToast(`Feil under kopiering: ${err instanceof Error ? err.message : 'Ukjent feil'}`, 'error');
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const formatList: { id: SupportedExportFormat; label: string; ext: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'zip', label: 'ZIP Fullpakke Arkiv', ext: '.zip', desc: 'Pakket arkiv med JSON, Word, CSV, BibTeX, RIS, Markdown og Audit Trail', icon: Layers },
    { id: 'excel', label: 'Excel (CSV med UTF-8)', ext: '.csv', desc: 'Åpnes direkte i Microsoft Excel og SPSS med alle JBI-skårer', icon: Table },
    { id: 'word', label: 'Word Rapport', ext: '.doc', desc: 'Komplett akademisk rapport med formaterte tabeller for Word', icon: FileText },
    { id: 'pdf', label: 'PDF Utskrift', ext: '.pdf', desc: 'Klargjort utskriftsrapport & WHO-sertifikat for lagring som PDF', icon: FileCheck },
    { id: 'ris', label: 'RIS Referansefil', ext: '.ris', desc: 'EndNote, Zotero, Covidence og Rayyan med JBI appraisal-notater', icon: Database },
    { id: 'bibtex', label: 'BibTeX Bibliografi', ext: '.bib', desc: 'LaTeX / Overleaf bibtex-oppføringer med kvalitetsvurderinger', icon: Code },
    { id: 'json', label: 'JSON Sikkerhetskopi', ext: '.json', desc: 'Fullstendig rådata og prosjektstruktur med revisjonsspor', icon: Layers },
    { id: 'markdown', label: 'Markdown', ext: '.md', desc: 'GitHub, Obsidian og Notion med formaterte tabeller', icon: Sparkles },
    { id: 'latex', label: 'LaTeX Tabeller', ext: '.tex', desc: 'Ferdig tabellkode (tabular/table) for vitenskapelige artikler', icon: Code },
    { id: 'tsv', label: 'TSV (Tab-separert)', ext: '.tsv', desc: 'For R, Python (Pandas) og statistisk bearbeiding', icon: Table }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:hidden">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <span>Data, Import & Eksport</span>
                <span className="text-xs font-sans px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold">
                  Alle Formater Støttes
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Sømløs integrasjon med EndNote, Zotero, Excel, Word, PDF, BibTeX, JSON og Rayyan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Import vs. Export */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-4">
          <button
            type="button"
            onClick={() => { setActiveTab('export'); setImportResult(null); }}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'export'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4 text-teal-700" />
            <span>Eksporter Filer & Rapporter ({articles.length} artikler)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'import'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4 text-teal-700" />
            <span>Importer Filer (RIS, BibTeX, Excel, PDF, JSON)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ========================================================= */}
          {/* EXPORT TAB */}
          {/* ========================================================= */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              
              {/* Scope & Scope Options */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    1. Velg Hva Som Skal Eksporteres
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Bibliotek: {articles.length} artikler totalt
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportScope('all')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      exportScope === 'all'
                        ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs">Alle Artikler ({articles.length})</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">Komplett kunnskapsbase</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportScope('included_only')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      exportScope === 'included_only'
                        ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs">
                      Inkluderte Studier ({articles.filter(a => a.overallVerdict === 'Inkluder' || a.overallVerdict === 'Vurder videre').length})
                    </div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">Kun godkjente til syntese</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportScope('selected_only')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      exportScope === 'selected_only'
                        ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs">Kun Valgt Artikkel (1)</div>
                    <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                      {articles.find(a => a.id === selectedArticleId)?.shortCitation || 'Aktiv artikkel'}
                    </div>
                  </button>
                </div>

                {/* Additional export options */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-4 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeJustifications}
                      onChange={(e) => setIncludeJustifications(e.target.checked)}
                      className="rounded text-teal-700 focus:ring-teal-600"
                    />
                    <span>Inkluder begrunnelser for hvert spørsmål (Q1–Q10)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeEvidenceQuotes}
                      onChange={(e) => setIncludeEvidenceQuotes(e.target.checked)}
                      className="rounded text-teal-700 focus:ring-teal-600"
                    />
                    <span>Inkluder tekstsitater & sidehenvisninger</span>
                  </label>
                </div>
              </div>

              {/* Format Grid */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  2. Velg Eksportformat
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {formatList.map(fmt => {
                    const Icon = fmt.icon;
                    const isSelected = selectedExportFormat === fmt.id;
                    return (
                      <div
                        key={fmt.id}
                        onClick={() => {
                          setSelectedExportFormat(fmt.id);
                          setShowPreview(false);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-teal-50/70 border-teal-600 ring-2 ring-teal-600/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-teal-400 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-slate-900">{fmt.label}</span>
                            </div>
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {fmt.ext}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {fmt.desc}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="mt-2 pt-2 border-t border-teal-200/60 flex items-center justify-end text-[10px] font-bold text-teal-800">
                            <span>Valgt format ✓</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Validert etter WHO 2024 & JBI 2017 metodikk</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {selectedExportFormat === 'pdf' ? (
                    <button
                      type="button"
                      onClick={handlePrintPdf}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Åpne Utskrift / Lagre som PDF</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleCopyToClipboard}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold rounded-xl shadow-2xs transition-colors"
                      >
                        <Copy className="w-4 h-4 text-slate-500" />
                        <span>Kopier Tekst</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadExport}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                      >
                        <Download className="w-4 h-4 text-teal-200" />
                        <span>Last Ned {selectedExportFormat.toUpperCase()}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* IMPORT TAB */}
          {/* ========================================================= */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              
              {/* Import Mode Switcher */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => { setImportMode('file'); setImportResult(null); }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
                    importMode === 'file'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Last Opp Fil (RIS, BibTeX, CSV, PDF, JSON, Word)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setImportMode('paste'); setImportResult(null); }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
                    importMode === 'paste'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Lim Inn Referansetekst / Rådata</span>
                </button>
              </div>

              {/* File Dropzone */}
              {importMode === 'file' && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-teal-600 bg-teal-50/60 scale-[1.01]'
                      : 'border-slate-300 hover:border-teal-500 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ris,.bib,.bibtex,.json,.csv,.tsv,.nbib,.medline,.txt,.pdf,.docx,.md"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto shadow-2xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Dra og slipp forskningsfiler her, eller <span className="text-teal-700 underline">bla gjennom mapper</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Støtter <strong>RIS</strong> (.ris), <strong>BibTeX</strong> (.bib), <strong>Excel/CSV</strong> (.csv, .tsv), <strong>JSON</strong> (.json), <strong>PubMed</strong> (.nbib) samt <strong>PDF & Word</strong> (.pdf, .docx).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Text Paste Box */}
              {importMode === 'paste' && (
                <div className="space-y-3">
                  <textarea
                    rows={8}
                    value={pastedContent}
                    onChange={(e) => setPastedContent(e.target.value)}
                    placeholder={`Lim inn RIS-oppføringer, BibTeX (@article{...}), JSON-struktur, CSV-tabell eller PubMed MEDLINE-tekst her...\n\nEksempel RIS:\nTY  - JOUR\nTI  - Tverrsektorielt samarbeid i primærhelsetjenesten\nAU  - Nordmann, O.\nPY  - 2024\nJO  - Tidsskrift for primærmedisin\nDO  - 10.1186/s12875-024-00000-0\nER  -`}
                    className="w-full text-xs font-mono p-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 leading-relaxed"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-mono">
                      {pastedContent.length} tegn
                    </span>
                    <button
                      type="button"
                      onClick={handleAnalyzePastedText}
                      disabled={isProcessingImport || !pastedContent.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                    >
                      {isProcessingImport ? 'Analyserer...' : 'Analyser og Klargjør Import'}
                    </button>
                  </div>
                </div>
              )}

              {/* Import Preview Result */}
              {importResult && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-sm font-bold text-slate-900 font-serif">
                          Identifiserte {importResult.totalParsed} artikler ({importResult.formatName})
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {importResult.duplicatesCount > 0 
                          ? `${importResult.duplicatesCount} av artiklene ser ut til å eksistere fra før i biblioteket.`
                          : 'Ingen duplikater funnet mot eksisterende bibliotek.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={importTargetMode}
                        onChange={(e) => setImportTargetMode(e.target.value === 'replace' ? 'replace' : 'append')}
                        className="text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-teal-600"
                      >
                        <option value="append">Legg til i biblioteket ({articles.length} + {importResult.totalParsed})</option>
                        <option value="replace">Erstatt hele biblioteket (Kun nye {importResult.totalParsed})</option>
                      </select>
                    </div>
                  </div>

                  {/* List of parsed articles */}
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {importResult.newArticles.map((art, idx) => (
                      <div key={art.id ? `${art.id}-${idx}` : `import-art-${idx}`} className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900">
                            #{idx + 1}. {art.title}
                          </span>
                          <p className="text-slate-500 text-[11px]">
                            {art.authors} • {art.journal} ({art.year}) • DOI: {art.doi || 'Ingen'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                          {art.design}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Confirm Button */}
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setImportResult(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl"
                    >
                      Avbryt
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    >
                      <Check className="w-4 h-4 text-teal-200" />
                      <span>Fullfør Import ({importResult.totalParsed} artikler)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Evidence Appraisal Tool • Full interoperabilitet med alle ledende referanse- og vitenskapsverktøy
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-2xs"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};
