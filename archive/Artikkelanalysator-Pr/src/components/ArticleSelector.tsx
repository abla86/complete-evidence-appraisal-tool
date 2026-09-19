import React, { useState } from 'react';
import { ArticleData } from '../types';
import { PRELOADED_ARTICLES } from '../data/articles';
import { BookOpen, FileText, Sparkles, Upload, CheckCircle2, ArrowRight } from 'lucide-react';

interface ArticleSelectorProps {
  selectedArticle: ArticleData;
  onSelectArticle: (article: ArticleData) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  customTitle: string;
  setCustomTitle: (t: string) => void;
  customText: string;
  setCustomText: (t: string) => void;
  isCustom: boolean;
  setIsCustom: (c: boolean) => void;
}

export const ArticleSelector: React.FC<ArticleSelectorProps> = ({
  selectedArticle,
  onSelectArticle,
  onRunAnalysis,
  isAnalyzing,
  customTitle,
  setCustomTitle,
  customText,
  setCustomText,
  isCustom,
  setIsCustom
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'preloaded' | 'custom'>('preloaded');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCustomTitle(file.name.replace(/\.[^/.]+$/, ""));
        setCustomText(content);
        setIsCustom(true);
        setActiveSubTab('custom');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Velg eller last opp artikkel for kritisk vurdering</h2>
        <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
          Verktøyet er klargjort med de to vedlagte artiklene (Øverhaug 2024 og Sahota 2026) samt mulighet for å laste opp egne filer (.txt, .md, .doc) eller skrive inn tekst.
        </p>
      </div>

      {/* Tabs for preloaded vs custom */}
      <div className="flex justify-center mb-6">
        <div className="bg-slate-100 p-1 rounded-xl flex space-x-1">
          <button
            onClick={() => {
              setActiveSubTab('preloaded');
              setIsCustom(false);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === 'preloaded'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vedlagte PDF-artikler (2)
          </button>
          <button
            onClick={() => {
              setActiveSubTab('custom');
              setIsCustom(true);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === 'custom'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last opp fil / Lim inn tekst
          </button>
        </div>
      </div>

      {activeSubTab === 'preloaded' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {PRELOADED_ARTICLES.map((art) => {
            const isSelected = !isCustom && selectedArticle.id === art.id;
            return (
              <div
                key={art.id}
                onClick={() => {
                  setIsCustom(false);
                  onSelectArticle(art);
                }}
                className={`bg-white rounded-2xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md ${
                  isSelected ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                      {art.journal} ({art.year})
                    </span>
                    {isSelected && (
                      <span className="flex items-center text-indigo-600 text-xs font-bold space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Valgt</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{art.title}</h3>
                  <p className="text-xs text-slate-500 mb-3 font-medium">{art.authors}</p>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4">{art.abstract}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono">DOI: {art.doi}</span>
                  <span className="text-indigo-600 font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                    Analyser denne <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-8 space-y-6">
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors bg-slate-50">
            <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900">Last opp dokument fra maskinen</h4>
            <p className="text-xs text-slate-500 mt-1 mb-3">Støtter .txt, .md, .doc, og tekstfiler</p>
            <label className="inline-flex px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
              <span>Velg fil</span>
              <input type="file" accept=".txt,.md,.doc,.docx" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Artikkeltittel</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="F.eks. Tittel på vitenskapelig artikkel eller faglitteratur"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Artikkeltekst / Sammendrag / Utdrag</label>
              <textarea
                rows={8}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Lim inn abstrakt, introduksjon, metode og funn her..."
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-sm font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action button to trigger AI evaluation */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between shadow-lg">
        <div className="mb-4 sm:mb-0">
          <h4 className="text-lg font-bold flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Start grundig sjekklistebasert AI-vurdering</span>
          </h4>
          <p className="text-slate-300 text-sm mt-1">
            Systemet klassifiserer artikkeltype, vurderer teoretisk rammeverk og sjekker alle kriterier med evidens.
          </p>
        </div>
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 whitespace-nowrap"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyserer...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Kjør komplett analyse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

