import React, { useState, useEffect } from 'react';
import { JBI_QUESTIONS } from './data/jbiData';
import { ArticleAppraisal, AssessmentStatus, JBIEvaluationItem } from './types';
import { generateArticleId, generateAuditId } from './services/idGenerator';
import { AutosaveService } from './services/autosaveService';
import { Header, ActiveTab } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { ArticleDetailView } from './components/ArticleDetailView';
import { JbiAssessmentForm } from './components/JbiAssessmentForm';
import { DualReviewView } from './components/DualReviewView';
import { PeerReviewStudioView } from './components/PeerReviewStudioView';
import { AuditTrailView } from './components/AuditTrailView';
import { ThesisReadyView } from './components/ThesisReadyView';
import { InstrumentInfoView } from './components/InstrumentInfoView';
import { WhoValidationHubView } from './components/WhoValidationHubView';
import { MethodologyAuditView } from './components/MethodologyAuditView';
import { MetaResearchLabView } from './components/MetaResearchLabView';
import { ReferenceLibraryView } from './components/ReferenceLibraryView';
import { ValidationDashboardView } from './components/ValidationDashboardView';
import { ResearchSearchView } from './components/ResearchSearchView';
import { HelpAndExamplesView } from './components/HelpAndExamplesView';
import { DocumentAnalysisModal } from './components/DocumentAnalysisModal';
import { ImportExportModal } from './components/ImportExportModal';
import { AutosaveModal } from './components/AutosaveModal';
import { GdprPrivacyCenterModal } from './components/GdprPrivacyCenterModal';
import { ToastProvider } from './components/Toast';
import { UserRole } from './services/rbacService';
import { GraduationCap, ExternalLink, ShieldCheck, PlusCircle } from 'lucide-react';

function createBlankJbiItems(defaultStatus: AssessmentStatus = 'Uklart', defaultJustification = ''): JBIEvaluationItem[] {
  return JBI_QUESTIONS.map(q => ({
    questionId: q.id,
    status: defaultStatus,
    justification: defaultJustification,
    evidenceText: '',
    sourceQuoteOrRef: '',
    location: { page: '', section: '' }
  }));
}

