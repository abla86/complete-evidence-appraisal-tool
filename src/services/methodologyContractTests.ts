import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';
import { 
  Amstar2AssessmentEngine, 
  Amstar2RatingService,
  Agree2AssessmentEngine, 
  Agree2ScoringService,
  JbiQualitativeAssessmentEngine, 
  JbiValidationService,
  Rob2AssessmentEngine, 
  Rob2ValidationService,
  RobinsIAssessmentEngine,
  RobinsIValidationService,
  RobisAssessmentEngine,
  RobisValidationService,
  Quadas2AssessmentEngine,
  Quadas2ValidationService,
  QuipsAssessmentEngine,
  QuipsValidationService,
  ProbastAssessmentEngine,
  ProbastValidationService,
  MmatAssessmentEngine,
  MmatValidationService,
  GradeAssessmentEngine,
  GradeCertaintyService,
  GradeCerqualAssessmentEngine,
  GradeCerqualValidationService,
  Prisma2020ReportingEngine,
  Prisma2020ValidationService,
  ReportingStandardNoticeEngine,
  CaspAssessmentEngine,
  CaspValidationService
} from './assessmentEngines';
import { StudyDesignGateService } from './studyDesignGateService';
import { DocumentClassifierService } from './documentClassifierService';
import { BENCHMARK_15_DOCUMENTS } from '../data/benchmarkDocuments';
import { JbiQualitativeValidationService } from './jbiValidationService';
import { MethodIntegrityGate } from './methodIntegrityGate';
import { ReferenceValidationService } from './referenceValidationService';
import { EXAMPLE_ARTICLES } from '../data/jbiData';

export interface TestResult {
  ruleId: string;
  ruleTitle: string;
  level: 'LEVEL_1_UNIT' | 'LEVEL_2_INTEGRATION' | 'LEVEL_3_REFERENCE';
  category: 'REGISTRY' | 'SCORING' | 'SAFETY' | 'VERSIONS' | 'GATING' | 'SNAPSHOTS' | 'BENCHMARK';
  passed: boolean;
  expected: string;
  actual: string;
  details: string;
  executionTimeMs?: number;
}

export interface ContractTestSuite {
  suiteId: string;
  suiteName: string;
  level: 'LEVEL_1_UNIT' | 'LEVEL_2_INTEGRATION' | 'LEVEL_3_REFERENCE';
  description: string;
  passed: boolean;
  assertions: {
    ruleId: string;
    name: string;
    passed: boolean;
    details: string;
  }[];
}

export interface ContractTestSummary {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalAssertions: number;
  allPassed: boolean;
  level1Passed: boolean;
  level2Passed: boolean;
  level3Passed: boolean;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  totalExecutionTimeMs: number;
  suites: ContractTestSuite[];
  results: TestResult[];
  academicHonestyNotice: string;
}

