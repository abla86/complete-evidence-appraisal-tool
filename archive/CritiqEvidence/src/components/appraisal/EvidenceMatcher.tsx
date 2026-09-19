import React, { useState } from 'react';
import { EvidenceAnchor, ChecklistCriterion, CriterionEvaluation, ImradSectionType } from '@/types/frameworks';
import { Pin, Filter, Plus, Check, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface EvidenceMatcherProps {
  anchors: EvidenceAnchor[];
  criteria: ChecklistCriterion[];
  evaluations: Record<string, CriterionEvaluation>;
  onLinkAnchorToCriterion: (criterionId: string, anchor: EvidenceAnchor) => void;
  onSelectCriterion?: (criterionId: string) => void;
}

export const EvidenceMatcher: React.FC<EvidenceMatcherProps> = ({
  anchors,
  criteria,
  evaluations,
  onLinkAnchorToCriterion,
  onSelectCriterion,
}) => {
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');
  const [targetCriterionId, setTargetCriterionId] = useState<string>(criteria[0]?.id || '');
  const [manualQuote, setManualQuote] = useState('');
  const [manualSection, setManualSection] = useState<ImradSectionType>('METHODS');
  const [isAddingManual, setIsAddingManual] = useState(false);

  const filteredAnchors = selectedSectionFilter === 'ALL'
    ? anchors
    : anchors.filter(a => a.section === selectedSectionFilter);

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuote.trim() || !targetCriterionId) return;
    const newAnchor: EvidenceAnchor = {
      section: manualSection,
      quote: manualQuote.trim(),
    };
    onLinkAnchorToCriterion(targetCriterionId, newAnchor);
    setManualQuote('');
    setIsAddingManual(false);
  };

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl p-5 shadow-lg border-t-4 border-t-blue-600">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Pin className="w-4 h-4 text-blue-600" />
            Evidensforankring & Sitatoversikt
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Koble tekstbevis fra studien direkte til metodiske sjekklistekriterier.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAddingManual(!isAddingManual)}
        >
          {isAddingManual ? 'Avbryt' : '+ Legg til manuelt sitat'}
        </Button>
      </div>

      {isAddingManual && (
        <form onSubmit={handleAddManual} className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
          <div className="font-semibold text-slate-800">Fest manuelt sitat:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">IMRaD-seksjon:</label>
              <select
                value={manualSection}
                onChange={(e) => setManualSection(e.target.value as ImradSectionType)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
              >
                <option value="ABSTRACT">Abstract</option>
                <option value="INTRODUCTION">Introduction</option>
                <option value="METHODS">Methods</option>
                <option value="RESULTS">Results</option>
                <option value="DISCUSSION">Discussion</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Knytt til kriterium:</label>
              <select
                value={targetCriterionId}
                onChange={(e) => setTargetCriterionId(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs truncate"
              >
                {criteria.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code}: {c.questionText.slice(0, 45)}...
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Sitat fra studien:</label>
            <textarea
              rows={2}
              value={manualQuote}
              onChange={(e) => setManualQuote(e.target.value)}
              placeholder="Lim inn nøyaktig sitat her..."
              className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="primary" type="submit">
              Fest sitat
            </Button>
          </div>
        </form>
      )}

      {/* Filter by section */}
      <div className="flex items-center gap-1.5 my-3 overflow-x-auto pb-1 text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
        <span className="text-slate-500 text-[11px] mr-1">Filter:</span>
        {['ALL', 'ABSTRACT', 'INTRODUCTION', 'METHODS', 'RESULTS', 'DISCUSSION', 'OTHER'].map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => setSelectedSectionFilter(sec)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              selectedSectionFilter === sec
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Anchor list */}
      {filteredAnchors.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          Ingen forankrede sitater {selectedSectionFilter !== 'ALL' ? `i ${selectedSectionFilter}` : ''} ennå.
          <p className="mt-1 text-slate-400">Marker setninger i artikkelen for å forankre evidens.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {filteredAnchors.map((anchor, idx) => {
            // Find which criteria this anchor is currently attached to
            const linkedCriteria = criteria.filter(c => {
              const ev = evaluations[c.id];
              return ev?.evidenceAnchors.some(a => a.quote === anchor.quote);
            });

            return (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <Badge variant="blue" size="sm">
                    {anchor.section}
                  </Badge>
                  {linkedCriteria.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-0.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Knyttet til:
                      </span>
                      {linkedCriteria.map(lc => (
                        <button
                          key={lc.id}
                          onClick={() => onSelectCriterion?.(lc.id)}
                          className="font-bold text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded hover:bg-emerald-200"
                        >
                          {lc.code}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-amber-700 font-medium">Ikke knyttet til kriterium</span>
                  )}
                </div>

                <p className="text-slate-800 italic leading-relaxed">«{anchor.quote}»</p>

                {/* Quick link selector if not linked to current selection */}
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500">Knytt til et kriterium:</span>
                  <div className="flex items-center gap-1.5">
                    <select
                      className="text-[11px] p-1 bg-white border border-slate-300 rounded max-w-[160px] truncate"
                      onChange={(e) => {
                        if (e.target.value) {
                          onLinkAnchorToCriterion(e.target.value, anchor);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Velg kriterium...</option>
                      {criteria.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
