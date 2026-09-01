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
import { 
  Amstar2RatingService, 
  Agree2ScoringService, 
  CaspValidationService, 
  JbiValidationService, 
  Rob2ValidationService 
} from './src/services/assessmentEngines';
import { MASTER_INSTRUMENTS_REGISTRY } from './src/data/masterRegistry';
import { ArticleAppraisal, AuditTrailEntry } from './src/types';
import { GoogleGenAI } from '@google/genai';
import { EvidenceIntelligenceService } from './src/services/evidenceIntelligenceService';

// Lazy Gemini Client initialization
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// In-memory store initialized with default peer-reviewed appraisals
let assessmentsStore: ArticleAppraisal[] = [...INITIAL_ARTICLES];
let auditTrailStore: AuditTrailEntry[] = INITIAL_ARTICLES.flatMap(a => a.auditTrail || []);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // ==========================================
  // API ROUTES
  // ==========================================

  // 1. Healthcheck
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', tool: 'Evidence Appraisal Tool', version: '2026.1' });
  });

  // 2. Instrument Registry Endpoint: GET /api/instruments
  app.get('/api/instruments', (req: Request, res: Response) => {
    res.json({
      success: true,
      count: MASTER_INSTRUMENTS_REGISTRY.length,
      instruments: MASTER_INSTRUMENTS_REGISTRY
    });
  });

  // 3. JBI Qualitative Validation: POST /api/jbi/qualitative/validate
  app.post('/api/jbi/qualitative/validate', (req: Request, res: Response) => {
    try {
      const assessment: Partial<ArticleAppraisal> = req.body;
      const report = JbiQualitativeValidationService.validate(assessment);
      res.json({
        success: true,
        report
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Validation error'
      });
    }
  });

  // 4. Retrieve Assessments: GET /api/jbi/qualitative/assessments
  app.get('/api/jbi/qualitative/assessments', (req: Request, res: Response) => {
    res.json({
      success: true,
      count: assessmentsStore.length,
      assessments: assessmentsStore
    });
  });

  // 5. Create or Update Assessment: POST /api/jbi/qualitative/assessments
  app.post('/api/jbi/qualitative/assessments', (req: Request, res: Response) => {
    try {
      const newOrUpdated: ArticleAppraisal = req.body;
      if (!newOrUpdated.id) {
        newOrUpdated.id = `jbi-${Date.now()}`;
      }

      // Check validation
      const report = JbiQualitativeValidationService.validate(newOrUpdated);

      const existingIndex = assessmentsStore.findIndex(a => a.id === newOrUpdated.id);
      if (existingIndex >= 0) {
        assessmentsStore[existingIndex] = newOrUpdated;
      } else {
        assessmentsStore.unshift(newOrUpdated);
      }

      res.json({
        success: true,
        assessment: newOrUpdated,
        validationReport: report
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to save assessment'
      });
    }
  });

  // 5b. Document Parsing & File Extraction API: POST /api/documents/parse-file
  app.post('/api/documents/parse-file', async (req: Request, res: Response) => {
    try {
      const { fileName, fileSizeBytes, mimeType, base64Content, textContent } = req.body;
      
      if (!fileName) {
        return res.status(400).json({ success: false, error: 'Filnavn mangler.' });
      }

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

      res.json({
        success: true,
        data: parseResult
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Feil under dokumentbehandling og tekstraksjon.'
      });
    }
  });

  // 6. Research Document Analysis: POST /api/jbi/qualitative/analyze-document
  app.post('/api/jbi/qualitative/analyze-document', (req: Request, res: Response) => {
    try {
      const { text, fileName } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Tekst fra forskningsartikkel er påkrevd.'
        });
      }

      const result = DocumentAnalysisService.analyzeText(text, fileName || 'uploaded-document.txt');
      res.json({
        success: true,
        result
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to analyze research document'
      });
    }
  });

  // 6b. Comprehensive Meta-Research & Document Classifier: POST /api/meta-research/analyze
  app.post('/api/meta-research/analyze', async (req: Request, res: Response) => {
    try {
      const { text, fileName } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Dokumenttekst eller forskningsartikkel er påkrevd.'
        });
      }

      // Base report from deterministic integrity engine
      const baseReport = MetaResearchService.classifyAndAuditDocument(text, fileName || 'document.pdf');

      // Attempt AI reasoning if Gemini API is available
      const ai = getGeminiClient();
      if (ai) {
        try {
          const prompt = `Du er en ledende ekspert i metavitenskap, forskningsmetodikk og evidensvurdering (forsk på forskning / integrity gate).
Analyser følgende forskningsdokument/tekst og returner en presis JSON-struktur:
1. Dokumentkategori: (PRIMARY_QUALITATIVE, PRIMARY_QUANT_RCT, PRIMARY_QUANT_OBSERVATIONAL, PRIMARY_MIXED_METHODS, PRIMARY_DIAGNOSTIC, SECONDARY_SYSTEMATIC_REVIEW, SECONDARY_SCOPING_REVIEW, SECONDARY_QUALITATIVE_SYNTHESIS, CLINICAL_GUIDELINE, IMPLEMENTATION_QUALITY_IMPROVEMENT, METHODOLOGICAL_PROTOCOL, OTHER)
2. Metodologifamilie
3. Epistemologisk/filosofisk posisjon
4. Anbefalt primærinstrument (f.eks. jbi-qualitative-2017, amstar-2, agree-ii, rob-2, robins-i, mmat-2018, quadas-2, cfir-2)
5. Vurdering av 9 integritetsdimensjoner: Problemstilling, Metodisk koherens, Utvalgsbegrunnelse/power, Forskerrefleksivitet, Etikk/samtykke, Forhåndsregistrering, Finansiering/COI, Datadeling/FAIR, Konklusjonsforankring.
6. Samlet integritetsnivå (HIGH_INTEGRITY, MODERATE_INTEGRITY, REPORTING_DEFICIT, HIGH_RISK_OF_BIAS).

Tekst fra dokumentet:
${text.slice(0, 7000)}

Returner KUN gyldig JSON med feltene:
{
  "extractedTitle": "...",
  "extractedAuthors": "...",
  "extractedYear": "...",
  "extractedDoi": "...",
  "documentType": "...",
  "documentTypeName": "...",
  "methodologyType": "...",
  "epistemology": "...",
  "confidenceScore": 95,
  "rationale": "...",
  "unitOfAnalysis": "...",
  "recommendedInstrumentId": "...",
  "alternativeInstrumentIds": ["..."],
  "incompatibleInstrumentIds": ["..."],
  "overallIntegrityLevel": "HIGH_INTEGRITY",
  "integritySummary": "...",
  "keyStrengths": ["..."],
  "potentialMethodologicalRisks": ["..."]
}`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json'
            }
          });

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
              confidenceScore: aiData.confidenceScore || baseReport.classification.confidenceScore,
              rationale: aiData.rationale || baseReport.classification.rationale,
              unitOfAnalysis: aiData.unitOfAnalysis || baseReport.classification.unitOfAnalysis,
              recommendedInstrumentId: aiData.recommendedInstrumentId || baseReport.classification.recommendedInstrumentId,
              alternativeInstrumentIds: aiData.alternativeInstrumentIds || baseReport.classification.alternativeInstrumentIds,
              incompatibleInstrumentIds: aiData.incompatibleInstrumentIds || baseReport.classification.incompatibleInstrumentIds
            };
            baseReport.overallIntegrityLevel = aiData.overallIntegrityLevel || baseReport.overallIntegrityLevel;
            baseReport.integritySummary = aiData.integritySummary || baseReport.integritySummary;
            if (Array.isArray(aiData.keyStrengths) && aiData.keyStrengths.length > 0) {
              baseReport.keyStrengths = aiData.keyStrengths;
            }
            if (Array.isArray(aiData.potentialMethodologicalRisks) && aiData.potentialMethodologicalRisks.length > 0) {
              baseReport.potentialMethodologicalRisks = aiData.potentialMethodologicalRisks;
            }
            baseReport.engineUsed = 'GEMINI_AI';
          }
        } catch (aiErr) {
          console.warn('Gemini API call warning, continuing with deterministic fallback report:', aiErr);
          baseReport.engineUsed = 'DETERMINISTIC_FALLBACK';
        }
      } else {
        baseReport.engineUsed = 'DETERMINISTIC_FALLBACK';
      }

      res.json({
        success: true,
        report: baseReport
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Feil ved metaundersøkelse av dokument'
      });
    }
  });

  // 6c. Evidence intelligence: bibliographic verification and structured literature search
  app.post('/api/evidence/verify-doi', async (req: Request, res: Response) => {
    try {
      const { doi } = req.body;
      if (!doi || typeof doi !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'DOI er påkrevd.'
        });
      }

      const verification = await EvidenceIntelligenceService.verifyPublicationByDoi(doi);
      if (!verification) {
        return res.status(404).json({
          success: false,
          status: 'NOT_FOUND',
          message: 'Ingen verifiserbar Crossref-post ble funnet. Dette er ikke i seg selv dokumentasjon på at publikasjonen er ugyldig.'
        });
      }

      res.json({
        success: true,
        verification,
        methodologicalNote: 'Crossref metadata kan ikke alene bekrefte fagfellevurdering.'
      });
    } catch (err: any) {
      res.status(502).json({
        success: false,
        error: err.message || 'Feil ved ekstern kildeverifisering.'
      });
    }
  });

  app.get('/api/evidence/search/europe-pmc', async (req: Request, res: Response) => {
    try {
      const query = String(req.query.q || '').trim();
      const pageSize = Number(req.query.pageSize || 25);
      const page = Number(req.query.page || 1);

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Søketekst mangler.'
        });
      }

      const result = await EvidenceIntelligenceService.searchEuropePmc(query, pageSize, page);
      const searchRecord = EvidenceIntelligenceService.createSearchRecord(
        'Europe PMC',
        result.query,
        { pageSize, page },
        result.total,
        0,
        result.results
      );

      res.json({
        success: true,
        ...result,
        searchRecord,
        prismaSNote: 'Søkehistorikken kan brukes som grunnlag for transparent rapportering av databasesøk; PRISMA-S-felter må fylles/valideres av forskeren.'
      });
    } catch (err: any) {
      res.status(502).json({
        success: false,
        error: err.message || 'Europe PMC-søk feilet.'
      });
    }
  });

  // 7. Audit Trail API: GET & POST /api/jbi/qualitative/audit-trail
  app.get('/api/jbi/qualitative/audit-trail', (req: Request, res: Response) => {
    const studyId = req.query.studyId as string;
    let entries = auditTrailStore;
    if (studyId) {
      entries = entries.filter(e => e.studyId === studyId);
    }
    res.json({
      success: true,
      count: entries.length,
      auditTrail: entries
    });
  });

  app.post('/api/jbi/qualitative/audit-trail', (req: Request, res: Response) => {
    try {
      const entry: AuditTrailEntry = {
        ...req.body,
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: req.body.timestamp || new Date().toISOString()
      };
      auditTrailStore.unshift(entry);
      res.json({
        success: true,
        entry
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to log audit trail entry'
      });
    }
  });

  // 8. Dual Review Comparison: POST /api/jbi/qualitative/dual-review/compare
  app.post('/api/jbi/qualitative/dual-review/compare', (req: Request, res: Response) => {
    try {
      const { studyId, r1, r2 } = req.body;
      if (!r1 || !r2) {
        return res.json({
          success: true,
          comparison: DUAL_REVIEW_SAMPLE
        });
      }

      // Build comparison
      const itemComparisons = [];
      let agreements = 0;
      let disagreements = 0;

      for (let qId = 1; qId <= 10; qId++) {
        const item1 = r1.items?.find((i: any) => i.questionId === qId);
        const item2 = r2.items?.find((i: any) => i.questionId === qId);

        const s1 = item1?.status || 'Ubesvart';
        const s2 = item2?.status || 'Ubesvart';
        const isAgreement = (s1 === s2) && s1 !== 'Ubesvart';

        if (isAgreement) agreements++;
        else disagreements++;

        itemComparisons.push({
          questionId: qId,
          questionTitle: `Spørsmål ${qId}`,
          r1Status: s1,
          r2Status: s2,
          isAgreement,
          r1Rationale: item1?.justification || '',
          r2Rationale: item2?.justification || '',
          consensusStatus: isAgreement ? s1 : undefined,
          consensusRationale: isAgreement ? item1?.justification : 'Krever konsensusmøte for avklaring.'
        });
      }

      res.json({
        success: true,
        comparison: {
          studyId: studyId || 'custom-dual-review',
          studyTitle: req.body.studyTitle || 'Dual Review Sammenligning',
          reviewer1: r1,
          reviewer2: r2,
          itemComparisons,
          overallAgreementPercentage: Math.round((agreements / 10) * 100),
          totalAgreements: agreements,
          totalDisagreements: disagreements,
          consensusVerdict: disagreements === 0 ? r1.verdict : 'Vurder videre'
        }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Dual review comparison error'
      });
    }
  });

  // ==========================================
  // REFERENCE VALIDATION & TEST PYRAMID ENDPOINTS
  // ==========================================

  // 10. Get all reference validation articles (Gold Standards)
  app.get('/api/validation/reference-articles', (req: Request, res: Response) => {
    try {
      const articles = ReferenceValidationService.getAllReferenceArticles();
      res.json({
        success: true,
        count: articles.length,
        articles
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 11. Run Full 3-Level Test Pyramid Contract Tests
  app.get('/api/validation/contract-tests', (req: Request, res: Response) => {
    try {
      const summary = MethodologyContractTests.runAllContractTests();
      res.json({
        success: true,
        summary
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 12. Run Gold-Standard Item-for-Item Diff Analysis
  app.post('/api/validation/gold-standard-diff', (req: Request, res: Response) => {
    try {
      const { referenceArticleId, applicationResponses } = req.body;
      const refArticle = ReferenceValidationService.getReferenceArticleById(referenceArticleId);
      if (!refArticle) {
        return res.status(404).json({ success: false, error: 'Reference article not found' });
      }

      const diffResult = ReferenceValidationService.compareAgainstGoldStandard(refArticle, applicationResponses || {});
      res.json({
        success: true,
        diffResult
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 13. AMSTAR 2 Strict Evaluation Endpoint
  app.post('/api/scoring/amstar2', (req: Request, res: Response) => {
    try {
      const { items } = req.body;
      const evaluation = Amstar2RatingService.evaluate(items || []);
      res.json({
        success: true,
        evaluation
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 14. AGREE II Standardized Domain Scoring Endpoint
  app.post('/api/scoring/agree2', (req: Request, res: Response) => {
    try {
      const { itemScores, totalAppraisers } = req.body;
      const domainScores = Agree2ScoringService.calculateDomainScores(itemScores || {}, totalAppraisers || 1);
      res.json({
        success: true,
        domainScores
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // VITE / STATIC MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Evidence Appraisal Tool Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
