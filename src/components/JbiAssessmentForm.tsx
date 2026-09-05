import React, { useState, useEffect } from 'react';
import { 
  ArticleAppraisal, 
  AssessmentStatus, 
  JBIEvaluationItem, 
  ValidationReport,
  EvidenceLocation
} from '../types';
import { JBI_QUESTIONS } from '../data/jbiData';
import { JbiQualitativeValidationService } from '../services/jbiValidationService';
import { DocumentAnalysisModal } from './DocumentAnalysisModal';
import { StatusBadge } from './StatusBadge';
import { useToast } from './Toast';
import { 
  ShieldCheck, 
  FileSearch, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Quote, 
  MapPin, 
  HelpCircle,
  FileText,
  User,
  Calendar,
  Layers,
  Sparkles,
  Download
} from 'lucide-react';

interface JbiAssessmentFormProps {
  initialArticle?: ArticleAppraisal;
  onSaveArticle: (article: ArticleAppraisal) => void;
  onCancel?: () => void;
}

export const JbiAssessmentForm: React.FC<JbiAssessmentFormProps> = ({
  initialArticle,
  onSaveArticle,
  onCancel
}) => {
  const { showToast } = useToast();

  // State
  const [title, setTitle] = useState(initialArticle?.title || '');
  const [authors, setAuthors] = useState(initialArticle?.authors || '');
  const [year, setYear] = useState(initialArticle?.year || new Date().getFullYear());
  const [journal, setJournal] = useState(initialArticle?.journal || '');
  const [doi, setDoi] = useState(initialArticle?.doi || '');
  const [design, setDesign] = useState(initialArticle?.design || 'Kvalitativ studie (f.eks. Grounded Theory, Fenomenologi, Tematisk analyse)');
  const [reviewerName, setReviewerName] = useState(initialArticle?.reviewerName || 'Forsker / Masterstudent');
  const [reviewerRole, setReviewerRole] = useState(initialArticle?.reviewerRole || 'Primærvurderer');
  const [assessmentDate, setAssessmentDate] = useState(initialArticle?.assessmentDate || new Date().toISOString().split('T')[0]);
  const [projectName, setProjectName] = useState(initialArticle?.projectName || 'Masteroppgave / Forskningsprosjekt');
  const [overallVerdict, setOverallVerdict] = useState<'Inkluder' | 'Ekskluder' | 'Vurder videre' | 'Søk mer informasjon'>(
    initialArticle?.overallVerdict || 'Inkluder'
  );
  const [verdictNote, setVerdictNote] = useState(initialArticle?.verdictNote || '');
  const [keyStrength, setKeyStrength] = useState(initialArticle?.keyStrength || '');
  const [mainLimitation, setMainLimitation] = useState(initialArticle?.mainLimitation || '');

  // 10 JBI Items
  const [items, setItems] = useState<JBIEvaluationItem[]>(() => {
    if (initialArticle && initialArticle.items && initialArticle.items.length === 10) {
      return initialArticle.items;
    }
    return JBI_QUESTIONS.map(q => ({
      questionId: q.id,
      status: 'Uklart',
      justification: '',
      evidenceText: '',
      location: {
        page: '',
        section: '',
        table: '',
        figure: ''
      },
      reviewerNotes: ''
    }));
  });

  const [activeQuestionId, setActiveQuestionId] = useState<number>(1);
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);

  useEffect(() => { if (doi.trim().toLowerCase() === '10.1186/s12875-024-02269-9') { const targetTitle="There's a will, but not a way': Norwegian GPs' experiences of collaboration with child welfare services - a grounded theory study"; setTitle(v=>v||targetTitle); setAuthors(v=>v||'Oda Martine Steinsdatter Øverhaug; Johanna Laue; Svein Arild Vis; Mette Bech Risør'); setYear(v=>v||2024); setJournal(v=>v||'BMC Primary Care'); setDesign(v=>v||'Kvalitativ studie (Grounded Theory)'); } }, [doi]);

  // Re-run validation whenever items or metadata change
  useEffect(() => {
    const draft: Partial<ArticleAppraisal> = {
      title,
      reviewerName,
      assessmentDate,
      items
    };
    const report = JbiQualitativeValidationService.validate(draft);
    setValidationReport(report);
  }, [title, reviewerName, assessmentDate, items]);

  const handleItemChange = (
    qId: number, 
    field: keyof JBIEvaluationItem | 'location', 
    value: any
  ) => {
    setItems(prev => prev.map(item => {
      if (item.questionId === qId) {
        if (field === 'location') {
          return {
            ...item,
            location: {
              ...(item.location || {}),
              ...value
            }
          };
        }
        return {
          ...item,
          [field]: value
        };
      }
      return item;
    }));
  };

  const handleApplyEvidenceFromDocAnalysis = (
    questionId: number, 
    evidenceText: string, 
    location: { page?: string; section?: string }
  ) => {
    setItems(prev => prev.map(item => {
      if (item.questionId === questionId) {
        return {
          ...item,
          evidenceText,
          location: {
            ...(item.location || {}),
            page: location.page || item.location?.page || '',
            section: location.section || item.location?.section || ''
          },
          candidateEvidenceVerified: true
        };
      }
      return item;
    }));
  };

  const handleSave = () => {
    if (!title.trim()) {
      showToast('Fyll ut studietittel før lagring.', 'error');
      return;
    }

    // Centralized mathematical score computation
    const score = JbiQualitativeValidationService.computeScore(items, 10);
    const shortCitation = JbiQualitativeValidationService.formatShortCitation(authors, year);
    const apaReference = JbiQualitativeValidationService.formatApa7Reference({
      authors: authors || 'Uspesifiserte forfattere',
      year: Number(year) || new Date().getFullYear(),
      title,
      journal: journal || 'Tidsskrift',
      doi: doi || undefined
    });

    const articleRecord: ArticleAppraisal = {
      id: initialArticle?.id || `jbi-custom-${Date.now()}`,
      instrumentId: 'jbi-qualitative-2017',
      instrumentVersion: '2017',
      methodologyAlignmentStatus: validationReport?.methodologyControl?.summaryVerdict === 'INTERN_METODISK_KONTROLLERT' ? 'INTERNAL_SOURCE_CONTROLLED' : 'PENDING_VERIFICATION',
      title,
      authors: authors || 'Uspesifiserte forfattere',
      shortCitation,
      year: Number(year) || new Date().getFullYear(),
      journal: journal || 'Tidsskrift',
      doi: doi || '',
      doiUrl: doi ? `https://doi.org/${doi}` : '',
      sourceUrl: '',
      sourceName: journal || 'Kvalitativ forskning',
      studyContext: `Kritisk vurdering utført i ${projectName}`,
      design,
      dataCollection: 'Kvalitativ datainnsamling',
      participants: 'Kvalitativt utvalg',
      analyticMethod: 'Kvalitativ analyse',
      reviewerName,
      reviewerRole,
      assessmentDate,
      projectName,
      summaryScore: {
        ja: score.ja,
        uklart: score.uklart,
        nei: score.nei,
        ikkeRelevant: score.ikkeRelevant,
        total: 10
      },
      overallVerdict,
      verdictNote: verdictNote || `Artikkelen er vurdert med JBI (2017): ${score.ja} Ja, ${score.uklart} Uklart, ${score.nei} Nei. Metodisk skår: ${score.jaScorePercent}%.`,
      keyStrength: keyStrength || 'Metodisk stringens og transparent datainnsamling.',
      mainLimitation: mainLimitation || 'Kvalitativ kontekstualisering.',
      apaReference,
      items
    };

    onSaveArticle(articleRecord);
    showToast('JBI 2017-vurdering lagret.');
  };

  const activeItem = items.find(i => i.questionId === activeQuestionId) || items[0];
  const activeQuestionDef = JBI_QUESTIONS.find(q => q.id === activeQuestionId) || JBI_QUESTIONS[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Official JBI Metadata */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                Instrument: JBI Qualitative (2017)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                10 Verifiserte Kriterier
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                JBI Metodisk Standard
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
              JBI – Critical Appraisal Checklist for Qualitative Research (2017)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Strukturert vurderingsskjema for metodisk etterprøvbarhet, ontologisk/metodisk samsvar, forskerens refleksivitet og etikk.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsDocModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-bold shadow-2xs transition-colors"
            >
              <FileSearch className="w-4 h-4 text-teal-700" />
              <span>Kandidat-evidens Dokumentanalyse</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4 text-teal-200" />
              <span>Lagre Vurdering</span>
            </button>
          </div>
        </div>

        {/* Validation & methodological control strip */}
        {validationReport && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Utfylt: {validationReport.answeredItems} / 10 ({validationReport.completenessPercent}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    Ja: {validationReport.counts.yes}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                    Uklart: {validationReport.counts.unclear}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-bold border border-rose-200">
                    Nei: {validationReport.counts.no}
                  </span>
                  {validationReport.counts.notApplicable > 0 && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      Ikke rel.: {validationReport.counts.notApplicable}
                    </span>
                  )}
                </div>
              </div>

              {/* Metodisk kontroll Status Badge */}
              <div className="flex items-center gap-2">
                {validationReport.methodologyControl && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    validationReport.methodologyControl.summaryVerdict === 'INTERN_METODISK_KONTROLLERT'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {validationReport.methodologyControl.summaryVerdict === 'INTERN_METODISK_KONTROLLERT' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    )}
                    <span>Metodisk kontroll: {validationReport.methodologyControl.summaryVerdict} ({validationReport.methodologyControl.complianceScore}%)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Warnings or Missing Items Hint */}
            {validationReport.warnings.length > 0 && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">Kvalitets- og valideringsmerknader:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-800 text-[11px]">
                    {validationReport.warnings.slice(0, 3).map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                    {validationReport.warnings.length > 3 && (
                      <li className="italic">+ {validationReport.warnings.length - 3} ytterligere merknader</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metadata Form Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-700" />
          <span>1. Studie- og Revieweropplysninger</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-slate-700">Artikkeltittel / Studietittel *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="F.eks. ‘There’s a will, but not a way’: Norwegian GPs’ experiences..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Forfattere</label>
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder="F.eks. Nordmann, O., Hansen, L., et al."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Publiseringsår</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Tidsskrift / Kilde</label>
            <input
              type="text"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="F.eks. BMC Primary Care / Global Health Action"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">DOI / Identifikator</label>
            <input
              type="text"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="10.1186/s12875-024-02269-9"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Vurderer / Reviewer</label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="Navn på vurderer"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Vurderingsdato</label>
            <input
              type="date"
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Prosjektnavn</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Masteroppgave / Forskningsprosjekt"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>
      </div>

      {/* 10 JBI Items Navigation & Active Question Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: 1-10 Item Selector List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            JBI Sjekkliste (10 Punkter):
          </div>

          <div className="space-y-1.5">
            {JBI_QUESTIONS.map(q => {
              const item = items.find(i => i.questionId === q.id);
              const isSelected = q.id === activeQuestionId;
              const hasRationale = item?.justification && item.justification.trim().length > 0;
              const hasEvidence = item?.evidenceText && item.evidenceText.trim().length > 0;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setActiveQuestionId(q.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-teal-50 border-teal-400 text-teal-950 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold line-clamp-1">
                      {q.shortTitle}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                      <span className="text-slate-400">{q.categoryTitle}</span>
                      {hasEvidence && (
                        <span className="text-teal-700 font-medium flex items-center gap-0.5">
                          <Quote className="w-2.5 h-2.5" /> Evidens
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <StatusBadge status={item?.status || 'Uklart'} size="sm" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Active Item Detailed Editor */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Question Title & Guidance */}
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-900">
                Spørsmål {activeQuestionDef.id} av 10 • {activeQuestionDef.categoryTitle}
              </span>
              <span className="text-xs text-slate-400">
                JBI Qualitative (2017)
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif mt-2">
              {activeQuestionDef.officialQuestion}
            </h3>
            <p className="text-xs text-slate-500 italic mt-0.5">
              Engelsk originaltekst: «{activeQuestionDef.officialQuestionEn}»
            </p>

            <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
              <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <span>{activeQuestionDef.descriptionGuide}</span>
            </div>
          </div>

          {/* Svaralternativer (Yes / No / Unclear / Not applicable) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Vurdererens Metodiske Svar:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Ja (Yes)', val: 'Ja' as AssessmentStatus, desc: 'Kriteriet er oppfylt og dokumentert' },
                { label: 'Uklart (Unclear)', val: 'Uklart' as AssessmentStatus, desc: 'Mangler eksplisitt redegjørelse' },
                { label: 'Nei (No)', val: 'Nei' as AssessmentStatus, desc: 'Kriteriet er ikke oppfylt' },
                { label: 'Ikke relevant (N/A)', val: 'Ikke relevant' as AssessmentStatus, desc: 'Gjelder ikke for studien' },
              ].map(opt => {
                const isSelected = activeItem.status === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => handleItemChange(activeQuestionId, 'status', opt.val)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs font-bold'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rationale / Begrunnelse */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Faglig Begrunnelse / Rationale *
              </label>
              <span className="text-[11px] text-slate-400">
                Påkrevd for sporbarhet
              </span>
            </div>
            <textarea
              rows={3}
              value={activeItem.justification}
              onChange={(e) => handleItemChange(activeQuestionId, 'justification', e.target.value)}
              placeholder={`Skriv din metodiske begrunnelse for hvorfor ${activeQuestionDef.shortTitle} er vurdert til «${activeItem.status}»...`}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 leading-relaxed"
            />
          </div>

          {/* Evidens fra artikkelen (Hva forskeren faktisk fant) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-teal-700" />
                <span>Evidens fra artikkelen (Hva forfatterne faktisk skrev):</span>
              </span>
              <button
                type="button"
                onClick={() => setIsDocModalOpen(true)}
                className="text-[11px] text-teal-700 hover:underline font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Finn i dokumentanalyse
              </button>
            </div>

            <textarea
              rows={2}
              value={activeItem.evidenceText || ''}
              onChange={(e) => handleItemChange(activeQuestionId, 'evidenceText', e.target.value)}
              placeholder="Sitér relevant tekstpassasje, formålserklæring, metodedel eller etisk godkjenningsreferanse..."
              className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-600 leading-relaxed"
            />

            {/* Evidence Location (Page, Section, Table, Figure) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Side (Page):</label>
                <input
                  type="text"
                  value={activeItem.location?.page || ''}
                  onChange={(e) => handleItemChange(activeQuestionId, 'location', { page: e.target.value })}
                  placeholder="F.eks. 3 eller 3-4"
                  className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Seksjon (Section):</label>
                <input
                  type="text"
                  value={activeItem.location?.section || ''}
                  onChange={(e) => handleItemChange(activeQuestionId, 'location', { section: e.target.value })}
                  placeholder="F.eks. Methods / Reflexivity"
                  className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Tabell (Table):</label>
                <input
                  type="text"
                  value={activeItem.location?.table || ''}
                  onChange={(e) => handleItemChange(activeQuestionId, 'location', { table: e.target.value })}
                  placeholder="F.eks. Tabell 1"
                  className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Figur (Figure):</label>
                <input
                  type="text"
                  value={activeItem.location?.figure || ''}
                  onChange={(e) => handleItemChange(activeQuestionId, 'location', { figure: e.target.value })}
                  placeholder="F.eks. Figur 2"
                  className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-600 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Reviewer-notater */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 block">
              Tilleggsnotater for Vurderer / Dual Review:
            </label>
            <input
              type="text"
              value={activeItem.reviewerNotes || ''}
              onChange={(e) => handleItemChange(activeQuestionId, 'reviewerNotes', e.target.value)}
              placeholder="F.eks. Merk: Dette punktet bør drøftes i konsensusmøte..."
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Navigation between 10 items */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={activeQuestionId === 1}
              onClick={() => setActiveQuestionId(prev => Math.max(1, prev - 1))}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              ← Forrige Spørsmål
            </button>

            <span className="text-xs text-slate-400">
              Spørsmål {activeQuestionId} av 10
            </span>

            <button
              type="button"
              disabled={activeQuestionId === 10}
              onClick={() => setActiveQuestionId(prev => Math.min(10, prev + 1))}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Neste Spørsmål →
            </button>
          </div>
        </div>
      </div>

      {/* Samlet Konklusjon & Inklusjonsbeslutning */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-700" />
          <span>Samlet Metodisk Vurdering & Inklusjonsbeslutning</span>
        </h3>

        {validationReport?.verdictRecommendation && (
          <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-teal-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                  WHO/JBI Anbefalt Vurdering:
                </span>
                <span className="px-2 py-0.5 rounded font-bold bg-white text-teal-900 border border-teal-200">
                  {validationReport.verdictRecommendation.verdict}
                </span>
                <span className="text-[11px] font-semibold text-slate-600">
                  (Bias-risiko: {validationReport.verdictRecommendation.riskOfBias})
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {validationReport.verdictRecommendation.rationale}
              </p>
            </div>
            {validationReport.verdictRecommendation.verdict !== 'Ufullstendig' && (
              <button
                type="button"
                onClick={() => {
                  if (validationReport.verdictRecommendation.verdict !== 'Ufullstendig') {
                    setOverallVerdict(validationReport.verdictRecommendation.verdict as any);
                    showToast(`Satte beslutning til «${validationReport.verdictRecommendation.verdict}»`);
                  }
                }}
                className="shrink-0 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs transition-colors shadow-2xs"
              >
                Bruk anbefaling
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { val: 'Inkluder' as const, label: 'Inkluder i syntesen', desc: 'Studien holder tilstrekkelig metodisk kvalitet' },
            { val: 'Søk mer informasjon' as const, label: 'Søk mer info / Uklart', desc: 'Krever forfatterkontakt eller tilleggskilder' },
            { val: 'Ekskluder' as const, label: 'Ekskluder', desc: 'Alvorlige metodiske mangler som svekker troverdigheten' },
          ].map(opt => {
            const isSelected = overallVerdict === opt.val;
            return (
              <button
                key={opt.val}
                type="button"
                onClick={() => setOverallVerdict(opt.val)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-teal-700 text-white border-teal-700 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold">{opt.label}</div>
                <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Samlet Vurderingsnotat / Syntesekommentar:</label>
          <textarea
            rows={3}
            value={verdictNote}
            onChange={(e) => setVerdictNote(e.target.value)}
            placeholder="Oppsummer studiens samlede metodiske styrker, begrensninger og betydning for kunnskapsoppsummeringen..."
            className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-600 leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl"
            >
              Avbryt
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-4 h-4 text-teal-200" />
            <span>Lagre Fullført Vurdering</span>
          </button>
        </div>
      </div>

      {/* Document Analysis Modal */}
      <DocumentAnalysisModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onApplyEvidenceToItem={handleApplyEvidenceFromDocAnalysis}
      />
    </div>
  );
};
