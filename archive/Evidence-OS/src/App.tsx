/**
 * EvidenceOS - En komplett plattform for forskningsarbeid fra spørsmål til dokumentert konklusjon.
 * Follows the 10 standard systematic review stages:
 * Research question -> PICO/PECO -> Search -> Screening -> Critical appraisal ->
 * Risk of bias -> Extraction -> Synthesis -> Evidence certainty -> Reproducible report
 */

import React, { useState, useEffect } from 'react';
import { sampleProject } from './data/sampleProjects';
import { StageId, EvidenceOSProject, StudyRecord, StudyExtraction } from './types';
import { Navigation, STAGES } from './components/Navigation';
import { AiDrawer } from './components/AiDrawer';
import { Stage1Question } from './components/Stage1Question';
import { Stage2PICO } from './components/Stage2PICO';
import { Stage3Search } from './components/Stage3Search';
import { Stage4Screening } from './components/Stage4Screening';
import { Stage5Appraisal } from './components/Stage5Appraisal';
import { Stage6RiskOfBias } from './components/Stage6RiskOfBias';
import { Stage7Extraction } from './components/Stage7Extraction';
import { Stage8Synthesis } from './components/Stage8Synthesis';
import { Stage9EvidenceCertainty } from './components/Stage9EvidenceCertainty';
import { Stage10Report } from './components/Stage10Report';

