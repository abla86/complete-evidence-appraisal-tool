import React, { useState } from 'react';
import { PRELOADED_ARTICLES } from '../data/articles';
import { ComparisonResult, ArticleData } from '../types';
import { ArrowRightLeft, Sparkles, CheckCircle2 } from 'lucide-react';

interface ComparisonViewProps {
  onCompare: (art1: ArticleData, art2: ArticleData) => void;
  comparisonResult: ComparisonResult | null;
  isComparing: boolean;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  onCompare,
  comparisonResult,
  isComparing
}) => {
  const [art1, setArt1] = useState<ArticleData>(PRELOADED_ARTICLES[0]);
  const [art2, setArt2] = useState<ArticleData>(PRELOADED_ARTICLES[1]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Sammenligningsstudio (Artikkel 1 vs. Artikkel 2)</h2>
        <p className="text-sm text-slate-600 mb-6">
          Sammenlign de to vedlagte artiklene (eller egne studier) på tvers av hensikt, metode, teoretisk rammeverk og resultater.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Artikkel 1</label>
            <select
              value={art1.id}
              onChange={(e) => {
                const found = PRELOADED_ARTICLES.find(a => a.id === e.target.value);
                if (found) setArt1(found);
              }}
              className="w-full bg-white px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-900"
            >
              {PRELOADED_ARTICLES.map(a => (
                <option key={a.id} value={a.id}>{a.title} ({a.year})</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2 italic">{art1.authors}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Artikkel 2</label>
            <select
              value={art2.id}
              onChange={(e) => {
                const found = PRELOADED_ARTICLES.find(a => a.id === e.target.value);
                if (found) setArt2(found);
              }}
              className="w-full bg-white px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-900"
            >
              {PRELOADED_ARTICLES.map(a => (
                <option key={a.id} value={a.id}>{a.title} ({a.year})</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2 italic">{art2.authors}</p>
          </div>
        </div>

        <button
          onClick={() => onCompare(art1, art2)}
          disabled={isComparing}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
        >
          {isComparing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Utfører strukturert sammenligning...</span>
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-4 h-4" />
              <span>Start sammenligning av de to artiklene</span>
            </>
          )}
        </button>
      </div>

      {comparisonResult && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>{comparisonResult.comparisonTitle}</span>
            </h3>

            <div className="space-y-6">
              {comparisonResult.aspects.map((aspect, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                  <h4 className="text-base font-bold text-indigo-900 border-b border-slate-200 pb-2">{aspect.title}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                      <span className="text-xs font-bold text-slate-400 block mb-1">Artikkel 1: {art1.journal}</span>
                      <p className="text-slate-700 leading-relaxed">{aspect.article1Text}</p>
                    </div>

                    <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                      <span className="text-xs font-bold text-slate-400 block mb-1">Artikkel 2: {art2.journal}</span>
                      <p className="text-slate-700 leading-relaxed">{aspect.article2Text}</p>
                    </div>
                  </div>

                  <div className="bg-indigo-50/70 p-3.5 rounded-lg border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                    <span className="font-bold block mb-1">Metodisk analyse & Syntese:</span>
                    {aspect.analysis}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Overordnet konklusjon & Syntese</span>
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">{comparisonResult.conclusion}</p>
          </div>
        </div>
      )}
    </div>
  );
};
