import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily/safely with required headers
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function generateAuditHash(agentName: string, action: string, timestamp: string, payload: any): string {
  const data = `${agentName}:${action}:${timestamp}:${JSON.stringify(payload)}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

// API Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'EvidenceOps AI Orchestrator',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
  });
});

// Dynamic AI parsing endpoint for custom user prompts using Gemini 3.8 Flash
app.post('/api/agents/ai-analyze', async (req, res) => {
  const { prompt, currentPico } = req.body;
  const ai = getGeminiClient();

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  if (!ai) {
    // Fallback to structured clinical parser when Gemini API key is not yet set
    const fallbackPico = {
      population: prompt.toLowerCase().includes('demens') ? 'Personer med diagnostisert mild til moderat demens' : 'Relevant klinisk pasientgruppe basert på problemstilling',
      intervention: prompt.toLowerCase().includes('kognitiv stimulering') ? 'Strukturert kognitiv stimuleringsterapi (CST) i gruppe' : 'Spesifisert helsefaglig intervensjon eller tiltak',
      comparison: 'Sedvanlig omsorg (treatment as usual), venteliste eller inaktiv kontroll',
      primaryOutcomes: ['Kognitiv funksjon (global)', 'Selvrapportert livskvalitet (QoL)'],
      secondaryOutcomes: ['Dagliglivets funksjon (ADL)', 'Atferdsmessige og psykologiske symptomer', 'Pårørendebelastning'],
      studyDesigns: ['Systematiske oversikter', 'Randomiserte kontrollerte studier (RCT)'],
      justification: `Strukturert PICO utledet fra klinisk oppdrag: "${prompt}" med fokus på evidensbasert beslutningsstøtte.`,
    };

    return res.json({
      success: true,
      source: 'deterministic_clinical_parser',
      pico: fallbackPico,
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Du er PICO-spesialist for kunnskapsbasert praksis i EvidenceOps AI. 
Analyser følgende helsefaglige oppgave og returner et strukturert JSON-objekt med PICO:
Oppgave: "${prompt}"

Format som streng JSON:
{
  "population": "...",
  "intervention": "...",
  "comparison": "...",
  "primaryOutcomes": ["..."],
  "secondaryOutcomes": ["..."],
  "studyDesigns": ["..."],
  "justification": "..."
}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      source: 'gemini_3_8_flash',
      pico: parsed,
    });
  } catch (error: any) {
    console.error('Gemini API error:', error);
    res.status(500).json({
      error: 'Failed to process AI analysis with Gemini model.',
      details: error.message,
    });
  }
});

// Human Approval Sign-Off API Endpoint (Enforces Mandatory Human Control!)
app.post('/api/agents/approve', (req, res) => {
  const {
    reviewerName,
    reviewerRole,
    decision, // 'APPROVED' | 'REJECTED' | 'REVISED'
    clinicalNotes,
    adjustmentsMade,
    pipelineState,
  } = req.body;

  if (!reviewerName || !reviewerRole || !decision) {
    return res.status(400).json({
      error: 'Reviewer name, professional role, and decision are strictly mandatory for clinical sign-off.',
    });
  }

  const timestamp = new Date().toISOString();
  const signatureHash = generateAuditHash('Human Reviewer', decision, timestamp, {
    reviewerName,
    reviewerRole,
    decision,
    clinicalNotes,
  });

  const auditEntry = {
    id: `audit-${Date.now()}`,
    timestamp,
    agentName: 'Human Reviewer',
    action: decision === 'APPROVED' ? 'KLINISK GODKJENNING UTFØRT' : 'REVISJON/AVSLAG MELDING',
    stepNumber: 6,
    status: decision === 'APPROVED' ? 'APPROVED' : 'WARNING',
    executionTimeMs: 0,
    hash: signatureHash,
    details: `Fagperson ${reviewerName} (${reviewerRole}) fullførte formell menneskelig godkjenning. Vedtak: ${decision}. Merknad: ${clinicalNotes || 'Ingen ytterligere merknader.'}`,
    payloadSummary: JSON.stringify({ reviewerName, reviewerRole, decision, timestamp }),
  };

  res.json({
    success: true,
    signatureHash,
    timestamp,
    auditEntry,
    message: decision === 'APPROVED' 
      ? 'Faglig godkjenning registrert. Beslutningsgrunnlag og publisering er nå autorisert.'
      : 'Vedtak registrert. Prosessen er satt på vent for revisjon.',
  });
});

// Start dev server or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EvidenceOps AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
