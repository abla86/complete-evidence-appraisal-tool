import React, { useState } from 'react';
import { ArticleData } from '../types';
import { Search, Sparkles, BookOpen, Quote, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

interface QaSearchComponentProps {
  selectedArticle: ArticleData;
}

interface QaResult {
  answer: string;
  matchedQuote: string;
  referenceSource: string;
  category: string;
}

export const QaSearchComponent: React.FC<QaSearchComponentProps> = ({ selectedArticle }) => {
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<QaResult | null>(null);
  const [showArticleTextHighlight, setShowArticleTextHighlight] = useState<boolean>(false);

  const predefinedQuestions = [
    'Hva er studiens hovedfunn og teoretiske modell?',
    'Hvordan ble utvalget og datainnsamlingen gjennomført?',
    'Hvilke metodiske begrensninger eller svakheter trekkes fram?',
    'Hvordan ble etiske hensyn og taushetsplikt håndtert?'
  ];

  const handleAskQuestion = async (qToAsk?: string) => {
    const query = qToAsk || question;
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);
    setShowArticleTextHighlight(false);

    try {
      const res = await fetch('/api/qa-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleTitle: selectedArticle.title,
          articleText: `${selectedArticle.abstract}\n\n${selectedArticle.fullText}`,
          question: query
        })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert(data.error || 'Kunne ikke finne svar.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Nettverkfeil under søk.');
    } finally {
      setLoading(false);
    }
  };

  const fullArticleText = `${selectedArticle.abstract}\n\n${selectedArticle.fullText}`;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 mb-2">
            Interaktivt Spørsmål & Svar (Sanntids kildehenvisning & Fargekoding)
          </span>
          <h2 className="text-xl font-bold text-slate-900">Still egne spørsmål til {selectedArticle.title}</h2>
          <p className="text-sm text-slate-600 mt-1">
            Skriv et spørsmål om metode, utvalg, funn eller etikk. Systemet henter svar med fargekodede sitater og direkte lenke til kilden i teksten.
          </p>
        </div>

        {/* Quick questions pills */}
        <div className="flex flex-wrap gap-2 pt-2">
          {predefinedQuestions.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(pq);
                handleAskQuestion(pq);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
            >
              {pq}
            </button>
          ))}
        </div>

        <div className="flex space-x-3 pt-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
            placeholder="F.eks. Hva var begrunnelsen for å velge semi-strukturerte intervjuer?"
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-sm"
          />
          <button
            onClick={() => handleAskQuestion()}
            disabled={loading || !question.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Søker i teksten...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Finn svar & kilde</span>
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Answer Box */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-indigo-600 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full">
                Kategori: {result.category}
              </span>
              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-lg">
                Kilde: {result.referenceSource}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Faglig svar på ditt spørsmål:</h3>
              <p className="text-slate-800 leading-relaxed text-base">{result.answer}</p>
            </div>

            {/* Color-coded matched quote with click action */}
            <div 
              onClick={() => setShowArticleTextHighlight(!showArticleTextHighlight)}
              className="bg-amber-50/90 p-5 rounded-xl border border-amber-300 shadow-xs cursor-pointer hover:bg-amber-100/60 transition-all space-y-2 group"
            >
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-amber-800">
                <div className="flex items-center space-x-2">
                  <Quote className="w-4 h-4 text-amber-600" />
                  <span>Verifisert sitat / Fargekodet tekstfunn (Klikk for å vise i artikkel)</span>
                </div>
                <ExternalLink className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
              <p className="italic font-serif bg-amber-200/50 p-3.5 rounded-lg border border-amber-300 text-slate-900 text-sm">
                "{result.matchedQuote}"
              </p>
            </div>

            {/* Highlighted context in article text */}
            {showArticleTextHighlight && (
              <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl space-y-3 animate-fade-in">
                <div className="flex justify-between items-center text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  <span>Artikkelkontekst (Sitat fremhevet i gult/gull)</span>
                  <button 
                    onClick={() => setShowArticleTextHighlight(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Lukk
                  </button>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 max-h-72 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {fullArticleText.split(result.matchedQuote).map((part, i, arr) => (
                    <React.Fragment key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <mark className="bg-amber-300 text-slate-950 font-bold px-1 rounded">
                          {result.matchedQuote}
                        </mark>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

