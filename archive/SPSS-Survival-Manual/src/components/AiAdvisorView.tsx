import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, HelpCircle, Loader2, BookOpen } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "advisor";
  text: string;
}

export const AiAdvisorView: React.FC = () => {
  const initialMessages: ChatMessage[] = [
    {
      id: "m-0",
      sender: "advisor",
      text:
        "Hei! Jeg er din pedagogiske statistikkveileder i SPSS Survival Manual. Jeg gir deg ikke bare fasiten, men hjelper deg å forstå de metodiske prinsippene, forutsetningene og tolkningene bak analysene dine. Hva lurer du på i dag?",
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "Hvorfor er ikke p < .05 nok alene?",
    "Hva gjør jeg hvis forutsetningen om normalfordeling brytes?",
    "Hvorfor ikke bare kjøre tre t-tester i stedet for ANOVA?",
    "Hva betyr det hvis 95% konfidensintervall krysser 0?",
    "Hva er forskjellen på paret og uavhengig design?",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const q = questionText || inputText.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInputText("");
    setLoading(true);

    try {
      const response = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          context: "SPSS Survival Manual - Student and Researcher pedagogical assistant",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.answer) {
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              sender: "advisor",
              text: data.answer,
            },
          ]);
          return;
        }
      }

      // Fallback response if offline or backend error
      const fallbackMsg = getFallbackResponse(q);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: "advisor",
          text: fallbackMsg,
        },
      ]);
    } catch (err) {
      console.warn("Using local fallback advisor:", err);
      const fallbackMsg = getFallbackResponse(q);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: "advisor",
          text: fallbackMsg,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackResponse = (q: string): string => {
    const lower = q.toLowerCase();
    if (lower.includes("p < .05") || lower.includes("nok") || lower.includes("p-verdi")) {
      return "En p-verdi forteller deg bare sannsynligheten for å observere en så stor forskjell dersom nullhypotesen (H0) var sann. Med et stort nok utvalg vil selv mikroskopiske, ubetydelige forskjeller bli p < .001! Derfor krever moderne forskning alltid at du oppgir effektstørrelse (f.eks. Cohen's d eller r²) og et 95% konfidensintervall.";
    }
    if (lower.includes("normalfordeling") || lower.includes("skjev")) {
      return "Ved brudd på normalfordeling har du tre hovedveier:\n1. Sjekk utvalgsstørrelsen: Hvis du har N > 30–50 per gruppe, beskytter sentralgrenseteoremet t-testen og ANOVA godt mot moderate avvik.\n2. Bytt til en ikke-parametrisk test: Bruk Mann-Whitney U i stedet for independent t-test, eller Kruskal-Wallis i stedet for enveis ANOVA.\n3. Benytt bootstrapping i SPSS for robuste konfidensintervaller.";
    }
    if (lower.includes("anova") || lower.includes("tre t-tester")) {
      return "Hvis du gjennomfører tre separate t-tester i stedet for én ANOVA med 3 grupper, akkumuleres type I-feilraten (familiær feilrate / alpha inflation). Med α = .05 for hver test, er risikoen for minst én falsk positiv: 1 - (0.95)³ ≈ 14.3%! ANOVA holder den samlede feilraten på 5%, og post-hoc tester (f.eks. Tukey HSD) justerer for flergangstesting.";
    }
    if (lower.includes("konfidensintervall") || lower.includes("krysser 0") || lower.includes("null")) {
      return "Når et 95% konfidensintervall for en differanse inkluderer verdien 0 (f.eks. [-1.2, 3.5]), betyr det at en differanse på 0 er et plausibelt utfall i populasjonen. Dette tilsvarer direkte at p ≥ .05 (ikke statistisk signifikant). Hvis intervallet er helt på den positive siden (f.eks. [1.2, 5.8]), er effekten signifikant.";
    }
    return "Et godt metodisk spørsmål! I kvantitativ forskning er det alltid lurt å tenke i rekkefølgen: Hva er problemstillingen og målenivået? Er målingene uavhengige? Er forutsetningene sjekket? Hva er den praktiske effektstørrelsen, og hvordan rapporteres dette akademisk etter APA 7?";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Pedagogisk Dialog
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Statistisk Mentor: «AI som veileder, ikke juksemotor»
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Målet er ikke å få AI til å skrive oppgaven for deg, men å lære deg <em>hvorfor</em> en analyse velges,
            hvordan forutsetninger tolkes, og hvordan du unngår vanlige metodiske feller.
          </p>
        </div>

        {/* Quick Question Chips */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto scrollbar-none">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Vanlige spørsmål:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Box */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[520px]">
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start space-x-3 ${
                m.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.sender === "user"
                    ? "bg-slate-900 text-white text-xs font-bold"
                    : "bg-emerald-600 text-white text-xs"
                }`}
              >
                {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-xl rounded-xl p-4 text-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 border border-slate-200 text-slate-800"
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Statistikkveilederen tenker og forbereder et pedagogisk svar...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Still et metodisk spørsmål (f.eks. «Hva gjør jeg hvis Levene's test har p = .02?»)..."
              className="flex-1 text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="inline-flex items-center space-x-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <span>Spør</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
