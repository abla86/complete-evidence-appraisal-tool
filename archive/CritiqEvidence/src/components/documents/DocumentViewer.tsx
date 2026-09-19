import React, { useState, useRef, useEffect } from 'react';
import { Study, StudySection } from '@/schemas/study.schema';
import { EvidenceAnchor, ImradSectionType } from '@/types/frameworks';
import { Search, Pin, BookOpen, ExternalLink, Bookmark, Copy, Check } from 'lucide-react';

interface DocumentViewerProps {
  study: Study;
  activeSectionIndex: number;
  onSectionChange: (index: number) => void;
  onAnchorCreated: (anchor: EvidenceAnchor) => void;
  attachedAnchors?: EvidenceAnchor[];
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  study,
  activeSectionIndex,
  onSectionChange,
  onAnchorCreated,
  attachedAnchors = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<ImradSectionType>('METHODS');
  const [selectionRange, setSelectionRange] = useState<{ start?: number; end?: number }>({});
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to selected section when activeSectionIndex changes
  useEffect(() => {
    const target = sectionRefs.current[activeSectionIndex];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSectionIndex]);

  // Handle text selection
  const handleMouseUp = (sectionType: ImradSectionType) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const text = selection.toString().trim();
      if (text.length >= 3) {
        setSelectedText(text);
        setSelectedSection(sectionType);
        return;
      }
    }
  };

  const handleCreateAnchor = () => {
    if (!selectedText) return;
    const anchor: EvidenceAnchor = {
      section: selectedSection,
      quote: selectedText,
      charOffsetStart: selectionRange.start,
      charOffsetEnd: selectionRange.end,
    };
    onAnchorCreated(anchor);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  const handleCopyQuote = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Header bar with metadata & search */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-slate-200 text-[10px] font-bold rounded uppercase">
              PDF: {study.doi ? study.doi.slice(0, 14) : 'PMC88231'}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wide">
              IMRaD Parsed
            </span>
            {study.year && (
              <span className="text-xs text-slate-500 font-medium">({study.year})</span>
            )}
            {study.doi && (
              <a
                href={`https://doi.org/${study.doi}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5 ml-1"
                title="Åpne DOI"
              >
                DOI
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          <h2 className="text-base font-bold text-slate-900 truncate mt-1.5" title={study.title}>
            {study.title}
          </h2>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {study.authors} {study.journal ? `• ${study.journal}` : ''}
          </p>
        </div>

        {/* Search in document */}
        <div className="relative w-full sm:w-60">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk i artikkel..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Floating Selection Tooltip / Action banner */}
      {selectedText && (
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between gap-3 text-xs shadow-md animate-in slide-in-from-top duration-150 border-y border-slate-800">
          <div className="flex items-center gap-2 truncate">
            <Bookmark className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-semibold text-blue-200 uppercase tracking-wide text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {selectedSection}
            </span>
            <span className="truncate italic text-slate-200">«{selectedText}»</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyQuote}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium flex items-center gap-1 transition-colors border border-slate-700 text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Kopiert' : 'Kopier'}
            </button>
            <button
              onClick={handleCreateAnchor}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center gap-1 transition-colors shadow-xs text-xs uppercase tracking-wider"
            >
              <Pin className="w-3.5 h-3.5" />
              Fest sitat
            </button>
            <button
              onClick={() => setSelectedText('')}
              className="text-slate-400 hover:text-white ml-1 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Document Content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {study.sections.map((section, idx) => {
          const isCurrent = activeSectionIndex === idx;
          const sectionAnchors = attachedAnchors.filter((a) => a.section === section.type);

          return (
            <section
              key={idx}
              ref={(el) => {
                sectionRefs.current[idx] = el;
              }}
              onMouseUp={() => handleMouseUp(section.type)}
              className={`p-5 rounded-r-xl border transition-all ${
                isCurrent
                  ? 'border-l-4 border-l-blue-500 bg-blue-50/30 border-t-blue-100 border-r-blue-100 border-b-blue-100 shadow-xs'
                  : 'border-l-4 border-l-slate-200 bg-white border-t-slate-100 border-r-slate-100 border-b-slate-100 hover:border-l-slate-300'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                <h4
                  className={`text-xs font-bold uppercase tracking-wide mb-1 ${
                    isCurrent ? 'text-blue-800' : 'text-slate-400'
                  }`}
                >
                  {section.type} • {section.heading}
                </h4>
                {sectionAnchors.length > 0 && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase tracking-wider">
                    {sectionAnchors.length} bevis forankret
                  </span>
                )}
              </div>

              {/* Section body */}
              <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line select-text">
                {searchQuery ? (
                  highlightSearchTerm(section.content, searchQuery)
                ) : (
                  section.content
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Footer Navigation bar matching Geometric Balance */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
        <button
          type="button"
          disabled={activeSectionIndex === 0}
          onClick={() => onSectionChange(Math.max(0, activeSectionIndex - 1))}
          className="flex-1 py-2 bg-white border border-slate-300 text-xs font-bold rounded shadow-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Previous Section
        </button>
        <button
          type="button"
          disabled={activeSectionIndex === study.sections.length - 1}
          onClick={() => onSectionChange(Math.min(study.sections.length - 1, activeSectionIndex + 1))}
          className="flex-1 py-2 bg-white border border-slate-300 text-xs font-bold rounded shadow-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Next Section
        </button>
      </div>
    </div>
  );
};

function highlightSearchTerm(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-200/60 text-slate-900 rounded px-1 font-medium">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
