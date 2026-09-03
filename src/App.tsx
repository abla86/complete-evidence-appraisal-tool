import React, { useEffect, useState } from 'react';
import { JBI_QUESTIONS } from './data/jbiData';
import { ArticleAppraisal, AssessmentStatus, JBIEvaluationItem } from './types';
import { generateArticleId, generateAuditId } from './services/idGenerator';
import { AutosaveService } from './services/autosaveService';
import { Header, ActiveTab } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { ArticleDetailView } from './components/ArticleDetailView';
import { JbiAssessmentForm } from './components/JbiAssessmentForm';
import { DualReviewView } from './components/DualReviewView';
import { UniversalDualReviewPanel } from './components/UniversalDualReviewPanel';
import { PeerReviewStudioView } from './components/PeerReviewStudioView';
import { AuditTrailView } from './components/AuditTrailView';
import { ThesisReadyView } from './components/ThesisReadyView';
import { WhoValidationHubView } from './components/WhoValidationHubView';
import { MethodologyAuditView } from './components/MethodologyAuditView';
import { MetaResearchLabView } from './components/MetaResearchLabView';
import { ReferenceLibraryView } from './components/ReferenceLibraryView';
import { ValidationDashboardView } from './components/ValidationDashboardView';
import { ResearchSearchView } from './components/ResearchSearchView';
import { HelpAndExamplesView } from './components/HelpAndExamplesView';
import { SourceRecordWorkflowView } from './components/SourceRecordWorkflowView';
import { DocumentAnalysisModal } from './components/DocumentAnalysisModal';
import { ImportExportModal } from './components/ImportExportModal';
import { AutosaveModal } from './components/AutosaveModal';
import { GdprPrivacyCenterModal } from './components/GdprPrivacyCenterModal';
import { ReferenceHubView } from './components/ReferenceHubView';
import { WritingStudioView } from './components/WritingStudioView';
import { UniversalAppraisalView } from './components/UniversalAppraisalView';
import { PipelineDashboard } from './components/PipelineDashboard';
import { ToastProvider } from './components/Toast';
import { UserRole } from './services/rbacService';
import { GraduationCap, PlusCircle } from 'lucide-react';
import { createReferenceRecord, type ReferenceRecord } from './services/referenceHubService';
import { loadReferenceLibrary, saveReferenceLibrary } from './services/referenceLibraryStore';
import { loadAppraisalSessions, upsertAppraisalSession } from './services/appraisalSessionStore';
import type { AppraisalSession } from './services/universalAppraisalService';
import { EvidencePipelineService, type EvidencePipelineState } from './services/evidencePipelineService';

function createBlankJbiItems(defaultStatus: AssessmentStatus = 'Uklart', defaultJustification = ''): JBIEvaluationItem[] {
  return JBI_QUESTIONS.map(q => ({ questionId: q.id, status: defaultStatus, justification: defaultJustification, evidenceText: '', sourceQuoteOrRef: '', location: { page: '', section: '' } }));
}

function articleToReference(article: ArticleAppraisal): ReferenceRecord {
  return createReferenceRecord({
    id: article.id,
    kind: 'JOURNAL_ARTICLE',
    title: article.title,
    authors: article.authors,
    year: article.year,
    journal: article.journal,
    volume: article.volumeIssue?.split('(')[0]?.trim(),
    issue: article.volumeIssue?.match(/\((.*?)\)/)?.[1],
    pages: article.pages,
    doi: article.doi,
    url: article.sourceUrl,
    importedFrom: ['JSON'],
    tags: [],
    collections: ['Evidence Appraisal Workspace'],
  });
}

