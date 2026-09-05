import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DocumentAnalysisService } from './src/services/documentAnalysisService';
import { DocumentParserService } from './src/services/documentParserService';
import { MetaResearchService } from './src/services/metaResearchService';
import { MASTER_INSTRUMENTS_REGISTRY } from './src/data/masterRegistry';
import { GoogleGenAI } from '@google/genai';
import { EvidenceIntelligenceService } from './src/services/evidenceIntelligenceService';
import { registerResearchEngineIntegration } from './src/services/researchEngineIntegration';
import { registerResearchWorkflowApi } from './src/services/researchWorkflowApi';
import { registerAppraisalWorkflowApi } from './src/services/appraisalWorkflowApi';

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 10000);

  app.use(express.json({ limit: '30mb' }));

  registerResearchEngineIntegration(app);
  registerResearchWorkflowApi(app);
  registerAppraisalWorkflowApi(app);

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      tool: 'Evidence Appraisal Tool',
      version: '2026.1',
      researchEngine: { status: 'integrated', contractVersion: '1.0.0' },
      workflow: { status: 'integrated', researchToAppraisal: true },
      appraisal: { status: 'integrated', sessionApi: true },
    });
  });

  app.get('/api/instruments', (_req: Request, res: Response) => {
    res.json({ success: true, count: MASTER_INSTRUMENTS_REGISTRY.length, instruments: MASTER_INSTRUMENTS_REGISTRY });
  });

        app.post('/api/documents/parse-file', async (req: Request, res: Response) => {
    try {
      const { fileName, fileSizeBytes, mimeType, base64Content, textContent } = req.body;
      if (!fileName) return res.status(400).json({ success: false, error: 'Filnavn mangler.' });
      let contentBuffer: ArrayBuffer | string = textContent || '';
      if (base64Content) {
        const binString = Buffer.from(base64Content, 'base64');
        contentBuffer = binString.buffer.slice(binString.byteOffset, binString.byteOffset + binString.byteLength);
      }
      const parseResult = await DocumentParserService.parseFile({
        name: fileName,
        size: fileSizeBytes || (typeof contentBuffer === 'string' ? Buffer.byteLength(contentBuffer) : contentBuffer.byteLength),
        type: mimeType,
        content: contentBuffer,
      });
      res.json({ success: true, data: parseResult, integration: { contractVersion: '1.0.0', evidenceCandidateCount: parseResult.candidateEvidence?.length ?? 0, humanVerificationRequired: true, appraisalGateRequired: true } });
    } catch (err: unknown) {
      res.status(400).json({ success: false, error: (err instanceof Error ? err.message : undefined) || 'Feil under dokumentbehandling og tekstraksjon.' });
    }
  });

    app.post('/api/meta-research/analyze', async (req: Request, res: Response) => {
    try {
      const { text, fileName } = req.body;
      if (!text || typeof text !== 'string') return res.status(400).json({ success: false, error: 'Dokumenttekst eller forskningsartikkel er påkrevd.' });
      const baseReport = MetaResearchService.classifyAndAuditDocument(text, fileName || 'document.pdf');
      const ai = getGeminiClient();
      if (ai) {
        try {
          const prompt = `Analyser forskningsdokumentet som metavitenskapelig og metodisk ekspert. Returner kun gyldig JSON med extractedTitle, extractedAuthors, extractedYear, extractedDoi, documentType, documentTypeName, methodologyType, epistemology, confidenceScore, rationale, unitOfAnalysis, recommendedInstrumentId, alternativeInstrumentIds, incompatibleInstrumentIds, overallIntegrityLevel, integritySummary, keyStrengths og potentialMethodologicalRisks. Dokument: ${text.slice(0, 7000)}`;
          const response = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || 'gemini-3.8-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
          if (response.text) {
            const aiData = JSON.parse(response.text);
            baseReport.extractedTitle = aiData.extractedTitle || baseReport.extractedTitle;
            baseReport.extractedAuthors = aiData.extractedAuthors || baseReport.extractedAuthors;
            baseReport.extractedYear = aiData.extractedYear || baseReport.extractedYear;
            baseReport.extractedDoi = aiData.extractedDoi || baseReport.extractedDoi;
            baseReport.classification = {
              ...baseReport.classification,
              documentType: aiData.documentType || baseReport.classification.documentType,
              documentTypeName: aiData.documentTypeName || baseReport.classification.documentTypeName,
              methodologyType: aiData.methodologyType || baseReport.classification.methodologyType,
              epistemology: aiData.epistemology || baseReport.classification.epistemology,
              confidenceScore: aiData.confidenceScore ?? baseReport.classification.confidenceScore,
              rationale: aiData.rationale || baseReport.classification.rationale,
              unitOfAnalysis: aiData.unitOfAnalysis || baseReport.classification.unitOfAnalysis,
              recommendedInstrumentId: aiData.recommendedInstrumentId || baseReport.classification.recommendedInstrumentId,
              alternativeInstrumentIds: Array.isArray(aiData.alternativeInstrumentIds) ? aiData.alternativeInstrumentIds : baseReport.classification.alternativeInstrumentIds,
              incompatibleInstrumentIds: Array.isArray(aiData.incompatibleInstrumentIds) ? aiData.incompatibleInstrumentIds : baseReport.classification.incompatibleInstrumentIds,
            };
            baseReport.overallIntegrityLevel = aiData.overallIntegrityLevel || baseReport.overallIntegrityLevel;
            baseReport.integritySummary = aiData.integritySummary || baseReport.integritySummary;
            if (Array.isArray(aiData.keyStrengths)) baseReport.keyStrengths = aiData.keyStrengths;
            if (Array.isArray(aiData.potentialMethodologicalRisks)) baseReport.potentialMethodologicalRisks = aiData.potentialMethodologicalRisks;
            baseReport.engineUsed = 'GEMINI_AI';
          }
        } catch (_aiErr) {
          baseReport.engineUsed = 'DETERMINISTIC_FALLBACK';
        }
      } else {
        baseReport.engineUsed = 'DETERMINISTIC_FALLBACK';
      }
      res.json({ success: true, report: baseReport });
    } catch (err: unknown) {
      res.status(500).json({ success: false, error: (err instanceof Error ? err.message : undefined) || 'Feil ved metaundersøkelse av dokument' });
    }
  });

  app.post('/api/evidence/verify-doi', async (req: Request, res: Response) => {
    try {
      const { doi } = req.body;
      if (!doi || typeof doi !== 'string') return res.status(400).json({ success: false, error: 'DOI er påkrevd.' });
      const verification = await EvidenceIntelligenceService.verifyPublicationByDoi(doi);
      if (!verification) return res.status(404).json({ success: false, status: 'NOT_FOUND', message: 'Ingen verifiserbar Crossref-post ble funnet.' });
      res.json({ success: true, verification, methodologicalNote: 'Crossref metadata kan ikke alene bekrefte fagfellevurdering.' });
    } catch (err: unknown) {
      res.status(502).json({ success: false, error: (err instanceof Error ? err.message : undefined) || 'Feil ved ekstern kildeverifisering.' });
    }
  });

  app.get('/api/evidence/search/europe-pmc', async (req: Request, res: Response) => {
    try {
      const query = String(req.query.q || '').trim();
      const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 25)));
      const page = Math.max(1, Number(req.query.page || 1));
      if (!query) return res.status(400).json({ success: false, error: 'Søketekst mangler.' });
      const result = await EvidenceIntelligenceService.searchEuropePmc(query, pageSize, page);
      const searchRecord = EvidenceIntelligenceService.createSearchRecord('Europe PMC', result.query, { pageSize, page }, result.total, 0, result.results);
      res.json({ success: true, ...result, searchRecord, prismaSNote: 'Søkehistorikken kan brukes som grunnlag for transparent rapportering av databasesøk; PRISMA-S-felter må fylles/valideres av forskeren.' });
    } catch (err: unknown) {
      res.status(502).json({ success: false, error: (err instanceof Error ? err.message : undefined) || 'Europe PMC-søk feilet.' });
    }
  });

      const viteDev = process.env.NODE_ENV !== 'production';
  if (viteDev) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, () => console.log(`Evidence Appraisal Tool running on http://localhost:${PORT}`));
}

startServer().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
