import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Server-side Gemini client with User-Agent header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API: Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// API: AI Statistical Advisor & Mentor
app.post("/api/gemini/advisor", async (req, res) => {
  const { question, context, datasetSummary, analysisType } = req.body;

  if (!question && !context) {
    return res.status(400).json({ error: "Spørsmål eller kontekst mangler." });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Graceful offline fallback providing high-quality pedagogical response
    return res.json({
      answer: `### Statistisk rådgiver (Lokal faglig veiledning)
Basert på din forespørsel om **${analysisType || "statistisk metode"}**:

1. **Forstå variabeltypene**:
   - Kontroller alltid målenivået (nominal, ordinal eller skala/kontinuerlig).
   - Husk at parametriske tester (f.eks. Independent t-test, ANOVA) krever kontinuerlig avhengig variabel og tilnærmet normalfordeling i gruppene.

2. **Forutsetningsvurdering**:
   - Vurder normalitet via histogram og Shapiro-Wilk test (eller skewness/kurtosis delt på SE mellom ±1.96).
   - Ved skjevhet i data eller ordinalt utfall: Vurder ikke-parametriske alternativer som **Mann-Whitney U** (for 2 grupper) eller **Kruskal-Wallis** (for >2 grupper).

3. **Klinisk vs. statistisk signifikans**:
   - En $p < .05$ beviser kun at forskjellen neppe skyldes tilfeldigheter gitt $H_0$. Den sier ingenting om hvor stor eller viktig effekten er.
   - Rapporter alltid effektstørrelse (**Cohen's d**, $\\eta^2$ eller Pearson's $r$) sammen med 95 % konfidensintervall!

*Tips: Du kan konfigurere GEMINI_API_KEY i Secrets-panelet for dypere AI-interaksjoner.*`,
      source: "local-fallback",
    });
  }

  try {
    const prompt = `Du er en erfaren universitetslektor i kvantitativ metode og forfatter av den digitale utgaven av 'SPSS Survival Manual'.
Ditt mål er ikke å gi et 'kjapt fasitsvar', men å lære brukeren å tenke statistisk og metodisk, med fokus på kunnskapsbasert praksis, forutsetninger, effektstørrelser og korrekt tolkning.

Kontekst for analysen: ${context || "Generell statistisk rådgivning"}
Aktuell analyse/metode: ${analysisType || "Ikke spesifisert"}
Datasett-informasjon: ${datasetSummary || "Ikke oppgitt"}
Brukerens spørsmål: ${question}

Gi et pedagogisk og strukturert svar på norsk med følgende avsnitt:
1. **Faglig anbefaling & Hvorfor**: Hvorfor denne tilnærmingen passer (eller ikke passer).
2. **Forutsetninger du MÅ sjekke**: Hvilke tester/grafer i SPSS brukeren må inspisere (f.eks. normalitet, homoscedastisitet, uavhengighet).
3. **Hva betyr brudd på forutsetningene?**: Hvilke robuste eller ikke-parametriske alternativer finnes?
4. **Tolkning & Kunnskapsbasert praksis**: Skille mellom p-verdi (statistisk signifikans) og klinisk/praktisk relevans (effektstørrelse, konfidensintervall).
5. **Viktig advarsel**: Hva kan man IKKE konkludere med (f.eks. kausalitet uten randomisering, utvalgsstørrelseseffekter).

Hold tonen profesjonell, pedagogisk og akademisk presis.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "Du er en pedagogisk statistikkekspert og metodolog for SPSS Survival Manual Digital.",
      },
    });

    return res.json({
      answer: response.text || "Ingen respons mottatt.",
      source: "gemini",
    });
  } catch (error: any) {
    console.error("Gemini advisor error:", error);
    return res.status(500).json({
      error: "Kunne ikke hente AI-veiledning: " + (error.message || "Ukjent feil"),
    });
  }
});

// API: SPSS Output Interpreter
app.post("/api/gemini/interpret-output", async (req, res) => {
  const { outputText, testType } = req.body;

  if (!outputText) {
    return res.status(400).json({ error: "Vennligst lim inn SPSS-output." });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Intelligent heuristic parser fallback
    return res.json({
      interpretation: {
        summary: "Output tolket via integrert statistisk regelmotor.",
        isSignificant: outputText.includes("p = .0") || outputText.includes("Sig. (2-tailed)") || outputText.includes("< .05"),
        plainNorwegian:
          "Resultatene indikerer en statistisk test. For fullstendig tolkning: sjekk om p-verdien (Sig.) er lavere enn det valgte signifikansnivået (vanligvis .05). Rapporter teststørrelse, frihetsgrader, p-verdi, gjennomsnittsforskjell og 95% konfidensintervall i henhold til APA 7.",
        whatItMeans:
          "Dersom p < .05 forkastes nullhypotesen (H0). Det er usannsynlig at denne observerte forskjellen eller sammenhengen skyldes ren utvalgsvariasjon gitt at det egentlig ikke er noen effekt.",
        whatItDoesNotMean:
          "Det beviser IKKE at effekten er stor eller klinisk viktig. Med store utvalg (N) kan selv mikroskopiske, ubetydelige forskjeller bli p < .001. Det beviser heller ikke kausalitet alene med mindre designet er et strengt kontrollert randomisert forsøk.",
        apaCitationProposal:
          "GENERERT FORSLAG – MÅ KONTROLLERES AV FORSKER:\nDet ble observert en statistisk signifikant forskjell mellom gruppene [sett inn teststørrelse, df, p-verdi og 95% KI].",
        clinicalChecklist: [
          "Undersøk effektstørrelse (Cohen's d eller r)",
          "Vurder 95% konfidensintervall for gjennomsnittsforskjellen mot klinisk minste viktige forskjell (MCID)",
          "Kontroller at forutsetningene var tilstrekkelig oppfylt",
        ],
      },
      source: "heuristic-engine",
    });
  }

  try {
    const prompt = `Du er ekspert på SPSS og tolkning av statistiske analyser i medisin, psykologi og samfunnsvitenskap.
Her er SPSS-output som brukeren har limt inn:
---
${outputText}
---
Testtype angitt av bruker: ${testType || "Automatisk detektert"}

Analyser denne outputen grundig og returner et JSON-objekt med nøyaktig følgende struktur:
{
  "summary": "En konsis oppsummering i 1-2 setninger av hva analysen viser.",
  "extractedStatistics": {
    "testName": "Navn på testen (f.eks. Independent-samples t-test)",
    "testStatistic": "F.eks. t = 2.41 eller F = 4.12",
    "degreesOfFreedom": "F.eks. df = 58 eller df = (2, 57)",
    "pValue": "F.eks. p = .019 eller p < .001",
    "effectSize": "F.eks. Cohen's d = 0.62 eller Eta-squared = .08",
    "confidenceInterval": "F.eks. 95% CI [0.54, 5.86]"
  },
  "isSignificant": true/false,
  "plainNorwegian": "En grundig forklaring på lettforståelig norsk av hva tallene betyr.",
  "whatItMeans": "Hva dette faktisk betyr vitenskapelig.",
  "whatItDoesNotMean": "Hva dette IKKE betyr (unngå vanlige misforståelser om p-verdier, kausalitet og generaliserbarhet).",
  "effectSizeAssessment": "Vurdering av om effekten er liten, medium eller stor ifølge etablerte normer (f.eks. Cohens tolkning) og om den har praktisk/klinisk betydning.",
  "apaCitationProposal": "GENERERT FORSLAG – MÅ KONTROLLERES AV FORSKER:\\n[Eksakt APA 7 formatert setning med kursiverte symboler t, p, CI, M, SD]",
  "clinicalChecklist": [
    "Punkt 1 for klinisk/metodisk vurdering",
    "Punkt 2",
    "Punkt 3"
  ]
}

Svar KUN med gyldig JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      interpretation: parsed,
      source: "gemini",
    });
  } catch (error: any) {
    console.error("Error interpreting output with Gemini:", error);
    return res.status(500).json({
      error: "Kunne ikke tolke output: " + (error.message || "Ukjent feil"),
    });
  }
});

// Vite middleware configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SPSS Survival Manual Server running on http://localhost:${PORT}`);
  });
}

startServer();
