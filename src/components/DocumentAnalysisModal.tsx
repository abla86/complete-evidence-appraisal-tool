import React, { useState, useRef } from 'react';
import { 
  CandidateEvidence, 
  DocumentAnalysisResult, 
  ArticleAppraisal,
  DocumentClassificationResult,
  HumanVerificationDecision,
  StandardDocumentType,
  MethodologicalApproach,
  MethodologicalPurpose
} from '../types';
import { DocumentAnalysisService } from '../services/documentAnalysisService';
import { DocumentParserService, FileParseResult } from '../services/documentParserService';
import { DocumentClassifierService } from './../services/documentClassifierService';
import { StudyDesignGateService, SUPPORTED_STUDY_DESIGNS } from '../services/studyDesignGateService';
import { JBI_QUESTIONS } from '../data/jbiData';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';
import { 
  FileSearch, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Copy, 
  ArrowRight, 
  X, 
  FileText,
  ShieldAlert,
  Info,
  Layers,
  FileCheck,
  Eye,
  BookOpen,
  HelpCircle,
  Scan,
  ShieldCheck,
  Lock,
  Edit3,
  Check,
  AlertCircle,
  Scale,
  ExternalLink,
  Gavel
} from 'lucide-react';
import { useToast } from './Toast';

interface DocumentAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyEvidenceToItem?: (questionId: number, evidenceText: string, location: { page?: string; section?: string }) => void;
  onStartAssessmentWithArticle?: (article: Partial<ArticleAppraisal>) => void;
}

