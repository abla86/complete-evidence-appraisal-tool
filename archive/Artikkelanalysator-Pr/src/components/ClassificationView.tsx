import React from 'react';
import { ArticleAnalysis, ArticleData } from '../types';
import { Layers, Award, FileText, CheckCircle2, AlertTriangle, Compass, Target } from 'lucide-react';

interface ClassificationViewProps {
  analysis: ArticleAnalysis | null;
  article: ArticleData;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
}

export const ClassificationView: React.FC<ClassificationViewProps> = ({
  analysis,
  article,
  isAnalyzing,
  onRunAnalysis
}) => {
  if (!analysis) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
          <Layers className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Ingen analyse utført ennå</h3>
          <p className="text-slate-600 mb-6">
            Klikk på knappen under for å la AI analysere klassifisering, teoretisk rammeverk og oppsummering for denne artikkelen.
          </p>
          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center space-x-2"
          >
            <span>Start analyse av artikkeltype</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 mb-2">
              Klassifisert som: {analysis.articleType}
            </span>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">{article.title}</h2>
            <p className="text-sm text-slate-500 mt-1">{article.authors} — <span className="italic">{article.journal} ({article.year})</span></p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center min-w-[140px]">
            <span className="text-xs text-slate-500 block font-medium">Metodisk kvalitetsklageskår</span>
            <span className="text-2xl font-black text-indigo-600">{analysis.methodologicalQualityScore} / 100</span>
          </div>
        </div>

        {/* Type justification */}
        <div className="mt-6 space-y-4">
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <h4 className="text-sm font-bold text-indigo-900 flex items-center space-x-2 mb-1">
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Begrunnelse for artikkeltype ({analysis.articleType})</span>
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.typeJustification}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-1">
              <Target className="w-4 h-4 text-slate-600" />
              <span>Teoretisk rammeverk / Teoretisk forankring</span>
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.theoreticalFramework}</p>
          </div>
        </div>
      </div>

      {/* Structured Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-100">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Bakgrunn & Hensikt</span>
          </h3>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Bakgrunn</h5>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary.background}</p>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Studiens hensikt</h5>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary.objective}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Metode & Resultater</span>
          </h3>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Metodisk tilnærming</h5>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary.methods}</p>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Hovedfunn</h5>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.summary.results}</p>
          </div>
        </div>
      </div>

      {/* Conclusion & Implications */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-2">Konklusjon & Praktiske Implikasjoner</h3>
        <p className="text-sm text-slate-700 leading-relaxed mb-4">{analysis.summary.conclusion}</p>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-sm text-emerald-900">
          <span className="font-bold block mb-1">Betydning for praksis:</span>
          {analysis.practicalImplications}
        </div>
      </div>

      {/* Strengths & Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Styrker ved artikkelen</span>
          </h4>
          <ul className="space-y-2">
            {analysis.strengths.map((s, idx) => (
              <li key={idx} className="text-sm text-slate-700 flex items-start space-x-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Begrensninger & Methodiske svakheter</span>
          </h4>
          <ul className="space-y-2">
            {analysis.limitations.map((l, idx) => (
              <li key={idx} className="text-sm text-slate-700 flex items-start space-x-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
