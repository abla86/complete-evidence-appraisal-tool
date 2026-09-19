import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini API client safely (server-side only)
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

// API Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiConfigured: !!ai });
});

// Analyze Article Endpoint
app.post("/api/analyze-article", async (req, res) => {
  try {
    const { title, text, articleTypeHint } = req.body;
    if (!text && !title) {
      return res.status(400).json({ error: "Artikkeltekst eller tittel må oppgis." });
    }

    if (!ai) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY er ikke konfigurert i miljøet. Vennligst sjekk innstillingene." 
      });
    }

    const prompt = `
Du er en ekspert på vitenskapelig metode, helseforskning og kritisk vurdering av litteratur. 
 analyser den følgende artikkelen grundig på norsk. 

Artikkeltittel: ${title || 'Ukjent tittel'}
Artikkeltilgang / Tekstutdrag:
${text}

Oppgave:
1. Klassifiser artikkelen nøyaktig i én av følgende kategorier (begrunn grundig):
   - "Kvalitativ forskningsartikkel"
   - "Kvantitativ forskningsartikkel"
   - "Systematisk oversikt / Scoping Review"
   - "Kunnskapsbasert teori / Teoretisk artikkel"
   - "Faglitteratur / Fagartikkel"
2. Gi en faglig begrunnelse for klassifiseringen (hvorfor er dette denne type artikkel, og hva skiller den fra andre typer?).
3. Identifiser det teoretiske rammeverket (f.eks. Gittell's relational coordination, Corbin & Strauss grounded theory, biopsykososial modell, etc.).
4. Lag en strukturert oppsummering av:
   - Bakgrunn / Problemstilling
   - Hensikt / Mål
   - Metode / Utvalg / Datainnsamling
   - Hovedfunn / Resultater
   - Konklusjon & Implikasjoner
5. Vurder metodisk kvalitet og gi en skår fra 0 til 100 med begrunnelse.
6. Fyll ut en sjekkliste med 5 sentrale evalueringspunkter (Formål & Design, Metode & Utvalg, Dataanalyse, Etikk, Validitet/Overførbaret) der du angir svar ('Ja', 'Delvis', 'Nei'), begrunnelse, og henviser til sitat/tekst fra artikkelen som bevis (ikke dikt opp noe!).
7. List opp styrker og begrensninger ved artikkelen.

Svar utelukkende i gyldig JSON-format i henhold til følgende skjema:
{
  "articleType": "Kvalitativ forskningsartikkel",
  "typeJustification": "...",
  "theoreticalFramework": "...",
  "methodologicalQualityScore": 85,
  "summary": {
    "background": "...",
    "objective": "...",
    "methods": "...",
    "results": "...",
    "conclusion": "..."
  },
  "checklists": [
    {
      "id": "c1",
      "question": "Er formålet med studien klart formulert?",
      "category": "Formål & Design",
      "answer": "Ja",
      "justification": "...",
      "evidenceQuote": "..."
    },
    {
      "id": "c2",
      "question": "Er kvalitetsmetoden/designet egnet for forskningsspørsmålet?",
      "category": "Metode & Utvalg",
      "answer": "Ja",
      "justification": "...",
      "evidenceQuote": "..."
    },
    {
      "id": "c3",
      "question": "Er datainnsamling og utvalg beskrevet på en transparent måte?",
      "category": "Metode & Utvalg",
      "answer": "Ja",
      "justification": "...",
      "evidenceQuote": "..."
    },
    {
      "id": "c4",
      "question": "Er dataanalysen utført systematisk og grundig?",
      "category": "Dataanalyse & Funn",
      "answer": "Ja",
      "justification": "...",
      "evidenceQuote": "..."
    },
    {
      "id": "c5",
      "question": "Er etiske hensyn ivaretatt og drøftet?",
      "category": "Etikk & Konklusjon",
      "answer": "Ja",
      "justification": "...",
      "evidenceQuote": "..."
    }
  ],
  "strengths": ["...", "..."],
  "limitations": ["...", "..."],
  "practicalImplications": "..."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const rawText = response.text || "{}";
    const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedJson);

    res.json(result);
  } catch (error: any) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: error.message || "Feil under AI-analyse av artikkelen." });
  }
});

// Compare Articles Endpoint
app.post("/api/compare-articles", async (req, res) => {
  try {
    const { article1Title, article1Text, article2Title, article2Text } = req.body;
    if (!article1Text || !article2Text) {
      return res.status(400).json({ error: "Begge artikler må oppgis for sammenligning." });
    }

    if (!ai) {
      return res.status(500).json({ error: "GEMINI_API_KEY er ikke konfigurert." });
    }

    const prompt = `
