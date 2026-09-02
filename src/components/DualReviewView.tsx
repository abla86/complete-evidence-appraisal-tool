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
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>(() => articles.map(a => a.id));
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedArticleId1, setSelectedArticleId1] = useState<string>(articles[0]?.id || '');
  const [selectedArticleId2, setSelectedArticleId2] = useState<string>(articles[1]?.id || articles[0]?.id || '');
  const [selectedStudyForDual, setSelectedStudyForDual] = useState<string>(articles[0]?.id || '');

  const article1 = articles.find(a => a.id === selectedArticleId1) || articles[0];
  const article2 = articles.find(a => a.id === selectedArticleId2) || articles[1] || articles[0];
  const dualArticle = articles.find(a => a.id === selectedStudyForDual) || articles[0];

  const [consensusDraft, setConsensusDraft] = useState<Record<number, { status: AssessmentStatus; rationale: string }>>(() => {
    const draft: Record<number, { status: AssessmentStatus; rationale: string }> = {};
    if (dualArticle?.items) dualArticle.items.forEach(item => { draft[item.questionId] = { status: item.status, rationale: item.justification }; });
    return draft;
  });
  const [reviewer2Draft, setReviewer2Draft] = useState<Record<number, AssessmentStatus>>({});

  const reviewer2Items = useMemo(() => {
    if (!dualArticle?.items) return [];
    return dualArticle.items.map(it => ({ ...it, status: reviewer2Draft[it.questionId] || 'Uklart', justification: reviewer2Draft[it.questionId] ? 'Reviewer 2: uavhengig vurdering registrert.' : 'Reviewer 2: ikke vurdert ennå.' }));
  }, [dualArticle, reviewer2Draft]);

  const handleReviewer2StatusChange = (qId: number, status: AssessmentStatus) => setReviewer2Draft(prev => ({ ...prev, [qId]: JbiQualitativeValidationService.normalizeStatus(status) }));
  const reviewer2Complete = !!dualArticle?.items?.length && dualArticle.items.every(item => Boolean(reviewer2Draft[item.questionId]));
  const agreement = useMemo(() => dualArticle?.items ? JbiQualitativeValidationService.calculateInterRaterAgreement(dualArticle.items, reviewer2Items) : null, [dualArticle, reviewer2Items]);

  const handleStatusChange = (qId: number, status: AssessmentStatus) => setConsensusDraft(prev => ({ ...prev, [qId]: { ...prev[qId], status: JbiQualitativeValidationService.normalizeStatus(status) } }));
  const handleRationaleChange = (qId: number, rationale: string) => setConsensusDraft(prev => ({ ...prev, [qId]: { ...prev[qId], rationale } }));

  const handleSaveConsensus = () => {
    if (!reviewer2Complete) { showToast('Reviewer 2 må vurdere alle kriterier før konsensus kan registreres.', 'warning'); return; }
    try { confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } }); } catch { /* optional visual effect */ }
    showToast(`Konsensusvedtak registrert for ${dualArticle?.shortCitation || 'studien'}!`, 'success');
  };

  const toggleSelectArticle = (id: string) => setSelectedArticleIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const selectAllArticles = () => setSelectedArticleIds(articles.map(a => a.id));
  const clearSelection = () => { if (articles.length > 0) setSelectedArticleIds([articles[0].id]); };

  const filteredMultiArticles = useMemo(() => articles.filter(a => selectedArticleIds.includes(a.id)).filter(a => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.authors.toLowerCase().includes(q) || a.design.toLowerCase().includes(q) || Boolean(a.methodology?.toLowerCase().includes(q));
  }), [articles, selectedArticleIds, searchTerm]);

  const renderReviewer2Controls = () => {
    if (!dualArticle?.items) return null;
    return <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"><div><h3 className="font-bold text-slate-900">Reviewer 2 — uavhengig vurdering</h3><p className="text-xs text-slate-600">Reviewer 2 registreres separat. Dette hindrer kunstig høy inter-rater agreement.</p></div>{dualArticle.items.map(item => <div key={item.questionId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50"><span className="text-xs font-semibold">Q{item.questionId}. {item.questionTitle}</span><select value={reviewer2Draft[item.questionId] || ''} onChange={e => handleReviewer2StatusChange(item.questionId, e.target.value as AssessmentStatus)} className="text-xs border rounded-lg px-2 py-1.5 bg-white"><option value="">Ikke vurdert</option><option value="Ja">Ja</option><option value="Ja, med forbehold">Ja, med forbehold</option><option value="Nei">Nei</option><option value="Uklart">Uklart</option><option value="Ikke relevant">Ikke relevant</option></select></div>)}</div>;
  };

  return <div className="space-y-6 pb-12">
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><h2 className="text-lg font-bold text-slate-900">Dual Review & Sammenligning</h2><p className="text-sm text-slate-600">Uavhengig vurdering, konsensus og metodisk sammenligning.</p></div>
      <div className="flex flex-wrap gap-2"><button onClick={() => setActiveSubMode('multi_matrix')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${activeSubMode === 'multi_matrix' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>Multi-matrise</button><button onClick={() => setActiveSubMode('side_by_side')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${activeSubMode === 'side_by_side' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>Side-by-side</button><button onClick={() => setActiveSubMode('dual_review')} className={`px-3 py-2 rounded-lg text-xs font-semibold ${activeSubMode === 'dual_review' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>Dual review</button></div>
    </div>

    {activeSubMode === 'dual_review' && <div className="space-y-4"><div className="bg-white border border-slate-200 rounded-2xl p-5"><label className="text-xs font-semibold text-slate-600">Studie</label><select value={selectedStudyForDual} onChange={e => setSelectedStudyForDual(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">{articles.map(a => <option key={a.id} value={a.id}>{a.shortCitation} — {a.title}</option>)}</select></div>{renderReviewer2Controls()}{agreement && <div className="bg-slate-900 text-white rounded-2xl p-5"><div className="text-sm font-bold">Inter-rater agreement</div><div className="mt-1 text-xs opacity-80">Sammenligning beregnes separat fra Reviewer 2s uavhengige registrering.</div><div className="mt-3 text-2xl font-black">{agreement.agreementPercentage}%</div></div>}<button onClick={handleSaveConsensus} disabled={!reviewer2Complete} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-40">Registrer konsensus</button></div>}

    {activeSubMode === 'multi_matrix' && <div className="space-y-4"><div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-2"><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Søk i studier..." className="flex-1 min-w-[220px] border rounded-lg px-3 py-2 text-sm" /><button onClick={selectAllArticles} className="px-3 py-2 rounded-lg bg-slate-100 text-xs font-semibold">Velg alle</button><button onClick={clearSelection} className="px-3 py-2 rounded-lg bg-slate-100 text-xs font-semibold">Nullstill</button></div><div className="overflow-auto bg-white border border-slate-200 rounded-2xl"><table className="min-w-[900px] w-full text-xs"><thead><tr className="bg-slate-50 text-left"><th className="p-3">Studie</th><th className="p-3">Design</th><th className="p-3">Metodologi</th><th className="p-3">Utvalg</th><th className="p-3">Vurdering</th></tr></thead><tbody>{filteredMultiArticles.map(a => { const score = JbiQualitativeValidationService.computeScore(a.items, 10); return <tr key={a.id} className="border-t"><td className="p-3"><label className="flex gap-2 items-start"><input type="checkbox" checked={selectedArticleIds.includes(a.id)} onChange={() => toggleSelectArticle(a.id)} /><span><strong>{a.shortCitation}</strong><br />{a.title}</span></label></td><td className="p-3">{a.design}</td><td className="p-3">{a.methodology}</td><td className="p-3">{a.participants}</td><td className="p-3">{score.ja}/10</td></tr>; })}</tbody></table></div></div>}

    {activeSubMode === 'side_by_side' && <div className="grid md:grid-cols-2 gap-4">{[{ article: article1, setter: setSelectedArticleId1, value: selectedArticleId1 }, { article: article2, setter: setSelectedArticleId2, value: selectedArticleId2 }].map((slot, index) => <div key={index} className="bg-white border border-slate-200 rounded-2xl p-5"><select value={slot.value} onChange={e => slot.setter(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mb-4">{articles.map(a => <option key={a.id} value={a.id}>{a.shortCitation} — {a.title}</option>)}</select>{slot.article ? <><h3 className="font-bold text-slate-900">{slot.article.title}</h3><p className="text-xs text-slate-600 mt-2">{slot.article.authors} ({slot.article.year})</p><p className="text-sm mt-4">{slot.article.methodology || slot.article.design}</p><p className="text-xs text-slate-500 mt-3">{slot.article.participants}</p></> : <p className="text-sm text-slate-500">Ingen studie valgt.</p>}</div>)}</div>}
  </div>;
};

export default DualReviewView;
