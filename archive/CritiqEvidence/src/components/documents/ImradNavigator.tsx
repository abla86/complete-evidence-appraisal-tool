import React from 'react';
import { ImradSectionType } from '@/types/frameworks';
import { StudySection } from '@/schemas/study.schema';
import { FileText, Compass, CheckCircle } from 'lucide-react';

interface ImradNavigatorProps {
  sections: StudySection[];
  activeSectionIndex: number;
  onSelectSection: (index: number) => void;
  sectionAnchorsCount?: Record<ImradSectionType, number>;
}

const SECTION_COLOR_MAP: Record<ImradSectionType, { bg: string; text: string; border: string }> = {
  ABSTRACT: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  INTRODUCTION: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  METHODS: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  RESULTS: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  DISCUSSION: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  OTHER: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

export const ImradNavigator: React.FC<ImradNavigatorProps> = ({
  sections,
  activeSectionIndex,
  onSelectSection,
  sectionAnchorsCount = {} as Record<ImradSectionType, number>,
}) => {
  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5 text-slate-500" />
          <span>IMRaD-struktur</span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          {sections.length} seksjoner
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {sections.map((sec, idx) => {
          const colors = SECTION_COLOR_MAP[sec.type] || SECTION_COLOR_MAP.OTHER;
          const isActive = activeSectionIndex === idx;
          const anchorsForSec = sectionAnchorsCount[sec.type] || 0;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSection(idx)}
              className={`flex items-center justify-between px-2.5 py-2 text-left rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase ${
                    isActive ? 'bg-slate-800 text-slate-200' : `${colors.bg} ${colors.text} ${colors.border} border`
                  }`}
                >
                  {sec.type.slice(0, 4)}
                </span>
                <span className="truncate">{sec.heading || sec.type}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {anchorsForSec > 0 && (
                  <span
                    title={`${anchorsForSec} sitat(er) forankret i denne seksjonen`}
                    className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800 font-semibold'
                    }`}
                  >
                    <CheckCircle className="w-2.5 h-2.5" />
                    {anchorsForSec}
                  </span>
                )}
                <span className={`text-[10px] ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                  {sec.content.split(/\s+/).filter(Boolean).length} ord
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
