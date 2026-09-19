import React, { useState, useEffect } from 'react';
import { FrameworkType, ChecklistCriterion, CriterionEvaluation, EvidenceAnchor } from '@/types/frameworks';
import { Study } from '@/schemas/study.schema';
import { FullAppraisalRecord, FullAppraisalRecordSchema } from '@/schemas/appraisal.schema';
import { FRAMEWORK_REGISTRY, getFrameworkCriteria } from '@/lib/frameworks';
import { SAMPLE_STUDIES } from '@/lib/sampleStudies';

import { ChecklistRunner } from '@/components/appraisal/ChecklistRunner';
import { EvidenceMatcher } from '@/components/appraisal/EvidenceMatcher';
import { ScoreSummary } from '@/components/appraisal/ScoreSummary';
import { DocumentViewer } from '@/components/documents/DocumentViewer';
import { ImradNavigator } from '@/components/documents/ImradNavigator';
import { ImportStudyModal } from '@/components/documents/ImportStudyModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { exportAppraisalToJson } from '@/lib/export/generateJson';
import { printAppraisalReport } from '@/lib/export/generatePdf';

import {
  FileCheck2,
  BookOpen,
  Pin,
  Award,
  Layers,
  FileUp,
  User,
  CheckCircle2,
  ChevronDown,
  Info,
} from 'lucide-react';

const STORAGE_KEY_APPRAISALS = 'critiq_evidence_appraisals_v1';
const STORAGE_KEY_CURRENT_STUDY = 'critiq_evidence_current_study_v1';
const STORAGE_KEY_CURRENT_FRAMEWORK = 'critiq_evidence_current_framework_v1';
const STORAGE_KEY_EVALUATOR = 'critiq_evidence_evaluator_name_v1';

