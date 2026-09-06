import React, { useState, useMemo, useRef } from 'react';
import { 
  ShieldCheck, 
  Search, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Upload, 
  Layers, 
  BookOpen, 
  ExternalLink, 
  Copy, 
  Download, 
  ArrowRight, 
  RefreshCw, 
  SlidersHorizontal,
  Compass,
  Award,
  Eye,
  FileCheck,
  Zap,
  HelpCircle,
  Hash,
  Activity,
  ChevronRight,
  ChevronDown,
  Info,
  Scale
} from 'lucide-react';
import { MethodologyRegistry } from '../data/masterRegistry';
import { META_RESEARCH_SAMPLES, MetaResearchSample } from '../data/metaResearchSamples';
import { MetaResearchService } from '../services/metaResearchService';
import { MetaResearchReport, AppraisalInstrument, ArticleAppraisal } from '../types';
import { useToast } from './Toast';

interface MetaResearchLabViewProps {
  onSelectInstrumentForAssessment?: (instrumentId: string, prefillArticle?: Partial<ArticleAppraisal>) => void;
  onSaveToLibrary?: (article: Partial<ArticleAppraisal>) => void;
}

export const MetaResearchLabView: React.FC<MetaResearchLabViewProps> = ({
  onSelectInstrumentForAssessment,
  onSaveToLibrary
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [documentText, setDocumentText] = useState<string>(META_RESEARCH_SAMPLES[0].text);
  const [documentFileName, setDocumentFileName] = useState<string>(META_RESEARCH_SAMPLES[0].fileName);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(META_RESEARCH_SAMPLES[0].id);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'classification' | 'integrity_scorecard' | 'tools_catalogue' | 'raw_data'>('classification');
  const [catalogueSearch, setCatalogueSearch] = useState<string>('');
  const [catalogueFilter, setCatalogueFilter] = useState<string>('all');
  const [expandedDimensionId, setExpandedDimensionId] = useState<string | null>('DIM-1-AIM');
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  // Report state
  const [report, setReport] = useState<MetaResearchReport>(() => {
    return MetaResearchService.classifyAndAuditDocument(META_RESEARCH_SAMPLES[0].text, META_RESEARCH_SAMPLES[0].fileName);
  });

  // Handle sample selection
  const handleSelectSample = (sample: MetaResearchSample) => {
    setSelectedSampleId(sample.id);
    setDocumentText(sample.text);
    setDocumentFileName(sample.fileName);
    const newReport = MetaResearchService.classifyAndAuditDocument(sample.text, sample.fileName);
    setReport(newReport);
    showToast(`Eksempelartikkel lastet: ${sample.title}`, 'info');
  };

  // Run analysis (tries backend API / Gemini, falls back to deterministic)
  const handleRunAnalysis = async () => {
    if (!documentText.trim()) {
      showToast('Vennligst lim inn eller last opp en forskningsartikkel fÃ¸rst.', 'warning');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/meta-research/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: documentText,
          fileName: documentFileName
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.report) {
          setReport(data.report);
          showToast(`Integritetsanalyse fullfÃ¸rt (${data.report.engineUsed})`, 'success');
          setIsAnalyzing(false);
          return;
        }
      }
    } catch (e) {
      console.warn('API call failed, running local deterministic integrity engine:', e);
    }

    // Local Fallback
    const localReport = MetaResearchService.classifyAndAuditDocument(documentText, documentFileName);
    setReport(localReport);
    showToast('Integritetsanalyse fullfÃ¸rt via deterministisk metodisk motor', 'success');
    setIsAnalyzing(false);
  };

  // Handle File Upload
  const handleFileUpload = (file: File) => {
    if (!file) return;
    setDocumentFileName(file.name);
    setSelectedSampleId('custom-uploaded');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setDocumentText(content);
        const newReport = MetaResearchService.classifyAndAuditDocument(content, file.name);
        setReport(newReport);
        showToast(`Fil lastet opp: ${file.name} (${Math.round(content.length / 1000)} kB)`, 'success');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Find Recommended & Alternative Instruments
  const recommendedInstrument = useMemo(() => {
    return MethodologyRegistry.find(i => i.id === report.classification.recommendedInstrumentId) || MethodologyRegistry[0];
  }, [report.classification.recommendedInstrumentId]);

  const alternativeInstruments = useMemo(() => {
    return MethodologyRegistry.filter(i => report.classification.alternativeInstrumentIds.includes(i.id));
  }, [report.classification.alternativeInstrumentIds]);

  const incompatibleInstruments = useMemo(() => {
    return MethodologyRegistry.filter(i => report.classification.incompatibleInstrumentIds.includes(i.id));
  }, [report.classification.incompatibleInstrumentIds]);

  // Filtered Catalogue
  const filteredCatalogue = useMemo(() => {
    return MethodologyRegistry.filter(inst => {
      const matchesSearch = catalogueSearch === '' || 
        inst.name.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
        inst.shortName.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
        inst.purpose.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
        inst.targetStudyDesign.some(d => d.toLowerCase().includes(catalogueSearch.toLowerCase()));
      
      const matchesFilter = catalogueFilter === 'all' || 
        inst.category === catalogueFilter || 
        inst.instrumentType === catalogueFilter;

      return matchesSearch && matchesFilter;
    });
  }, [catalogueSearch, catalogueFilter]);

  // Export report as markdown
  const handleCopyMarkdown = () => {
    let md = `# META-RESEARCH & INTEGRITY GATE RAPPORT\n\n`;
    md += `**Tittel:** ${report.extractedTitle}\n`;
    md += `**Forfattere:** ${report.extractedAuthors} (${report.extractedYear || 'N/A'})\n`;
    md += `**Dokumenttype:** ${report.classification.documentTypeName}\n`;
    md += `**Metodologifamilie:** ${report.classification.methodologyType}\n`;
    md += `**Epistemologi:** ${report.classification.epistemology}\n`;
    md += `**Samlet integritetsnivÃ¥:** ${report.overallIntegrityLevel}\n`;
    md += `**Anbefalt primÃ¦rinstrument:** ${recommendedInstrument.name} (${recommendedInstrument.shortName})\n\n`;
    md += `## Sammendrag\n${report.integritySummary}\n\n`;
    md += `## 9 Integritetsdimensjoner\n\n`;
    report.integrityDimensions.forEach(dim => {
      md += `### ${dim.name} [Status: ${dim.score}]\n`;
      md += `- **Vurdering:** ${dim.assessment}\n`;
      md += `- **Tekstutdrag:** ${dim.foundSnippet}\n`;
      md += `- **Anbefaling:** ${dim.recommendation}\n\n`;
    });

    navigator.clipboard.writeText(md);
    showToast('Full metoderapport kopiert til utklippstavlen som Markdown', 'success');
  };

  const handleLaunchAssessment = (instId: string) => {
    if (onSelectInstrumentForAssessment) {
      onSelectInstrumentForAssessment(instId, {
        title: report.extractedTitle,
        authors: report.extractedAuthors,
        year: report.extractedYear ? Number.parseInt(report.extractedYear, 10) : undefined,
        doi: report.extractedDoi || '',
        studyDesign: report.classification.documentTypeName
      });
      showToast(`Starter vurdering med ${instId.toUpperCase()}`, 'success');
    }
  };

  const handleSaveArticle = () => {
    if (onSaveToLibrary) {
      onSaveToLibrary({
        title: report.extractedTitle,
        authors: report.extractedAuthors,
        year: parseInt(report.extractedYear || '2024', 10) || 2024,
        doi: report.extractedDoi || '',
        studyDesign: report.classification.documentTypeName
      });
      showToast('Artikkel lagret i biblioteket!', 'success');
    }
  };

  return (
    <div id="meta-research-lab-workspace" className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div id="meta-research-header" className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Meta-Research & Methodological Integrity Gate
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                <span>Forsk pÃ¥ Forskning & Integritetsvakt</span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-3xl mt-1.5 leading-relaxed">
                Automatisk identifisering av vitenskapelige publikasjoner (kvalitativ, RCT, observasjonell, mixed methods, retningslinje), 
                kildekontrollert integritetsscreening over 9 metavitenskapelige dimensjoner, og matchmaking mot alle internasjonalt verifiserte evalueringsverktÃ¸y.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                id="btn-copy-meta-report"
                onClick={handleCopyMarkdown}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
              >
                <Copy className="w-4 h-4 text-slate-400" />
                Kopier Rapport (MD)
              </button>
              
              <button
                id="btn-save-to-library"
                onClick={handleSaveArticle}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-md transition"
              >
                <FileCheck className="w-4 h-4" />
                Lagre til Bibliotek
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Upload & Samples / Right Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: File Ingestion & Sample Picker (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Sample Picker */}
          <div id="sample-papers-card" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Velg Eksempelartikkel
              </h2>
              <span className="text-xs text-slate-500 font-medium">{META_RESEARCH_SAMPLES.length} studier</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {META_RESEARCH_SAMPLES.map(sample => {
                const isSelected = selectedSampleId === sample.id;
                return (
                  <button
                    key={sample.id}
                    id={`btn-sample-${sample.id}`}
                    onClick={() => handleSelectSample(sample)}
                    className={`text-left p-3 rounded-xl border transition flex items-start justify-between gap-3 ${
                      isSelected 
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-xs' 
                        : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/70'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shrink-0">
                          {sample.categoryName}
                        </span>
                        <span className="text-xs font-medium text-slate-900 truncate">
                          {sample.title.split('â€“')[0]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {sample.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drag & Drop File Upload & Text Ingestion */}
          <div id="file-drop-zone-card" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                Last Opp eller Lim Inn Forskningsfil
              </h2>
              <span className="text-xs text-slate-500 font-medium">PDF, DOCX, TXT, MD</span>
            </div>

            {/* Drag Drop Area */}
            <div
              id="drag-drop-area"
              onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                isDraggingFile
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-100/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.json,.md"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mb-1">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Dra og slipp forskningsartikkel eller klikk for Ã¥ bla gjennom
              </p>
              <p className="text-[11px] text-slate-500">
                StÃ¸tter PDF, Word (DOCX), ren tekst og forskningsnotater
              </p>
            </div>

            {/* Editable Raw Text Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium">Artikkeltekst ({documentFileName}):</span>
                <span>{documentText.length} tegn (~{Math.round(documentText.split(/\s+/).length)} ord)</span>
              </div>
              <textarea
                id="textarea-document-text"
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                rows={6}
                placeholder="Lim inn tittel, sammendrag, metodeavsnitt eller fulltekst fra forskningsartikkel..."
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-y"
              />
            </div>

            {/* Run Analysis CTA */}
            <button
              id="btn-run-integrity-analysis"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                  KjÃ¸rer Metodisk AI & Integritetsscreening...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  KjÃ¸r Integritetsanalyse & VerktÃ¸ymatch
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Identification, Matchmaker & Integrity Scorecard (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Navigation Subtabs */}
          <div id="meta-research-subtabs" className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200 overflow-x-auto">
            <button
              id="tab-btn-classification"
              onClick={() => setActiveTab('classification')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition shrink-0 flex items-center gap-2 ${
                activeTab === 'classification'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              1. Dokumenttype & VerktÃ¸ymatch
            </button>

            <button
              id="tab-btn-integrity-scorecard"
              onClick={() => setActiveTab('integrity_scorecard')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition shrink-0 flex items-center gap-2 ${
                activeTab === 'integrity_scorecard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              2. 9 Integritetsdimensjoner ({report.integrityDimensions.filter(d => d.score === 'HIGH').length}/9)
            </button>

            <button
              id="tab-btn-tools-catalogue"
              onClick={() => setActiveTab('tools_catalogue')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition shrink-0 flex items-center gap-2 ${
                activeTab === 'tools_catalogue'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-600" />
              3. Alle EvalueringsverktÃ¸y ({MethodologyRegistry.length})
            </button>
          </div>

          {/* TAB 1: CLASSIFICATION & TOOL MATCHMAKER */}
          {activeTab === 'classification' && (
            <div id="classification-tab-content" className="space-y-6">
              
              {/* Document Classification Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Identifisert Publikasjon
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {report.extractedTitle}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      report.overallIntegrityLevel === 'HIGH_INTEGRITY'
                        ? 'bg-emerald-100 text-emerald-800'
                        : report.overallIntegrityLevel === 'REPORTING_DEFICIT'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {report.overallIntegrityLevel.replace(/_/g, ' ')}
                    </span>

                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium font-mono">
                      {report.engineUsed}
                    </span>
                  </div>
                </div>

                {/* Metadata Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">Dokumenttype</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{report.classification.documentTypeName.split('(')[0]}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">Metodologifamilie</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{report.classification.methodologyType}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">Epistemologi</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate" title={report.classification.epistemology}>
                      {report.classification.epistemology}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">Analyseenhet</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate" title={report.classification.unitOfAnalysis}>
                      {report.classification.unitOfAnalysis}
                    </span>
                  </div>
                </div>

                {/* Classification Rationale */}
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs text-slate-800 space-y-1.5">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    Klassifiseringsbegrunnelse (Konfidens: {report.classification.confidenceScore}%):
                  </span>
                  <p className="leading-relaxed text-slate-700">
                    {report.classification.rationale}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {report.classification.detectedKeywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 text-[11px] font-mono">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* RECOMMENDED PRIMARY INSTRUMENT MATCH */}
              <div className="bg-white rounded-2xl p-6 border-2 border-emerald-500/80 shadow-md space-y-5 relative">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      Anbefalt Gullstandard-Instrument
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                      100% Verifisert
                    </span>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    ID: {recommendedInstrument.id}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>{recommendedInstrument.name}</span>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {recommendedInstrument.purpose}
                  </p>
                </div>

                {/* Key Spec Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-semibold text-slate-400 block">Utgiver / Organisasjon</span>
                    <span className="font-bold text-slate-800">{recommendedInstrument.publisher}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-semibold text-slate-400 block">Antall Kriterier</span>
                    <span className="font-bold text-slate-800">{recommendedInstrument.itemCount} punkter / domener</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-semibold text-slate-400 block">Scoringsmodell</span>
                    <span className="font-bold text-slate-800">{recommendedInstrument.scoringModel}</span>
                  </div>
                </div>

                {/* Prohibited Practices Guardrail */}
                {recommendedInstrument.prohibitedAcademicPractices && recommendedInstrument.prohibitedAcademicPractices.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-rose-950">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Integritetsvern â€“ Forbudte praksiser for dette verktÃ¸yet:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-rose-800 text-[11px]">
                      {recommendedInstrument.prohibitedAcademicPractices.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action CTA */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">
                    Kilde: {recommendedInstrument.officialSource.slice(0, 75)}...
                  </span>

                  <button
                    id="btn-launch-recommended-assessment"
                    onClick={() => handleLaunchAssessment(recommendedInstrument.id)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <span>Start Vurdering med {recommendedInstrument.shortName}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ALTERNATIVE & INCOMPATIBLE INSTRUMENTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Alternative Valid Tools */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                    Gyldige Metodiske Alternativer
                  </h4>
                  {alternativeInstruments.length > 0 ? (
                    <div className="space-y-2">
                      {alternativeInstruments.map(alt => (
                        <div key={alt.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">{alt.name}</span>
                            <span className="text-[11px] text-slate-500">{alt.publisher} ({alt.itemCount} items)</span>
                          </div>
                          <button
                            onClick={() => handleLaunchAssessment(alt.id)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition"
                          >
                            Bruk
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Ingen andre primÃ¦re alternativer registrert for dette designet.</p>
                  )}
                </div>

                {/* Incompatible Tools Warning */}
                <div className="bg-white rounded-2xl p-5 border border-rose-200/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Inkompatible VerktÃ¸y (Advarsel)
                  </h4>
                  {incompatibleInstruments.length > 0 ? (
                    <div className="space-y-2">
                      {incompatibleInstruments.slice(0, 2).map(inc => (
                        <div key={inc.id} className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/60 text-xs text-rose-900">
                          <span className="font-bold block">{inc.shortName} ({inc.name})</span>
                          <span className="text-[11px] text-rose-700 block mt-0.5">
                            Metodisk feil: Utformet for {inc.targetStudyDesign.join(', ')}. Kan ikke benyttes pÃ¥ {report.classification.documentTypeName.toLowerCase()}.
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Ingen spesifikke inkompatibiliteter oppdaget.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: INTEGRITY SCORECARD (9 DIMENSIONS) */}
          {activeTab === 'integrity_scorecard' && (
            <div id="integrity-scorecard-tab-content" className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Metodisk Integritets-Scorecard (Forsk pÃ¥ Forskning)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Strukturert kildekontroll over 9 vitenskapelige kjerneelementer i trÃ¥d med JBI, Cochrane, ICMJE og Open Science.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                    {report.integrityDimensions.filter(d => d.score === 'HIGH').length} BestÃ¥tt
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
                    {report.integrityDimensions.filter(d => d.score === 'UNCLEAR' || d.score === 'MODERATE').length} Uavklart
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800">
                    {report.integrityDimensions.filter(d => d.score === 'LOW').length} Risiko
                  </span>
                </div>
              </div>

              {/* 9 Dimensions List */}
              <div className="space-y-3">
                {report.integrityDimensions.map(dim => {
                  const isExpanded = expandedDimensionId === dim.id;
                  const isHigh = dim.score === 'HIGH';
                  const isLow = dim.score === 'LOW';

                  return (
                    <div
                      key={dim.id}
                      id={`card-dimension-${dim.id}`}
                      className={`bg-white rounded-2xl border transition overflow-hidden ${
                        isExpanded ? 'border-slate-400 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedDimensionId(isExpanded ? null : dim.id)}
                        className="w-full p-4 flex items-center justify-between text-left gap-3 hover:bg-slate-50/50 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isHigh ? 'bg-emerald-100 text-emerald-700' : isLow ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {isHigh ? <CheckCircle2 className="w-4 h-4" /> : isLow ? <XCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {dim.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Kategori: {dim.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isHigh ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : isLow ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {dim.score}
                          </span>
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-slate-100 space-y-3 text-xs bg-slate-50/30">
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-700 block">Vurdering:</span>
                            <p className="text-slate-600 leading-relaxed">{dim.assessment}</p>
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                            <span className="font-semibold text-slate-500 text-[11px] block uppercase">Funnet tekstutdrag / sitat:</span>
                            <p className="font-mono text-slate-800 text-[11px] italic bg-slate-50 p-2 rounded-lg">
                              "{dim.foundSnippet}"
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="font-semibold text-slate-700 block">Metodisk anbefaling:</span>
                            <p className="text-slate-600 leading-relaxed">{dim.recommendation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: COMPLETE TOOLS CATALOGUE (18+ INSTRUMENTS) */}
          {activeTab === 'tools_catalogue' && (
            <div id="tools-catalogue-tab-content" className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Komplett Register over EvalueringsverktÃ¸y ({filteredCatalogue.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verifiserte internasjonale standarder for kritisk vurdering, risk of bias, retningslinjer og syntese.
                    </p>
                  </div>

                  {/* Filter by category */}
                  <select
                    id="select-catalogue-category"
                    value={catalogueFilter}
                    onChange={(e) => setCatalogueFilter(e.target.value)}
                    className="text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Alle kategorier</option>
                    <option value="critical-appraisal">Kritisk vurdering</option>
                    <option value="risk-of-bias">Risk of Bias</option>
                    <option value="guideline-appraisal">Retningslinjer</option>
                    <option value="certainty-framework">GRADE / CERQual</option>
                    <option value="reporting-guideline">Rapportering</option>
                    <option value="implementation-framework">Implementering</option>
                  </select>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-search-catalogue"
                    type="text"
                    value={catalogueSearch}
                    onChange={(e) => setCatalogueSearch(e.target.value)}
                    placeholder="SÃ¸k i verktÃ¸y (JBI, AMSTAR 2, CASP, AGREE II, RoB 2, GRADE, MMAT, QUADAS-2, STROBE)..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* List of instruments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCatalogue.map(inst => {
                  const isPrimaryMatch = inst.id === report.classification.recommendedInstrumentId;
                  const isAltMatch = report.classification.alternativeInstrumentIds.includes(inst.id);

                  return (
                    <div
                      key={inst.id}
                      id={`card-tool-${inst.id}`}
                      className={`bg-white rounded-2xl p-4 border transition flex flex-col justify-between gap-3 ${
                        isPrimaryMatch 
                          ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-xs' 
                          : isAltMatch
                          ? 'border-cyan-300'
                          : 'border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {inst.categoryName}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            {inst.verificationStatus}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {inst.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {inst.publisher} ({inst.year})
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {inst.purpose}
                        </p>

                        <div className="flex flex-wrap gap-1 text-[10px] text-slate-500">
                          <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200">
                            Items: {inst.itemCount}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200">
                            Modell: {inst.scoringModel}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          {inst.id}
                        </span>

                        <button
                          id={`btn-select-tool-${inst.id}`}
                          onClick={() => handleLaunchAssessment(inst.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-600 text-white text-xs font-semibold transition cursor-pointer"
                        >
                          Velg VerktÃ¸y
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};