export const DocumentAnalysisModal: React.FC<DocumentAnalysisModalProps> = ({
  isOpen,
  onClose,
  onApplyEvidenceToItem,
  onStartAssessmentWithArticle
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeMode, setActiveMode] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('forskningsartikkel.pdf');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<FileParseResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [classification, setClassification] = useState<DocumentClassificationResult | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState<string>('');
  const [isCustomizingClassification, setIsCustomizingClassification] = useState(false);

  // Manual classification edits
  const [manualDocType, setManualDocType] = useState<StandardDocumentType | undefined>(undefined);

const STANDARD_DOCUMENT_TYPES: readonly StandardDocumentType[] = [
    'PRIMARY_RESEARCH_ARTICLE',
    'SYSTEMATIC_REVIEW',
    'META_ANALYSIS',
    'SCOPING_REVIEW',
    'RAPID_REVIEW',
    'INTEGRATIVE_REVIEW',
    'UMBRELLA_REVIEW',
    'QUALITATIVE_EVIDENCE_SYNTHESIS',
    'METHODOLOGY_STUDY',
    'DIAGNOSTIC_ACCURACY_STUDY',
    'RCT',
    'NON_RANDOMIZED_INTERVENTION_STUDY',
    'COHORT_STUDY',
    'CASE_CONTROL_STUDY',
    'CROSS_SECTIONAL_STUDY',
    'QUALITATIVE_STUDY',
    'MIXED_METHODS_STUDY',
    'CASE_REPORT',
    'CASE_SERIES',
    'PROTOCOL',
    'GUIDELINE',
    'NATIONAL_CLINICAL_GUIDELINE',
    'CLINICAL_PRACTICE_GUIDELINE',
    'PUBLIC_RECOMMENDATION_POLICY',
    'CONSENSUS_DOCUMENT',
    'IMPLEMENTATION_FRAMEWORK',
    'METHODOLOGICAL_FRAMEWORK',
    'REPORT',
    'HTA',
    'ECONOMIC_EVALUATION',
    'EDITORIAL_COMMENTARY',
    'LETTER_CORRESPONDENCE',
    'PROTOCOL_SYSTEMATIC_REVIEW',
    'OTHER',
    'UNKNOWN_UNCERTAIN'
];

function isStandardDocumentType(value: string): value is StandardDocumentType {
    return STANDARD_DOCUMENT_TYPES.includes(value as StandardDocumentType);
}
  const [manualStudyDesign, setManualStudyDesign] = useState<string>('');
  const [manualApproach, setManualApproach] = useState<MethodologicalApproach | undefined>(undefined);
  const [manualPurpose, setManualPurpose] = useState<MethodologicalPurpose | undefined>(undefined);

  if (!isOpen) return null;

  const performClassification = (rawText: string, name: string, parsedMeta?: any) => {
    const meta = parsedMeta || DocumentParserService.extractMetadata(rawText, name);
    const classRes = DocumentClassifierService.classifyDocument(rawText, {
      title: meta.title,
      authors: meta.authors,
      journal: meta.journal,
      doi: meta.doi
    });

    setClassification(classRes);
    setSelectedInstrument(classRes.recommendedInstrumentId);
    if (isStandardDocumentType(classRes.documentType)) {
      setManualDocType(classRes.documentType);
    } else {
      setManualDocType(undefined);
    }
    setManualApproach(classRes.methodologicalApproach);
    setManualPurpose(classRes.methodologicalPurpose);
  };

  const handleFileUpload = async (file: File) => {
    const validation = DocumentParserService.validateFile({
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (!validation.valid) {
      showToast(validation.error || 'Ugyldig fil.', 'error');
      return;
    }

    setFileName(file.name);
    setIsAnalyzing(true);

    try {
      const parsed = await DocumentParserService.parseFile(file);
      setParseResult(parsed);
      setPastedText(parsed.extractedText);

      performClassification(parsed.extractedText, file.name, parsed.metadata);

      const analysis = DocumentAnalysisService.analyzeText(parsed.extractedText, file.name);
      setAnalysisResult(analysis);

      if (parsed.isScannedOrImageOnly) {
        showToast('Dokumentet er skannet bilde-PDF. Tekstuttrekk og metadata er basert pÃ¥ OCR-deteksjon.', 'warning');
      } else {
        showToast(`Dokument lastet opp og parset (${parsed.wordCount} ord).`);
      }
    } catch (err: any) {
      showToast(`Feil under filparsing: ${err.message}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRunTextAnalysis = () => {
    if (!pastedText.trim()) {
      showToast('Lim inn artikkeltekst fÃ¸r du starter analysen.', 'error');
      return;
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      try {
        const parsedMetadata = DocumentParserService.extractMetadata(pastedText, fileName);
        const sections = DocumentParserService.extractSections(pastedText);
        const analysis = DocumentAnalysisService.analyzeText(pastedText, fileName);

        const words = pastedText.trim().split(/\s+/).filter(Boolean);
        setParseResult({
          fileName,
          fileSizeBytes: new Blob([pastedText]).size,
          fileType: 'txt',
          mimeType: 'text/plain',
          isScannedOrImageOnly: false,
          ocrAppliedOrNeeded: false,
          ocrConfidence: 100,
          extractedText: pastedText,
          wordCount: words.length,
          estimatedPages: Math.max(1, Math.ceil(words.length / 500)),
          metadata: parsedMetadata,
          sections,
          candidateEvidence: analysis.candidateEvidence
        });

        performClassification(pastedText, fileName, parsedMetadata);
        setAnalysisResult(analysis);
        showToast(`Dokument klassifisert og analysert.`);
      } catch (e: any) {
        showToast('Feil under dokumentanalyse: ' + e.message, 'error');
      } finally {
        setIsAnalyzing(false);
      }
    }, 300);
  };

  const handleLoadSampleStudy = () => {
    setFileName('grounded-theory-primary-care-2024.txt');
    const sample = `Title: Navigating Relational Complexity in Primary Healthcare: A Constructivist Grounded Theory Study of General Practitioners' Interprofessional Collaboration.
Authors: Lund, H. M., Solberg, K. E., Vis, S. A., & Bakke, M. B. (2024). BMC Primary Care, 25, 36.
DOI: 10.1186/s12875-024-02269-9

Background & Aim:
Interprofessional collaboration in primary care is essential for vulnerable patient groups, yet fraught with structural barriers. The aim of this study was to explore general practitionersâ€™ experiences of interprofessional collaboration, identifying structural and relational patterns in clinical practice.

Methods:
Study design: A qualitative study utilizing Grounded Theory methodology (Strauss & Corbin, Charmaz).
Participants & Data collection: We conducted 10 individual semi-structured qualitative interviews with general practitioners across various municipalities. The interview guide explored real-life collaboration cases, communication bottlenecks, and interprofessional dynamics.
Data analysis: Audio recordings were transcribed verbatim and analyzed using constant comparative method with open and axial coding. Categories were constructed iteratively until theoretical saturation was achieved.

Reflexivity & Research team:
The research team consisted of two practicing clinicians (authors 1 and 2), a health services researcher (author 3), and a medical anthropologist (author 4). Shared clinical background facilitated rapport during interviews, while multidisciplinary debriefings mitigated confirmation bias.

Results:
The core category emerged as 'Thereâ€™s a will, but not a way', encompassing three main dimensions: (1) Asymmetrical communication channels, (2) Uncertainty regarding feedback and confidentiality boundaries, and (3) Desire for structured interprofessional meeting platforms.

Declarations & Ethics:
Ethical approval was evaluated and granted by Sikt (ref 982121). Written informed consent was obtained from all participating GPs. Confidentiality was strictly maintained by pseudonymizing all transcripts.`;
    setPastedText(sample);
    setActiveMode('paste');
  };

  const handleApproveProposal = () => {
    if (!classification) return;
    const updated = DocumentClassifierService.applyHumanDecision(classification, {
      status: 'APPROVED',
      verifiedBy: 'Forsker'
    });
    setClassification(updated);
    showToast('AI-kandidatforslag er godkjent og verifisert av forsker.', 'success');
  };

  const handleSaveManualClassification = () => {
    if (!classification) return;
    const matchedDesign = SUPPORTED_STUDY_DESIGNS.find(d => d.id === manualStudyDesign);
    const updated = DocumentClassifierService.applyHumanDecision(classification, {
      status: 'MODIFIED',
      manualDocType: manualDocType,
      manualStudyDesign: matchedDesign?.name || manualStudyDesign,
      manualMethodology: manualApproach,
      manualPurpose: manualPurpose,
      manualInstrumentId: selectedInstrument,
      verifiedBy: 'Forsker'
    });
    setClassification(updated);
    setIsCustomizingClassification(false);
    showToast('Klassifisering overstyrt og lagret av forsker.', 'success');
  };

  const handleMarkUncertain = () => {
    if (!classification) return;
    const updated = DocumentClassifierService.applyHumanDecision(classification, {
      status: 'UNCERTAIN',
      verifiedBy: 'Forsker',
      rationale: 'Markert som usikker av forsker â€“ krever manuell fulltekst-gjennomgang'
    });
    setClassification(updated);
    showToast('Dokument markert som metodisk usikkert.', 'warning');
  };

  // Compatibility Check
  const detectedDesignId = classification ? StudyDesignGateService.detectStudyDesign(classification.studyDesign).id : 'unknown-uncertain';
  const gateCheck = StudyDesignGateService.checkCompatibility(detectedDesignId, selectedInstrument);

  const handleStartAssessmentFromDocument = () => {
    if (!parseResult || !classification) {
      showToast('Vennligst analyser dokumentet fÃ¸rst.', 'warning');
      return;
    }

    if (onStartAssessmentWithArticle) {
      const newArticle: Partial<ArticleAppraisal> = {
        title: parseResult.metadata.title || fileName,
        authors: parseResult.metadata.authors || 'Forfattere',
        year: parseResult.metadata.year || undefined,
        journal: parseResult.metadata.journal || undefined,
        doi: parseResult.metadata.doi || '',
        doiUrl: parseResult.metadata.doi ? `https://doi.org/${parseResult.metadata.doi}` : undefined,
        design: classification.studyDesign || undefined,
        studyContext: parseResult.metadata.abstract || undefined,
        instrumentId: selectedInstrument || undefined
      };

      onStartAssessmentWithArticle(newArticle);
      onClose();
      showToast('Opprettet ny vurdering forhÃ¥ndsutfylt fra dokumentet.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
              <FileSearch className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <span>Dokumentklassifisering & Studiedesign-Gate</span>
                <span className="text-xs font-sans px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold">
                  Seksjon 8â€“22 Integritetskontroll
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Obligatorisk dokumentidentifisering, klassifisering og instrumentkompatibilitet fÃ¸r appraisal
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Methodological Safety Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-amber-900 uppercase tracking-wide">
                Kritisk Metodisk Sikkerhetskrav: AI er kun kandidatgenerator
              </span>
              <p className="text-amber-800 leading-relaxed">
                Systemet <strong>antar aldri</strong> at et dokument er en kvalitativ forskningsartikkel bare fordi det inneholder tekst. 
                Alle automatiske forslag markeres som <strong>Â«AI-kandidatforslag â€“ krever verifiseringÂ»</strong>. 
                Forskeren mÃ¥ eksplisitt godkjenne eller overstyre klassifiseringen fÃ¸r vurderingsinstrumentet velges.
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveMode('upload')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
                activeMode === 'upload'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Last opp Forskningsfil (PDF / DOCX / TXT)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('paste')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
                activeMode === 'paste'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Lim inn Tekst / Metodeseksjon</span>
            </button>
            
            <div className="ml-auto">
              <button
                type="button"
                onClick={handleLoadSampleStudy}
                className="text-xs text-teal-700 hover:text-teal-800 font-semibold hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Last inn eksempel: Kvalitativ GT-studie</span>
              </button>
            </div>
          </div>

          {/* Upload Drop Zone */}
          {activeMode === 'upload' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-teal-600 bg-teal-50/50 scale-[1.01]' 
                  : 'border-slate-300 hover:border-teal-500 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.rtf,.md"
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
                    Dra og slipp forskningsartikkel her, eller <span className="text-teal-700 underline">bla gjennom filer</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    StÃ¸tter PDF (.pdf), Word (.docx), ren tekst (.txt) og Markdown (.md) opptil 25 MB
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-[11px] font-mono text-slate-500 bg-white px-3 py-1 rounded-md border border-slate-200">
                  <Scan className="w-3.5 h-3.5 text-teal-700" />
                  <span>Automatisk deteksjon av tekstlag, skannet PDF og OCR-status</span>
                </div>
              </div>
            </div>
          )}

          {/* Paste Text Area */}
          {activeMode === 'paste' && (
            <div className="space-y-3">
              <textarea
                rows={7}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Lim inn tittel, bakgrunn, metodedel, refleksivitet, etikk eller resultatavsnitt fra forskningsartikkelen her..."
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Tegn: {pastedText.length} | Avsnitt: {pastedText.split('\n\n').filter(Boolean).length}
                </span>
                <button
                  type="button"
                  onClick={handleRunTextAnalysis}
                  disabled={isAnalyzing || !pastedText.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>Klassifiserer dokument...</>
                  ) : (
                    <>
                      <FileSearch className="w-4 h-4 text-teal-200" />
                      <span>Start Dokumentklassifisering</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* CLASSIFICATION & GATE RESULTS */}
          {classification && (
            <div className="space-y-5 border-t border-slate-200 pt-5">
              
              {/* Conflict Alert Banner if Metadata Contradicts Body */}
              {classification.hasMetadataContentConflict && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-xs text-rose-900">
                  <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wide block">
                      Metodisk Klassifiseringskonflikt Oppdaget
                    </span>
                    <p className="mt-0.5">{classification.conflictDetails}</p>
                  </div>
                </div>
              )}

              {/* Classification Results Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 font-serif">
                        1. Dokumenttype & Forskningsstatus
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        classification.confidenceStatus === 'HUMAN_VERIFIED'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : classification.confidenceStatus === 'MANUAL_VERIFICATION_REQUIRED' || classification.confidenceStatus === 'INSUFFICIENT_INFORMATION'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-teal-100 text-teal-900 border-teal-300'
                      }`}>
                        {classification.statusBadgeText}
                      </span>
                      {classification.isResearchDocument === false && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300">
                          Retningslinje / Ikke-primÃ¦rforskning
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {classification.rationale}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCustomizingClassification(!isCustomizingClassification)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-2xs flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>{isCustomizingClassification ? 'Lukk endring' : 'Endre / Overstyr'}</span>
                    </button>
                    {classification.confidenceStatus !== 'HUMAN_VERIFIED' && (
                      <button
                        type="button"
                        onClick={handleApproveProposal}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Godkjenn AI-forslag</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 4 Classification Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Dokumenttype (8.1)
                    </span>
                    <span className="font-bold text-slate-900 block">
                      {classification.documentTypeName}
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Studiedesign (8.2)
                    </span>
                    <span className="font-bold text-slate-900 block">
                      {classification.studyDesign}
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Metodisk TilnÃ¦rming (9.1)
                    </span>
                    <span className="font-bold text-slate-900 block">
                      {classification.methodologicalApproach}
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      FormÃ¥l (10.1)
                    </span>
                    <span className="font-bold text-slate-900 block">
                      {classification.methodologicalPurpose}
                    </span>
                  </div>
                </div>

                {/* Legal Identification & Normative Classification Card (Lovfestet plikt vs Faglig rÃ¥d) */}
                {classification.legalAnalysis && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                          <Scale className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            Juridisk Forankring & Lovfestede Plikter vs. Faglige RÃ¥d
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {classification.legalAnalysis.summary}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        classification.legalAnalysis.hasLegalActs
                          ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {classification.legalAnalysis.identifiedActs.length} lovverk identifisert
                      </span>
                    </div>

                    {/* Identified Legal Acts */}
                    {classification.legalAnalysis.hasLegalActs ? (
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold text-slate-700 block">
                          Identifiserte Lovverk og Paragrafer:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {classification.legalAnalysis.identifiedActs.map((act, idx) => (
                            <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start justify-between gap-2 text-xs">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">{act.officialName}</span>
                                  {act.shortCode && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                                      {act.shortCode}
                                    </span>
                                  )}
                                </div>
                                {act.relevantSections && act.relevantSections.length > 0 && (
                                  <p className="text-[11px] text-indigo-700 font-mono mt-0.5">
                                    Relevante paragrafer: {act.relevantSections.join(', ')}
                                  </p>
                                )}
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Jurisdiksjon: {act.jurisdiction}
                                </p>
                              </div>
                              {act.lovdataUrl && (
                                <a 
                                  href={act.lovdataUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-800 shrink-0 p-1 hover:bg-indigo-50 rounded"
                                  title="Ã…pne pÃ¥ Lovdata"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        Ingen spesifikke lovverk sitert i teksten (dokumentet baserer seg pÃ¥ faglige vurderinger eller generell forskningsmetodikk).
                      </p>
                    )}

                    {/* Statutory Duties vs Professional Advice breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                            <Gavel className="w-3.5 h-3.5 text-rose-700" />
                            <span>Lovfestede Plikter (Â«skal / mÃ¥Â»)</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                            {classification.legalAnalysis.statutoryDuties.length}
                          </span>
                        </div>
                        {classification.legalAnalysis.statutoryDuties.length > 0 ? (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {classification.legalAnalysis.statutoryDuties.map((duty, idx) => (
                              <div key={idx} className="bg-white p-2 rounded border border-rose-100 text-[11px] text-slate-800">
                                <span className="font-mono text-rose-900 font-semibold block">Â«{duty.rawText}Â»</span>
                                {duty.legalBasis && (
                                  <span className="text-[10px] text-rose-700 block mt-0.5">Hjemmel: {duty.legalBasis}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-rose-800/80 italic">
                            Ingen eksplisitte lovfestede tvangsplikter eller Â«skalÂ»-krav registrert.
                          </p>
                        )}
                      </div>

                      <div className="bg-teal-50/50 p-3 rounded-lg border border-teal-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                            <span>Faglige RÃ¥d (Â«bÃ¸r / kanÂ»)</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                            {classification.legalAnalysis.professionalAdvice.length}
                          </span>
                        </div>
                        {classification.legalAnalysis.professionalAdvice.length > 0 ? (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {classification.legalAnalysis.professionalAdvice.map((advice, idx) => (
                              <div key={idx} className="bg-white p-2 rounded border border-teal-100 text-[11px] text-slate-800">
                                <span className="font-mono text-teal-950 block">Â«{advice.rawText}Â»</span>
                                <span className="text-[10px] text-teal-700 block mt-0.5">{advice.context}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-teal-800/80 italic">
                            Ingen spesifikke Â«bÃ¸rÂ»-rÃ¥d registrert.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Customization Panel */}
                {isCustomizingClassification && (
                  <div className="bg-white p-4 rounded-xl border border-teal-300 space-y-4 animate-in fade-in duration-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Manuell overstyring av klassifisering
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Velg Studiedesign
                        </label>
                        <select
                          value={manualStudyDesign}
                          onChange={(e) => setManualStudyDesign(e.target.value)}
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg"
                        >
                          {SUPPORTED_STUDY_DESIGNS.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Metodisk TilnÃ¦rming
                        </label>
                        <select
                          value={manualApproach}
                          onChange={(e) => setManualApproach(e.target.value as MethodologicalApproach)}
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg"
                        >
                          <option value="Kvalitativ">Kvalitativ</option>
                          <option value="Kvantitativ (Eksperimentell / RCT)">Kvantitativ (Eksperimentell / RCT)</option>
                          <option value="Kvantitativ (Observasjonell)">Kvantitativ (Observasjonell)</option>
                          <option value="Mixed Methods (Blandet metode)">Mixed Methods (Blandet metode)</option>
                          <option value="Kunnskapsoppsummering / Syntese">Kunnskapsoppsummering / Syntese</option>
                          <option value="Klinisk retningslinje / Normativ praksis">Klinisk retningslinje / Normativ praksis</option>
                          <option value="Diagnostikk & Testvalidering">Diagnostikk & Testvalidering</option>
                          <option value="Metodologi & VerktÃ¸yutvikling">Metodologi & VerktÃ¸yutvikling</option>
                          <option value="Ukjent / Uavklart">Ukjent / Uavklart</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          VurderingsformÃ¥l
                        </label>
                        <select
                          value={manualPurpose}
                          onChange={(e) => setManualPurpose(e.target.value as MethodologicalPurpose)}
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg"
                        >
                          <option value="Levde erfaringer / Sosiale fenomener">Levde erfaringer / Sosiale fenomener</option>
                          <option value="Kausaleffekt / Behandlingseffekt">Kausaleffekt / Behandlingseffekt</option>
                          <option value="Etiologi / Risikofaktorer">Etiologi / Risikofaktorer</option>
                          <option value="Prevalens / Kartlegging">Prevalens / Kartlegging</option>
                          <option value="Kunnskapssyntese / Meta-analyse">Kunnskapssyntese / Meta-analyse</option>
                          <option value="Kvalitativ evidenssyntese">Kvalitativ evidenssyntese</option>
                          <option value="Kliniske handlingsanbefalinger">Kliniske handlingsanbefalinger</option>
                          <option value="Diagnostisk nÃ¸yaktighet / Testvalidering">Diagnostisk nÃ¸yaktighet / Testvalidering</option>
                          <option value="Uavklart / Krever manuell presisering">Uavklart / Krever manuell presisering</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleMarkUncertain}
                        className="px-3 py-1.5 text-xs text-amber-800 bg-amber-100 hover:bg-amber-200 font-semibold rounded-lg"
                      >
                        Marker som usikker / ukjent
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveManualClassification}
                        className="px-4 py-1.5 text-xs text-white bg-teal-700 hover:bg-teal-800 font-bold rounded-lg"
                      >
                        Lagre Overstyring
                      </button>
                    </div>
                  </div>
                )}

                {/* Compatibility Gate Card */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  gateCheck.matchLevel === 'EXACT_RECOMMENDED'
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : gateCheck.matchLevel === 'ACCEPTABLE_ALTERNATIVE'
                    ? 'bg-blue-50/70 border-blue-300 text-blue-950'
                    : 'bg-rose-50/80 border-rose-300 text-rose-950'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {gateCheck.isCompatible ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
                      )}
                      <span className="text-xs font-bold">
                        {gateCheck.headline}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-700 shrink-0">
                        Valgt Instrument:
                      </label>
                      <select
                        value={selectedInstrument}
                        onChange={(e) => setSelectedInstrument(e.target.value)}
                        className="text-xs font-semibold bg-white border border-slate-300 rounded-md p-1 focus:ring-1 focus:ring-teal-600"
                      >
                        {MASTER_INSTRUMENTS_REGISTRY.map(inst => (
                          <option key={inst.id} value={inst.id}>
                            {inst.shortName} ({inst.version}) â€“ {inst.categoryName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed">
                    {gateCheck.explanation}
                  </p>

                  {gateCheck.incompatibleReasons && gateCheck.incompatibleReasons.length > 0 && (
                    <div className="bg-white/80 p-2.5 rounded-lg border border-rose-200 text-xs text-rose-900 space-y-1">
                      <span className="font-bold block text-[11px] uppercase">Gating-advarsel:</span>
                      {gateCheck.incompatibleReasons.map((reason, idx) => (
                        <p key={idx}>â€¢ {reason}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Educational Framework Role Note (Section 13) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Info className="w-4 h-4 text-teal-700" />
                    <span>Metodisk Instrumentrolle & Begrensninger (Seksjon 13 & 14)</span>
                  </div>
                  <p className="leading-relaxed">
                    {classification.recommendedInstrumentJustification}
                  </p>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <strong>Kilde/Standard:</strong> {classification.instrumentSourceAndAuthority} | <strong>Begrensning:</strong> {classification.methodologicalLimitations}
                  </div>
                </div>

                {/* Start Assessment Action Button */}
                {onStartAssessmentWithArticle && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleStartAssessmentFromDocument}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Start Vurdering med Dette Dokumentet</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Candidate Evidence Extraction (if qualitative) */}
          {analysisResult && selectedInstrument === 'jbi-qualitative-2017' && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-serif">
                    Kandidat-evidens funnet ({analysisResult.candidateEvidence.length} av 10 JBI-kriterier)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vurder hvert funn og overfÃ¸r til vurderingsskjemaet
                  </p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {analysisResult.fileName}
                </span>
              </div>

              <div className="space-y-3">
                {JBI_QUESTIONS.map(q => {
                  const candidate = analysisResult.candidateEvidence.find(c => c.questionId === q.id);

                  return (
                    <div 
                      key={q.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        candidate 
                          ? 'bg-white border-teal-200 shadow-2xs' 
                          : 'bg-slate-50 border-slate-200 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">
                              {q.shortTitle}
                            </span>
                            {candidate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-200">
                                <Sparkles className="w-3 h-3 text-teal-700" />
                                <span>Candidate evidence â€“ requires verification</span>
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">
                                Ingen direkte teksttreff (Ikke funnet â‰  Nei)
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{q.officialQuestion}</p>

                          {candidate && (
                            <div className="mt-3 space-y-2">
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed">
                                Â«{candidate.extractedSnippet}Â»
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                                <span>
                                  ForeslÃ¥tt lokasjon: <strong>Side {candidate.suggestedLocation.page || '1'}</strong> | Seksjon: <strong>{candidate.suggestedLocation.section || 'Metode'}</strong>
                                </span>
                                
                                {onApplyEvidenceToItem && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onApplyEvidenceToItem(
                                        q.id,
                                        candidate.extractedSnippet,
                                        candidate.suggestedLocation
                                      );
                                      showToast(`Evidens for SpÃ¸rsmÃ¥l ${q.id} er lagt til i skjemaet.`);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 font-semibold rounded-md transition-colors"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                                    <span>OverfÃ¸r til Skjema</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            WHO Guideline Standards & JBI Adelaide Evidence Appraisal Workflow
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-2xs transition-colors"
          >
            Lukk Dokumentanalyse
          </button>
        </div>
      </div>
    </div>
  );
};