Du er en ekspert på forskningsmetodikk og kritisk analyse. Sammenlign de følgende to artiklene grundig på norsk:

Artikkel 1: ${article1Title}
Tekst/Sammendrag 1:
${article1Text}

Artikkel 2: ${article2Title}
Tekst/Sammendrag 2:
${article2Text}

Analyser likheter, forskjeller, metodiske tilnærminger, teoretisk fundament, og funn. 
Svar i gyldig JSON-format med følgende skjema:
{
  "comparisonTitle": "Sammenligning mellom Artikkel 1 og Artikkel 2",
  "aspects": [
    {
      "title": "Hovedformål og Problemstilling",
      "article1Text": "...",
      "article2Text": "...",
      "analysis": "..."
    },
    {
      "title": "Metode og Datainnsamling",
      "article1Text": "...",
      "article2Text": "...",
      "analysis": "..."
    },
    {
      "title": "Teoretisk Rammeverk",
      "article1Text": "...",
      "article2Text": "...",
      "analysis": "..."
    },
    {
      "title": "Hovedfunn og Implikasjoner",
      "article1Text": "...",
      "article2Text": "...",
      "analysis": "..."
    }
  ],
  "conclusion": "..."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const rawText = response.text || "{}";
    const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedJson);

    res.json(result);
  } catch (error: any) {
    console.error("Comparison error:", error);
    res.status(500).json({ error: error.message || "Feil under sammenligning av artikler." });
  }
});

