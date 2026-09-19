import React, { useState, useEffect } from 'react';
import { ChecklistCriterion, CriterionEvaluation, AppraisalResponse, EvidenceAnchor } from '@/types/frameworks';
import { CheckCircle2, HelpCircle, XCircle, MinusCircle, Pin, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export interface ChecklistRunnerProps {
  criteria: ChecklistCriterion[];
  initialEvaluations?: CriterionEvaluation[];
  onSaveCriterion: (evaluation: CriterionEvaluation) => void;
  activeEvidenceAnchor?: EvidenceAnchor | null;
  onClearActiveAnchor?: () => void;
  frameworkTitle?: string;
  checklistCode?: string;
}

export const ChecklistRunner: React.FC<ChecklistRunnerProps> = ({
  criteria,
  initialEvaluations = [],
  onSaveCriterion,
  activeEvidenceAnchor,
  onClearActiveAnchor,
  frameworkTitle = 'Evidensvurdering',
  checklistCode = 'CRITIQ_EVAL_2024',
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [evaluations, setEvaluations] = useState<Record<string, CriterionEvaluation>>(() =>
    Object.fromEntries(initialEvaluations.map((e) => [e.criterionId, e]))
  );

  // Sync if initialEvaluations update
  useEffect(() => {
    if (initialEvaluations.length > 0) {
      setEvaluations(prev => {
        const next = { ...prev };
        for (const ev of initialEvaluations) {
          next[ev.criterionId] = ev;
        }
        return next;
      });
    }
  }, [initialEvaluations]);

  const currentCriterion = criteria[currentIndex] || criteria[0];
  if (!currentCriterion) {
    return <div className="p-6 text-slate-500">Ingen kriterier funnet for dette rammeverket.</div>;
  }

  const currentEvaluation = evaluations[currentCriterion.id] || {
    criterionId: currentCriterion.id,
    response: 'UNCLEAR',
    rationale: '',
    evidenceAnchors: [],
  };

  const handleResponseChange = (response: AppraisalResponse) => {
    const updated: CriterionEvaluation = { ...currentEvaluation, response };
    updateAndSave(updated);
  };

  const handleRationaleChange = (rationale: string) => {
    const updated: CriterionEvaluation = { ...currentEvaluation, rationale };
    updateAndSave(updated);
  };

  const attachActiveEvidence = () => {
    if (!activeEvidenceAnchor) return;
    const exists = currentEvaluation.evidenceAnchors.some(
      (a) => a.quote === activeEvidenceAnchor.quote && a.section === activeEvidenceAnchor.section
    );
    if (!exists) {
      const updated: CriterionEvaluation = {
        ...currentEvaluation,
        evidenceAnchors: [...currentEvaluation.evidenceAnchors, activeEvidenceAnchor],
      };
      updateAndSave(updated);
      if (onClearActiveAnchor) {
        onClearActiveAnchor();
      }
    }
  };

  const removeEvidenceAnchor = (indexToRemove: number) => {
    const updatedAnchors = currentEvaluation.evidenceAnchors.filter((_, i) => i !== indexToRemove);
    const updated: CriterionEvaluation = {
      ...currentEvaluation,
      evidenceAnchors: updatedAnchors,
    };
    updateAndSave(updated);
  };

  const updateAndSave = (evaluation: CriterionEvaluation) => {
    setEvaluations((prev) => ({ ...prev, [evaluation.criterionId]: evaluation }));
    onSaveCriterion(evaluation);
  };

  const getResponseStyle = (val: AppraisalResponse) => {
    const isSelected = currentEvaluation.response === val;
    if (!isSelected) {
      return 'bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50';
    }
    switch (val) {
      case 'YES':
        return 'bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md ring-2 ring-blue-600 ring-offset-2';
      case 'NO':
        return 'bg-rose-600 text-white text-xs font-bold rounded-lg shadow-md ring-2 ring-rose-600 ring-offset-2';
      case 'UNCLEAR':
        return 'bg-amber-500 text-white text-xs font-bold rounded-lg shadow-md ring-2 ring-amber-500 ring-offset-2';
      case 'NOT_APPLICABLE':
        return 'bg-slate-700 text-white text-xs font-bold rounded-lg shadow-md ring-2 ring-slate-700 ring-offset-2';
    }
  };

  const answeredCount = (Object.values(evaluations) as CriterionEvaluation[]).filter(
    (e) => e.rationale.trim().length >= 5 || e.response === 'YES' || e.response === 'NO'
  ).length;
  const progressPercentage = Math.min(100, Math.round((answeredCount / (criteria.length || 1)) * 100));

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header & Geometric Progress Meter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">{frameworkTitle}</h2>
          <p className="text-xs text-slate-500 font-mono tracking-wide mt-0.5">Checklist ID: {checklistCode.toLowerCase()}</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Progress</div>
          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs font-bold text-slate-700 mt-1">
            {answeredCount} / {criteria.length} Criteria
          </div>
        </div>
      </div>

      {/* Main Criterion Card with Geometric Top Border */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-6 flex flex-col gap-4 border-t-4 border-t-blue-600">
        <div className="flex justify-between items-start">
          {currentCriterion.mandatory ? (
            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded tracking-wide uppercase">
              CRITERION {currentIndex + 1} (MANDATORY)
            </span>
          ) : (
            <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded tracking-wide uppercase">
              CRITERION {currentIndex + 1}
            </span>
          )}
          <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">
            {currentCriterion.code}
          </span>
        </div>

        {/* Question & Guide */}
        <h3 className="text-lg font-bold text-slate-800 leading-snug">
          {currentCriterion.questionText}
        </h3>
        {currentCriterion.helpText && (
          <p className="text-sm text-slate-500 italic leading-relaxed">
            Look for: {currentCriterion.helpText}
          </p>
        )}

        {/* Step dots */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {criteria.map((c, idx) => {
            const ev = evaluations[c.id];
            const isDone = ev && (ev.rationale.trim().length >= 5 || ev.response === 'YES' || ev.response === 'NO');
            const resp = ev?.response || 'UNCLEAR';
            const isSelected = currentIndex === idx;
            return (
              <button
                key={c.id}
                onClick={() => setCurrentIndex(idx)}
                title={`${c.code}: ${c.questionText}`}
                className={`w-7 h-7 text-xs font-bold rounded-lg flex items-center justify-center transition-all ${
                  isSelected
                    ? 'ring-2 ring-blue-600 bg-blue-50 text-blue-900 border border-blue-300'
                    : isDone
                    ? resp === 'YES'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : resp === 'NO'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                    : 'text-slate-400 hover:bg-slate-100 border border-transparent'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Response Options */}
        <div className="grid grid-cols-4 gap-2 mt-1">
          {(['YES', 'NO', 'UNCLEAR', 'NOT_APPLICABLE'] as AppraisalResponse[]).map((val) => {
            const label = val === 'NOT_APPLICABLE' ? 'N/A' : val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleResponseChange(val)}
                className={`py-2.5 transition-all text-center uppercase tracking-wider ${getResponseStyle(val)}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Methodological Rationale */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
              Methodological Rationale
            </label>
            <span className="text-[10px] text-slate-400">
              {currentEvaluation.rationale.length}/5 min. chars
            </span>
          </div>
          <textarea
            rows={3}
            value={currentEvaluation.rationale}
            onChange={(e) => handleRationaleChange(e.target.value)}
            placeholder="Explain the reasoning for your assessment based on study evidence..."
            className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all leading-relaxed"
          />
        </div>

        {/* Active Anchor Callout Banner */}
        {activeEvidenceAnchor && (
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 truncate min-w-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0" />
              <span className="text-xs text-blue-900 font-medium truncate">
                Active anchor [{activeEvidenceAnchor.section}]:{' '}
                <span className="italic font-bold">"{activeEvidenceAnchor.quote}"</span>
              </span>
            </div>
            <button
              type="button"
              onClick={attachActiveEvidence}
              className="text-[10px] font-bold bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors uppercase tracking-wider shrink-0"
            >
              ATTACH ANCHOR
            </button>
          </div>
        )}

        {/* Attached Evidence Anchors List */}
        {currentEvaluation.evidenceAnchors.length > 0 && (
          <div className="space-y-2 mt-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Attached Anchors ({currentEvaluation.evidenceAnchors.length})
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {currentEvaluation.evidenceAnchors.map((anchor, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 border border-slate-200 border-l-4 border-l-blue-500 rounded-r-lg text-xs text-slate-700 flex items-start justify-between gap-2"
                >
                  <div className="truncate">
                    <span className="font-bold text-[10px] text-blue-800 uppercase mr-1.5">
                      [{anchor.section}]
                    </span>
                    <span className="italic">"{anchor.quote}"</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEvidenceAnchor(idx)}
                    title="Remove anchor"
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Stepper Buttons */}
      <div className="mt-2 flex justify-between gap-4">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-lg text-sm hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-colors uppercase tracking-wider"
        >
          BACK
        </button>
        <button
          type="button"
          disabled={currentIndex === criteria.length - 1}
          onClick={() => setCurrentIndex((prev) => Math.min(criteria.length - 1, prev + 1))}
          className="flex-[2] py-3 bg-slate-900 text-white font-bold rounded-lg text-sm shadow-xl hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all uppercase tracking-wider flex items-center justify-center gap-2"
        >
          SAVE & NEXT CRITERION
        </button>
      </div>
    </div>
  );
};
