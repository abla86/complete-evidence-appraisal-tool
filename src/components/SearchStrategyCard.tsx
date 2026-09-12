import React, { useState } from 'react';
import { 
  Search, 
  Copy, 
  Check, 
  Terminal, 
  Tag, 
  SlidersHorizontal, 
  ExternalLink,
  Database
} from 'lucide-react';
import { SearchStrategy } from '../types';

interface SearchStrategyCardProps {
  strategy: SearchStrategy;
}

export const SearchStrategyCard: React.FC<SearchStrategyCardProps> = ({ strategy }) => {
  const [copied, setCopied] = useState(false);

  const copyQuery = () => {
    navigator.clipboard.writeText(strategy.booleanQuery);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 rounded uppercase">
              Agent 2: Search Strategy Agent
            </span>
            <span className="text-xs text-slate-400">Trinn 2 av 6</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            Litteratursøkestrategi & Boolske søkestrenger
          </h3>
          <p className="text-xs text-slate-400">
            Formulering av MeSH-deskriptorer, fritekstsynonymer og studiedesignfiltre for PubMed og Cochrane
          </p>
        </div>

        <button
          type="button"
          onClick={copyQuery}
          className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Kopiert til utklipp</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Kopier PubMed-streng</span>
            </>
          )}
        </button>
      </div>

      {/* Boolean Query Box */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Terminal className="w-3.5 h-3.5" /> PubMed (MEDLINE) Boolsk Søkestreng:
          </span>
          <span className="text-[11px] text-slate-500">Klar til innsending via E-utilities API</span>
        </div>
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto selection:bg-emerald-900">
          {strategy.booleanQuery}
        </div>
      </div>

      {/* Grid of MeSH, Free Text & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* MeSH Terms */}
        <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 mb-2">
            <Tag className="w-3.5 h-3.5" />
            <span>Kontrollerte MeSH-termer</span>
          </div>
          <ul className="space-y-1.5">
            {strategy.meshTerms.map((mesh, i) => (
              <li key={i} className="text-xs text-slate-300 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800/80">
                {mesh}
              </li>
            ))}
          </ul>
        </div>

        {/* Free Text Keywords */}
        <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 mb-2">
            <Search className="w-3.5 h-3.5" />
            <span>Fritekstsøk (Tittel / Abstrakt)</span>
          </div>
          <ul className="space-y-1.5">
            {strategy.freeTextKeywords.map((kw, i) => (
              <li key={i} className="text-xs text-slate-300 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800/80">
                {kw}
              </li>
            ))}
          </ul>
        </div>

        {/* Limits and Filters */}
        <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Metodologiske filtre (Limits)</span>
          </div>
          <ul className="space-y-1.5">
            {strategy.limitsAndFilters.map((flt, i) => (
              <li key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>{flt}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Cochrane Strategy Section */}
      <div className="mt-4 p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-semibold text-slate-300 block">Cochrane Library (CENTRAL) syntaks:</span>
          <code className="text-[11px] text-slate-400 font-mono">
            {strategy.cochraneStrategy.replace('\n', ' ')}
          </code>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-400">Aktive databaser:</span>
          {strategy.targetDatabases.map((db, i) => (
            <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
              {db}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
