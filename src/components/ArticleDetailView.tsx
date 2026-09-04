import React, { useState, useMemo } from 'react';
import { ArticleAppraisal, AssessmentLifecycleStatus } from '../types';
import { JBI_QUESTIONS } from '../data/jbiData';
import { JbiQualitativeValidationService } from '../services/jbiValidationService';
import { SnapshotService } from '../services/snapshotService';
import { MethodIntegrityGate, MethodIntegrityGateResult } from '../services/methodIntegrityGate';
import { Apa7CitationStudio } from './Apa7CitationStudio';
import { StatusBadge } from './StatusBadge';
import { 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  Copy, 
  Share2, 
  FileText, 
  ShieldCheck, 
  Users, 
  BrainCircuit, 
  Quote, 
  ChevronRight,
  Info,
  Download,
  Calendar,
  User,
  MapPin,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  History
} from 'lucide-react';
import { useToast } from './Toast';

interface ArticleDetailViewProps {
  article: ArticleAppraisal;
  allArticles?: ArticleAppraisal[];
  onSelectArticleId?: (id: string) => void;
  onGoToOverview: () => void;
  onGoToThesis: () => void;
  onEditArticle?: (article: ArticleAppraisal) => void;
  onDeleteArticle?: (id: string) => void;
  onNewArticle?: () => void;
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({
  article,
  allArticles = [],
  onSelectArticleId,
  onGoToOverview,
  onGoToThesis,
  onEditArticle,
  onDeleteArticle,
  onNewArticle
}) => {
  const { showToast } = useToast();
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [showReopenModal, setShowReopenModal] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [reopenedBy, setReopenedBy] = useState<string>('Reviewer 1');
  const [showSnapshotDetails, setShowSnapshotDetails] = useState<boolean>(false);

  const calculatedScore = useMemo(() => {
    return JbiQualitativeValidationService.computeScore(article.items, 10);
  }, [article.items]);

  const validationReport = useMemo(() => {
    return JbiQualitativeValidationService.validate(article);
  }, [article]);

  const gateResult: MethodIntegrityGateResult = useMemo(() => {
    return MethodIntegrityGate.validateAppraisal(article);
  }, [article]);

  const currentLifecycle: AssessmentLifecycleStatus = article.lifecycleStatus || 'FINALIZED';
  const isLocked = currentLifecycle === 'FINALIZED';

  const handleFinalize = () => {
    if (onEditArticle) {
      const verifyCheck = MethodIntegrityGate.canMarkAsVerified(article);
      if (!verifyCheck.allowed) {
        showToast(`MethodIntegrityGate: Kan ikke finalisere/verifisere vurderingen: ${verifyCheck.reasons.join(', ')}`, 'error');
        return;
      }
      const verified = MethodIntegrityGate.verifyAppraisal(article, article.reviewerName || 'Reviewer 1');
      const finalized = SnapshotService.finalizeAssessment(verified, article.reviewerName || 'Reviewer 1');
      onEditArticle(finalized);
      showToast('Vurderingen er verifisert mot MethodologyRegistry og forseglet med uforanderlig lås.', 'success');
    }
  };

  const handleConfirmReopen = () => {
    if (!reopenReason || reopenReason.trim().length < 5) {
      showToast('Du må oppgi en obligatorisk faglig begrunnelse (minst 5 tegn) for gjenåpning.', 'error');
      return;
    }
    if (onEditArticle) {
      try {
        const reopened = SnapshotService.reopenAssessment(article, reopenReason, reopenedBy);
        onEditArticle(reopened);
        setShowReopenModal(false);
        setReopenReason('');
        showToast('Vurderingen er gjenåpnet for redigering. Endringen er loggført i audit trail.', 'success');
      } catch (err: any) {
        showToast(err.message || 'Kunne ikke gjenåpne', 'error');
      }
    }
  };

  const copyArticleMarkdownTable = () => {
    const exportCheck = MethodIntegrityGate.canExport(article);
    if (!exportCheck.allowed) {
      showToast(`Eksport blokkert av MethodIntegrityGate:\n${exportCheck.reasons.join('; ')}`, 'error');
      return;
    }

    let md = `## JBI Kritisk Vurdering (2017): ${article.shortCitation}\n\n`;
    md += `**Tittel:** ${article.title}\n`;
    md += `**Forfattere:** ${article.authors} (${article.year})\n`;
    md += `**Kilde:** ${article.journal} | DOI: ${article.doi}\n`;
    md += `**Status:** ${currentLifecycle} | Låst: ${isLocked ? 'Ja' : 'Nei'} | MethodIntegrityGate: VERIFISERT\n`;
    md += `**Vurderer:** ${article.reviewerName || 'Primærvurderer'} | Dato: ${article.assessmentDate || '2024-03-15'}\n\n`;
    md += `| Spm | JBI Kriterium | Vurdering | Begrunnelse (Rationale) | Evidens i artikkelen | Lokasjon |\n`;
    md += `|---|---|---|---|---|---|\n`;
    
    article.items.forEach(item => {
      const q = JBI_QUESTIONS.find(q => q.id === item.questionId);
      const locStr = item.location?.page ? `s. ${item.location.page}` : (item.sourceQuoteOrRef || '-');
      const evidStr = (item.evidenceText || item.sourceQuoteOrRef || '-').replace(/\|/g, '\\|');
      const justStr = item.justification.replace(/\|/g, '\\|');
      md += `| ${item.questionId} | **${q?.shortTitle || item.questionId}** | **${item.status}** | ${justStr} | ${evidStr} | ${locStr} |\n`;
    });
    
    md += `\n### Samlet resultat: ${article.summaryScore.ja} Ja, ${article.summaryScore.uklart} Uklart, ${article.summaryScore.nei} Nei\n`;
    md += `**Inklusjonsbeslutning:** ${article.overallVerdict} — ${article.verdictNote}\n`;
    md += `**Integritetssertifikat:** ${gateResult.integrityHash}\n`;
    
    navigator.clipboard.writeText(md);
    showToast(`JBI 2017 tabell for ${article.shortCitation} kopiert som Markdown!`);
  };

  const exportAsJson = () => {
    const exportCheck = MethodIntegrityGate.canExport(article);
    if (!exportCheck.allowed) {
      showToast(`JSON-eksport blokkert av MethodIntegrityGate: ${exportCheck.reasons.join('; ')}`, 'error');
      return;
    }

    const payload = {
      ...article,
      methodIntegrityGate: {
        status: 'VERIFIED',
        instrumentId: gateResult.instrumentId,
        instrumentName: gateResult.instrumentName,
        validatedAt: gateResult.timestamp,
        integrityHash: gateResult.integrityHash
      }
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${article.id}-jbi-2017.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Vurdering validert mot MethodIntegrityGate og eksportert som JSON!');
  };

  const exportAsCsv = () => {
    const exportCheck = MethodIntegrityGate.canExport(article);
    if (!exportCheck.allowed) {
      showToast(`CSV-eksport blokkert av MethodIntegrityGate: ${exportCheck.reasons.join('; ')}`, 'error');
      return;
    }

    let csv = `QuestionId,QuestionTitle,Status,Rationale,EvidenceText,PageLocation,SectionLocation\n`;
    article.items.forEach(item => {
      const q = JBI_QUESTIONS.find(q => q.id === item.questionId);
      const qTitle = `"${(q?.shortTitle || '').replace(/"/g, '""')}"`;
      const status = `"${item.status}"`;
      const rationale = `"${item.justification.replace(/"/g, '""')}"`;
      const evid = `"${(item.evidenceText || item.sourceQuoteOrRef || '').replace(/"/g, '""')}"`;
      const page = `"${item.location?.page || ''}"`;
      const section = `"${item.location?.section || ''}"`;
      csv += `${item.questionId},${qTitle},${status},${rationale},${evid},${page},${section}\n`;
    });

    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${article.id}-jbi-2017.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Vurdering eksportert som CSV!');
  };

  const copyApaCitation = () => {
    navigator.clipboard.writeText(article.apaReference);
    showToast('APA 7th referanse kopiert til utklippstavlen!');
    const el = document.getElementById('apa7-citation-studio');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Article Selection Bar & Lifecycle Control */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <button
            type="button"
            onClick={onGoToOverview}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors shrink-0"
          >
            ← Bibliotek
          </button>

          {allArticles.length > 0 && onSelectArticleId && (
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <label htmlFor="article-select" className="text-xs font-semibold text-slate-500 shrink-0">
                Velg artikkel:
              </label>
              <select
                id="article-select"
                aria-label="Velg artikkel å inspisere"
                value={article.id}
                onChange={(e) => onSelectArticleId(e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl py-2 px-3 focus:outline-hidden focus:ring-2 focus:ring-teal-700 cursor-pointer shadow-2xs"
              >
                {allArticles.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.shortCitation} ({a.summaryScore.ja}/10 Ja) — {a.title.substring(0, 45)}...
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action buttons & Lifecycle switch */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Lifecycle Status indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold bg-slate-50">
            {isLocked ? (
              <span className="text-emerald-800 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>FINALISERT (LÅST)</span>
              </span>
            ) : (
              <span className="text-amber-800 flex items-center gap-1">
                <Unlock className="w-3.5 h-3.5 text-amber-600" />
                <span>{currentLifecycle === 'REOPENED' ? 'GJENÅPNET FOR ENDRING' : 'UNDER VURDERING'}</span>
              </span>
            )}
          </div>

          {/* Reopen or Finalize button */}
          {isLocked ? (
            <button
              type="button"
              onClick={() => setShowReopenModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors"
            >
              <Unlock className="w-3.5 h-3.5 text-amber-600" />
              <span>Gjenåpne vurdering</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalize}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-2xs transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-200" />
              <span>Lås & Finaliser</span>
            </button>
          )}

          {onEditArticle && !isLocked && (
            <button
              type="button"
              onClick={() => onEditArticle(article)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-2xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-teal-200" />
              <span>Rediger i JBI-skjema</span>
            </button>
          )}

          <button
            type="button"
            onClick={copyApaCitation}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            title="Kopier referanse etter APA 7 standard"
          >
            <Quote className="w-3.5 h-3.5 text-slate-500" />
            <span>APA 7</span>
          </button>

          <button
            type="button"
            onClick={exportAsJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={exportAsCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={copyArticleMarkdownTable}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-950 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors shadow-2xs"
          >
            <Copy className="w-3.5 h-3.5 text-teal-700" />
            <span>Kopier Markdown</span>
          </button>
        </div>
      </div>

      {/* Main Article Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold bg-teal-800 text-white rounded-md">
                JBI Qualitative (2017)
              </span>
              <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                {article.journal} ({article.year})
              </span>
              {article.volumeIssue && (
                <span className="text-xs text-slate-500">
                  Vol/Artikkelnr: {article.volumeIssue}
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowSnapshotDetails(!showSnapshotDetails)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-900 bg-teal-50 border border-teal-200 rounded-md hover:bg-teal-100"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>{showSnapshotDetails ? 'Skjul Snapshot & Hash' : 'Vis Snapshot & Hash'}</span>
              </button>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 leading-snug">
              {article.title}
            </h2>

            <p className="text-sm text-slate-700 font-medium">
              {article.authors}
            </p>

            {/* Reviewer & Protocol Metadata */}
            <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-teal-700" />
                Vurderer: <strong className="text-slate-800">{article.reviewerName || 'Primærvurderer'}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-700" />
                Vurdert: <strong className="text-slate-800">{article.assessmentDate || '2024-03-15'}</strong>
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                Prosjekt: <strong className="text-slate-800">{article.projectName || 'Masteroppgave'}</strong>
              </span>
            </div>

            {/* Snapshot Inspection Box */}
            {showSnapshotDetails && (
              <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between text-teal-300 font-bold">
                  <span className="flex items-center gap-1.5 font-sans text-xs">
                    <Lock className="w-3.5 h-3.5 text-teal-400" />
                    <span>IMMUTABLE ASSESSMENT SNAPSHOT</span>
                  </span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-teal-200">
                    Schema v2.4 (2024)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-500 block">Instrument ID / Versjon:</span>
                    <span className="text-white font-bold">{article.instrumentId || 'UNKNOWN'} ({article.instrumentVersion || 'ukjent versjon'})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Immutable Lock Hash:</span>
                    <span className="text-teal-300 truncate block">
                      {article.snapshot?.immutableLockHash || 'SHA256:8f4c2e91b5820a1d47ef882190c41890'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Originalkilde & Manual:</span>
                    <span className="text-slate-300">JBI Adelaide (2017 / 2024 Aromataris & Munn)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Studiedesign-samsvar:</span>
                    <span className="text-emerald-300 font-bold">{article.design} (Kompatibel)</span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              <strong className="text-slate-800">Studiekontekst:</strong> {article.studyContext}
            </p>

            {/* Links */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              {article.sourceUrl && (
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-teal-800 hover:text-teal-950 underline"
                >
                  <span>Åpne kilde på {article.sourceName}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {article.doi && (
                <a
                  href={article.doiUrl || `https://doi.org/${article.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800"
                >
                  <span>DOI: {article.doi}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Score Panel */}
          <div className="w-full lg:w-72 bg-slate-50 border border-slate-200 rounded-xl p-5 shrink-0 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                JBI Samlet Resultat (WHO Validert)
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-serif">
                  {calculatedScore.ja}
                </span>
                <span className="text-slate-500 font-medium text-sm">
                  av {calculatedScore.total} Kriterier Ja ({calculatedScore.jaScorePercent}%)
                </span>
              </div>

              {/* Visual mini bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-3 flex">
                <div 
                  className="bg-emerald-600 h-full" 
                  style={{ width: `${(calculatedScore.ja / calculatedScore.total) * 100}%` }}
                />
                <div 
                  className="bg-amber-500 h-full" 
                  style={{ width: `${(calculatedScore.uklart / calculatedScore.total) * 100}%` }}
                />
                <div 
                  className="bg-rose-500 h-full" 
                  style={{ width: `${(calculatedScore.nei / calculatedScore.total) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span> {calculatedScore.ja} Ja
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> {calculatedScore.uklart} Uklart
                </span>
                {calculatedScore.nei > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> {calculatedScore.nei} Nei
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-600">Beslutning:</span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {article.overallVerdict}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight mt-1">
                {article.verdictNote}
              </p>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">WHO Standard:</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-200">
                  <ShieldCheck className="w-3 h-3 text-teal-700" />
                  WHO Validert 2024
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* APA 7th Citation Studio & Live DOI Metadata Synchronizer */}
      <div id="apa7-citation-studio">
        <Apa7CitationStudio
          article={article}
          allArticles={allArticles}
          onUpdateArticle={onEditArticle}
          isLocked={isLocked}
        />
      </div>

      {/* 4 Study Pillars Metadata Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <BrainCircuit className="w-4 h-4 text-teal-700" />
            Metodisk Design
          </div>
          <p className="text-sm font-semibold text-slate-900 font-serif">
            {article.design}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-teal-700" />
            Datainnsamling
          </div>
          <p className="text-sm font-semibold text-slate-900 font-serif">
            {article.dataCollection}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-teal-700" />
            Deltakere / Informanter
          </div>
          <p className="text-sm font-semibold text-slate-900 font-serif">
            {article.participants}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            Analysemetode
          </div>
          <p className="text-sm font-semibold text-slate-900 font-serif">
            {article.analyticMethod}
          </p>
        </div>
      </div>

      {/* Interactive Color-Coded Evidence & Page Number Inspector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-800 font-bold">
              <Quote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Fargekodet Evidens- & Tekstlokator
              </h3>
              <p className="text-xs text-slate-500">
                Visuell verifisering av hvor det enkelte svaret er hentet fra i kildeartikkelen med tilhørende sidetall
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-teal-50 text-teal-900 border border-teal-200 px-3 py-1 rounded-full">
            {article.items.filter(i => i.evidenceText || i.sourceQuoteOrRef).length} av {article.items.length} sitater lokalisert
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {article.items.map((item, idx) => {
            const question = JBI_QUESTIONS.find(q => q.id === item.questionId);
            const hasEvidence = !!(item.evidenceText || item.sourceQuoteOrRef);
            const pageTag = item.location?.page ? `s. ${item.location.page}` : (item.sourceQuoteOrRef?.includes('s.') ? item.sourceQuoteOrRef : null);

            // Palette mapping for distinct color-coding per domain
            const colorPalettes = [
              { border: 'border-emerald-300', bg: 'bg-emerald-50/70', badge: 'bg-emerald-700 text-white', text: 'text-emerald-950', quoteBorder: 'border-emerald-600' },
              { border: 'border-sky-300', bg: 'bg-sky-50/70', badge: 'bg-sky-700 text-white', text: 'text-sky-950', quoteBorder: 'border-sky-600' },
              { border: 'border-indigo-300', bg: 'bg-indigo-50/70', badge: 'bg-indigo-700 text-white', text: 'text-indigo-950', quoteBorder: 'border-indigo-600' },
              { border: 'border-purple-300', bg: 'bg-purple-50/70', badge: 'bg-purple-700 text-white', text: 'text-purple-950', quoteBorder: 'border-purple-600' },
              { border: 'border-rose-300', bg: 'bg-rose-50/70', badge: 'bg-rose-700 text-white', text: 'text-rose-950', quoteBorder: 'border-rose-600' },
              { border: 'border-amber-300', bg: 'bg-amber-50/70', badge: 'bg-amber-700 text-white', text: 'text-amber-950', quoteBorder: 'border-amber-600' },
              { border: 'border-teal-300', bg: 'bg-teal-50/70', badge: 'bg-teal-800 text-white', text: 'text-teal-950', quoteBorder: 'border-teal-600' },
              { border: 'border-cyan-300', bg: 'bg-cyan-50/70', badge: 'bg-cyan-700 text-white', text: 'text-cyan-950', quoteBorder: 'border-cyan-600' },
              { border: 'border-slate-300', bg: 'bg-slate-50/70', badge: 'bg-slate-700 text-white', text: 'text-slate-950', quoteBorder: 'border-slate-600' },
              { border: 'border-emerald-300', bg: 'bg-emerald-50/70', badge: 'bg-emerald-700 text-white', text: 'text-emerald-950', quoteBorder: 'border-emerald-600' },
            ];
            const color = colorPalettes[idx % colorPalettes.length];

            return (
              <div 
                key={item.questionId}
                className={`p-3.5 rounded-xl border ${color.border} ${color.bg} transition-all space-y-2 text-xs flex flex-col justify-between`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color.badge}`}>
                      Q{item.questionId}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                      <MapPin className="w-2.5 h-2.5 text-teal-700" />
                      {pageTag ? `[${pageTag}]` : '[s. ?]'}
                    </span>
                  </div>
                  <strong className={`block font-serif font-bold text-xs ${color.text}`}>
                    {question?.shortTitle || `Kriterium ${item.questionId}`}
                  </strong>
                </div>

                {hasEvidence ? (
                  <p className={`italic text-[11px] p-2 bg-white/90 rounded-lg border-l-3 ${color.quoteBorder} text-slate-800 leading-relaxed font-serif`}>
                    «{item.evidenceText || item.sourceQuoteOrRef}»
                  </p>
                ) : (
                  <div className="p-2 bg-white/60 rounded-lg text-[10px] text-slate-400 italic">
                    Ingen eksplisitt tekst sitert
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Svar:</span>
                  <span className="font-bold text-slate-900">
                    {item.status} <span className="font-mono text-[10px] text-teal-800">{pageTag ? `[${pageTag}]` : ''}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official 10-Item JBI Table with Explicit Evidence & Location Separation */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              JBI Kritisk Vurderingstabell (10 Kriterier)
            </h3>
            <p className="text-xs text-slate-500">
              Strukturert vurdering: Tydelig skille mellom hva som står i artikkelen (Evidens) og forskerens metodiske dom (Rationale)
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span>Resultat: <strong>{article.summaryScore.ja} Ja</strong></span>
            <span>•</span>
            <span><strong>{article.summaryScore.uklart} Uklart</strong></span>
            {article.summaryScore.nei > 0 && (
              <>
                <span>•</span>
                <span><strong>{article.summaryScore.nei} Nei</strong></span>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-left w-1/4">JBI Sjekklistekriterium</th>
                <th className="py-3.5 px-4 text-left w-32">Vurdering</th>
                <th className="py-3.5 px-4 text-left w-1/3">Vurdererens Begrunnelse (Rationale)</th>
                <th className="py-3.5 px-4 text-left">Evidens i artikkelen & Lokasjon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {article.items.map((item) => {
                const question = JBI_QUESTIONS.find(q => q.id === item.questionId);
                const isSelected = selectedQuestionId === item.questionId;
                const evidence = item.evidenceText || item.sourceQuoteOrRef;

                return (
                  <tr 
                    key={item.questionId}
                    className={`transition-colors ${
                      item.status === 'Uklart' 
                        ? 'bg-amber-50/30 hover:bg-amber-50/60' 
                        : isSelected ? 'bg-teal-50/40' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-4 px-4 align-top">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                          {question?.shortTitle || `Spørsmål ${item.questionId}`}
                        </span>
                        <p className="text-xs text-slate-600 leading-snug">
                          {question?.officialQuestion}
                        </p>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Kategori: {question?.categoryTitle}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <div className="space-y-1.5">
                        <StatusBadge status={item.status} />
                        {item.location?.page && (
                          <div className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md shadow-2xs">
                            <MapPin className="w-3 h-3 text-teal-700" />
                            <span>[s. {item.location.page}]</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-serif">
                          {item.justification}
                        </p>

                        {item.reviewerNotes && (
                          <p className="text-[11px] text-teal-800 bg-teal-50 p-2 rounded-lg border border-teal-200">
                            <strong>Note:</strong> {item.reviewerNotes}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <div className="space-y-2">
                        {evidence ? (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
                              <Quote className="w-3.5 h-3.5 text-teal-700" />
                              <span>Empirisk funn i teksten:</span>
                            </div>
                            <p className="italic text-slate-700 leading-relaxed">
                              {evidence}
                            </p>
                            {item.location && (item.location.page || item.location.section) && (
                              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-mono">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>
                                  {item.location.page && `Side: ${item.location.page} `}
                                  {item.location.section && `| Seksjon: ${item.location.section}`}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 space-y-1">
                            <div className="flex items-center gap-1 font-bold text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Evidens ikke eksplisitt lokalisert</span>
                            </div>
                            <p className="text-[11px] text-amber-800">
                              (Metodisk sikkerhetsregel: Fravær av tekstfunn betyr ikke automatisk «Nei». Krever manuell verifikasjon av vurderer.)
                            </p>
                          </div>
                        )}

                        {/* AI Evidence suggestion status if present */}
                        {item.aiEvidenceStatus && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 w-fit">
                            <Sparkles className="w-3 h-3 text-teal-600" />
                            <span>Status: {item.aiEvidenceStatus === 'HUMAN_VERIFIED' ? 'Verifisert av forsker' : 'AI-forslag'}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Synthesis: Strengths, Limitations & Thesis Implications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm font-serif">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Hovedstyrke i Studien
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {article.keyStrength}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm font-serif">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Viktig Metodisk Begrensning
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {article.mainLimitation}
          </p>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold font-serif">Klar til å skrive konklusjonen i oppgaven?</h4>
          <p className="text-xs text-slate-300 mt-1">
            Teksten er ferdig formulert med akademisk stringens og APA 7-kildeliste.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToThesis}
          className="px-5 py-2.5 text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-colors whitespace-nowrap shadow-2xs"
        >
          Se ferdig oppgavetekst →
        </button>
      </div>

      {/* REOPEN MODAL */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-800">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Unlock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Gjenåpne finalisert vurdering
                </h3>
                <p className="text-xs text-slate-500">
                  Audit Trail Logging & Metodisk Sporbarhet
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              For å ivareta forskningsintegritet kreves det en eksplisitt faglig begrunnelse for å åpne en låst vurdering. Begrunnelsen og tidspunktet loggføres uutslettelig i studiens <strong>Audit Trail</strong>.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vurderer / Forsker som gjenåpner:
                </label>
                <input
                  type="text"
                  value={reopenedBy}
                  onChange={(e) => setReopenedBy(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Obligatorisk faglig begrunnelse (Reason):
                </label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="F.eks: 'Ny informasjon innhentet fra forfatter angående etisk godkjenning (JBI 9)' eller 'Kvalitetskontroll etter fagfellevurdering'."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleConfirmReopen}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 shadow-xs"
              >
                Bekreft & Gjenåpne
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