// Custom Q&A Search Endpoint with source grounding and color-coding
app.post("/api/qa-search", async (req, res) => {
  try {
    const { articleTitle, articleText, question } = req.body;
    if (!question || !articleText) {
      return res.status(400).json({ error: "Spørsmål og artikkeltekst må oppgis." });
    }

    if (!ai) {
      return res.status(500).json({ error: "GEMINI_API_KEY er ikke konfigurert." });
    }

    const prompt = `
Du er en akademisk forskningsassistent. Gitt følgende artikkel ("${articleTitle}") og dens tekst:
${articleText}

Svar på brukerens spørsmål: "${question}"
Svaret skal være grundig, faglig fundert og basert *kun* på teksten (ingen dikting). Finn også det mest relevante sitatet fra teksten som beviser eller underbygger svaret.

Svar utelukkende i gyldig JSON-format i henhold til følgende skjema:
{
  "answer": "Faglig og presist svar på norsk...",
  "matchedQuote": "Eksakt sitat fra teksten...",
  "referenceSource": "Artikkeltittel og avsnitt/seksjon",
  "category": "Metode / Funn / Etikk / Bakgrunn"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const rawText = response.text || "{}";
    const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedJson);

    res.json(result);
  } catch (error: any) {
    console.error("QA Search error:", error);
    res.status(500).json({ error: error.message || "Feil under QA-søk." });
  }
});

// Google Search Grounding Endpoint to verify references and find newer studies
app.post("/api/verify-references", async (req, res) => {
  try {
    const { articleTitle, authors } = req.body;
    if (!articleTitle) {
      return res.status(400).json({ error: "Artikkeltittel må oppgis for verifisering." });
    }

    if (!ai) {
      return res.status(500).json({ error: "GEMINI_API_KEY er ikke konfigurert." });
    }

    const prompt = `
Søk etter informasjon om følgende forskningsartikkel på nettet: "${articleTitle}" av ${authors || 'Ukjent forfatter'}.
1. Verifiser om artikkelen eksisterer, sjekk DOI, tidsskrift og publiseringsår.
2. Finn 3 til 5 nyere relaterte studier (helst fra de siste 2-3 årene) innen samme forskningsfelt (f.eks. barnevern, fastlegesamarbeid, global helse, maternal nutrition eller metodologi).
3. Presenter resultatene strukturert på norsk med APA 7 referanser for de nye studiene og verifiseringsstatus.

Svar i gyldig JSON-format:
{
  "verified": true,
  "verificationDetails": "Artikkelen er verifisert i internasjonale registre...",
  "recentStudies": [
    {
      "title": "Tittel på nyere studie",
      "authors": "Forfattere",
      "year": 2025,
      "journal": "Tidsskrift",
      "doi": "10.xxxx/...",
      "apa7": "APA 7 referanse...",
      "relevance": "Hvorfor denne er relevant for temaet"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const rawText = response.text || "{}";
    const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedJson);

    res.json(result);
  } catch (error: any) {
    console.error("Verify references error:", error);
    res.status(500).json({ error: error.message || "Feil under verifisering med Google Search." });
  }
});

// Real Crossref DOI Lookup Endpoint
app.post("/api/lookup-doi", async (req, res) => {
  try {
    const { doi } = req.body;
    if (!doi) {
      return res.status(400).json({ error: "DOI må oppgis." });
    }

    const cleanDoi = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
    const doiRegex = /^10.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
    if (!doiRegex.test(cleanDoi)) {
      return res.status(400).json({ error: "Ugyldig DOI-format. Eksempel: 10.1016/j.jclinepi.2023.05.001" });
    }

    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`, {
      headers: {
        'User-Agent': 'EvidenceAppEngine/2.0 (mailto:support@evidenceapp.local)'
      }
    });

    if (!response.ok) {
      return res.status(404).json({ error: `DOI ble ikke funnet i Crossref-registeret (status ${response.status}).` });
    }

    const data = await response.json();
    const work = data.message;

    const title = work.title?.[0] || 'Ukjent tittel';
    const authors = (work.author || []).map((a: any) => `${a.family || ''}, ${a.given || ''}`.trim()).filter(Boolean);
    const year = work.published?.['date-parts']?.[0]?.[0] || work.issued?.['date-parts']?.[0]?.[0] || new Date().getFullYear();
    const journal = work['container-title']?.[0] || work.publisher || 'Ukjent tidsskrift';
    const abstract = work.abstract ? work.abstract.replace(/<[^>]*>?/gm, '') : 'Ingen abstrakt registrert i Crossref.';

    res.json({
      doi: cleanDoi,
      title,
      authors: authors.length > 0 ? authors : ['Ukjent forfatter'],
      year,
      journal,
      abstract,
      publisher: work.publisher,
      verified: true
    });
  } catch (error: any) {
    console.error("DOI Lookup error:", error);
    res.status(500).json({ error: error.message || "Feil under oppslag mot Crossref." });
  }
});

// Student Paper & Exam Evaluation Endpoint (KBP Master level, APA 7, Epistemology, AI/Plagiarism check)
app.post("/api/evaluate-student-paper", async (req, res) => {
  try {
    const { title, text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Oppgavetekst må oppgis." });
    }

    if (!ai) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY er ikke konfigurert. Ekte AI-analyse krever gyldig API-nøkkel (ingen hardkodede eller simulerte resultater tillates)." 
      });
    }

    const prompt = `
Du er en streng og erfaren sensor og professor ved Høgskulen på Vestlandet (HVL) for Master i kunnskapsbasert praksis.
Analyser følgende studentoppgave/eksamensoppgave kritisk:
Tittel: "${title || 'Uten tittel'}"
Tekst:
${text}

Vurder oppgaven grundig ut fra følgende kriterier for mastergradsnivå:
1. KBP & Vitenskapsteori: Vurder om studenten viser avansert kunnskap om KBP, vitenskapsteoretiske tradisjoner (f.eks. hermeneutikk, positivisme, sosialkonstruktivisme) og forskningsmetodiske posisjoner.
2. Referansekontroll (APA 7): Vurder kvaliteten og formateringen på kildehenvisninger.
3. AI- og plagiatindikatorer: Vurder om teksten bærer preg av AI-generert språk (for generisk, manglende dybde/refleksjon, monotone setningsstrukturer) eller om den viser ekte studentrefleksjon og kritisk sans. Estimer en sannsynlighet (0-100%).
4. Karakter og poengsum (0-100), samt begrunnelse og konkrete forbedringspunkter.

Svar i gyldig JSON-format:
{
  "estimatedGrade": "A / B / C / D",
  "score": 85,
  "gradeRationale": "Kort samlet vurdering av oppgavens nivå...",
  "kbpAndEpistemology": "Detaljert vurdering av vitenskapsteori, KBP-forankring og metodevalg...",
  "referenceCheck": "Vurdering av kildebruk og APA 7-etterlevelse...",
  "aiProbability": 15,
  "aiAssessment": "Lav sannsynlighet for AI; viser genuin faglig refleksjon",
  "plagiarismAssessment": "Ingen opplagte plagiatindikasjoner funnet, god integrasjon av kilder.",
  "improvements": [
    "Konkret forbedringspunkt 1...",
    "Konkret forbedringspunkt 2...",
    "Konkret forbedringspunkt 3..."
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const rawText = response.text || "{}";
    const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedJson);

    res.json(result);
  } catch (error: any) {
    console.error("Evaluate student paper error:", error);
    res.status(500).json({ error: error.message || "Feil under AI-vurdering av oppgave." });
  }
});

// Full File-Based Critical Appraisal Endpoint (Strict compliance with user requirements)
app.post("/api/appraise-uploaded-file", async (req, res) => {
  try {
    const { fileName, fileText } = req.body;
    if (!fileText || !fileText.trim()) {
      return res.status(400).json({ error: "Ingen filtekst mottatt for analyse." });
    }

    if (!ai) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY er ikke konfigurert. Ekte filbasert analyse krever gyldig API-nøkkel (ingen hardkodede eller simulerte resultater tillates)." 
      });
    }

    const prompt = `
Du er en fremragende professor og ekspert på vitenskapelig metode, evidensbasert praksis og kritisk vurdering av forskningslitteratur.
Analyser den opplastede forskningsfilen ("${fileName || 'Dokument'}") fullstendig på norsk. Les hele teksten nøye.

HER ER HELE FILTEKSTEN SOM SKAL ANALYSERES:
----------------------------------------
${fileText}
----------------------------------------

VIKTIGE METODISKE OG ETISKE KRAV TIL VURDERINGEN:
1. EVIDENSSITATER: ALLE sitater i 'evidenceQuote' MÅ være 100% ordrette, komplette utdrag direkte fra filteksten ovenfor. 
   - STRENGT FORBUDT med forkortelser, sammendrag eller utelatelser ved bruk av "..." eller "…". Sitatet skal gjengi hele den relevante setningen eller avsnittet nøyaktig slik det står i originalteksten.
2. ETISK VURDERING: Vær helt presis på etiske forhold (f.eks. skille mellom om REK-godkjenning ble vurdert som unødvendig etter nasjonale regler vs. fritak, og innhenting av informert samtykke).
3. METODISK PRESISJON: Beskriv nøyaktige teknikker som faktisk er dokumentert i teksten (f.eks. purposive/teoretisk sampling, teoretisk metning, åpen/aksial/selektiv koding, konstant komparativ analyse) i stedet for generelle formuleringer.

Oppgave:
1. Identifiser studiedesign og velg det mest egnede kritisk vurderingsverktøy (f.eks. CASP for RCT/Kvalitativ, JBI for kvalitative studier/tverrsnitt). Gi en faglig begrunnelse for valg av instrument.
2. Trekk ut og strukturer informasjon fra hele dokumentet fordelt på følgende 20 punkter:
   - forskningsspørsmål
   - formål
   - studiedesign
   - populasjon/deltakere
   - utvalg
   - intervensjon eller eksponering
   - sammenligning
   - utfall
   - datainnsamling
   - måleinstrumenter
   - analysemetoder
   - resultater
   - statistiske analyser
   - bias og mulige feilkilder
   - metodiske styrker (array)
   - metodiske svakheter (array)
   - begrensninger (array)
   - etiske forhold
   - finansiering/interessekonflikter
   - konklusjoner.
3. Utfør en systematisk kritisk vurdering (sjekkliste med 5 til 8 sentrale kriterier tilpasset instrumentet). For hvert kriterium må du:
   - oppgi kriteriet / spørsmålet
   - finne et NØYAKTIG, UFORKORTET ORDRETT SITAT fra filteksten (uten "...")
   - gi vurdering ('Ja', 'Delvis', 'Nei', 'Uklar/Manglende')
   - forklare vurderingen grundig basert på faktiske detaljer i teksten
   - angi usikkerhet ('Lav', 'Moderat', 'Høy').
4. Gi en samlet kritisk vurdering og konklusjon.

Svar utelukkende i gyldig JSON-format i henhold til følgende skjema:
{
  "fileName": "${fileName || 'Dokument'}",
  "fileSize": ${fileText.length},
  "uploadedAt": "${new Date().toISOString()}",
  "selectedInstrument": {
    "name": "JBI Critical Appraisal Checklist for Qualitative Research",
    "acronym": "JBI Qualitative",
    "justification": "Begrunnelse...",
    "confidence": "Sikker"
  },
  "structuredContent": {
    "researchQuestion": "...",
    "purpose": "...",
    "studyDesign": "...",
    "population": "...",
    "sample": "...",
    "interventionOrExposure": "...",
    "comparison": "...",
    "outcomes": "...",
    "dataCollection": "...",
    "instruments": "...",
    "analysisMethods": "...",
    "results": "...",
    "statisticalAnalysis": "...",
    "biasAndConfounders": "...",
    "methodologicalStrengths": ["...", "..."],
    "methodologicalWeaknesses": ["...", "..."],
    "limitations": ["...", "..."],
    "ethicalConsiderations": "...",
    "fundingAndConflicts": "...",
    "conclusions": "..."
  },
  "criteria": [
    {
      "id": "crit-1",
      "criterion": "Er formålet med studien klart formulert?",
      "category": "Formål & Design",
      "evidenceQuote": "Ordrett sitat fra filen uten ...",
      "appraisal": "Ja",
      "explanation": "Forklaring...",
      "uncertainty": "Lav"
    }
  ],
  "overallSummary": "Samlet faglig konklusjon..."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const rawText = response.text || "{}";
    const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedJson);

    // Strict Evidence Verification: Check if proposed quotes actually exist in fileText and contain no ellipsis (...)
    if (result.criteria && Array.isArray(result.criteria)) {
      const lowerFileText = fileText.toLowerCase();
      result.criteria = result.criteria.map((c: any) => {
        const quote = c.evidenceQuote || '';
        const hasEllipsis = quote.includes('...') || quote.includes('…');
        const cleanQuote = quote.trim().toLowerCase();
        const isFound = cleanQuote.length > 3 && !hasEllipsis && lowerFileText.includes(cleanQuote);
        
        if (!isFound) {
          return {
            ...c,
            evidenceQuote: hasEllipsis ? "Ugyldig forkortet sitat (...) avvist. Kravet er 100% uforkortet ordrett utdrag." : "Uklar eller manglende direkte evidens i dokumentet (AI-sitat ikke gjenfunnet i filteksten)",
            appraisal: "Uklar/Manglende",
            uncertainty: "Høy",
            explanation: `${c.explanation} [Merk: Oppgitt sitat ${hasEllipsis ? 'inneholdt ulovlig forkortelse (...)' : 'ble ikke gjenfunnet ordrett'} i originaldokumentet].`,
            verifiedByDocument: false
          };
        }
        return { ...c, verifiedByDocument: true };
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error("Appraise uploaded file error:", error);
    res.status(500).json({ error: error.message || "Feil under filbasert kritisk vurdering." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