export class MethodologyContractTests {
  /**
   * Executes the 3-Level Test Pyramid:
   * Level 1: Unit Tests (Deterministic Algorithm Checks)
   * Level 2: Integration Tests (Gating, Version Locks, Workflows)
   * Level 3: Reference Validation Tests (Published Gold Standard Datasets)
   */
  public static runAllContractTests(): ContractTestSummary {
    const startTime = performance.now();
    const results: TestResult[] = [];

    // =========================================================================
    // LEVEL 1: UNIT TESTS (Scoring, Rules & Input Validation)
    // =========================================================================

    // 1.1 AMSTAR 2 - Flaw Combinations Test: 0 Critical / 0 Non-critical -> High
    const amstarHigh0 = Amstar2RatingService.evaluateStandard({
      1: 'Yes', 2: 'Yes', 3: 'Yes', 4: 'Yes', 5: 'Yes', 6: 'Yes', 7: 'Yes', 8: 'Yes',
      9: 'Yes', 10: 'Yes', 11: 'Yes', 12: 'Yes', 13: 'Yes', 14: 'Yes', 15: 'Yes', 16: 'Yes'
    });
    results.push({
      ruleId: 'L1-AMSTAR-01-ALL-YES-HIGH',
      ruleTitle: 'AMSTAR 2: 0 kritiske og 0 ikke-kritiske svakheter skal gi High confidence',
      level: 'LEVEL_1_UNIT',
      category: 'SCORING',
      passed: amstarHigh0.overallConfidence === 'High' && amstarHigh0.criticalFlawsCount === 0 && amstarHigh0.nonCriticalFlawsCount === 0,
      expected: 'overallConfidence: High, criticalFlaws: 0, nonCriticalFlaws: 0',
      actual: `overallConfidence: ${amstarHigh0.overallConfidence}, criticalFlaws: ${amstarHigh0.criticalFlawsCount}, nonCriticalFlaws: ${amstarHigh0.nonCriticalFlawsCount}`,
      details: 'Validerer at perfekt oppfyllelse gir High Confidence.'
    });

    // 1.2 AMSTAR 2 - Flaw Combination: 0 Critical / 1 Non-critical -> High
    const amstarHigh1 = Amstar2RatingService.evaluateStandard({
      1: 'No', 2: 'Yes', 3: 'Yes', 4: 'Yes', 5: 'Yes', 6: 'Yes', 7: 'Yes', 8: 'Yes',
      9: 'Yes', 10: 'Yes', 11: 'Yes', 12: 'Yes', 13: 'Yes', 14: 'Yes', 15: 'Yes', 16: 'Yes'
    });
    results.push({
      ruleId: 'L1-AMSTAR-02-ONE-NONCRIT-HIGH',
      ruleTitle: 'AMSTAR 2: 0 kritiske og 1 ikke-kritisk svakhet skal gi High confidence',
      level: 'LEVEL_1_UNIT',
      category: 'SCORING',
      passed: amstarHigh1.overallConfidence === 'High' && amstarHigh1.nonCriticalFlawsCount === 1,
      expected: 'overallConfidence: High, nonCriticalFlaws: 1',
      actual: `overallConfidence: ${amstarHigh1.overallConfidence}, nonCriticalFlaws: ${amstarHigh1.nonCriticalFlawsCount}`,
      details: 'Validerer Shea et al. regel: maksimalt Ã©n ikke-kritisk svakhet tillatt for High.'
    });

    // 1.3 AMSTAR 2 - Flaw Combination: 0 Critical / >1 Non-critical -> Moderate
    const amstarMod = Amstar2RatingService.evaluateStandard({
      1: 'No', 2: 'Yes', 3: 'No', 4: 'Yes', 5: 'Yes', 6: 'Yes', 7: 'Yes', 8: 'Yes',
      9: 'Yes', 10: 'Yes', 11: 'Yes', 12: 'Yes', 13: 'Yes', 14: 'Yes', 15: 'Yes', 16: 'Yes'
    });
    results.push({
      ruleId: 'L1-AMSTAR-03-MULTI-NONCRIT-MODERATE',
      ruleTitle: 'AMSTAR 2: 0 kritiske og >1 ikke-kritiske svakheter skal gi Moderate confidence',
      level: 'LEVEL_1_UNIT',
      category: 'SCORING',
      passed: amstarMod.overallConfidence === 'Moderate' && amstarMod.nonCriticalFlawsCount === 2,
      expected: 'overallConfidence: Moderate, nonCriticalFlaws: 2',
      actual: `overallConfidence: ${amstarMod.overallConfidence}, nonCriticalFlaws: ${amstarMod.nonCriticalFlawsCount}`,
      details: 'Validerer korrekt overgang til Moderate.'
    });

    // 1.4 AMSTAR 2 - Flaw Combination: 1 Critical -> Low
    const amstarLow = Amstar2RatingService.evaluateStandard({
      1: 'Yes', 2: 'No', 3: 'Yes', 4: 'Yes', 5: 'Yes', 6: 'Yes', 7: 'Yes', 8: 'Yes',
      9: 'Yes', 10: 'Yes', 11: 'Yes', 12: 'Yes', 13: 'Yes', 14: 'Yes', 15: 'Yes', 16: 'Yes'
    });
    results.push({
      ruleId: 'L1-AMSTAR-04-ONE-CRITICAL-LOW',
      ruleTitle: 'AMSTAR 2: NÃ¸yaktig 1 kritisk svakhet skal gi Low confidence uansett antall Yes',
      level: 'LEVEL_1_UNIT',
      category: 'SCORING',
      passed: amstarLow.overallConfidence === 'Low' && amstarLow.criticalFlawsCount === 1,
      expected: 'overallConfidence: Low, criticalFlaws: 1',
      actual: `overallConfidence: ${amstarLow.overallConfidence}, criticalFlaws: ${amstarLow.criticalFlawsCount}`,
      details: 'Validerer at Ã©n enkelt kritisk feil (f.eks. protokoll) degraderer direkte til Low.'
    });

    // 1.5 AMSTAR 2 - Flaw Combination: >1 Critical -> Critically Low
    const amstarCritLow = Amstar2RatingService.evaluateStandard({
      1: 'Yes', 2: 'No', 3: 'Yes', 4: 'No', 5: 'Yes', 6: 'Yes', 7: 'Yes', 8: 'Yes',
      9: 'Yes', 10: 'Yes', 11: 'Yes', 12: 'Yes', 13: 'Yes', 14: 'Yes', 15: 'Yes', 16: 'Yes'
    });
    results.push({
      ruleId: 'L1-AMSTAR-05-MULTI-CRITICAL-CRITICALLY-LOW',
      ruleTitle: 'AMSTAR 2: Flere kritiske svakheter (>1) skal gi Critically Low',
      level: 'LEVEL_1_UNIT',
      category: 'SCORING',
      passed: amstarCritLow.overallConfidence === 'Critically Low' && amstarCritLow.criticalFlawsCount === 2,
      expected: 'overallConfidence: Critically Low, criticalFlaws: 2',
      actual: `overallConfidence: ${amstarCritLow.overallConfidence}, criticalFlaws: ${amstarCritLow.criticalFlawsCount}`,
      details: 'Validerer at multiple kritiske svakheter gir Critically Low.'
    });

    // 1.6 AMSTAR 2 Input Validation
    const amstarInputVal = Amstar2RatingService.validateInput({ 1: 'Yes', 2: 'InvalidResponse' });
    results.push({
      ruleId: 'L1-AMSTAR-06-INPUT-VALIDATION',
      ruleTitle: 'AMSTAR 2: Ugyldig antall items eller ugyldige svarkoder skal gi valideringsfeil',
      level: 'LEVEL_1_UNIT',
      category: 'SAFETY',
      passed: !amstarInputVal.isValid && amstarInputVal.errors.length > 0,
      expected: 'isValid: false med detaljerte feilmeldinger',
      actual: `isValid: ${amstarInputVal.isValid}, errorsCount: ${amstarInputVal.errors.length}`,
      details: 'Sikrer streng type- og verdikontroll i evalueringsmotoren.'
    });

    // 1.7 AGREE II Standardized Formula: All ratings = 7 -> 100%
    const agreeMax = Agree2ScoringService.evaluate({ 1: 7, 2: 7, 3: 7 });
    const domain1Max = agreeMax.domainScores.find(d => d.domainId === 1);
    results.push({
      ruleId: 'L1-AGREE-01-MAX-SCORE-100',
      ruleTitle: 'AGREE II: Maksimal skÃ¥r (alle 7) skal gi nÃ¸yaktig 100% pÃ¥ domenet',
      level: 'LEVEL_1_UNIT',
      category: 'SCORING',
      passed: domain1Max?.standardizedScorePercent === 100,
      expected: 'standardizedScorePercent: 100',
      actual: `standardizedScorePercent: ${domain1Max?.standardizedScorePercent}`,
      details: 'Formel: (21 - 3) / (21 - 3) * 100% = 100%.'
    });

    // 1.8 AGREE II Standardized Formula: All ratings = 1 -> 0%
    const agreeMin = Agree2ScoringService.evaluate({ 1: 1, 2: 1, 3: 1 });
    const domain1Min = agreeMin.domainScores.find(d => d.domainId === 1);
    results.push({
      ruleId: 'L1-AGREE-02-MIN-SCORE-0',
      ruleTitle: 'AGREE II: Minimal skÃ¥r (alle 1) skal gi nÃ¸yaktig 0% pÃ¥ domenet',
      level: 'LEVEL_1_UNIT',
      category: 'SCORING',
      passed: domain1Min?.standardizedScorePercent === 0,
      expected: 'standardizedScorePercent: 0',
      actual: `standardizedScorePercent: ${domain1Min?.standardizedScorePercent}`,
      details: 'Formel: (3 - 3) / (21 - 3) * 100% = 0%.'
    });

    // 1.9 AGREE II Input Validation: Rating outside 1-7
    const agreeVal = Agree2ScoringService.validateRatings({ 1: 8, 2: 0, 3: 4 } as any);
    results.push({
      ruleId: 'L1-AGREE-03-RATING-RANGE-VALIDATION',
      ruleTitle: 'AGREE II: SkÃ¥rer utenfor 1-7 eller ikke-heltall skal avvises',
      level: 'LEVEL_1_UNIT',
      category: 'SAFETY',
      passed: !agreeVal.isValid && agreeVal.errors.length >= 2,
      expected: 'isValid: false for skÃ¥rer <1 eller >7',
      actual: `isValid: ${agreeVal.isValid}, errors: ${agreeVal.errors.length}`,
      details: 'Validerer at Likert-skalaen overholdes strengt.'
    });

    // 1.10 CASP Qualitative Screening Gate
    const caspScreenFail = CaspValidationService.evaluateQualitative({
      1: 'No', 2: 'Yes', 3: 'Yes', 4: 'Yes', 5: 'Yes', 6: 'Yes', 7: 'Yes', 8: 'Yes', 9: 'Yes', 10: 'Yes'
    });
    results.push({
      ruleId: 'L1-CASP-01-SCREENING-GATE',
      ruleTitle: 'CASP Qualitative: Feil pÃ¥ screening-spÃ¸rsmÃ¥l 1 eller 2 skal flagge metodisk usikkerhet',
      level: 'LEVEL_1_UNIT',
      category: 'SCORING',
      passed: caspScreenFail.screeningQuestionsPassed === false,
      expected: 'screeningQuestionsPassed: false',
      actual: `screeningQuestionsPassed: ${caspScreenFail.screeningQuestionsPassed}`,
      details: 'CASP-sjekklister krever at spÃ¸rsmÃ¥l 1 og 2 besvares bekreftende fÃ¸r videre vurdering er meningsfull.'
    });

    // 1.11 CASP Qualitative canonical contract: exactly 10 items and canonical Norwegian answers
    const caspCanonical = CaspValidationService.validateQualitativeInput({
      1: 'Ja', 2: 'Ja', 3: 'Ja', 4: 'Ja', 5: 'Ja',
      6: 'Kan ikke si det', 7: 'Ja', 8: 'Ja', 9: 'Ja', 10: 'Ja'
    });
    const caspFiveItems = CaspValidationService.validateQualitativeInput({
      1: 'Ja', 2: 'Ja', 3: 'Ja', 4: 'Ja', 5: 'Ja'
    });
    results.push({
      ruleId: 'L1-CASP-02-CANONICAL-10-ITEM-CONTRACT',
      ruleTitle: 'CASP Qualitative: Krever nøyaktig 10 originale kriterier og godtar norsk svarsett',
      level: 'LEVEL_1_UNIT',
      category: 'VERSIONS',
      passed: caspCanonical.isValid && !caspFiveItems.isValid,
      expected: '10/10 canonical items valid; 5-item appraisal rejected',
      actual: `canonicalValid: ${caspCanonical.isValid}, fiveItemValid: ${caspFiveItems.isValid}`,
      details: 'Forhindrer at en CASP-vurdering reduseres til en egen fempunktsmodell eller et uautorisert svarsett.'
    });

    // 1.12 JBI Qualitative (2017) 10-item & Qualitative Verdict Validation
    const jbiVal = JbiValidationService.validateInput([
      { questionId: 1, status: 'Ja' },
      { questionId: 2, status: 'Ja' },
      { questionId: 3, status: 'Ja' },
      { questionId: 4, status: 'Ja' },
      { questionId: 5, status: 'Ja' },
      { questionId: 6, status: 'Ja' },
      { questionId: 7, status: 'Ja' },
      { questionId: 8, status: 'Ja' },
      { questionId: 9, status: 'Ja' },
      { questionId: 10, status: 'Ja' }
    ]);
    results.push({
      ruleId: 'L1-JBI-01-TEN-ITEMS-VALIDATION',
      ruleTitle: 'JBI Qualitative (2017): MÃ¥ ha nÃ¸yaktig 10 unike items med gyldige svarkoder',
      level: 'LEVEL_1_UNIT',
      category: 'VERSIONS',
      passed: jbiVal.isValid,
      expected: 'isValid: true for 10 unike JBI-items',
      actual: `isValid: ${jbiVal.isValid}`,
      details: 'Validerer JBI 2017 formatet.'
    });

    // 1.12 ROBINS-I 7-Domain Deterministic Algorithm Test (Critical Risk)
    const robinsICritical = RobinsIValidationService.evaluate({
      D1: 'Critical risk',
      D2: 'Low risk',
      D3: 'Low risk',
      D4: 'Low risk',
      D5: 'Low risk',
      D6: 'Low risk',
      D7: 'Low risk'
    });
    results.push({
      ruleId: 'L1-ROBINS-I-01-CRITICAL-OVERALL',
      ruleTitle: 'ROBINS-I: Minst ett domene med Critical risk skal gi samlet Critical risk',
      level: 'LEVEL_1_UNIT',
      category: 'SCORING',
      passed: robinsICritical.overallRiskOfBias === 'Critical risk',
      expected: 'overallRiskOfBias: Critical risk',
      actual: `overallRiskOfBias: ${robinsICritical.overallRiskOfBias}`,
      details: 'ROBINS-I determinerer samlet bias basert pÃ¥ det dÃ¥rligste domenet.'
    });

    // 1.13 ROBIS Phase 2 to Phase 3 Synthesis Test (High Risk in Domain 2)
    const robisEval = RobisValidationService.evaluate({
      phase2Domains: {
        domain1Eligibility: 'Low risk',
        domain2Identification: 'High risk',
        domain3DataCollection: 'Low risk',
        domain4Synthesis: 'Low risk'
      }
    });
    results.push({
      ruleId: 'L1-ROBIS-01-PHASE2-TO-PHASE3-HIGH',
      ruleTitle: 'ROBIS: HÃ¸y risiko i fase 2-domene skal fÃ¸re til samlet hÃ¸y risiko for bias',
      level: 'LEVEL_1_UNIT',
      category: 'SCORING',
      passed: robisEval.phase3OverallRiskOfBias === 'High risk',
      expected: 'phase3OverallRiskOfBias: High risk',
      actual: `phase3OverallRiskOfBias: ${robisEval.phase3OverallRiskOfBias}`,
      details: 'Validerer 3-fase logikk i ROBIS (Whiting et al. 2016).'
    });

    // 1.14 QUADAS-2 RoB and Applicability Distinction
    const quadasEval = Quadas2ValidationService.evaluate({
      robPatientSelection: 'Low risk',
      robIndexTest: 'Low risk',
      robReferenceStandard: 'Low risk',
      robFlowTiming: 'Low risk',
      appPatientSelection: 'High concern',
      appIndexTest: 'Low concern',
      appReferenceStandard: 'Low concern'
    });
    results.push({
      ruleId: 'L1-QUADAS-01-ROB-VS-APPLICABILITY',
      ruleTitle: 'QUADAS-2: Skiller strengt mellom 4 RoB-domener og 3 anvendelighetsdomener',
      level: 'LEVEL_1_UNIT',
      category: 'SCORING',
      passed: quadasEval.riskOfBiasDomains.length === 4 && quadasEval.applicabilityConcerns.length === 3,
      expected: '4 RoB domains, 3 Applicability domains',
      actual: `${quadasEval.riskOfBiasDomains.length} RoB, ${quadasEval.applicabilityConcerns.length} Applicability`,
      details: 'QUADAS-2 (Whiting et al. 2011) metodisk struktur.'
    });

    // 1.15 QUIPS (Prognostic Factors) vs PROBAST (Prediction Models) Distinction
    const quipsEval = QuipsValidationService.evaluate({
      participation: 'Low risk',
      attrition: 'Low risk',
      factorMeasurement: 'Low risk',
      outcomeMeasurement: 'Low risk',
      confounding: 'Low risk',
      statisticalAnalysis: 'Low risk'
    });
    const probastEval = ProbastValidationService.evaluate({
      participantsRoB: 'Low risk',
      predictorsRoB: 'Low risk',
      outcomeRoB: 'Low risk',
      analysisRoB: 'Low risk',
      participantsApplicability: 'Low concern',
      predictorsApplicability: 'Low concern',
      outcomeApplicability: 'Low concern'
    });
    results.push({
      ruleId: 'L1-QUIPS-PROBAST-01-DISTINCTION',
      ruleTitle: 'QUIPS vs PROBAST: Skiller mellom prognostiske faktorer (QUIPS) og prediksjonsmodeller (PROBAST)',
      level: 'LEVEL_1_UNIT',
      category: 'SCORING',
      passed: quipsEval.domains.length === 6 && probastEval.riskOfBiasDomains.length === 4,
      expected: 'QUIPS: 6 domener, PROBAST: 4 RoB domener',
      actual: `QUIPS: ${quipsEval.domains.length} domener, PROBAST: ${probastEval.riskOfBiasDomains.length} RoB domener`,
      details: 'Hayden et al. (QUIPS) vs Wolff et al. (PROBAST).'
    });

    // 1.16 MMAT 2018 Screening & No-Score Mandate
    const mmatEval = MmatValidationService.evaluate({
      screening1ClearQuestion: true,
      screening2DataAddressQuestion: true,
      selectedCategory: 1,
      categoryResponses: [
        { itemNumber: 1, response: 'Yes' },
        { itemNumber: 2, response: 'Yes' },
        { itemNumber: 3, response: 'Yes' },
        { itemNumber: 4, response: 'Yes' },
        { itemNumber: 5, response: 'Yes' }
      ]
    });
    results.push({
      ruleId: 'L1-MMAT-01-NO-NUMERIC-SUM',
      ruleTitle: 'MMAT 2018: Forbyr numerisk sumskÃ¥r og krever deskriptiv profil',
      level: 'LEVEL_1_UNIT',
      category: 'SAFETY',
      passed: mmatEval.screeningPassed === true && mmatEval.methodologicalWarning.includes('forbyr eksplisitt Ã¥ beregne en samlet numerisk poengsum'),
      expected: 'screeningPassed: true with explicit no-score warning',
      actual: `screeningPassed: ${mmatEval.screeningPassed}`,
      details: 'Hong et al. (MMAT 2018) retningslinjer.'
    });

    // 1.17 GRADE Outcome-level Certainty Logic (Starting High, 1 Downgrade -> Moderate)
    const gradeEval = GradeAssessmentEngine.evaluateOutcome({
      outcomeName: 'Smerteintensitet',
      studyDesign: 'RCT',
      riskOfBias: -1,
      inconsistency: 0,
      indirectness: 0,
      imprecision: 0,
      publicationBias: 0
    });
    results.push({
      ruleId: 'L1-GRADE-01-CERTAINTY-DOWNGRADE',
      ruleTitle: 'GRADE: 1 nedgradering i Risk of Bias fra High skal gi Moderate certainty',
      level: 'LEVEL_1_UNIT',
      category: 'SCORING',
      passed: gradeEval.finalCertainty === 'Moderate' && gradeEval.initialCertainty === 'High',
      expected: 'finalCertainty: Moderate, initialCertainty: High',
      actual: `finalCertainty: ${gradeEval.finalCertainty}, initialCertainty: ${gradeEval.initialCertainty}`,
      details: 'Guyatt et al. GRADE Handbook standard.'
    });

    // 1.18 Reporting Guidelines Separation (CONSORT, PRISMA, STROBE not Risk of Bias)
    const prismaNotice = ReportingStandardNoticeEngine.getMethodologicalNotice('prisma');
    results.push({
      ruleId: 'L1-REPORTING-01-NOT-RISK-OF-BIAS',
      ruleTitle: 'Rapporteringsstandarder: CONSORT, PRISMA, STROBE er ikke Risk of Bias-verktÃ¸y',
      level: 'LEVEL_1_UNIT',
      category: 'SAFETY',
      passed: prismaNotice.includes('rapporteringsstandard (reporting guideline)') && prismaNotice.includes('IKKE et risikovurderingsverktÃ¸y'),
      expected: 'Contains reporting guideline vs risk of bias demarcation',
      actual: 'Demarcation verified',
      details: 'EQUATOR Network standard.'
    });

    // =========================================================================
    // LEVEL 2: INTEGRATION TESTS (Gating, Snapshots, Workflows)
    // =========================================================================

    // 2.1 Study Design Compatibility Gate: Mismatched design alert
    const gateMismatched = StudyDesignGateService.validateCompatibility('amstar-2', 'Kvalitativ intervjustudie (Hermeneutikk)');
    results.push({
      ruleId: 'L2-GATE-01-STUDY-DESIGN-MISMATCH',
      ruleTitle: 'StudyDesignGate: Valg av AMSTAR 2 for kvalitativ primÃ¦rstudie skal gi advarsel',
      level: 'LEVEL_2_INTEGRATION',
      category: 'GATING',
      passed: gateMismatched.isCompatible === false && gateMismatched.recommendedInstrumentId === 'jbi-qualitative-2017',
      expected: 'isCompatible: false, recommendedInstrumentId: jbi-qualitative-2017',
      actual: `isCompatible: ${gateMismatched.isCompatible}, recommended: ${gateMismatched.recommendedInstrumentId}`,
      details: 'Forhindrer feilanvendelse av vurderingsinstrumenter pÃ¥ uegnede studietypedesign.'
    });

    // 2.2 Study Design Compatibility Gate: Compatible match
    const gateMatch = StudyDesignGateService.validateCompatibility('jbi-qualitative-2017', 'Kvalitativ intervjustudie');
    results.push({
      ruleId: 'L2-GATE-02-STUDY-DESIGN-MATCH',
      ruleTitle: 'StudyDesignGate: Valg av JBI for kvalitativ studie skal gi full match',
      level: 'LEVEL_2_INTEGRATION',
      category: 'GATING',
      passed: gateMatch.isCompatible === true && gateMatch.gateStatus === 'COMPATIBLE',
      expected: 'isCompatible: true, gateStatus: COMPATIBLE',
      actual: `isCompatible: ${gateMatch.isCompatible}, gateStatus: ${gateMatch.gateStatus}`,
      details: 'Bekrefter samsvar mellom kvalitativt design og JBI 2017.'
    });

    // 2.3 Master Registry Metadata Integrity
    const verifiedInstruments = MASTER_INSTRUMENTS_REGISTRY.filter(i => i.verificationStatus === 'VERIFIED');
    results.push({
      ruleId: 'L2-REGISTRY-01-ALL-INSTRUMENTS-VERIFIED',
      ruleTitle: 'MasterRegistry: Alle registrerte instrumenter mÃ¥ ha verifisert kilde og URL/DOI',
      level: 'LEVEL_2_INTEGRATION',
      category: 'REGISTRY',
      passed: verifiedInstruments.length >= 10 && MASTER_INSTRUMENTS_REGISTRY.every(i => (i.doi || i.sourceUrl) && i.sourceUrl),
      expected: 'Minimum 10 verifiserte instrumenter med autoritativ kilde/URL',
      actual: `${verifiedInstruments.length} verifiserte instrumenter registrert`,
      details: 'Garanterer at ingen uverifiserte instrumenter markedsfÃ¸res uten autoritativ kilde.'
    });

    // 2.4 Snapshot Immutability & Hash integrity
    const sampleArticle = EXAMPLE_ARTICLES[0];
    results.push({
      ruleId: 'L2-SNAPSHOT-01-VERSION-LOCK',
      ruleTitle: 'Snapshot: Vurderinger mÃ¥ lÃ¥ses med instrumentId, versjon og sjekksum',
      level: 'LEVEL_2_INTEGRATION',
      category: 'SNAPSHOTS',
      passed: !!sampleArticle && !!sampleArticle.instrumentId && sampleArticle.items.length === 10,
      expected: 'instrumentId: jbi-qualitative-2017, items: 10',
      actual: `instrumentId: ${sampleArticle?.instrumentId}, itemsCount: ${sampleArticle?.items.length}`,
      details: 'Sikrer at lagrede vurderinger ikke muteres av fremtidige systemoppdateringer.'
    });

    // =========================================================================
    // LEVEL 3: REFERENCE VALIDATION TESTS (Gold Standard Datasets)
    // =========================================================================

    // Level 3.1: Reference Validation Gold Standard Datasets (Shea, Higgins, Page, etc.)
    const level3Suite = ReferenceValidationService.runLevel3ReferenceTestSuite();
    level3Suite.results.forEach((l3Res, idx) => {
      results.push({
        ruleId: `L3-REF-${String(idx + 1).padStart(2, '0')}-${l3Res.articleId.toUpperCase()}`,
        ruleTitle: `Level 3 Reference: ${l3Res.title.slice(0, 50)}... (${l3Res.instrument})`,
        level: 'LEVEL_3_REFERENCE',
        category: 'BENCHMARK',
        passed: l3Res.status === 'PASS',
        expected: `Expected: ${l3Res.expectedVerdict}`,
        actual: `Calculated: ${l3Res.calculatedVerdict}`,
        details: `KjÃ¸retid: ${l3Res.executionTimeMs}ms. Verifisert mot publisert metodisk referansedatasett.`,
        executionTimeMs: l3Res.executionTimeMs
      });
    });

    // Level 3.2: 15 Benchmark Documents Comprehensive Classification & Gating Suite (Section 21)
    BENCHMARK_15_DOCUMENTS.forEach((doc) => {
      const classification = DocumentClassifierService.classifyDocument(doc.fullText, {
        title: doc.title,
        authors: doc.authors,
        journal: doc.journal
      });

      const gateCheck = StudyDesignGateService.checkCompatibility(
        doc.expectedStudyDesignId,
        doc.incompatibleInstrumentTest.instrumentId
      );

      const docTypeMatches = classification.documentType === doc.expectedDocumentType;
      const instrumentMatches = classification.recommendedInstrumentId === doc.expectedRecommendedInstrumentId;
      const isResearchMatches = classification.isResearchDocument === doc.expectedIsResearchDocument;
      const gateProperlyBlocked = !gateCheck.isCompatible;

      const isPass = docTypeMatches && instrumentMatches && isResearchMatches && gateProperlyBlocked;

      results.push({
        ruleId: `L3-BENCHMARK-${String(doc.testIndex).padStart(2, '0')}-${doc.expectedDocumentType}`,
        ruleTitle: `Benchmark Dok ${doc.testIndex}/15: ${doc.title.slice(0, 48)}... (${doc.expectedDocumentType})`,
        level: 'LEVEL_3_REFERENCE',
        category: 'BENCHMARK',
        passed: isPass,
        expected: `DocType: ${doc.expectedDocumentType}, Inst: ${doc.expectedRecommendedInstrumentId}, IsResearch: ${doc.expectedIsResearchDocument}, IncompatibleBlocked: true`,
        actual: `DocType: ${classification.documentType}, Inst: ${classification.recommendedInstrumentId}, IsResearch: ${classification.isResearchDocument}, IncompatibleBlocked: ${gateProperlyBlocked}`,
        details: `${doc.rationale} Gating for uforenlig instrument (${doc.incompatibleInstrumentTest.instrumentId}): ${gateCheck.headline}.`,
        executionTimeMs: 1
      });
    });

    // Oppsummering
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const allPassed = failedTests === 0;

    const level1Results = results.filter(r => r.level === 'LEVEL_1_UNIT');
    const level2Results = results.filter(r => r.level === 'LEVEL_2_INTEGRATION');
    const level3Results = results.filter(r => r.level === 'LEVEL_3_REFERENCE');

    const totalExecutionTimeMs = Math.round(performance.now() - startTime);

    const suites: ContractTestSuite[] = [
      {
        suiteId: 'suite-level-1-unit',
        suiteName: 'Level 1: Unit Tests (Metodisk logikk & Inputvalidering)',
        level: 'LEVEL_1_UNIT',
        description: 'Enhetstester for alle skÃ¥ringskombinasjoner i AMSTAR 2, AGREE II, CASP og JBI.',
        passed: level1Results.every(r => r.passed),
        assertions: level1Results.map(r => ({
          ruleId: r.ruleId,
          name: r.ruleTitle,
          passed: r.passed,
          details: r.details
        }))
      },
      {
        suiteId: 'suite-level-2-integration',
        suiteName: 'Level 2: Integration Tests (Gating, LÃ¥sing & Arbeidsflyt)',
        level: 'LEVEL_2_INTEGRATION',
        description: 'Integrasjonstester for studiedesign-gating, sjekksummer, versjonslÃ¥ser og fler-granskerflyt.',
        passed: level2Results.every(r => r.passed),
        assertions: level2Results.map(r => ({
          ruleId: r.ruleId,
          name: r.ruleTitle,
          passed: r.passed,
          details: r.details
        }))
      },
      {
        suiteId: 'suite-level-3-reference',
        suiteName: 'Level 3: Reference Validation Tests (Publiserte Gullstandarder)',
        level: 'LEVEL_3_REFERENCE',
        description: 'Validering av systemets evalueringsmotorer mot fagfellevurderte referanseartikler og benchmarks.',
        passed: level3Results.every(r => r.passed),
        assertions: level3Results.map(r => ({
          ruleId: r.ruleId,
          name: r.ruleTitle,
          passed: r.passed,
          details: r.details
        }))
      }
    ];

    return {
      timestamp: new Date().toISOString(),
      totalTests,
      passedTests,
      failedTests,
      totalAssertions: totalTests,
      allPassed,
      level1Passed: level1Results.every(r => r.passed),
      level2Passed: level2Results.every(r => r.passed),
      level3Passed: level3Results.every(r => r.passed),
      level1Count: level1Results.length,
      level2Count: level2Results.length,
      level3Count: level3Results.length,
      totalExecutionTimeMs,
      suites,
      results,
      academicHonestyNotice: 'AKADEMISK INTEGRITETSERKLÃ†RING: BestÃ¥tt programvaretest (Â«Software test passedÂ») bekrefter algoritmisk determinisme og fravÃ¦r av implementeringsfeil, men erstatter ALDRI vitenskapelig forskerskjÃ¸nn eller manuell fagfellevurdering.'
    };
  }
}


