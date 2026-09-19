import React, { useState } from 'react';
import { BookOpen, Highlighter, CheckCircle, Info, Sparkles, Filter } from 'lucide-react';
import { ChecklistItem, EvidenceHighlight } from '../types';

interface ArticleViewerWithHighlightsProps {
  title: string;
  authors: string;
  journal: string;
  year: number;
  fullText: string;
  checklists: ChecklistItem[];
  highlights?: EvidenceHighlight[];
}

export const ArticleViewerWithHighlights: React.FC<ArticleViewerWithHighlightsProps> = ({
  title,
  authors,
  journal,
  year,
  fullText,
  checklists,
  highlights = []
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  // Map categories to color schemes
  const categoryColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    'Formål & Design': {
      bg: 'bg-indigo-50 hover:bg-indigo-100',
      border: 'border-indigo-300',
      text: 'text-indigo-900',
      badge: 'bg-indigo-600 text-white'
    },
    'Metode & Utvalg': {
      bg: 'bg-emerald-50 hover:bg-emerald-100',
      border: 'border-emerald-300',
      text: 'text-emerald-900',
      badge: 'bg-emerald-600 text-white'
    },
    'Dataanalyse & Funn': {
      bg: 'bg-amber-50 hover:bg-amber-100',
      border: 'border-amber-300',
      text: 'text-amber-900',
      badge: 'bg-amber-600 text-white'
    },
    'Etikk & Konklusjon': {
      bg: 'bg-purple-50 hover:bg-purple-100',
      border: 'border-purple-300',
      text: 'text-purple-900',
      badge: 'bg-purple-600 text-white'
    }
  };

  // Compile active checklist quotes as highlights if no explicit highlights array exists
  const effectiveHighlights: EvidenceHighlight[] = highlights.length > 0 ? highlights : checklists
    .filter(item => item.evidenceQuote && item.evidenceQuote.trim().length > 5)
    .map((item, idx) => ({
      id: `hl-${idx}-${item.id}`,
      questionId: item.id,
      category: item.category,
      quote: item.evidenceQuote,
      color: categoryColors[item.category]?.badge || 'bg-blue-600 text-white'
    }));

  const filteredChecklistItems = checklists.filter(item => {
    if (selectedCategoryFilter === 'All') return true;
    return item.category === selectedCategoryFilter;
  });

  // Render text with highlighted quotes
  const renderAnnotatedText = () => {
    if (!fullText) return <p className="text-slate-500 italic">Ingen fulltekst tilgjengelig for visning.</p>;

    if (effectiveHighlights.length === 0) {
      return <div className="whitespace-pre-wrap font-serif text-slate-800 leading-relaxed text-sm">{fullText}</div>;
    }

    // Sort highlights by length descending to match longest substrings first
    const activeHighlights = effectiveHighlights.filter(h => 
      selectedCategoryFilter === 'All' || h.category === selectedCategoryFilter
    );

    let content = fullText;
    
    return (
      <div className="space-y-4 font-serif text-slate-800 leading-relaxed text-sm">
        {fullText.split('\n\n').map((paragraph, pIdx) => {
          // Check if paragraph contains any highlight quotes
          let paragraphContent: React.ReactNode = paragraph;
          
          const matchingHighlights = activeHighlights.filter(h => paragraph.includes(h.quote));

          if (matchingHighlights.length > 0) {
            // Split paragraph by quotes
            let parts: Array<{ type: 'text' | 'highlight'; text: string; highlight?: EvidenceHighlight }> = [{ type: 'text', text: paragraph }];
            
            matchingHighlights.forEach(h => {
              const newParts: typeof parts = [];
              parts.forEach(part => {
                if (part.type === 'highlight') {
                  newParts.push(part);
                  return;
                }
                const idx = part.text.indexOf(h.quote);
                if (idx !== -1) {
                  if (idx > 0) newParts.push({ type: 'text', text: part.text.slice(0, idx) });
                  newParts.push({ type: 'highlight', text: h.quote, highlight: h });
                  if (idx + h.quote.length < part.text.length) {
                    newParts.push({ type: 'text', text: part.text.slice(idx + h.quote.length) });
                  }
                } else {
                  newParts.push(part);
                }
              });
              parts = newParts;
            });

            paragraphContent = parts.map((part, ptIdx) => {
              if (part.type === 'highlight' && part.highlight) {
                const h = part.highlight;
                const colors = categoryColors[h.category] || { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', badge: 'bg-blue-600' };
                const isSelected = activeHighlightId === h.id;
                return (
                  <mark
                    key={ptIdx}
                    onClick={() => setActiveHighlightId(isSelected ? null : h.id)}
                    className={`cursor-pointer px-1.5 py-0.5 rounded-md border transition-all duration-200 ${colors.bg} ${colors.border} ${colors.text} ${isSelected ? 'ring-2 ring-indigo-600 font-bold shadow-sm' : ''}`}
                    title={`Kategori: ${h.category} (Klikk for å se svar i sjekklisten)`}
                  >
                    {part.text}
                    <span className="ml-1 text-[10px] uppercase font-sans font-extrabold px-1 py-0.2 rounded bg-white/80 border border-slate-200 text-slate-700">
                      {h.category.split(' ')[0]}
                    </span>
                  </mark>
                );
              }
              return part.text;
            });
          }

          return (
            <p key={pIdx} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:bg-white transition-colors">
              {paragraphContent}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
      {/* Article text column */}
      <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-4 max-h-[750px] overflow-y-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-1">
              <BookOpen className="w-3.5 h-3.5 mr-1" /> Artikkeltekst med Fargekodet Evidens-Sporing
            </span>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{authors} ({year}) • {journal}</p>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-700">
            <Filter className="w-3.5 h-3.5 ml-1 text-slate-400" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              aria-label="Filtrer etter kategori"
              className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
            >
              <option value="All">Alle kategorier ({effectiveHighlights.length})</option>
              <option value="Formål & Design">Formål & Design</option>
              <option value="Metode & Utvalg">Metode & Utvalg</option>
              <option value="Dataanalyse & Funn">Dataanalyse & Funn</option>
              <option value="Etikk & Konklusjon">Etikk & Konklusjon</option>
            </select>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start space-x-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Slik fungerer fargekodingen:</strong> Markerte avsnitt viser nøyaktig hvor i artikkelteksten svarene og sitatene i sjekklisten er hentet fra. Klikk på et uthevet avsnitt for å filtrere eller se tilhørende sjekklistepunkt.
          </div>
        </div>

        {renderAnnotatedText()}
      </div>

      {/* Checklist matching column */}
      <div className="lg:col-span-5 p-6 bg-slate-50/50 space-y-4 max-h-[750px] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Highlighter className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">Sjekklistepunkter & Sitater</h4>
          </div>
          <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-semibold">
            {filteredChecklistItems.length}punkter
          </span>
        </div>

        <div className="space-y-3">
          {filteredChecklistItems.map((item) => {
            const isHighlighted = effectiveHighlights.some(h => h.questionId === item.id && (activeHighlightId === h.id || !activeHighlightId));
            const colors = categoryColors[item.category] || { bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-800', badge: 'bg-slate-600 text-white' };
            
            return (
              <div
                key={item.id}
                onClick={() => {
                  const match = effectiveHighlights.find(h => h.questionId === item.id);
                  if (match) setActiveHighlightId(match.id);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  activeHighlightId && effectiveHighlights.some(h => h.questionId === item.id && h.id === activeHighlightId)
                    ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-xs'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                    {item.category}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    item.answer === 'Ja' ? 'bg-emerald-100 text-emerald-800' :
                    item.answer === 'Delvis' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {item.answer}
                  </span>
                </div>

                <p className="text-xs font-semibold text-slate-900 mb-2">{item.question}</p>
                
                {item.evidenceQuote ? (
                  <div className={`p-2.5 rounded-lg border text-xs italic ${colors.bg} ${colors.border} ${colors.text} mb-2`}>
                    <span className="font-sans font-bold block text-[10px] uppercase opacity-75 not-italic mb-0.5">Bevissitat fra artikkel:</span>
                    "{item.evidenceQuote}"
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic mb-2">Ingen direkte sitat knyttet til dette punktet.</div>
                )}

                <p className="text-xs text-slate-600">
                  <strong className="text-slate-800">Vurdering:</strong> {item.justification}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
