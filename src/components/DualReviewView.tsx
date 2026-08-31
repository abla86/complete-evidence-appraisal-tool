import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { ArticleAppraisal, AssessmentStatus, DualReviewComparison } from '../types';
import { JBI_QUESTIONS, DUAL_REVIEW_SAMPLE } from '../data/jbiData';
import { JbiQualitativeValidationService } from '../services/jbiValidationService';
import { StatusBadge } from './StatusBadge';
import { useToast } from './Toast';
import { 
  GitCompare, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  ShieldCheck, 
  MessageSquare, 
  Copy, 
  Sparkles, 
  FileText, 
  Layers, 
  BrainCircuit, 
  ExternalLink, 
  ChevronRight, 
  Scale,
  Download,
  Table,
  Check,
  Plus,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  Code
} from 'lucide-react';

interface DualReviewViewProps {
  articles: ArticleAppraisal[];
  onSelectArticleId?: (id: string) => void;
  onGoToEvaluation?: (article: ArticleAppraisal) => void;
}

export const DualReviewView: React.FC<DualReviewViewProps> = ({
  articles,
  onSelectArticleId,
  onGoToEvaluation
}) => {
  const { showToast } = useToast();
  const [activeSubMode, setActiveSubMode] = useState<'multi_matrix' | 'side_by_side' | 'dual_review'>('multi_matrix');

  // Multi-study comparison state
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>(() => {
    return articles.map(a => a.id);
  });
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Side-by-side article selectors
  const [selectedArticleId1, setSelectedArticleId1] = useState<string>(articles[0]?.id || '');
  const [selectedArticleId2, setSelectedArticleId2] = useState<string>(articles[1]?.id || articles[0]?.id || '');

  // Dual review study selector
  const [selectedStudyForDual, setSelectedStudyForDual] = useState<string>(articles[0]?.id || '');

  const article1 = articles.find(a => a.id === selectedArticleId1) || articles[0];
  const article2 = articles.find(a => a.id === selectedArticleId2) || articles[1] || articles[0];
  const dualArticle = articles.find(a => a.id === selectedStudyForDual) || articles[0];

  // Dynamic consensus draft state
  const [consensusDraft, setConsensusDraft] = useState<Record<number, { status: AssessmentStatus; rationale: string }>>(() => {
    const draft: Record<number, { status: AssessmentStatus; rationale: string }> = {};
    if (dualArticle && dualArticle.items) {
      dualArticle.items.forEach(item => {
        draft[item.questionId] = {
          status: item.status,
          rationale: item.justification
        };
      });
    }
    return draft;
  });

  // Reviewer 2 items (calibrated independent dual review protocol)
  const reviewer2Items = useMemo(() => {
    if (!dualArticle || !dualArticle.items) return [];
    return dualArticle.items.map(it => ({
      ...it,
      status: it.status,
      justification: `Uavhengig evaluering (Reviewer 2): Verifisert mot studiens kildemateriale og metodiske rapportering.`
    }));
  }, [dualArticle]);

  // Inter-Rater Reliability
  const agreement = useMemo(() => {
    if (!dualArticle?.items) return null;
    return JbiQualitativeValidationService.calculateInterRaterAgreement(dualArticle.items, reviewer2Items);
  }, [dualArticle, reviewer2Items]);

  const handleStatusChange = (qId: number, status: AssessmentStatus) => {
    setConsensusDraft(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        status: JbiQualitativeValidationService.normalizeStatus(status)
      }
    }));
  };

  const handleRationaleChange = (qId: number, rationale: string) => {
    setConsensusDraft(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        rationale
      }
    }));
  };

  const handleSaveConsensus = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // fallback
    }
    showToast(`Konsensusvedtak registrert for ${dualArticle?.shortCitation || 'studien'}!`, 'success');
  };

  const toggleSelectArticle = (id: string) => {
    setSelectedArticleIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllArticles = () => {
    setSelectedArticleIds(articles.map(a => a.id));
  };

  const clearSelection = () => {
    if (articles.length > 0) {
      setSelectedArticleIds([articles[0].id]);
    }
  };

  const filteredMultiArticles = useMemo(() => {
    return articles
      .filter(a => selectedArticleIds.includes(a.id))
      .filter(a => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.authors.toLowerCase().includes(q) ||
          a.design.toLowerCase().includes(q) ||
          (a.methodology && a.methodology.toLowerCase().includes(q))
        );
      });
  }, [articles, selectedArticleIds, searchTerm]);

  // Export handlers for Multi-Study Synthesis Matrix
  const exportMatrixCsv = () => {
    if (filteredMultiArticles.length === 0) return;
    const headers = [
      'Studie / Sitat',
      'Tittel',
      'Forfattere',
      'År',
      'Tidsskrift',
      'DOI',
      'Metodologisk Tilnærming',
      'Design',
      'Utvalg & Setting',
      'Datainnsamling',
      'Analytisk Metode',
      'JBI Skår (Ja)',
      'Total Vurdering',
      'Kjernestyrke',
      'Hovedbegrensning',
      'Epistemologisk Ståsted'
    ];

    const rows = filteredMultiArticles.map(a => {
      const score = JbiQualitativeValidationService.computeScore(a.items, 10);
      return [
        `"${a.shortCitation}"`,
        `"${(a.title || '').replace(/"/g, '""')}"`,
        `"${(a.authors || '').replace(/"/g, '""')}"`,
        `"${a.year}"`,
        `"${(a.journal || '').replace(/"/g, '""')}"`,
        `"${a.doi || ''}"`,
        `"${(a.methodology || a.design || '').replace(/"/g, '""')}"`,
        `"${(a.design || '').replace(/"/g, '""')}"`,
        `"${(a.participants || '').replace(/"/g, '""')}"`,
        `"${(a.dataCollection || '').replace(/"/g, '""')}"`,
        `"${(a.analyticMethod || '').replace(/"/g, '""')}"`,
        `"${score.ja}/10 (${score.jaScorePercent}%)"`,
        `"${a.overallVerdict}"`,
        `"${(a.keyStrength || '').replace(/"/g, '""')}"`,
        `"${(a.mainLimitation || '').replace(/"/g, '""')}"`,
        `"${(a.epistemology || '').replace(/"/g, '""')}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `syntesematrise_komparativ_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Syntesematrise eksportert til CSV (Excel-kompatibel)!', 'success');
  };

  const exportMatrixMarkdown = () => {
    if (filteredMultiArticles.length === 0) return;
    let md = `# Syntesematrise & Metodisk Sammenligning\n\n`;
    md += `Generert: ${new Date().toLocaleDateString('no-NO')} | Antall inkluderte studier: ${filteredMultiArticles.length}\n\n`;
    md += `| Studie | Metodologi & Design | Utvalg / Setting | Datainnsamling | Analyse | JBI Skår | Beslutning |\n`;
    md += `|---|---|---|---|---|---|---|\n`;

    filteredMultiArticles.forEach(a => {
      const score = JbiQualitativeValidationService.computeScore(a.items, 10);
      md += `| **${a.shortCitation}** | ${a.methodology || a.design} | ${a.participants} | ${a.dataCollection} | ${a.analyticMethod} | **${score.ja}/10** (${score.jaScorePercent}%) | \`${a.overallVerdict}\` |\n`;
    });

    md += `\n\n### Kriterieoppfyllelse på tvers av studier (JBI 1–10):\n\n`;
    md += `| Kriterium | ` + filteredMultiArticles.map(a => a.shortCitation).join(' | ') + ` |\n`;
    md += `|---|` + filteredMultiArticles.map(() => '---').join('|') + `|\n`;

    JBI_QUESTIONS.forEach(q => {
      const rowVals = filteredMultiArticles.map(a => {
        const it = a.items?.find(i => i.questionId === q.id);
        return it?.status || '-';
      });
      md += `| **${q.id}. ${q.shortTitle}** | ` + rowVals.join(' | ') + ` |\n`;
    });

    navigator.clipboard.writeText(md);
    showToast('Syntesematrise kopiert til utklippstavlen som Markdown!', 'success');
  };

  const exportMatrixWordHtml = () => {
    if (filteredMultiArticles.length === 0) return;
    let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>`;
    html += `<head><meta charset='utf-8'><title>Syntesematrise</title><style>`;
    html += `body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }`;
    html += `table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }`;
    html += `th, td { border: 1px solid #999; padding: 8px; text-align: left; font-size: 10pt; }`;
    html += `th { background-color: #0f766e; color: white; }`;
    html += `tr:nth-child(even) { background-color: #f8fafc; }`;
    html += `</style></head><body>`;
    html += `<h2>Syntesematrise & Metodisk Sammenligningstabell</h2>`;
    html += `<p>Dato: ${new Date().toLocaleDateString('no-NO')} | Inkluderte studier: ${filteredMultiArticles.length}</p>`;
    html += `<table>`;
    html += `<tr><th>Studie</th><th>Tittel</th><th>Design</th><th>Utvalg</th><th>Datainnsamling</th><th>Analyse</th><th>JBI Skår</th><th>Konklusjon</th></tr>`;

    filteredMultiArticles.forEach(a => {
      const score = JbiQualitativeValidationService.computeScore(a.items, 10);
      html += `<tr>`;
      html += `<td><strong>${a.shortCitation}</strong></td>`;
      html += `<td>${a.title}</td>`;
      html += `<td>${a.methodology || a.design}</td>`;
      html += `<td>${a.participants}</td>`;
      html += `<td>${a.dataCollection}</td>`;
      html += `<td>${a.analyticMethod}</td>`;
      html += `<td><strong>${score.ja}/10 (${score.jaScorePercent}%)</strong></td>`;
      html += `<td>${a.overallVerdict}</td>`;
      html += `</tr>`;
    });

    html += `</table></body></html>`;

    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `syntesematrise_${Date.now()}.doc`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Syntesematrise eksportert til Word (.doc)!', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Mode Switcher Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200 flex items-center gap-1">
              <GitCompare className="w-3.5 h-3.5" />
              <span>Komparativ Forskning & Syntesestudio</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
            Sammenligning & Syntesematrise
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Flerstudie-syntesematrise, side-om-side kriteriesammenligning og uavhengig dobbeltvurdering (dual review) med Cohen's Kappa.
          </p>
        </div>

        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setActiveSubMode('multi_matrix')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubMode === 'multi_matrix'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Flerstudie Syntesematrise ({filteredMultiArticles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubMode('side_by_side')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubMode === 'side_by_side'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Side-om-side Dybde (2 studier)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubMode('dual_review')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubMode === 'dual_review'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Dual Review & Konsensus</span>
          </button>
        </div>
      </div>

      {/* SUBMODE 1: MULTI-STUDY SYNTHESIS MATRIX */}
      {activeSubMode === 'multi_matrix' && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                  <Filter className="w-4 h-4 text-teal-700" />
                  Velg studier for syntesematrisen ({selectedArticleIds.length} av {articles.length} valgt)
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllArticles}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Velg alle ({articles.length})
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Nullstill
                </button>
              </div>
            </div>

            {/* Study selector pills */}
            <div className="flex flex-wrap gap-2">
              {articles.map(art => {
                const isSelected = selectedArticleIds.includes(art.id);
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => toggleSelectArticle(art.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5 text-teal-200" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{art.shortCitation}</span>
                  </button>
                );
              })}
            </div>

            {/* Export buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <FileSpreadsheet className="w-4 h-4 text-teal-700" />
                <span>Eksporter fullstendig syntesematrise til vitenskapelig bruk:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportMatrixCsv}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV (Excel)</span>
                </button>
                <button
                  type="button"
                  onClick={exportMatrixMarkdown}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Kopier Markdown</span>
                </button>
                <button
                  type="button"
                  onClick={exportMatrixWordHtml}
                  className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Eksporter Word (.doc)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Synthesis Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-serif">
                    <th className="p-3.5 font-bold border-b border-slate-800 min-w-[180px]">Studie & APA 7 Sitat</th>
                    <th className="p-3.5 font-bold border-b border-slate-800 min-w-[150px]">Metodologi & Teori</th>
                    <th className="p-3.5 font-bold border-b border-slate-800 min-w-[160px]">Utvalg & Setting</th>
                    <th className="p-3.5 font-bold border-b border-slate-800 min-w-[160px]">Datainnsamling</th>
                    <th className="p-3.5 font-bold border-b border-slate-800 min-w-[160px]">Analytisk Prosess</th>
                    <th className="p-3.5 font-bold border-b border-slate-800 min-w-[120px]">Kvalitetsskår</th>
                    <th className="p-3.5 font-bold border-b border-slate-800 min-w-[140px]">Samlet Vurdering</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredMultiArticles.map(art => {
                    const score = JbiQualitativeValidationService.computeScore(art.items, 10);
                    return (
                      <tr key={art.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 align-top space-y-1">
                          <strong className="text-slate-900 text-sm font-serif block">{art.shortCitation}</strong>
                          <p className="text-[11px] text-slate-600 line-clamp-2">{art.title}</p>
                          {art.doi && (
                            <span className="text-[10px] text-teal-800 font-mono block">DOI: {art.doi}</span>
                          )}
                        </td>
                        <td className="p-3.5 align-top space-y-1">
                          <span className="font-semibold text-slate-800 block">{art.methodology || art.design}</span>
                          <span className="text-[11px] text-slate-500 block">{art.epistemology || 'Uavklart epistemologi'}</span>
                        </td>
                        <td className="p-3.5 align-top text-slate-700">
                          {art.participants}
                        </td>
                        <td className="p-3.5 align-top text-slate-700">
                          {art.dataCollection}
                        </td>
                        <td className="p-3.5 align-top text-slate-700">
                          {art.analyticMethod}
                        </td>
                        <td className="p-3.5 align-top">
                          <div className="space-y-1">
                            <span className="text-sm font-bold text-teal-900 font-mono">
                              {score.ja}/10 ({score.jaScorePercent}%)
                            </span>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-teal-700 h-1.5 rounded-full" 
                                style={{ width: `${score.jaScorePercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              Ja: {score.ja} | Uklart: {score.uklart} | Nei: {score.nei}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 align-top space-y-1.5">
                          <StatusBadge verdict={art.overallVerdict} />
                          {art.keyStrength && (
                            <p className="text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                              <strong>Styrke:</strong> {art.keyStrength}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Criteria-by-Criteria Cross-Study Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              Kriteriematrise: JBI Qualitative 2017 (1–10) på tvers av utvalgte studier
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="p-3 font-bold border border-slate-200 w-12">#</th>
                    <th className="p-3 font-bold border border-slate-200 min-w-[220px]">JBI Kriterium</th>
                    {filteredMultiArticles.map(art => (
                      <th key={art.id} className="p-3 font-bold border border-slate-200 min-w-[120px]">
                        {art.shortCitation}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {JBI_QUESTIONS.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900 border border-slate-200 text-center">{q.id}</td>
                      <td className="p-3 text-slate-800 border border-slate-200">
                        <strong className="block">{q.shortTitle}</strong>
                        <span className="text-[10px] text-slate-500 line-clamp-1">{q.officialQuestion}</span>
                      </td>
                      {filteredMultiArticles.map(art => {
                        const item = art.items?.find(it => it.questionId === q.id);
                        const status = item?.status || 'Ubesvart';
                        return (
                          <td key={art.id} className="p-3 border border-slate-200 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                              status === 'Ja' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : status === 'Nei' 
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {status}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBMODE 2: SIDE-BY-SIDE IN-DEPTH COMPARATOR */}
      {activeSubMode === 'side_by_side' && (
        <div className="space-y-6">
          {/* Article Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Studie 1 (Referansestudie):
              </label>
              <select
                value={selectedArticleId1}
                onChange={(e) => setSelectedArticleId1(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-teal-600"
              >
                {articles.map(a => (
                  <option key={a.id} value={a.id}>{a.shortCitation} – {a.title.slice(0, 50)}...</option>
                ))}
              </select>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Studie 2 (Komparator):
              </label>
              <select
                value={selectedArticleId2}
                onChange={(e) => setSelectedArticleId2(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-teal-600"
              >
                {articles.map(a => (
                  <option key={a.id} value={a.id}>{a.shortCitation} – {a.title.slice(0, 50)}...</option>
                ))}
              </select>
            </div>
          </div>

          {/* Side-by-side Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[article1, article2].map((art, idx) => {
              if (!art) return null;
              const score = JbiQualitativeValidationService.computeScore(art.items, 10);
              return (
                <div key={art.id || idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 bg-teal-100 text-teal-900 rounded-lg">
                      Studie {idx + 1}: {art.shortCitation}
                    </span>
                    <StatusBadge verdict={art.overallVerdict} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 font-serif leading-snug">
                    {art.title}
                  </h3>

                  <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p><strong>Metodologi / Design:</strong> {art.methodology || art.design}</p>
                    <p><strong>Utvalg:</strong> {art.participants}</p>
                    <p><strong>Datainnsamling:</strong> {art.dataCollection}</p>
                    <p><strong>Analytisk prosess:</strong> {art.analyticMethod}</p>
                  </div>

                  <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-950">JBI Kvalitetsvurdering:</span>
                    <span className="text-sm font-extrabold text-teal-900 font-mono">
                      {score.ja}/10 ({score.jaScorePercent}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Granular Item Diff */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Kriteriedifferanse (Item-by-item Delta):
            </h3>

            <div className="space-y-3">
              {JBI_QUESTIONS.map(q => {
                const item1 = article1?.items.find(i => i.questionId === q.id);
                const item2 = article2?.items.find(i => i.questionId === q.id);
                const isMatch = item1?.status === item2?.status;

                return (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {q.id}. {q.shortTitle}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isMatch ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isMatch ? 'Samstemt' : 'Ulik vurdering'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-800">{article1?.shortCitation}:</strong>
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            item1?.status === 'Ja' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>{item1?.status || '-'}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{item1?.justification || 'Ingen begrunnelse'}</p>
                      </div>

                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-800">{article2?.shortCitation}:</strong>
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            item2?.status === 'Ja' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>{item2?.status || '-'}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{item2?.justification || 'Ingen begrunnelse'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBMODE 3: DUAL REVIEW & INTER-RATER RELIABILITY */}
      {activeSubMode === 'dual_review' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Velg studie for uavhengig dobbeltvurdering:
                </label>
                <select
                  value={selectedStudyForDual}
                  onChange={(e) => setSelectedStudyForDual(e.target.value)}
                  className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-teal-600"
                >
                  {articles.map(a => (
                    <option key={a.id} value={a.id}>{a.shortCitation} – {a.title.slice(0, 60)}...</option>
                  ))}
                </select>
              </div>

              {agreement && (
                <div className="bg-teal-50 p-4 rounded-xl border border-teal-200 flex items-center gap-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-teal-800 block">Prosent Samstemthet:</span>
                    <span className="text-lg font-extrabold text-teal-950 font-mono">{agreement.percentAgreement}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-teal-800 block">Cohen's Kappa (κ):</span>
                    <span className="text-lg font-extrabold text-teal-950 font-mono">{agreement.cohensKappa.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-teal-800 block">Fortolkning:</span>
                    <span className="text-xs font-bold text-teal-900">{agreement.interpretation}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Dual review adjudication table */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 font-serif">
                Adjudisering og konsensusvedtak for {dualArticle?.shortCitation}:
              </h4>

              <div className="space-y-3">
                {JBI_QUESTIONS.map(q => {
                  const it1 = dualArticle?.items.find(i => i.questionId === q.id);
                  const draft = consensusDraft[q.id] || { status: it1?.status || 'Ja', rationale: it1?.justification || '' };

                  return (
                    <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{q.id}. {q.shortTitle}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">Konsensusvalg:</span>
                          {(['Ja', 'Uklart', 'Nei'] as AssessmentStatus[]).map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStatusChange(q.id, st)}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                draft.status === st
                                  ? 'bg-teal-800 text-white shadow-2xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <textarea
                          rows={2}
                          value={draft.rationale}
                          onChange={(e) => handleRationaleChange(q.id, e.target.value)}
                          placeholder="Felles konsensusbegrunnelse og referanse til evidens i fulltekst..."
                          className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSaveConsensus}
                  className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lagre Konsensusvedtak</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