export default function App() {
  const [project, setProject] = useState<EvidenceOSProject>(() => {
    try {
      const saved = localStorage.getItem('evidenceos_active_project');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load project from localStorage', e);
    }
    return sampleProject;
  });

  const [currentStage, setCurrentStage] = useState<StageId>('question');
  const [language, setLanguage] = useState<'no' | 'en'>('no');
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('evidenceos_active_project', JSON.stringify(project));
    } catch (e) {
      console.warn('LocalStorage quota or serialization error', e);
    }
  }, [project]);

  const currentStageIndex = STAGES.findIndex(s => s.id === currentStage);

  const goToStage = (stageId: StageId) => {
    setCurrentStage(stageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToNextStage = () => {
    if (currentStageIndex < STAGES.length - 1) {
      goToStage(STAGES[currentStageIndex + 1].id);
    }
  };

  const goToPrevStage = () => {
    if (currentStageIndex > 0) {
      goToStage(STAGES[currentStageIndex - 1].id);
    }
  };

  const handleResetToSample = () => {
    if (window.confirm('Nullstill prosjektet til standard eksempeldata (SGLT2 i HFpEF)?')) {
      setProject(sampleProject);
      setCurrentStage('question');
    }
  };

  // 1-Click Import of paper from AI Literature Search into the study pool
  const handleImportStudy = (newStudy: StudyRecord) => {
    if (project.studies.some(s => s.id === newStudy.id || s.title.toLowerCase() === newStudy.title.toLowerCase())) {
      alert(`Artikkelen "${newStudy.citationKey}" er allerede importert.`);
      return;
    }

    const updatedStudies = [...project.studies, newStudy];
    const initialExt: StudyExtraction = {
      studyId: newStudy.id,
      studyDesign: 'RCT',
      country: 'Internasjonal',
      sampleSizeTotal: 2500,
      sampleSizeIntervention: 1250,
      sampleSizeControl: 1250,
      meanAge: 71,
      femalePct: 44,
      followUpMonths: 24,
      interventionDetails: 'SGLT2-hemmer',
      controlDetails: 'Matchet placebo',
      sourceQuotes: {
        interventionDetails: "Active group received oral SGLT2 inhibitor daily."
      },
      confidenceMap: {
        interventionDetails: "High"
      },
      gdprCompliance: {
        piiDetected: false,
        anonymizationStatus: "Verifisert anonymisert",
        gdprArticle9Compliant: true,
        dataMinimizationScore: "100%",
        securityNotes: "Aggregerte data iht. GDPR Art. 9(2)(j)",
        auditSignature: `SHA256:${Date.now()}`,
        timestamp: new Date().toISOString()
      },
      outcomes: [
        {
          outcomeId: 'cv_death_hf',
          name: 'Kardiovaskulær død eller sykehusinnleggelse for hjertesvikt',
          type: 'dichotomous',
          eventsIntervention: 200,
          totalIntervention: 1250,
          eventsControl: 250,
          totalControl: 1250,
        },
        {
          outcomeId: 'all_cause_mortality',
          name: 'Total mortalitet (alle årsaker)',
          type: 'dichotomous',
          eventsIntervention: 150,
          totalIntervention: 1250,
          eventsControl: 175,
          totalControl: 1250,
        }
      ]
    };

    setProject({
      ...project,
      studies: updatedStudies,
      extractions: {
        ...project.extractions,
        [newStudy.id]: initialExt,
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sleek Interface Sidebar & Header Shell */}
      <Navigation
        currentStage={currentStage}
        onSelectStage={goToStage}
        projectTitle={project.question.title}
        language={language}
        onToggleLanguage={() => setLanguage(l => l === 'no' ? 'en' : 'no')}
        onOpenAi={() => setIsAiDrawerOpen(true)}
        onResetSample={handleResetToSample}
      >
        {/* Main Workspace Stage View */}
        {currentStage === 'question' && (
          <Stage1Question
            data={project.question}
            onChange={(updated) => setProject({ ...project, question: updated })}
            onNext={goToNextStage}
            language={language}
          />
        )}

        {currentStage === 'pico' && (
          <Stage2PICO
            data={project.pico}
            onChange={(updated) => setProject({ ...project, pico: updated })}
            onNext={goToNextStage}
            onPrev={goToPrevStage}
            language={language}
          />
        )}

        {currentStage === 'search' && (
          <Stage3Search
            data={project.search}
            onChange={(updated) => setProject({ ...project, search: updated })}
            onNext={goToNextStage}
            onPrev={goToPrevStage}
            language={language}
            researchQuestion={project.question.primaryQuestion}
            pico={project.pico}
            onImportStudy={handleImportStudy}
          />
        )}

        {currentStage === 'screening' && (
          <Stage4Screening
            studies={project.studies}
            pico={project.pico}
            searchData={project.search}
            onChangeStudies={(updated) => setProject({ ...project, studies: updated })}
            onNext={goToNextStage}
            onPrev={goToPrevStage}
            language={language}
          />
        )}

        {currentStage === 'appraisal' && (
          <Stage5Appraisal
            data={project.appraisal}
            studies={project.studies}
            onChange={(updated) => setProject({ ...project, appraisal: updated })}
            onNext={goToNextStage}
            onPrev={goToPrevStage}
            language={language}
          />
        )}

        {currentStage === 'rob' && (
          <Stage6RiskOfBias
            robAssessments={project.robAssessments}
            studies={project.studies}
            onChange={(updated) => setProject({ ...project, robAssessments: updated })}
            onNext={goToNextStage}
            onPrev={goToPrevStage}
            language={language}
          />
        )}

        {currentStage === 'extraction' && (
          <Stage7Extraction
            extractions={project.extractions}
            studies={project.studies}
            onChange={(updated) => setProject({ ...project, extractions: updated })}
            onNext={goToNextStage}
            onPrev={goToPrevStage}
            language={language}
          />
        )}

        {currentStage === 'synthesis' && (
          <Stage8Synthesis
            synthesis={project.synthesis}
            studies={project.studies}
            extractions={project.extractions}
            onChange={(updated) => setProject({ ...project, synthesis: updated })}
            onNext={goToNextStage}
            onPrev={goToPrevStage}
            language={language}
          />
        )}

        {currentStage === 'grade' && (
          <Stage9EvidenceCertainty
            grade={project.grade}
            onChange={(updated) => setProject({ ...project, grade: updated })}
            onNext={goToNextStage}
            onPrev={goToPrevStage}
            language={language}
          />
        )}

        {currentStage === 'report' && (
          <Stage10Report
            project={project}
            onChangeReport={(updated) => setProject({ ...project, report: updated })}
            onPrev={goToPrevStage}
            language={language}
          />
        )}
      </Navigation>

      {/* Persistent AI Methodologist Assistant Drawer */}
      <AiDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        currentStage={currentStage}
        project={project}
        language={language}
      />
    </div>
  );
}