export default function App() {
  const [articles, setArticles] = useState<ArticleAppraisal[]>(() => 
    AutosaveService.loadArticles([])
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>('jbi-qualitative-2017');
  const [selectedArticleId, setSelectedArticleId] = useState<string>(() => {
    const loaded = AutosaveService.loadArticles([]);
    return loaded[0]?.id || '';
  });
  const [editingArticle, setEditingArticle] = useState<ArticleAppraisal | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('lead_reviewer');
  const [isPrivacyCenterOpen, setIsPrivacyCenterOpen] = useState<boolean>(false);
  const [isDocAnalysisOpen, setIsDocAnalysisOpen] = useState<boolean>(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState<boolean>(false);
  const [isAutosaveModalOpen, setIsAutosaveModalOpen] = useState<boolean>(false);
  const [importExportInitialTab, setImportExportInitialTab] = useState<'import' | 'export'>('export');

  // Continual autosave on every mutation
  useEffect(() => {
    AutosaveService.saveArticles(articles);
  }, [articles]);

  const handleOpenImportExport = (tab: 'import' | 'export' = 'export') => {
    setImportExportInitialTab(tab);
    setIsImportExportOpen(true);
  };

  const handleImportArticles = (importedArticles: ArticleAppraisal[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      const seenIds = new Set<string>();
      const sanitized = importedArticles.map((art) => {
        let uniqueId = art.id;
        if (!uniqueId || seenIds.has(uniqueId)) {
          uniqueId = generateArticleId('art');
        }
        seenIds.add(uniqueId);
        return { ...art, id: uniqueId };
      });
      setArticles(sanitized);
      if (sanitized.length > 0) {
        setSelectedArticleId(sanitized[0].id);
      }
    } else {
      const existingIds = new Set(articles.map(p => p.id));
      const newItems: ArticleAppraisal[] = [];
      importedArticles.forEach(item => {
        let uniqueId = item.id;
        if (!uniqueId || existingIds.has(uniqueId)) {
          uniqueId = generateArticleId('art');
        }
        existingIds.add(uniqueId);
        newItems.push({ ...item, id: uniqueId });
      });
      setArticles(prev => [...newItems, ...prev]);
      if (newItems.length > 0) {
        setSelectedArticleId(newItems[0].id);
      }
    }
  };

  const handleSelectArticle = (id: string) => {
    setSelectedArticleId(id);
    setActiveTab('details');
  };

  const handleEditArticle = (article: ArticleAppraisal) => {
    setEditingArticle(article);
    setSelectedArticleId(article.id);
    setActiveTab('evaluate');
  };

  const handleNewArticle = () => {
    setEditingArticle(null);
    setActiveTab('evaluate');
  };

  const handleSaveArticle = (savedArticle: ArticleAppraisal) => {
    setArticles(prev => {
      const idx = prev.findIndex(a => a.id === savedArticle.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedArticle;
        return next;
      }
      return [savedArticle, ...prev];
    });
    setSelectedArticleId(savedArticle.id);
    setEditingArticle(null);
    setActiveTab('details');
  };

  const currentArticle = articles.find(a => a.id === selectedArticleId) || articles[0];

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
        {/* Navigation & Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          articles={articles}
          selectedArticleId={selectedArticleId}
          onSelectArticleId={(id) => {
            setSelectedArticleId(id);
          }}
          selectedInstrumentId={selectedInstrumentId}
          onSelectInstrument={setSelectedInstrumentId}
          currentUserRole={currentUserRole}
          onSelectUserRole={setCurrentUserRole}
          onOpenPrivacyCenter={() => setIsPrivacyCenterOpen(true)}
          onOpenDocAnalysis={() => setIsDocAnalysisOpen(true)}
          onOpenImportExport={handleOpenImportExport}
          onOpenAutosave={() => setIsAutosaveModalOpen(true)}
          onNewArticle={handleNewArticle}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
          {/* If another instrument than JBI Qualitative is selected and active tab is instrumentinfo */}
          {selectedInstrumentId !== 'jbi-qualitative-2017' && activeTab === 'instrumentinfo' ? (
            <InstrumentInfoView
              instrumentId={selectedInstrumentId}
              onSwitchToJbi={() => {
                setSelectedInstrumentId('jbi-qualitative-2017');
                setActiveTab('overview');
              }}
            />
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewView
                  articles={articles}
                  onSelectArticle={handleSelectArticle}
                  onEditArticle={handleEditArticle}
                  onGoToThesis={() => setActiveTab('synthesis')}
                  onOpenCustomEvaluator={handleNewArticle}
                  onOpenImportExport={handleOpenImportExport}
                />
              )}

              {activeTab === 'search' && (
                <ResearchSearchView
                  existingArticles={articles}
                  onImportArticle={(imported) => {
                    const articleId = generateArticleId('art');
                    const newArt: ArticleAppraisal = {
                      id: articleId,
                      instrumentId: 'jbi-qualitative-2017',
                      instrumentVersion: '2017',
                      lifecycleStatus: 'DRAFT',
                      title: imported.title || 'Uten tittel',
                      authors: imported.authors || 'Ukjent forfatter',
                      shortCitation: imported.shortCitation || 'Ukjent (2024)',
                      year: imported.publicationYear || 2024,
                      doi: imported.doi || '',
                      doiUrl: imported.doi ? `https://doi.org/${imported.doi}` : '',
                      sourceUrl: '',
                      sourceName: 'Forskningssøk (API)',
                      journal: imported.journal || 'Vitenskapelig tidsskrift',
                      studyContext: 'Importert fra database for appraisal',
                      design: imported.studyDesign || 'Kvalitativ studie',
                      dataCollection: 'Dokumentert i kildeartikkel',
                      participants: 'Se fulltekst',
                      analyticMethod: 'Se kildedokument',
                      summaryScore: { ja: 0, uklart: 10, nei: 0, total: 10 },
                      overallVerdict: 'Vurder videre',
                      verdictNote: 'Importert via ekstern database',
                      keyStrength: 'Publikasjon importert fra ekstern forskningsdatabase; fagfellevurdering må dokumenteres separat',
                      mainLimitation: 'Kvalitetsvurdering ikke gjennomført ennå',
                      apaReference: `${imported.authors || 'Forfattere'} (${imported.publicationYear || 2024}). ${imported.title || 'Artikkel'}. ${imported.journal || ''}.`,
                      items: createBlankJbiItems('Uklart', 'Vurdering må gjennomføres med fulltekst'),
                      auditTrail: [
                        {
                          id: generateAuditId('audit'),
                          studyId: articleId,
                          reviewer: 'System (Research Search)',
                          instrumentId: 'jbi-qualitative-2017',
                          version: '2017',
                          itemId: 1,
                          itemTitle: 'Initialisering',
                          previousAnswer: 'NONE',
                          newAnswer: 'UNCLEAR',
                          previousRationale: '',
                          newRationale: 'Importert fra forskningsdatabase for kvalitetsvurdering',
                          changedBy: 'Forsker',
                          timestamp: new Date().toISOString(),
                          comment: 'Opprettet via Forskningssøk'
                        }
                      ]
                    };
                    setArticles(prev => [newArt, ...prev]);
                    setSelectedArticleId(newArt.id);
                  }}
                />
              )}

              {activeTab === 'details' && (
                currentArticle ? (
                  <ArticleDetailView
                    article={currentArticle}
                    allArticles={articles}
                    onSelectArticleId={(id) => setSelectedArticleId(id)}
                    onGoToOverview={() => setActiveTab('overview')}
                    onGoToThesis={() => setActiveTab('synthesis')}
                    onEditArticle={handleEditArticle}
                    onNewArticle={handleNewArticle}
                  />
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-xs">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <GraduationCap className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 font-serif">Ingen artikkel valgt</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Legg til en ny artikkel eller last inn en eksempelstudie for å se detaljer, metodisk analyse og APA 7-siteringsstudio.
                    </p>
                    <div className="pt-2 flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleNewArticle}
                        className="px-4 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
                      >
                        <PlusCircle className="w-4 h-4" /> Opprett ny artikkel
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('help_examples')}
                        className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
                      >
                        <GraduationCap className="w-4 h-4 text-indigo-600" /> Utforsk eksempelbibliotek
                      </button>
                    </div>
                  </div>
                )
              )}

              {activeTab === 'evaluate' && (
                <JbiAssessmentForm
                  initialArticle={editingArticle || undefined}
                  onSaveArticle={handleSaveArticle}
                  onCancel={() => {
                    setEditingArticle(null);
                    setActiveTab('overview');
                  }}
                />
              )}

              {activeTab === 'compare' && (
                <DualReviewView 
                  articles={articles}
                  onSelectArticleId={(id) => {
                    setSelectedArticleId(id);
                    setActiveTab('details');
                  }}
                  onGoToEvaluation={handleEditArticle}
                />
              )}

              {activeTab === 'peer_review' && (
                <PeerReviewStudioView 
                  articles={articles}
                  onUpdateArticles={(updated) => setArticles(updated)}
                  onNavigateToStudy={(id) => {
                    setSelectedArticleId(id);
                    setActiveTab('details');
                  }}
                />
              )}

              {activeTab === 'synthesis' && (
                <ThesisReadyView 
                  articles={articles}
                  onOpenImportExport={handleOpenImportExport}
                />
              )}

              {activeTab === 'audittrail' && (
                <AuditTrailView articles={articles} />
              )}

              {activeTab === 'who_validation' && (
                <WhoValidationHubView
                  articles={articles}
                  onSelectArticleForEdit={(id) => {
                    const art = articles.find(a => a.id === id);
                    if (art) handleEditArticle(art);
                  }}
                  onSelectArticleForView={(id) => {
                    setSelectedArticleId(id);
                    setActiveTab('details');
                  }}
                />
              )}

              {activeTab === 'methodology_audit' && (
                <MethodologyAuditView />
              )}

              {activeTab === 'meta_research' && (
                <MetaResearchLabView
                  onSelectInstrumentForAssessment={(instrumentId, prefillArticle) => {
                    setSelectedInstrumentId(instrumentId);
                    if (prefillArticle) {
                      const articleId = generateArticleId('art');
                      const newArt: ArticleAppraisal = {
                        id: articleId,
                        instrumentId: instrumentId,
                        instrumentVersion: 'PENDING_VERIFICATION',
                        lifecycleStatus: 'DRAFT',
                        title: prefillArticle.title || 'Ny Forskingsartikkel',
                        authors: prefillArticle.authors || 'Forfattere',
                        shortCitation: `${(prefillArticle.authors || 'Forfattere').split(',')[0]} (${prefillArticle.year || 2024})`,
                        year: prefillArticle.year || 2024,
                        doi: prefillArticle.doi || '',
                        doiUrl: prefillArticle.doi ? `https://doi.org/${prefillArticle.doi}` : '',
                        sourceUrl: '',
                        sourceName: 'Forsk på Forskning (Integritetsvakt)',
                        journal: 'Vitenskapelig Tidsskrift',
                        studyContext: 'Klinisk eller samfunnsmessig kontekst',
                        design: prefillArticle.design || 'Kvalitativ studie',
                        dataCollection: 'Intervjuer / Observasjon',
                        participants: 'Deltakere / Informanter',
                        analyticMethod: 'Tematisk / Hermeneutisk analyse',
                        summaryScore: { ja: 0, uklart: 10, nei: 0, total: 10 },
                        overallVerdict: 'Vurder videre',
                        verdictNote: 'Opprettet via Forsk på Forskning (Integritetsvakt)',
                        keyStrength: 'Tydelig formål og metodisk koherens',
                        mainLimitation: 'Kontekstavhengig overførbarhet',
                        apaReference: `${prefillArticle.authors || 'Forfattere'} (${prefillArticle.year || 2024}). ${prefillArticle.title || 'Artikkel'}.`,
                        items: createBlankJbiItems('Uklart', `Importert for vurdering med ${instrumentId.toUpperCase()}; ingen metodisk vurdering er forhåndsutført.`),
                        auditTrail: [
                          {
                            id: generateAuditId('audit'),
                            studyId: articleId,
                            reviewer: 'Integritetsvakt (Meta-Research Lab)',
                            instrumentId: instrumentId,
                            version: '1.0.0',
                            itemId: 1,
                            itemTitle: 'Initialisering',
                            previousAnswer: 'NONE',
                            newAnswer: 'YES',
                            previousRationale: '',
                            newRationale: `Artikkel identifisert og importert for vurdering med ${instrumentId.toUpperCase()}`,
                            changedBy: 'Integritetsvakt',
                            timestamp: new Date().toISOString(),
                            comment: `Opprettet via Meta-Research Lab (${instrumentId.toUpperCase()})`
                          }
                        ]
                      };
                      setArticles(prev => [newArt, ...prev]);
                      setSelectedArticleId(newArt.id);
                      setEditingArticle(newArt);
                    }
                    if (instrumentId === 'jbi-qualitative-2017') {
                      setActiveTab('evaluate');
                    } else {
                      setActiveTab('instrumentinfo');
                    }
                  }}
                  onSaveToLibrary={(prefillArticle) => {
                    const articleId = generateArticleId('art');
                    const newArt: ArticleAppraisal = {
                      id: articleId,
                      instrumentId: 'jbi-qualitative-2017',
                      instrumentVersion: '2017/2024',
                      lifecycleStatus: 'DRAFT',
                      title: prefillArticle.title || 'Ny Forskingsartikkel',
                      authors: prefillArticle.authors || 'Forfattere',
                      shortCitation: `${(prefillArticle.authors || 'Forfattere').split(',')[0]} (${prefillArticle.year || 2024})`,
                      year: prefillArticle.year || 2024,
                      doi: prefillArticle.doi || '',
                      doiUrl: prefillArticle.doi ? `https://doi.org/${prefillArticle.doi}` : '',
                      sourceUrl: '',
                      sourceName: 'Forsk på Forskning (Integritetsvakt)',
                      journal: 'Vitenskapelig Tidsskrift',
                      studyContext: 'Klinisk eller samfunnsmessig kontekst',
                      design: prefillArticle.design || 'Forskningsartikkel',
                      dataCollection: 'Intervjuer / Observasjon',
                      participants: 'Deltakere / Informanter',
                      analyticMethod: 'Tematisk / Hermeneutisk analyse',
                      summaryScore: { ja: 0, uklart: 10, nei: 0, total: 10 },
                      overallVerdict: 'Vurder videre',
                      verdictNote: 'Importert via Forsk på Forskning (Integritetsvakt)',
                      keyStrength: 'Dokumentert forskningsarbeid',
                      mainLimitation: 'Krever manuell kildekontroll',
                      apaReference: `${prefillArticle.authors || 'Forfattere'} (${prefillArticle.year || 2024}). ${prefillArticle.title || 'Artikkel'}.`,
                      items: createBlankJbiItems('Uklart', 'Importert for vurdering'),
                      auditTrail: [
                        {
                          id: generateAuditId('audit'),
                          studyId: articleId,
                          reviewer: 'Integritetsvakt',
                          instrumentId: 'jbi-qualitative-2017',
                          version: '1.0.0',
                          itemId: 1,
                          itemTitle: 'Initialisering',
                          previousAnswer: 'NONE',
                          newAnswer: 'UNCLEAR',
                          previousRationale: '',
                          newRationale: 'Artikkel importert til bibliotek fra dokumentanalyse',
                          changedBy: 'Integritetsvakt',
                          timestamp: new Date().toISOString(),
                          comment: 'Importert til bibliotek'
                        }
                      ]
                    };
                    setArticles(prev => [newArt, ...prev]);
                    setSelectedArticleId(newArt.id);
                    setActiveTab('overview');
                  }}
                />
              )}

              {activeTab === 'reference_library' && (
                <ReferenceLibraryView
                  articles={articles}
                />
              )}

              {activeTab === 'validation_dashboard' && (
                <ValidationDashboardView />
              )}

              {activeTab === 'help_examples' && (
                <HelpAndExamplesView
                  onLoadExampleToWorkspace={(exampleArticle) => {
                    setArticles(prev => [exampleArticle, ...prev]);
                    setSelectedArticleId(exampleArticle.id);
                    setActiveTab('details');
                  }}
                  onGoToEvaluation={(exampleArticle) => {
                    setEditingArticle(exampleArticle);
                    setSelectedArticleId(exampleArticle.id);
                    setActiveTab('evaluate');
                  }}
                />
              )}

              {activeTab === 'instrumentinfo' && (
                <InstrumentInfoView
                  instrumentId={selectedInstrumentId}
                  onSwitchToJbi={() => {
                    setSelectedInstrumentId('jbi-qualitative-2017');
                    setActiveTab('overview');
                  }}
                />
              )}
            </>
          )}
        </main>

        {/* Global Document Analysis Modal */}
        <DocumentAnalysisModal
          isOpen={isDocAnalysisOpen}
          onClose={() => setIsDocAnalysisOpen(false)}
          onStartAssessmentWithArticle={(prefill) => {
            const articleId = generateArticleId('doc');
            const newArt: ArticleAppraisal = {
              id: articleId,
              instrumentId: prefill.instrumentId || selectedInstrumentId || 'jbi-qualitative-2017',
              instrumentVersion: '2017/2024',
              lifecycleStatus: 'DRAFT',
              whoValidationStatus: 'PENDING_VERIFICATION',
              parsingStatus: 'PARSED_COMPLETE',
              authors: prefill.authors || 'Forfattere',
              shortCitation: `${(prefill.authors || 'Forfattere').split(',')[0].trim()} (${prefill.year || new Date().getFullYear()})`,
              year: prefill.year || new Date().getFullYear(),
              title: prefill.title || 'Uten tittel',
              journal: prefill.journal || 'Tidsskrift / Kilde',
              doi: prefill.doi || '',
              doiUrl: prefill.doi ? `https://doi.org/${prefill.doi}` : '#',
              sourceUrl: '#',
              sourceName: prefill.journal || 'Opplastet dokument',
              studyContext: prefill.studyContext || 'Ekstrahert fra dokumentanalyse',
              design: prefill.design || 'Kvalitativ studie',
              dataCollection: 'Intervjuer / observasjon',
              participants: 'Studiepopulasjon',
              analyticMethod: 'Tematisk syntese / analyse',
              reviewerName: 'Primærvurderer',
              reviewerRole: 'Forsker / Vurderer',
              assessmentDate: new Date().toISOString().split('T')[0],
              projectName: 'Evidensvurdering',
              summaryScore: {
                ja: 0,
                uklart: 10,
                nei: 0,
                ikkeRelevant: 0,
                total: 10
              },
              overallVerdict: 'Vurder videre',
              verdictNote: 'Opprettet fra opplastet forskningsdokument',
              keyStrength: 'Dokumentert studie',
              mainLimitation: 'Krever systematisk kildevurdering',
              apaReference: `${prefill.authors || 'Forfattere'} (${prefill.year || new Date().getFullYear()}). ${prefill.title || 'Artikkel'}.`,
              items: createBlankJbiItems('Uklart', ''),
              auditTrail: [
                {
                  id: generateAuditId('audit'),
                  studyId: articleId,
                  reviewer: 'Dokumentanalyse',
                  instrumentId: prefill.instrumentId || 'jbi-qualitative-2017',
                  version: '1.0.0',
                  itemId: 1,
                  itemTitle: 'Initialisering',
                  previousAnswer: 'NONE',
                  newAnswer: 'UNCLEAR',
                  previousRationale: '',
                  newRationale: 'Opprettet fra opplastet forskningsdokument',
                  changedBy: 'Dokumentanalyse',
                  timestamp: new Date().toISOString(),
                  comment: 'Opprettet fra dokument'
                }
              ]
            };
            setArticles(prev => [newArt, ...prev]);
            setSelectedArticleId(newArt.id);
            if (prefill.instrumentId) {
              setSelectedInstrumentId(prefill.instrumentId);
            }
            setActiveTab('overview');
          }}
        />

        {/* Universal Import & Export Hub Modal */}
        <ImportExportModal
          isOpen={isImportExportOpen}
          onClose={() => setIsImportExportOpen(false)}
          articles={articles}
          onImportArticles={handleImportArticles}
          selectedArticleId={selectedArticleId}
          initialTab={importExportInitialTab}
        />

        {/* Autosave & Snapshot Management Modal */}
        <AutosaveModal
          isOpen={isAutosaveModalOpen}
          onClose={() => setIsAutosaveModalOpen(false)}
          articles={articles}
          onRestoreArticles={(restored) => {
            setArticles(restored);
            if (restored.length > 0) {
              setSelectedArticleId(restored[0].id);
            }
          }}
        />

        {/* GDPR Privacy & Security Center Modal */}
        <GdprPrivacyCenterModal
          isOpen={isPrivacyCenterOpen}
          onClose={() => setIsPrivacyCenterOpen(false)}
          articles={articles}
          onVaultPurged={() => {
            setArticles([]);
            setSelectedArticleId('');
          }}
        />

        {/* Academic Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 sm:py-8 mt-12 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                Evidence Appraisal Tool • WHO Handbook for Guideline Development & Joanna Briggs Institute-kildemateriale.
              </span>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => setActiveTab('methodology_audit')}
                className="text-slate-600 hover:text-teal-700 underline font-semibold flex items-center gap-1"
              >
                <span>Kilde- & Metoderevisjon</span>
              </button>
              <button
                onClick={() => setActiveTab('who_validation')}
                className="text-slate-600 hover:text-teal-700 underline font-semibold flex items-center gap-1"
              >
                <span>Metodisk kontroll & modeller</span>
              </button>
              <a
                href="https://jbi.global/critical-appraisal-tools"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-teal-700 underline flex items-center gap-1"
              >
                <span>JBI Adelaide Checklist</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
