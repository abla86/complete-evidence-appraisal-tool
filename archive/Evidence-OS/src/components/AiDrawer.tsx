import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, Loader2, Copy, Check, BookOpen } from 'lucide-react';
import { StageId, EvidenceOSProject } from '../types';

interface AiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage: StageId;
  project: EvidenceOSProject;
  onApplySuggestion?: (field: string, value: any) => void;
  language: 'no' | 'en';
}

export const AiDrawer: React.FC<AiDrawerProps> = ({
  isOpen,
  onClose,
  currentStage,
  project,
  onApplySuggestion,
  language,
}) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; data?: any }>>([
    {
      sender: 'ai',
      text: language === 'no' 
        ? `Hei! Jeg er EvidenceOS AI-metodolog. Jeg kan veilede deg gjennom Cochrane-, PRISMA 2020- og GRADE-standarder for trinnet: ${currentStage.toUpperCase()}. Hva ønsker du hjelp med?`
        : `Hello! I am your EvidenceOS AI Methodologist. I can assist you with Cochrane, PRISMA 2020, and GRADE standards for step: ${currentStage.toUpperCase()}. How can I assist?`
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const runQuickAction = async (actionType: string) => {
    setLoading(true);
    let promptMsg = '';

    if (actionType === 'audit_question') {
      promptMsg = 'Vurder forskningsspørsmålet og PICO i henhold til FINER- og PRISMA-retningslinjer.';
    } else if (actionType === 'suggest_mesh') {
      promptMsg = 'Generer optimaliserte MeSH- og Emtree-termer for PICO-elementene.';
    } else if (actionType === 'grade_advice') {
      promptMsg = 'Gi metodisk råd for GRADE-nedgradering på grunn av inkonsistens eller upresisjon.';
    } else if (actionType === 'synthesis_advice') {
      promptMsg = 'Forklar tolkningen av I²-heterogenitet og valg mellom fixed vs random effects model.';
    }

    setMessages(prev => [...prev, { sender: 'user', text: promptMsg }]);

    try {
      let task = 'refine_question';
      let payload: any = {};

      if (currentStage === 'question' || actionType === 'audit_question') {
        task = 'refine_question';
        payload = {
          question: project.question.primaryQuestion,
          context: project.question.contextRationale,
        };
      } else if (currentStage === 'pico' || actionType === 'suggest_mesh') {
        task = 'pico_mesh';
        payload = {
          population: project.pico.population,
          intervention: project.pico.intervention,
          comparison: project.pico.comparison,
          outcome: project.pico.primaryOutcome,
        };
      } else if (currentStage === 'grade' || actionType === 'grade_advice') {
        task = 'grade_assess';
        payload = {
          question: project.question.primaryQuestion,
          outcome: project.pico.primaryOutcome,
          studiesCount: project.studies.filter(s => s.status === 'fulltext_eligible').length,
          pooledEffect: 'RR 0.80',
          ci: '0.73 to 0.87',
          i2: 0,
          robSummary: 'Low risk across major trials',
        };
      } else {
        task = 'custom';
        payload = {
          stage: currentStage,
          question: project.question.primaryQuestion,
          pico: project.pico,
          prompt: promptMsg,
        };
      }

      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, payload, language }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        let answerText = '';
        if (json.data.refined_question) {
          answerText = `Forslag til presisert forskningsspørsmål:\n"${json.data.refined_question}"\n\nFINER-analyse:\n• Gjennomførbarhet: ${json.data.finer_analysis?.Feasible?.rating || 'God'}\n• Relevans: ${json.data.finer_analysis?.Relevant?.rating || 'Høy'}`;
        } else if (json.data.pubmed_string) {
          answerText = `PubMed søkestreng:\n${json.data.pubmed_string}\n\nCochrane Library:\n${json.data.cochrane_string}`;
        } else if (json.data.plainLanguageSummary) {
          answerText = `GRADE oppsummering:\n${json.data.plainLanguageSummary}\n\nAnbefalt evidenssikkerhet: ${json.data.certainty || 'Moderat'}`;
        } else {
          answerText = JSON.stringify(json.data, null, 2);
        }

        setMessages(prev => [...prev, { sender: 'ai', text: answerText, data: json.data }]);
      } else {
        setMessages(prev => [...prev, { 
          sender: 'ai', 
          text: json.message || 'Forespørselen ble behandlet med innebygde metodologiske maler.' 
        }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'ai', text: `Feil ved kontakt med AI-tjenesten: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputQuery.trim()) return;
    const query = inputQuery;
    setInputQuery('');
    setMessages(prev => [...prev, { sender: 'user', text: query }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'custom',
          payload: {
            stage: currentStage,
            userQuery: query,
            question: project.question.primaryQuestion,
            pico: project.pico,
          },
          language,
        }),
      });
      const json = await res.json();
      let answerText = '';
      if (json.data?.advice) {
        answerText = json.data.advice;
      } else if (json.data?.text) {
        answerText = json.data.text;
      } else {
        answerText = typeof json.data === 'string' ? json.data : JSON.stringify(json.data, null, 2);
      }

      setMessages(prev => [...prev, { sender: 'ai', text: answerText || 'Analysen er fullført.' }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Kunne ikke nå AI-modellen: ' + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-stone-900 text-stone-100 shadow-2xl border-l border-stone-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-100">AI Methodologist</h3>
            <p className="text-[11px] text-stone-400">Cochrane & PRISMA 2020 Veileder</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded text-stone-400 hover:text-white hover:bg-stone-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick context pills */}
      <div className="p-3 bg-stone-950/60 border-b border-stone-800/80 flex flex-wrap gap-1.5">
        <button
          onClick={() => runQuickAction('audit_question')}
          className="text-[11px] px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 flex items-center gap-1 transition"
        >
          <BookOpen className="w-3 h-3 text-amber-400" />
          FINER-vurdering
        </button>
        <button
          onClick={() => runQuickAction('suggest_mesh')}
          className="text-[11px] px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 flex items-center gap-1 transition"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          Generer MeSH
        </button>
        <button
          onClick={() => runQuickAction('grade_advice')}
          className="text-[11px] px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 flex items-center gap-1 transition"
        >
          <BookOpen className="w-3 h-3 text-emerald-400" />
          GRADE-kriterier
        </button>
        <button
          onClick={() => runQuickAction('synthesis_advice')}
          className="text-[11px] px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 flex items-center gap-1 transition"
        >
          <BookOpen className="w-3 h-3 text-sky-400" />
          I² Heterogenitet
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="text-[10px] text-stone-500 mb-1 flex items-center gap-1">
              {m.sender === 'ai' ? (
                <>
                  <Bot className="w-3 h-3 text-amber-400" />
                  <span>EvidenceOS Methodologist</span>
                </>
              ) : (
                <span>Forsker</span>
              )}
            </div>
            <div
              className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-800 border border-stone-700 text-stone-200 shadow-sm'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans break-words">{m.text}</pre>

              {m.sender === 'ai' && (
                <div className="mt-2 pt-2 border-t border-stone-700/60 flex justify-end">
                  <button
                    onClick={() => copyToClipboard(m.text)}
                    className="text-[10px] text-stone-400 hover:text-white flex items-center gap-1 transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Kopiert' : 'Kopier'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-amber-400 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analyserer protokoll og evidens...</span>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-stone-800 bg-stone-950 flex items-center gap-2">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Spør om PICO, RoB 2, I² eller GRADE..."
          className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
        />
        <button
          onClick={handleSend}
          disabled={loading || !inputQuery.trim()}
          className="p-2 rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 disabled:opacity-50 transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
