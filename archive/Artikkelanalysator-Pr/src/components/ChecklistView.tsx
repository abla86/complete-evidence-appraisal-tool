import React, { useState } from 'react';
import { ArticleAnalysis } from '../types';
import { CheckSquare, CheckCircle, HelpCircle, XCircle, Quote, Filter } from 'lucide-react';

interface ChecklistViewProps {
  analysis: ArticleAnalysis | null;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  analysis,
  onRunAnalysis,
  isAnalyzing
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('Alle');

  if (!analysis) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs">
          <CheckSquare className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Ingen sjekkliste tilgjengelig ennå</h3>
          <p className="text-slate-600 mb-6">
            Vennligst kjør artikkelanalyse først for å generere evidensbaserte sjekklister og sitathenvisninger.
          </p>
          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Start analyse og sjekkliste
          </button>
        </div>
      </div>
    );
  }

  const categories = ['Alle', 'Formål & Design', 'Metode & Utvalg', 'Dataanalyse & Funn', 'Etikk & Konklusjon'];
  const filteredChecklist = filterCategory === 'Alle' 
    ? analysis.checklists 
    : analysis.checklists.filter(c => c.category === filterCategory);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Kritisk Sjekklistevurdering (Evidensbasert)</h2>
          <p className="text-sm text-slate-600 mt-1">
            Evaluering basert på etablerte sjekklister (CASP / COREQ) med konkrete sitathenvisninger fra teksten for å unngå dikting.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filterCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-4">
        {filteredChecklist.map((item, idx) => {
          const isYes = item.answer === 'Ja';
          const isPart = item.answer === 'Delvis';
          return (
            <div key={item.id || idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center space-x-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    isYes ? 'bg-emerald-100 text-emerald-700' : isPart ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {isYes ? <CheckCircle className="w-5 h-5" /> : isPart ? <HelpCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">{item.category}</span>
                    <h3 className="text-base font-bold text-slate-900">{item.question}</h3>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isYes ? 'bg-emerald-100 text-emerald-800' : isPart ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  Svar: {item.answer}
                </span>
              </div>

              <div className="pl-11 space-y-3">
                <div className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="font-bold block text-slate-900 mb-1">Faglig begrunnelse:</span>
                  {item.justification}
                </div>

                {item.evidenceQuote && (
                  <div className="text-xs text-indigo-900 bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 flex items-start space-x-2.5">
                    <Quote className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">Bevis / Sitat fra artikkelen:</span>
                      <p className="italic font-serif">"{item.evidenceQuote}"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
