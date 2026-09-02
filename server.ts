import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INSTRUMENTS_REGISTRY, INITIAL_ARTICLES, DUAL_REVIEW_SAMPLE } from './src/data/jbiData';
import { JbiQualitativeValidationService } from './src/services/jbiValidationService';
import { DocumentAnalysisService } from './src/services/documentAnalysisService';
import { DocumentParserService } from './src/services/documentParserService';
import { MetaResearchService } from './src/services/metaResearchService';
import { ReferenceValidationService } from './src/services/referenceValidationService';
import { MethodologyContractTests } from './src/services/methodologyContractTests';
import { Amstar2RatingService, Agree2ScoringService, CaspValidationService, JbiValidationService, Rob2ValidationService } from './src/services/assessmentEngines';
import { MASTER_INSTRUMENTS_REGISTRY } from './src/data/masterRegistry';
import { ArticleAppraisal, AuditTrailEntry } from './src/types';
import { GoogleGenAI } from '@google/genai';
import { EvidenceIntelligenceService } from './src/services/evidenceIntelligenceService';
import { registerResearchEngineIntegration } from './src/services/researchEngineIntegration';

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

let assessmentsStore: ArticleAppraisal[] = [...INITIAL_ARTICLES];
let auditTrailStore: AuditTrailEntry[] = INITIAL_ARTICLES.flatMap(a => a.auditTrail || []);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 10000);

  app.use(express.json({ limit: '10mb' }));
  registerResearchEngineIntegration(app);

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', tool: 'Evidence Appraisal Tool', version: '2026.1', researchEngine: 'integrated' });
  });

  app.get('/api/instruments', (_req: Request, res: Response) => {
    res.json({ success: true, count: MASTER_INSTRUMENTS_REGISTRY.length, instruments: MASTER_INSTRUMENTS_REGISTRY });
  });

  app.post('/api/jbi/qualitative/validate', (req: Request, res: Response) => {
    try {
      const assessment: Partial<ArticleAppraisal> = req.body;
      res.json({ success: true, report: JbiQualitativeValidationService.validate(assessment) });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Validation error' });
    }
  });

  app.get('/api/jbi/qualitative/assessments', (_req: Request, res: Response) => {
    res.json({ success: true, count: assessmentsStore.length, assessments: assessmentsStore });
  });

  app.post('/api/jbi/qualitative/assessments', (req: Request, res: Response) => {
    try {
      const newOrUpdated: ArticleAppraisal = req.body;
      if (!newOrUpdated.id) newOrUpdated.id = `jbi-${Date.now()}`;
      const report = JbiQualitativeValidationService.validate(newOrUpdated);
      const existingIndex = assessmentsStore.findIndex(a => a.id === newOrUpdated.id);
      if (existingIndex >= 0) assessmentsStore[existingIndex] = newOrUpdated;
      else assessmentsStore.unshift(newOrUpdated);
      res.json({ success: true, assessment: newOrUpdated, validationReport: report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to save assessment' });
    }
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
        size: fileSizeBytes || (typeof contentBuffer === 'string' ? contentBuffer.length : contentBuffer.byteLength),
        content: contentBuffer
      });
      res.json({ success: true, data: parseResult });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Feil under dokumentbehandling og tekstraksjon.' });
    }
  });

  app.post('/api/jbi/qualitative/analyze-document', (req: Request, res: Response) => {
    try {
      const { text, fileName } = req.body;
      if (!text || typeof text !== 'string') return res.status(400).json({ success: false, error: 'Tekst fra forskningsartikkel er påkrevd.' });
      res.json({ success: true, result: DocumentAnalysisService.analyzeText(text, fileName || 'uploaded-document.txt') });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to analyze research document' });
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
            baseReport.classification = { ...baseReport.classification, documentType: aiData.documentType || baseReport.classification.documentType, documentTypeName: aiData.documentTypeName || baseReport.classification.documentTypeName, methodologyType: aiData.methodologyType || baseReport.classification.methodologyType, epistemology: aiData.epistemology || baseReport.classification.epistemology, confidenceScore: aiData.confidenceScore ?? baseReport.classification.confidenceScore, rationale: aiData.rationale || baseReport.classification.rationale, unitOfAnalysis: aiData.unitOfAnalysis || baseReport.classification.unitOfAnalysis, recommendedInstrumentId: aiData.recommendedInstrumentId || baseReport.classification.recommendedInstrumentId, alternativeInstrumentIds: Array.isArray(aiData.alternativeInstrumentIds) ? aiData.alternativeInstrumentIds : baseReport.classification.alternativeInstrumentIds, incompatibleInstrumentIds: Array.isArray(aiData.incompatibleInstrumentIds) ? aiData.incompatibleInstrumentIds : baseReport.classification.incompatibleInstrumentIds };
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
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Feil ved metaundersøkelse av dokument' });
    }
  });

  app.post('/api/evidence/verify-doi', async (req: Request, res: Response) => {
    try {
      const { doi } = req.body;
      if (!doi || typeof doi !== 'string') return res.status(400).json({ success: false, error: 'DOI er påkrevd.' });
      const verification = await EvidenceIntelligenceService.verifyPublicationByDoi(doi);
      if (!verification) return res.status(404).json({ success: false, status: 'NOT_FOUND', message: 'Ingen verifiserbar Crossref-post ble funnet.' });
      res.json({ success: true, verification, methodologicalNote: 'Crossref metadata kan ikke alene bekrefte fagfellevurdering.' });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err.message || 'Feil ved ekstern kildeverifisering.' });
    }
  });

  app.get('/api/evidence/search/europe-pmc', async (req: Request, res: Response) => {
    try {
      const query = String(req.query.q || '').trim();
      const pageSize = Number(req.query.pageSize || 25);
      const page = Number(req.query.page || 1);
      if (!query) return res.status(400).json({ success: false, error: 'Søketekst mangler.' });
      const result = await EvidenceIntelligenceService.searchEuropePmc(query, pageSize, page);
      const searchRecord = EvidenceIntelligenceService.createSearchRecord('Europe PMC', result.query, { pageSize, page }, result.total, 0, result.results);
      res.json({ success: true, ...result, searchRecord, prismaSNote: 'Søkehistorikken kan brukes som grunnlag for transparent rapportering av databasesøk; PRISMA-S-felter må fylles/valideres av forskeren.' });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err.message || 'Europe PMC-søk feilet.' });
    }
  });

  app.get('/api/jbi/qualitative/audit-trail', (req: Request, res: Response) => {
    const studyId = req.query.studyId as string;
    const entries = studyId ? auditTrailStore.filter(e => e.studyId === studyId) : auditTrailStore;
    res.json({ success: true, count: entries.length, auditTrail: entries });
  });

  app.post('/api/jbi/qualitative/audit-trail', (req: Request, res: Response) => {
    try {
      const entry: AuditTrailEntry = { ...req.body, id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, timestamp: req.body.timestamp || new Date() };
      auditTrailStore.push(entry);
      res.json({ success: true, entry });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Audit trail error' });
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
