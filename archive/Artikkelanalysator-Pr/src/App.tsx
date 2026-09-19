import React, { useState, useEffect } from 'react';
import { ArticleData, ArticleAnalysis, ComparisonResult } from './types';
import { PRELOADED_ARTICLES } from './data/articles';
import { EXPERT_ANALYSES } from './data/expertAnalyses';
import { Navbar } from './components/Navbar';
import { ArticleSelector } from './components/ArticleSelector';
import { ClassificationView } from './components/ClassificationView';
import { ChecklistView } from './components/ChecklistView';
import { CustomChecklistView } from './components/CustomChecklistView';
import { ComparisonView } from './components/ComparisonView';
import { PresentationView } from './components/PresentationView';
import { QaSearchComponent } from './components/QaSearchComponent';
import { ReferenceVerifierView } from './components/ReferenceVerifierView';
import { StudentPaperEvaluator } from './components/StudentPaperEvaluator';
import { ReferencesView } from './components/ReferencesView';
import { ReportView } from './components/ReportView';
import { HelpGuideComponent } from './components/HelpGuideComponent';
import { SystemExportComponent } from './components/SystemExportComponent';
import { AuditLogView } from './components/AuditLogView';
import { FileAppraisalView } from './components/FileAppraisalView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'library' | 'classification' | 'checklist' | 'custom-checklist' | 'comparison' | 'presentation' | 'qa' | 'verifier' | 'student-evaluator' | 'references' | 'report' | 'help' | 'system-export' | 'audit-log' | 'file-appraisal'>('library');
  const [selectedArticle, setSelectedArticle] = useState<ArticleData>(PRELOADED_ARTICLES[0]);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const [analysis, setAnalysis] = useState<ArticleAnalysis | null>(EXPERT_ANALYSES['overhaug-2024']);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // When selected article changes, automatically load expert analysis if available
  useEffect(() => {
    if (!isCustom && EXPERT_ANALYSES[selectedArticle.id]) {
      setAnalysis(EXPERT_ANALYSES[selectedArticle.id]);
    }
  }, [selectedArticle, isCustom]);

  const currentTitle = isCustom ? customTitle || 'Egen artikkel' : selectedArticle.title;
  const currentText = isCustom ? customText : `${selectedArticle.abstract}\n\n${selectedArticle.fullText}`;

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // If preloaded, use expert analysis instantly
      if (!isCustom && EXPERT_ANALYSES[selectedArticle.id]) {
        setAnalysis(EXPERT_ANALYSES[selectedArticle.id]);
        setIsAnalyzing(false);
        setActiveTab('classification');
        return;
      }

      const res = await fetch('/api/analyze-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentTitle,
          text: currentText
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAnalysis({
          ...data,
          articleId: isCustom ? 'custom' : selectedArticle.id
        });
        setActiveTab('classification');
      } else {
        alert(data.error || 'Kunne ikke gjennomføre analyse.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Nettverkfeil under analyse.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCompare = async (art1: ArticleData, art2: ArticleData) => {
    setIsComparing(true);
    try {
      const res = await fetch('/api/compare-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article1Title: art1.title,
          article1Text: `${art1.abstract}\n\n${art1.fullText}`,
          article2Title: art2.title,
          article2Text: `${art2.abstract}\n\n${art2.fullText}`
        })
      });
      const data = await res.json();
      if (res.ok) {
        setComparisonResult(data);
      } else {
        alert(data.error || 'Kunne ikke sammenligne artikler.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Nettverkfeil under sammenligning.');
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedArticleTitle={currentTitle}
        isAnalyzing={isAnalyzing}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'library' && (
          <ArticleSelector
            selectedArticle={selectedArticle}
            onSelectArticle={(art) => setSelectedArticle(art)}
            onRunAnalysis={handleRunAnalysis}
            isAnalyzing={isAnalyzing}
            customTitle={customTitle}
            setCustomTitle={setCustomTitle}
            customText={customText}
            setCustomText={setCustomText}
            isCustom={isCustom}
            setIsCustom={setIsCustom}
          />
        )}

        {activeTab === 'classification' && (
          <ClassificationView
            analysis={analysis}
            article={selectedArticle}
            isAnalyzing={isAnalyzing}
            onRunAnalysis={handleRunAnalysis}
          />
        )}

        {activeTab === 'checklist' && (
          <ChecklistView
            analysis={analysis}
            onRunAnalysis={handleRunAnalysis}
            isAnalyzing={isAnalyzing}
          />
        )}

        {activeTab === 'custom-checklist' && (
          <CustomChecklistView
            selectedArticle={selectedArticle}
          />
        )}

        {activeTab === 'comparison' && (
          <ComparisonView
            onCompare={handleCompare}
            comparisonResult={comparisonResult}
            isComparing={isComparing}
          />
        )}

        {activeTab === 'qa' && (
          <QaSearchComponent
            selectedArticle={selectedArticle}
          />
        )}

        {activeTab === 'verifier' && (
          <ReferenceVerifierView
            selectedArticle={selectedArticle}
          />
        )}

        {activeTab === 'student-evaluator' && (
          <StudentPaperEvaluator />
        )}

        {activeTab === 'presentation' && (
          <PresentationView
            selectedArticle={selectedArticle}
          />
        )}

        {activeTab === 'references' && (
          <ReferencesView />
        )}

        {activeTab === 'report' && (
          <ReportView
            analysis={analysis}
            article={selectedArticle}
          />
        )}

        {activeTab === 'help' && (
          <HelpGuideComponent />
        )}

        {activeTab === 'system-export' && (
          <SystemExportComponent />
        )}

        {activeTab === 'audit-log' && (
          <AuditLogView />
        )}

        {activeTab === 'file-appraisal' && (
          <FileAppraisalView />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Artikkelanalysator Pro • Utviklet for kritisk vurdering, sjekklister og akademisk analyse uten dikting.
      </footer>
    </div>
  );
}