export default function App() {
  // Current active framework
  const [currentFramework, setCurrentFramework] = useState<FrameworkType>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT_FRAMEWORK);
    return (saved as FrameworkType) || 'CASP_QUALITATIVE';
  });

  // Evaluator Name
  const [evaluatorName, setEvaluatorName] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_EVALUATOR) || 'Anne-Beth Andersen';
  });

  // Current Study
  const [study, setStudy] = useState<Study>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT_STUDY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to sample
      }
    }
    return SAMPLE_STUDIES[0].study;
  });

  // Appraisal Record
  const [appraisal, setAppraisal] = useState<FullAppraisalRecord>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_APPRAISALS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.studyId === study.id && parsed.framework === currentFramework) {
          return parsed;
        }
      } catch {
        // Fallback
      }
    }
    // Return sample appraisal or blank
    const sampleRecord = SAMPLE_STUDIES[0].initialEvaluations;
    if (sampleRecord && study.id === sampleRecord.studyId && currentFramework === sampleRecord.framework) {
      return sampleRecord;
    }

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : 'appraisal-1',
      studyId: study.id,
      framework: currentFramework,
      evaluatorName: 'Anne-Beth Andersen',
      completed: false,
      evaluations: [],
      overallRiskOrQuality: 'MODERATE',
      summaryNotes: '',
      updatedAt: new Date().toISOString(),
    };
  });

  // Active view tab on the right panel
  const [activeTab, setActiveTab] = useState<'checklist' | 'matcher' | 'summary'>('checklist');

  // Active IMRaD section in DocumentViewer
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);

  // Active selected quote/anchor to attach
  const [activeAnchor, setActiveAnchor] = useState<EvidenceAnchor | null>(null);

  // Import Modal visibility
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Synchronize storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENT_FRAMEWORK, currentFramework);
  }, [currentFramework]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENT_STUDY, JSON.stringify(study));
  }, [study]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EVALUATOR, evaluatorName);
  }, [evaluatorName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_APPRAISALS, JSON.stringify(appraisal));
  }, [appraisal]);

  const criteria = getFrameworkCriteria(currentFramework);
  const frameworkMeta = FRAMEWORK_REGISTRY[currentFramework]?.meta;

  // Handle criterion evaluation save from ChecklistRunner
  const handleSaveCriterion = (evaluation: CriterionEvaluation) => {
    setAppraisal((prev) => {
      const existingIdx = prev.evaluations.findIndex((e) => e.criterionId === evaluation.criterionId);
      let newEvaluations: CriterionEvaluation[];
      if (existingIdx >= 0) {
        newEvaluations = [...prev.evaluations];
        newEvaluations[existingIdx] = evaluation;
      } else {
        newEvaluations = [...prev.evaluations, evaluation];
      }

      // Check if all mandatory criteria are answered
      const mandatoryIds = criteria.filter((c) => c.mandatory).map((c) => c.id);
      const allMandatoryAnswered = mandatoryIds.every((mId) => {
        const ev = newEvaluations.find((e) => e.criterionId === mId);
        return ev && ev.rationale.trim().length >= 5 && ev.response !== 'UNCLEAR';
      });

      const updated: FullAppraisalRecord = {
        ...prev,
        evaluations: newEvaluations,
        completed: allMandatoryAnswered,
        updatedAt: new Date().toISOString(),
      };
      return updated;
    });
  };

  // Handle switching framework
  const handleSwitchFramework = (framework: FrameworkType) => {
    setCurrentFramework(framework);
    // Find if we have existing evaluations or create fresh record
    setAppraisal((prev) => {
      return {
        id: crypto.randomUUID ? crypto.randomUUID() : `appraisal-${Date.now()}`,
        studyId: study.id,
        framework,
        evaluatorName,
        completed: false,
        evaluations: [],
        overallRiskOrQuality: 'MODERATE',
        summaryNotes: '',
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Handle study import
  const handleImportStudy = (newStudy: Study, framework: FrameworkType) => {
    setStudy(newStudy);
    setCurrentFramework(framework);

    // If matches a sample study with pre-filled evaluations, load them!
    const sample = SAMPLE_STUDIES.find((s) => s.study.id === newStudy.id);
    if (sample && sample.initialEvaluations) {
      setAppraisal(sample.initialEvaluations);
    } else {
      setAppraisal({
        id: crypto.randomUUID ? crypto.randomUUID() : `appraisal-${Date.now()}`,
        studyId: newStudy.id,
        framework,
        evaluatorName,
        completed: false,
        evaluations: [],
        overallRiskOrQuality: 'MODERATE',
        summaryNotes: '',
        updatedAt: new Date().toISOString(),
      });
    }

    setActiveSectionIndex(0);
    setActiveAnchor(null);
  };

  // When text is selected in DocumentViewer, create an active anchor
  const handleAnchorCreated = (anchor: EvidenceAnchor) => {
    setActiveAnchor(anchor);
    // Automatically switch to checklist so user can pin it!
    setActiveTab('checklist');
  };

  // Link an anchor to a specific criterion from EvidenceMatcher
  const handleLinkAnchorToCriterion = (criterionId: string, anchor: EvidenceAnchor) => {
    const existingEv = appraisal.evaluations.find((e) => e.criterionId === criterionId) || {
      criterionId,
      response: 'YES' as const,
      rationale: 'Forankret basert på tekstbevis i studien.',
      evidenceAnchors: [],
    };

    const exists = existingEv.evidenceAnchors.some(
      (a) => a.quote === anchor.quote && a.section === anchor.section
    );

    if (!exists) {
      const updated: CriterionEvaluation = {
        ...existingEv,
        evidenceAnchors: [...existingEv.evidenceAnchors, anchor],
      };
      handleSaveCriterion(updated);
    }
  };

  // Collect all unique attached anchors across all criteria + active anchor
  const allAnchors: EvidenceAnchor[] = [];
  const anchorQuotesSet = new Set<string>();

  appraisal.evaluations.forEach((ev) => {
    ev.evidenceAnchors.forEach((anc) => {
      if (!anchorQuotesSet.has(anc.quote)) {
        anchorQuotesSet.add(anc.quote);
        allAnchors.push(anc);
      }
    });
  });

  if (activeAnchor && !anchorQuotesSet.has(activeAnchor.quote)) {
    allAnchors.push(activeAnchor);
  }

  // Count anchors per IMRaD section
  const sectionAnchorsCount = allAnchors.reduce((acc, curr) => {
    acc[curr.section] = (acc[curr.section] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const evaluationsMap = Object.fromEntries(appraisal.evaluations.map((e) => [e.criterionId, e]));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* TOP APPLICATION HEADER (Geometric Balance style) */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-lg shadow-sm text-white font-bold text-xl tracking-tight shrink-0">
            CE
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-slate-900">CritiqEvidence</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Evidence Appraisal Engine v1.0
            </p>
          </div>
        </div>

        {/* Center: Framework Switcher */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(['CASP_QUALITATIVE', 'AMSTAR_2', 'AGREE_II', 'COCHRANE_ROB_2'] as FrameworkType[]).map((f) => {
            const meta = FRAMEWORK_REGISTRY[f].meta;
            const isActive = currentFramework === f;
            return (
              <button
                key={f}
                onClick={() => handleSwitchFramework(f)}
                title={`${meta.title}: ${meta.studyType}`}
                className={`px-3 py-1 text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 font-bold shadow-xs rounded-md'
                    : 'text-slate-600 hover:text-slate-900 font-medium rounded-md'
                }`}
              >
                {meta.title}
              </button>
            );
          })}
        </div>

        {/* Right: Evaluator Info & Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors uppercase tracking-wider"
          >
            <FileUp className="w-3.5 h-3.5" />
            Bytt studie
          </button>

          <div className="flex items-center gap-2.5 sm:pl-3 sm:border-l border-slate-200">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Evaluator
              </span>
              <input
                type="text"
                value={evaluatorName}
                onChange={(e) => {
                  setEvaluatorName(e.target.value);
                  setAppraisal((prev) => ({ ...prev, evaluatorName: e.target.value }));
                }}
                className="text-xs sm:text-sm font-medium text-slate-800 text-right bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-24 sm:w-32 truncate"
                placeholder="Dr. S. Andersen"
                title="Evaluator"
              />
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
              {getInitials(evaluatorName)}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Framework Switcher (shown on smaller screens) */}
      <div className="md:hidden bg-white border-b border-slate-200 p-2 overflow-x-auto flex gap-1.5">
        {(['CASP_QUALITATIVE', 'AMSTAR_2', 'AGREE_II', 'COCHRANE_ROB_2'] as FrameworkType[]).map((f) => {
          const meta = FRAMEWORK_REGISTRY[f].meta;
          const isActive = currentFramework === f;
          return (
            <button
              key={f}
              onClick={() => handleSwitchFramework(f)}
              className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {meta.title}
            </button>
          );
        })}
      </div>

      {/* SUB-HEADER / CONTEXT BAR */}
      <div className="bg-slate-50/70 border-b border-slate-200 px-6 sm:px-8 py-2.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-slate-900 truncate">{study.title}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 truncate">{study.authors}</span>
            {study.year && <span className="text-slate-500">({study.year})</span>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-1 bg-slate-200 text-[10px] font-bold rounded uppercase tracking-wide">
              {study.doi ? `DOI: ${study.doi.slice(0, 12)}` : 'PMC88231'}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wide">
              {frameworkMeta.title}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium">
              Kriterier:{' '}
              <strong className="text-slate-900">
                {appraisal.evaluations.filter((e) => e.rationale.length >= 5).length}/{criteria.length}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: IMRaD Navigator & Document Viewer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <ImradNavigator
            sections={study.sections}
            activeSectionIndex={activeSectionIndex}
            onSelectSection={setActiveSectionIndex}
            sectionAnchorsCount={sectionAnchorsCount}
          />

          <div className="h-[750px]">
            <DocumentViewer
              study={study}
              activeSectionIndex={activeSectionIndex}
              onSectionChange={setActiveSectionIndex}
              onAnchorCreated={handleAnchorCreated}
              attachedAnchors={allAnchors}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Appraisal Tools & Checklists (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* View Mode Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl shadow-xs">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'checklist'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Sjekkliste
            </button>
            <button
              onClick={() => setActiveTab('matcher')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'matcher'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              Evidens ({allAnchors.length})
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Rapport & Score
            </button>
          </div>

          {/* TAB CONTENT */}
          {activeTab === 'checklist' && (
            <ChecklistRunner
              criteria={criteria}
              initialEvaluations={appraisal.evaluations}
              onSaveCriterion={handleSaveCriterion}
              activeEvidenceAnchor={activeAnchor}
              onClearActiveAnchor={() => setActiveAnchor(null)}
              frameworkTitle={frameworkMeta.title}
              checklistCode={frameworkMeta.shortCode || currentFramework}
            />
          )}

          {activeTab === 'matcher' && (
            <EvidenceMatcher
              anchors={allAnchors}
              criteria={criteria}
              evaluations={evaluationsMap}
              onLinkAnchorToCriterion={handleLinkAnchorToCriterion}
              onSelectCriterion={() => setActiveTab('checklist')}
            />
          )}

          {activeTab === 'summary' && (
            <ScoreSummary
              appraisal={appraisal}
              criteria={criteria}
              study={study}
              onUpdateAppraisal={(partial) => {
                setAppraisal((prev) => ({
                  ...prev,
                  ...partial,
                  updatedAt: new Date().toISOString(),
                }));
              }}
            />
          )}
        </div>
      </main>

      {/* FOOTER BAR (Geometric Balance style) */}
      <footer className="h-12 bg-white border-t border-slate-200 px-6 sm:px-8 flex items-center justify-between text-xs sticky bottom-0 z-20">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Local Storage Active</span>
          </div>
          <span className="text-slate-300">|</span>
          <span>Sist lagret: {new Date(appraisal.updatedAt).toLocaleTimeString('no-NO')}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportAppraisalToJson(appraisal, study)}
            className="px-3 py-1.5 bg-slate-100 font-bold text-slate-700 rounded-lg hover:bg-slate-200 transition-colors uppercase tracking-wider text-[11px]"
          >
            Export JSON
          </button>
          <button
            onClick={() => printAppraisalReport(appraisal, study, criteria)}
            className="px-3 py-1.5 bg-blue-600 font-bold text-white rounded-lg hover:bg-blue-700 transition-colors uppercase tracking-wider text-[11px] shadow-sm"
          >
            Generate PDF
          </button>
        </div>
      </footer>

      {/* STUDY IMPORT MODAL */}
      <ImportStudyModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportStudy={handleImportStudy}
      />
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