export default function App() {
  const [articles, setArticles] = useState<ArticleAppraisal[]>(() => AutosaveService.loadArticles([]));
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>('jbi-qualitative-2017');
  const [selectedArticleId, setSelectedArticleId] = useState<string>(() => { const loaded = AutosaveService.loadArticles([]); return loaded[0]?.id || ''; });
  const [editingArticle, setEditingArticle] = useState<ArticleAppraisal | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('lead_reviewer');
  const [isPrivacyCenterOpen, setIsPrivacyCenterOpen] = useState(false);
  const [isDocAnalysisOpen, setIsDocAnalysisOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isAutosaveModalOpen, setIsAutosaveModalOpen] = useState(false);
  const [importExportInitialTab, setImportExportInitialTab] = useState<'import' | 'export'>('export');
  const [referenceRecords, setReferenceRecords] = useState<ReferenceRecord[]>(() => loadReferenceLibrary([]));
  const [appraisalSessions, setAppraisalSessions] = useState<AppraisalSession[]>(() => loadAppraisalSessions());
  const [pipelineState, setPipelineState] = useState<EvidencePipelineState>(() => new EvidencePipelineService().create('workspace'));

  useEffect(() => { AutosaveService.saveArticles(articles); }, [articles]);
  useEffect(() => { saveReferenceLibrary(referenceRecords); }, [referenceRecords]);

  const handleOpenImportExport = (tab: 'import' | 'export' = 'export') => { setImportExportInitialTab(tab); setIsImportExportOpen(true); };
  const handleImportArticles = (importedArticles: ArticleAppraisal[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      const seenIds = new Set<string>();
      const sanitized = importedArticles.map(art => { let uniqueId = art.id; if (!uniqueId || seenIds.has(uniqueId)) uniqueId = generateArticleId('art'); seenIds.add(uniqueId); return { ...art, id: uniqueId }; });
      setArticles(sanitized); if (sanitized.length) setSelectedArticleId(sanitized[0].id);
    } else {
      const existingIds = new Set(articles.map(p => p.id)); const newItems: ArticleAppraisal[] = [];
      importedArticles.forEach(item => { let uniqueId = item.id; if (!uniqueId || existingIds.has(uniqueId)) uniqueId = generateArticleId('art'); existingIds.add(uniqueId); newItems.push({ ...item, id: uniqueId }); });
      setArticles(prev => [...newItems, ...prev]); if (newItems.length) setSelectedArticleId(newItems[0].id);
    }
  };
  const handleSelectArticle = (id: string) => { setSelectedArticleId(id); setActiveTab('details'); };
  const handleEditArticle = (article: ArticleAppraisal) => { setEditingArticle(article); setSelectedArticleId(article.id); setActiveTab('evaluate'); };
  const handleNewArticle = () => { setEditingArticle(null); setActiveTab('evaluate'); };
  const handleSaveArticle = (savedArticle: ArticleAppraisal) => { setArticles(prev => { const idx = prev.findIndex(a => a.id === savedArticle.id); if (idx >= 0) { const next = [...prev]; next[idx] = savedArticle; return next; } return [savedArticle, ...prev]; }); setSelectedArticleId(savedArticle.id); setEditingArticle(null); setActiveTab('details'); };
  const currentArticle = articles.find(a => a.id === selectedArticleId) || articles[0];

  useEffect(() => {
    setReferenceRecords(prev => {
      const byId = new Map(prev.map(record => [record.id, record]));
      for (const article of articles) if (!byId.has(article.id)) byId.set(article.id, articleToReference(article));
      return Array.from(byId.values());
    });
  }, [articles]);

  const handleReferenceChange = (records: ReferenceRecord[]) => {
    setReferenceRecords(records);
    setArticles(current => current.map(article => {
      const reference = records.find(r => r.id === article.id);
      if (!reference) return article;
      return { ...article, doi: reference.doi || article.doi, doiUrl: reference.doi ? `https://doi.org/${reference.doi}` : article.doiUrl, journal: reference.journal || article.journal, pages: reference.pages || article.pages, apaReference: article.apaReference };
    }));
  };

  const saveAppraisalSession = (session: AppraisalSession) => {
    setAppraisalSessions(upsertAppraisalSession(session));
  };

  const actor = { id: currentUserRole === 'lead_reviewer' ? 'lead-reviewer' : currentUserRole, role: currentUserRole } as const;
  const pipelineProjectId = selectedArticleId || pipelineState.projectId;
  const appraisalReviewerId = actor.id;

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} articles={articles} selectedArticleId={selectedArticleId} onSelectArticleId={setSelectedArticleId} selectedInstrumentId={selectedInstrumentId} onSelectInstrument={setSelectedInstrumentId} currentUserRole={currentUserRole} onSelectUserRole={setCurrentUserRole} onOpenPrivacyCenter={() => setIsPrivacyCenterOpen(true)} onOpenDocAnalysis={() => setIsDocAnalysisOpen(true)} onOpenImportExport={handleOpenImportExport} onOpenAutosave={() => setIsAutosaveModalOpen(true)} onNewArticle={handleNewArticle} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
          {activeTab === 'overview' && <PipelineDashboard projectId={pipelineProjectId || 'workspace'} actor={actor} initialState={pipelineState} onStateChange={setPipelineState} />}
          {selectedInstrumentId !== 'jbi-qualitative-2017' && activeTab === 'instrumentinfo' ? (
            <UniversalAppraisalView studyId={selectedArticleId || 'new-study'} studyDesign={currentArticle?.design || ''} initialInstrumentId={selectedInstrumentId} reviewerId={appraisalReviewerId} onSaved={saveAppraisalSession} />
          ) : <>
            {activeTab === 'overview' && <OverviewView articles={articles} onSelectArticle={handleSelectArticle} onEditArticle={handleEditArticle} onGoToThesis={() => setActiveTab('synthesis')} onOpenCustomEvaluator={handleNewArticle} onOpenImportExport={handleOpenImportExport} />}
            {activeTab === 'search' && <ResearchSearchView existingArticles={articles} onImportArticle={(imported) => { const articleId = generateArticleId('art'); const newArt: ArticleAppraisal = { id: articleId, instrumentId: 'jbi-qualitative-2017', instrumentVersion: '2017', lifecycleStatus: 'DRAFT', title: imported.title || 'Uten tittel', authors: imported.authors || 'Ukjent forfatter', shortCitation: imported.shortCitation || 'Ukjent (2024)', year: imported.publicationYear || 2024, doi: imported.doi || '', doiUrl: imported.doi ? `https://doi.org/${imported.doi}` : '', sourceUrl: '', sourceName: 'ForskningssÃ¸k (API)', journal: imported.journal || 'Vitenskapelig tidsskrift', studyContext: 'Importert fra ekstern database for appraisal', design: imported.studyDesign || 'Ukjent / Uavklart', dataCollection: 'Dokumentert i fulltekst', participants: 'Se fulltekst', analyticMethod: 'Se fulltekst', summaryScore: { ja: 0, uklart: 10, nei: 0, ikkeRelevant: 0, total: 10 }, overallVerdict: 'Vurder videre', verdictNote: 'Importert via ekstern forskningsdatabase', keyStrength: 'Metadata importert; metodisk vurdering ikke utfÃ¸rt', mainLimitation: 'Fulltekst mÃ¥ kontrolleres', apaReference: `${imported.authors || 'Forfattere'} (${imported.publicationYear || 2024}). ${imported.title || 'Artikkel'}. ${imported.journal || ''}.`, items: createBlankJbiItems('Uklart', 'Vurdering mÃ¥ gjennomfÃ¸res med valgt instrument'), auditTrail: [{ id: generateAuditId('audit'), studyId: articleId, reviewer: 'System (Research Search)', instrumentId: 'jbi-qualitative-2017', version: '2017', itemId: 1, itemTitle: 'Initialisering', previousAnswer: 'NONE', newAnswer: 'UNCLEAR', previousRationale: '', newRationale: 'Importert fra forskningsdatabase', changedBy: 'Forsker', timestamp: new Date().toISOString(), comment: 'Opprettet via ForskningssÃ¸k' }] }; setArticles(prev => [newArt, ...prev]); setSelectedArticleId(newArt.id); }} />}
            {activeTab === 'details' && (currentArticle ? <ArticleDetailView article={currentArticle} allArticles={articles} onSelectArticleId={setSelectedArticleId} onGoToOverview={() => setActiveTab('overview')} onGoToThesis={() => setActiveTab('synthesis')} onEditArticle={handleEditArticle} onNewArticle={handleNewArticle} /> : <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center"><GraduationCap className="w-6 h-6 mx-auto mb-3" /><h3 className="font-bold">Ingen artikkel valgt</h3><button type="button" onClick={handleNewArticle} className="mt-4 px-4 py-2 rounded-xl bg-teal-800 text-white text-xs font-bold"><PlusCircle className="w-4 h-4 inline mr-1" /> Opprett ny artikkel</button></div>)}
            {activeTab === 'evaluate' && <JbiAssessmentForm initialArticle={editingArticle || undefined} onSaveArticle={handleSaveArticle} onCancel={() => { setEditingArticle(null); setActiveTab('overview'); }} />}
            {activeTab === 'compare' && <><UniversalDualReviewPanel studyId={selectedArticleId} instrumentId={selectedInstrumentId} actorId={actor.id} actorRole={currentUserRole} /><DualReviewView articles={articles} onSelectArticleId={(id) => { setSelectedArticleId(id); setActiveTab('details'); }} onGoToEvaluation={handleEditArticle} /></>}
            {activeTab === 'peer_review' && <PeerReviewStudioView articles={articles} onUpdateArticles={setArticles} onNavigateToStudy={(id) => { setSelectedArticleId(id); setActiveTab('details'); }} />}
            {activeTab === 'synthesis' && <ThesisReadyView articles={articles} onOpenImportExport={handleOpenImportExport} />}
            {activeTab === 'audittrail' && <AuditTrailView articles={articles} />}
            {activeTab === 'who_validation' && <WhoValidationHubView articles={articles} onSelectArticleForEdit={(id) => { const art = articles.find(a => a.id === id); if (art) handleEditArticle(art); }} onSelectArticleForView={(id) => { setSelectedArticleId(id); setActiveTab('details'); }} />}
            {activeTab === 'methodology_audit' && <MethodologyAuditView />}
            {activeTab === 'meta_research' && <MetaResearchLabView onSelectInstrumentForAssessment={(instrumentId, prefillArticle) => { setSelectedInstrumentId(instrumentId); if (prefillArticle) { const articleId = generateArticleId('art'); const newArt: ArticleAppraisal = { id: articleId, instrumentId, instrumentVersion: 'PENDING_VERIFICATION', lifecycleStatus: 'DRAFT', title: prefillArticle.title || 'Ny forskningsartikkel', authors: prefillArticle.authors || 'Forfattere', shortCitation: `${(prefillArticle.authors || 'Forfattere').split(',')[0]} (${prefillArticle.year || 2024})`, year: prefillArticle.year || 2024, doi: prefillArticle.doi || '', doiUrl: prefillArticle.doi ? `https://doi.org/${prefillArticle.doi}` : '', sourceUrl: '', sourceName: 'Forsk pÃ¥ forskning', journal: 'Vitenskapelig tidsskrift', studyContext: 'Klinisk eller samfunnsmessig kontekst', design: prefillArticle.design || 'Ukjent / Uavklart', dataCollection: 'Se fulltekst', participants: 'Se fulltekst', analyticMethod: 'Se fulltekst', summaryScore: { ja: 0, uklart: 10, nei: 0, ikkeRelevant: 0, total: 10 }, overallVerdict: 'Vurder videre', verdictNote: 'Krever vurdering med valgt instrument', keyStrength: 'Ikke forhÃ¥ndsvurdert', mainLimitation: 'Fulltekst mÃ¥ kontrolleres', apaReference: `${prefillArticle.authors || 'Forfattere'} (${prefillArticle.year || 2024}). ${prefillArticle.title || 'Artikkel'}.`, items: createBlankJbiItems('Uklart', 'Opprettet for instrumentvurdering; ingen vurdering er forhÃ¥ndsgitt.'), auditTrail: [] }; setArticles(prev => [...prev, newArt]); setSelectedArticleId(newArt.id); } setActiveTab('instrumentinfo'); }} onSaveToLibrary={() => setActiveTab('overview')} />}
            {activeTab === 'reference_hub' && <ReferenceHubView records={referenceRecords} onChange={handleReferenceChange} />}
            {activeTab === 'writing_studio' && <WritingStudioView references={referenceRecords} />}
            {activeTab === 'reference_library' && <ReferenceLibraryView articles={articles} />}
            {activeTab === 'validation_dashboard' && <ValidationDashboardView articles={articles} />}
            {activeTab === 'help_examples' && <HelpAndExamplesView />}
            {activeTab === 'source_workflow' && <SourceRecordWorkflowView />}
            {activeTab === 'appraisal' && <UniversalAppraisalView studyId={selectedArticleId || 'new-study'} studyDesign={currentArticle?.design || ''} initialInstrumentId={selectedInstrumentId} reviewerId={appraisalReviewerId} onSaved={saveAppraisalSession} />}
          </>}
        </main>

        <DocumentAnalysisModal isOpen={isDocAnalysisOpen} onClose={() => setIsDocAnalysisOpen(false)} />
        <ImportExportModal isOpen={isImportExportOpen} onClose={() => setIsImportExportOpen(false)} initialTab={importExportInitialTab} articles={articles} onImportArticles={handleImportArticles} />
        <AutosaveModal isOpen={isAutosaveModalOpen} onClose={() => setIsAutosaveModalOpen(false)} />
        <GdprPrivacyCenterModal isOpen={isPrivacyCenterOpen} onClose={() => setIsPrivacyCenterOpen(false)} />
      </div>
    </ToastProvider>
  );
}
