import { AppraisalInstrument, WhoEtdCriteriaInput, WhoEtdEvaluationResult } from '../types';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';

/**
 * METHODOLOGICAL ASSESSMENT ENGINES
 * 
 * Strict, authoritative evaluation engines for each methodology family.
 * Ensures zero invented scores, no universal percentage flattening, and exact rule adherence.
 */

export interface Amstar2EvaluationResult {
  criticalFlawsCount: number;
  nonCriticalFlawsCount: number;
  criticalFlawItems: number[];
  overallConfidence: 'High' | 'Moderate' | 'Low' | 'Critically Low';
  confidenceRationale: string;
  methodologicalWarning?: string;
}

export interface Agree2DomainScore {
  domainId: number;
  domainName: string;
  itemIds: number[];
  obtainedScore: number;
  minPossibleScore: number;
  maxPossibleScore: number;
  standardizedScorePercent: number; // Formula: (Obtained - Min) / (Max - Min) * 100%
}

export interface Agree2EvaluationResult {
  domainScores: Agree2DomainScore[];
  overallRecommendation: 'Anbefales' | 'Anbefales med modifikasjoner' | 'Anbefales ikke';
  recommendationRationale: string;
  methodologicalNote: string;
}

export interface Rob2DomainEvaluation {
  domainId: string;
  domainTitle: string;
  riskOfBias: 'Low risk' | 'Some concerns' | 'High risk';
  signallingItemsSummary: string;
}

export interface Rob2EvaluationResult {
  variant: 'parallel-group' | 'cluster-randomised' | 'crossover';
  domainEvaluations: Rob2DomainEvaluation[];
  overallRiskOfBias: 'Low risk' | 'Some concerns' | 'High risk';
  algorithmRationale: string;
}

export interface GradeCertaintyEvaluation {
  outcomeName: string;
  studyDesign: 'RCT' | 'Observational';
  initialCertainty: 'High' | 'Low';
  downgradeFactors: {
    riskOfBias: 0 | -1 | -2;
    inconsistency: 0 | -1 | -2;
    indirectness: 0 | -1 | -2;
    imprecision: 0 | -1 | -2;
    publicationBias: 0 | -1 | -2;
  };
  upgradeFactors: {
    largeEffect: 0 | 1 | 2;
    doseResponse: 0 | 1;
    opposingConfounders: 0 | 1;
  };
  finalCertainty: 'High' | 'Moderate' | 'Low' | 'Very Low';
  certaintyRationale: string;
}

export interface CaspQualitativeResult {
  screeningQuestionsPassed: boolean; // Questions 1 & 2
  methodologicalRigorNotes: string;
  isValuableLocally: boolean;
  qualitativeSummary: string;
}

export interface GradeCerqualComponentEvaluation {
  methodologicalLimitations: 'No or very minor concerns' | 'Minor concerns' | 'Moderate concerns' | 'Serious concerns';
  coherence: 'No or very minor concerns' | 'Minor concerns' | 'Moderate concerns' | 'Serious concerns';
  adequacyOfData: 'No or very minor concerns' | 'Minor concerns' | 'Moderate concerns' | 'Serious concerns';
  relevance: 'No or very minor concerns' | 'Minor concerns' | 'Moderate concerns' | 'Serious concerns';
}

export interface GradeCerqualEvaluationResult {
  reviewFinding: string;
  components: GradeCerqualComponentEvaluation;
  overallConfidence: 'High confidence' | 'Moderate confidence' | 'Low confidence' | 'Very low confidence';
  confidenceExplanation: string;
  methodologicalNote: string;
}

export interface Prisma2020SectionSummary {
  sectionName: string;
  totalItems: number;
  reportedCount: number;
  partialCount: number;
  notReportedCount: number;
  notApplicableCount: number;
  adherencePercentage: number;
}

export interface Prisma2020EvaluationResult {
  checklistItemsEvaluated: number;
  sectionSummaries: Prisma2020SectionSummary[];
  overallReportingCompleteness: number; // percentage reported/partial
  flowDiagramComplete: boolean;
  searchStrategyTransparent: boolean;
  methodologicalNotice: string;
}

export interface Cfir2ConstructItem {
  domainId: 'innovation' | 'outer_setting' | 'inner_setting' | 'individuals' | 'process';
  domainName: string;
  constructId: string;
  constructName: string;
  classification: 'Facilitator (+2)' | 'Facilitator (+1)' | 'Neutral (0)' | 'Barrier (-1)' | 'Barrier (-2)' | 'Not applicable';
  contextualEvidence: string;
}

export interface Cfir2EvaluationResult {
  totalConstructsAssessed: number;
  facilitatorsCount: number;
  barriersCount: number;
  neutralCount: number;
  dominantDomain: string;
  topFacilitators: string[];
  topBarriers: string[];
  determinantsNarrative: string;
  methodologicalWarning: string;
}

export interface KtaPhaseStatus {
  phaseNumber: number;
  phaseName: string;
  phaseCategory: 'Knowledge Creation' | 'Action Cycle';
  status: 'Completed' | 'In progress' | 'Planned' | 'Not initiated';
  keyActivities: string;
  localBarriersIdentified: string[];
  tailoredInterventions: string[];
}

export interface KtaEvaluationResult {
  completedPhasesCount: number;
  inProgressPhasesCount: number;
  currentActivePhase: string;
  knowledgeCreationFunnelStage: 'Knowledge Inquiry' | 'Knowledge Synthesis' | 'Knowledge Tools/Products';
  actionCycleMaturity: 'Initiation' | 'Contextual Adaptation' | 'Implementation & Monitoring' | 'Sustainment';
  processRoadmapSummary: string;
  methodologicalWarning: string;
}

// -------------------------------------------------------------
// 1. AMSTAR 2 ASSESSMENT ENGINE
// -------------------------------------------------------------
export class Amstar2AssessmentEngine {
  public static readonly CRITICAL_ITEMS = [2, 4, 7, 9, 11, 13, 15];

  public static evaluate(
    itemResponses: Record<number, 'Yes' | 'Partial Yes' | 'No' | 'No meta-analysis conducted' | string>
  ): Amstar2EvaluationResult {
    const expectedItems = Array.from({ length: 16 }, (_, index) => index + 1);
    const responseKeys = Object.keys(itemResponses).map(Number);
    if (responseKeys.some(key => !Number.isInteger(key) || key < 1 || key > 16) || responseKeys.length !== 16 || expectedItems.some(key => itemResponses[key] === undefined)) {
      throw new Error('AMSTAR 2 scoring requires exactly one response for all 16 items.');
    }
    let criticalFlawsCount = 0;
    let nonCriticalFlawsCount = 0;
    const criticalFlawItems: number[] = [];

    for (let i = 1; i <= 16; i++) {
      const response = itemResponses[i];
      const isCritical = this.CRITICAL_ITEMS.includes(i);

      if (isCritical) {
        if (response === 'No') {
          criticalFlawsCount++;
          criticalFlawItems.push(i);
        }
      } else {
        if (response === 'No') {
          nonCriticalFlawsCount++;
        }
      }
    }

    let overallConfidence: 'High' | 'Moderate' | 'Low' | 'Critically Low';
    let confidenceRationale = '';

    if (criticalFlawsCount === 0) {
      if (nonCriticalFlawsCount <= 1) {
        overallConfidence = 'High';
        confidenceRationale = 'Ingen kritiske metodiske svakheter (flaws) og maksimalt én ikke-kritisk svakhet. Gir et nøyaktig og helhetlig sammendrag.';
      } else {
        overallConfidence = 'Moderate';
        confidenceRationale = 'Ingen kritiske svakheter, men mer enn én ikke-kritisk svakhet. Oversikten kan ha enkelte begrensninger, men gir et gyldig bilde.';
      }
    } else if (criticalFlawsCount === 1) {
      overallConfidence = 'Low';
      confidenceRationale = `Én kritisk metodisk svakhet (Item ${criticalFlawItems.join(', ')}). Kunnskapsoppsummeringen gir kanskje ikke et nøyaktig bilde av den tilgjengelige evidensen.`;
    } else {
      overallConfidence = 'Critically Low';
      confidenceRationale = `Flere kritiske metodiske svakheter (${criticalFlawsCount} kritiske domener: Items ${criticalFlawItems.join(', ')}). Oversikten bør ikke tillegges vesentlig vekt i kliniske beslutninger.`;
    }

    return {
      criticalFlawsCount,
      nonCriticalFlawsCount,
      criticalFlawItems,
      overallConfidence,
      confidenceRationale,
      methodologicalWarning: 'AMSTAR 2 skal aldri rapporteres som en numerisk sum eller prosent (f.eks. "14/16" eller "88%").'
    };
  }
}

// -------------------------------------------------------------
// 2. AGREE II ASSESSMENT ENGINE
// -------------------------------------------------------------
export class Agree2AssessmentEngine {
  public static readonly DOMAINS = [
    { id: 1, name: 'Omfang og formål (Scope and Purpose)', items: [1, 2, 3] },
    { id: 2, name: 'Involvering av interessenter (Stakeholder Involvement)', items: [4, 5, 6] },
    { id: 3, name: 'Metodisk nøyaktighet (Rigour of Development)', items: [7, 8, 9, 10, 11, 12, 13, 14] },
    { id: 4, name: 'Klarhet i presentasjonen (Clarity of Presentation)', items: [15, 16, 17] },
    { id: 5, name: 'Anvendelighet (Applicability)', items: [18, 19, 20, 21] },
    { id: 6, name: 'Redaksjonell uavhengighet (Editorial Independence)', items: [22, 23] }
  ];

  /**
   * Calculates standardized domain scores according to official AGREE II User Guide formula:
   * Standardized Domain Score = (Obtained Score - Minimum Possible Score) / (Maximum Possible Score - Minimum Possible Score) * 100%
   */
  public static evaluateDomainScores(
    ratings: Record<number, number>, // Item 1..23 scored 1..7 per reviewer
    reviewersCount: number = 1
  ): Agree2EvaluationResult {
    const domainScores: Agree2DomainScore[] = this.DOMAINS.map(domain => {
      let obtained = 0;
      domain.items.forEach(itemId => {
        const val = ratings[itemId];
      if (val === undefined || val < 1 || val > 7) throw new Error(`AGREE II item ${itemId} must be rated 1–7 before scoring.`);
        obtained += val;
      });

      const minPossible = domain.items.length * 1 * reviewersCount;
      const maxPossible = domain.items.length * 7 * reviewersCount;
      const scorePercent = maxPossible > minPossible
        ? Math.round(((obtained - minPossible) / (maxPossible - minPossible)) * 100)
        : 0;

      return {
        domainId: domain.id,
        domainName: domain.name,
        itemIds: domain.items,
        obtainedScore: obtained,
        minPossibleScore: minPossible,
        maxPossibleScore: maxPossible,
        standardizedScorePercent: Math.max(0, Math.min(100, scorePercent))
      };
    });

    if (Object.keys(ratings).some(key => !Number.isInteger(Number(key)) || Number(key) < 1 || Number(key) > 23) || Object.keys(ratings).length !== 23) throw new Error('AGREE II scoring requires exactly one valid rating for all 23 items.');

    // Rigour domain (Domain 3) is key for recommendation
    const rigourScore = domainScores.find(d => d.domainId === 3)?.standardizedScorePercent || 0;
    let overallRecommendation: 'Anbefales' | 'Anbefales med modifikasjoner' | 'Anbefales ikke' = 'Anbefales med modifikasjoner';

    if (rigourScore >= 70) {
      overallRecommendation = 'Anbefales';
    } else if (rigourScore < 40) {
      overallRecommendation = 'Anbefales ikke';
    }

    return {
      domainScores,
      overallRecommendation,
      recommendationRationale: `Vurdering basert på standardiserte domeneskårer. Metodisk nøyaktighet (Domene 3): ${rigourScore}%.`,
      methodologicalNote: 'AGREE II domeneskårer skal rapporteres uavhengig per domene og må aldri slås sammen til en enkelt samlet retningslinjescore.'
    };
  }
}

// -------------------------------------------------------------
// 3. JBI QUALITATIVE (2017) ASSESSMENT ENGINE
// -------------------------------------------------------------
export class JbiQualitativeAssessmentEngine {
  public static evaluate(
    items: { questionId: number; status: string; justification?: string }[]
  ) {
    let jaCount = 0;
    let neiCount = 0;
    let uklartCount = 0;
    let ikkeRelevantCount = 0;

    const identifiedDefects: string[] = [];

    items.forEach(item => {
      const st = (item.status || '').toLowerCase();
      if (st.includes('ja') || st.includes('yes')) {
        jaCount++;
      } else if (st.includes('nei') || st.includes('no')) {
        neiCount++;
        identifiedDefects.push(`Kriterium ${item.questionId}: Ikke oppfylt (${item.justification || 'Mangler oppfyllelse'})`);
      } else if (st.includes('uklart') || st.includes('unclear')) {
        uklartCount++;
        identifiedDefects.push(`Kriterium ${item.questionId}: Uklart rapportert (${item.justification || 'Krever avklaring'})`);
      } else if (st.includes('ikke relevant') || st.includes('not applicable')) {
        ikkeRelevantCount++;
      }
    });

    let verdict: 'Inkluder' | 'Ekskluder' | 'Vurder videre' | 'Søk mer informasjon';
    let rationale = '';

    if (jaCount === 10 || (jaCount >= 7 && neiCount === 0 && uklartCount <= 1)) {
      verdict = 'Inkluder';
      rationale = 'Høy metodisk stringens med dokumentert filosofisk samsvar, refleksivitet, etikk og dataforankring på samtlige vurderte kriterier.';
    } else if (uklartCount >= 3) {
      verdict = 'Søk mer informasjon';
      rationale = `${uklartCount} metodiske punkter er uklart rapportert i artikkelen og krever protokollsjekk eller supplerende informasjon.`;
    } else if (neiCount > 0) {
      verdict = 'Vurder videre';
      rationale = `Metodiske svakheter identifisert på ${neiCount} punkter (${identifiedDefects.join('; ')}). JBI krever helhetlig forskerskjønn for å avgjøre om svakhetene påvirker syntesens gyldighet.`;
    } else {
      verdict = 'Vurder videre';
      rationale = 'Helhetlig kvalitativ vurdering: Metodiske egenskaper må drøftes i lys av kunnskapsoppsummeringens formål og kontekst.';
    }

    return {
      jaCount,
      neiCount,
      uklartCount,
      ikkeRelevantCount,
      verdict,
      rationale,
      identifiedDefects,
      criticalItemsDefects: identifiedDefects, // Retained for backwards-compatibility of consumer interfaces
      methodologicalNote: 'JBI Critical Appraisal Checklist for Qualitative Research (2017) krever helhetlig kvalitativ forskerbedømmelse. Sjekklisten skiller ikke offisielt mellom kritiske/ikke-kritiske spørsmål og har ingen rigid matematisk cut-off score.'
    };
  }
}

// -------------------------------------------------------------
// 4. RoB 2 (Cochrane Risk of Bias 2) ASSESSMENT ENGINE
// -------------------------------------------------------------
export class Rob2AssessmentEngine {
  public static evaluate(
    domainRisks: {
      variant?: 'parallel-group' | 'cluster-randomised' | 'crossover';
      d1Randomisation: 'Low risk' | 'Some concerns' | 'High risk';
      d2Deviations: 'Low risk' | 'Some concerns' | 'High risk';
      d3MissingData: 'Low risk' | 'Some concerns' | 'High risk';
      d4Measurement: 'Low risk' | 'Some concerns' | 'High risk';
      d5Selection: 'Low risk' | 'Some concerns' | 'High risk';
    }
  ): Rob2EvaluationResult {
    const list = [
      { domainId: 'D1', domainTitle: 'Randomiseringsprosess', riskOfBias: domainRisks.d1Randomisation, signallingItemsSummary: 'Sekvensgenerering & allokeringsskjuling' },
      { domainId: 'D2', domainTitle: 'Avvik fra intenderte intervensjoner', riskOfBias: domainRisks.d2Deviations, signallingItemsSummary: 'Blindingsintegritet & protokollavvik' },
      { domainId: 'D3', domainTitle: 'Manglende utfallsdata', riskOfBias: domainRisks.d3MissingData, signallingItemsSummary: 'Frafall & ITT analyse' },
      { domainId: 'D4', domainTitle: 'Måling av utfall', riskOfBias: domainRisks.d4Measurement, signallingItemsSummary: 'Målemetoder & utfallsvurderer-blinding' },
      { domainId: 'D5', domainTitle: 'Seleksjon av rapportert resultat', riskOfBias: domainRisks.d5Selection, signallingItemsSummary: 'Pre-registrert analyseplan & selektiv rapportering' }
    ];

    const hasHigh = list.some(d => d.riskOfBias === 'High risk');
    const someConcernsCount = list.filter(d => d.riskOfBias === 'Some concerns').length;

    let overallRiskOfBias: 'Low risk' | 'Some concerns' | 'High risk';
    let algorithmRationale = '';

    if (hasHigh) {
      overallRiskOfBias = 'High risk';
      algorithmRationale = 'Studien bedømmes til HØY risiko for bias fordi minst ett domene har høy risiko for bias.';
    } else if (someConcernsCount >= 1) {
      overallRiskOfBias = 'Some concerns';
      algorithmRationale = `Studien har noen bekymringer (${someConcernsCount} domener med 'Some concerns'), men ingen domener med høy risiko.`;
    } else {
      overallRiskOfBias = 'Low risk';
      algorithmRationale = 'Lav risiko for bias over samtlige 5 Cochrane RoB 2-domener.';
    }

    return {
      variant: domainRisks.variant ?? 'parallel-group',
      domainEvaluations: list,
      overallRiskOfBias,
      algorithmRationale
    };
  }
}

// -------------------------------------------------------------
// 5. GRADE CERTAINTY ENGINE
// -------------------------------------------------------------
export class GradeAssessmentEngine {
  public static evaluateOutcome(input: {
    outcomeName: string;
    studyDesign: 'RCT' | 'Observational';
    riskOfBias: 0 | -1 | -2;
    inconsistency: 0 | -1 | -2;
    indirectness: 0 | -1 | -2;
    imprecision: 0 | -1 | -2;
    publicationBias: 0 | -1 | -2;
    largeEffect?: 0 | 1 | 2;
    doseResponse?: 0 | 1;
    opposingConfounders?: 0 | 1;
    finalCertainty?: GradeCertaintyEvaluation['finalCertainty'];
    certaintyRationale?: string;
  }): GradeCertaintyEvaluation {
    if (!input.outcomeName.trim()) throw new Error('GRADE outcomeName er påkrevd.');
    if (input.finalCertainty && !input.certaintyRationale?.trim()) throw new Error('Eksplisitt GRADE-final certainty krever begrunnelse.');
    const downgrade = [input.riskOfBias,input.inconsistency,input.indirectness,input.imprecision,input.publicationBias];
    const upgrade = [input.largeEffect ?? 0,input.doseResponse ?? 0,input.opposingConfounders ?? 0];
    const reasons:string[] = [];
    if(input.riskOfBias < 0) reasons.push(`risk of bias ${input.riskOfBias}`);
    if(input.inconsistency < 0) reasons.push(`inconsistency ${input.inconsistency}`);
    if(input.indirectness < 0) reasons.push(`indirectness ${input.indirectness}`);
    if(input.imprecision < 0) reasons.push(`imprecision ${input.imprecision}`);
    if(input.publicationBias < 0) reasons.push(`publication bias ${input.publicationBias}`);
    if((input.largeEffect ?? 0)>0) reasons.push(`large effect +${input.largeEffect}`);
    if((input.doseResponse ?? 0)>0) reasons.push('dose-response +1');
    if((input.opposingConfounders ?? 0)>0) reasons.push('opposing confounding +1');
    if (![input.riskOfBias,input.inconsistency,input.indirectness,input.imprecision,input.publicationBias].every(value => value === 0 || value === -1 || value === -2)) throw new Error('GRADE downgrade judgments must be 0, -1 or -2.');
    const initialLevel = input.studyDesign === 'RCT' ? 4 : 2;
    const calculatedLevel = Math.max(1, Math.min(4, initialLevel + downgrade.reduce((a,b)=>a+b,0) + upgrade.reduce((a,b)=>a+b,0)));
    const calculated: GradeCertaintyEvaluation['finalCertainty'] = calculatedLevel === 4 ? 'High' : calculatedLevel === 3 ? 'Moderate' : calculatedLevel === 2 ? 'Low' : 'Very Low';
    return {
      outcomeName: input.outcomeName,
      studyDesign: input.studyDesign,
      initialCertainty: input.studyDesign === 'RCT' ? 'High' : 'Low',
      downgradeFactors:{riskOfBias:input.riskOfBias,inconsistency:input.inconsistency,indirectness:input.indirectness,imprecision:input.imprecision,publicationBias:input.publicationBias},
      upgradeFactors:{largeEffect:input.largeEffect ?? 0,doseResponse:input.doseResponse ?? 0,opposingConfounders:input.opposingConfounders ?? 0},
      finalCertainty: input.finalCertainty ?? calculated,
      certaintyRationale: input.certaintyRationale?.trim() ?? `Foreløpig regelberegning basert på registrerte GRADE-domener: ${reasons.length ? reasons.join('; ') : 'ingen eksplisitte justeringer'}.`
    };
  }
}

// -------------------------------------------------------------
// 6. CASP (Critical Appraisal Skills Programme) ASSESSMENT ENGINE
// -------------------------------------------------------------
export class CaspAssessmentEngine {
  public static evaluateQualitative(responses: Record<number, 'Yes' | 'Can’t tell' | 'No'>): CaspQualitativeResult {
    const expectedItems = Array.from({ length: 10 }, (_, index) => index + 1);
    const responseKeys = Object.keys(responses).map(Number);
    if (responseKeys.length !== 10 || responseKeys.some(key => !expectedItems.includes(key)) || expectedItems.some(key => responses[key] === undefined)) throw new Error('CASP qualitative appraisal requires exactly one response for all 10 questions.');
    const q1 = responses[1];
    const q2 = responses[2];
    const screeningPassed = q1 === 'Yes' && q2 === 'Yes';

    const q6Reflexivity = responses[6];
    const q7Ethics = responses[7];
    const q10Value = responses[10];

    const issues: string[] = [];
    if (q1 !== 'Yes') issues.push('Uklart eller manglende klart forskningsmål (Spm 1)');
    if (q2 !== 'Yes') issues.push('Kvalitativ metodologi ikke tilstrekkelig begrunnet som hensiktsmessig (Spm 2)');
    if (q6Reflexivity !== 'Yes') issues.push('Forholdet mellom forsker og deltakere / refleksivitet ikke adekvat redegjort for (Spm 6)');
    if (q7Ethics !== 'Yes') issues.push('Etiske hensyn eller formell godkjenning mangelfullt rapportert (Spm 7)');

    const isValuableLocally = q10Value === 'Yes';

    let qualitativeSummary = '';
    if (!screeningPassed) {
      qualitativeSummary = 'Screening-kriterier ikke tilfredsstilt (Spm 1 & 2). Videre detaljert vurdering bør overveies nøye før inklusjon i kunnskapsoppsummering.';
    } else if (issues.length === 0) {
      qualitativeSummary = 'Kvalitativ studie med høy pedagogisk og metodisk stringens. Klart definert formål, metodisk stringens, etisk forankring og høy lokal nytteverdi.';
    } else {
      qualitativeSummary = `Metodisk vurdering avdekket følgende forhold: ${issues.join('; ')}.`;
    }

    return {
      screeningQuestionsPassed: screeningPassed,
      methodologicalRigorNotes: issues.length > 0 ? issues.join('; ') : 'Ingen metodiske svakheter identifisert i seksjon A/B.',
      isValuableLocally,
      qualitativeSummary
    };
  }
}

// -------------------------------------------------------------
// 7. GRADE-CERQual ASSESSMENT ENGINE
// -------------------------------------------------------------
export class GradeCerqualAssessmentEngine {
  public static evaluateFinding(input: {
    reviewFinding: string;
    methodologicalLimitations: GradeCerqualComponentEvaluation['methodologicalLimitations'];
    coherence: GradeCerqualComponentEvaluation['coherence'];
    adequacyOfData: GradeCerqualComponentEvaluation['adequacyOfData'];
    relevance: GradeCerqualComponentEvaluation['relevance'];
    overallConfidence: GradeCerqualEvaluationResult['overallConfidence'];
    confidenceExplanation: string;
    methodologicalNote?: string;
  }): GradeCerqualEvaluationResult {
    if (!input.reviewFinding.trim()) throw new Error('CERQual-funn må beskrives.');
    if (!input.confidenceExplanation.trim()) throw new Error('CERQual samlet confidence krever eksplisitt begrunnelse.');
    return {
      reviewFinding: input.reviewFinding,
      components: {
        methodologicalLimitations: input.methodologicalLimitations,
        coherence: input.coherence,
        adequacyOfData: input.adequacyOfData,
        relevance: input.relevance
      },
      overallConfidence: input.overallConfidence,
      confidenceExplanation: input.confidenceExplanation,
      methodologicalNote: input.methodologicalNote?.trim() || 'Samlet CERQual-confidence er et eksplisitt reviewer-judgment basert på de fire komponentene og skal ikke reduseres til en automatisk poengsum.'
    };
  }
}

// -------------------------------------------------------------
// 7B. WHO EVIDENCE-TO-DECISION (EtD / DECIDE) FRAMEWORK ENGINE
// -------------------------------------------------------------
export class WhoEtdAssessmentEngine {
  public static evaluateEtD(input: WhoEtdCriteriaInput): WhoEtdEvaluationResult {
    const detailedCriteriaAudit: {
      criterionName: string;
      judgment: string;
      whoRequirementSummary: string;
      status: 'SUPPORTIVE' | 'CAUTION' | 'BARRIER';
    }[] = [];

    // 1. Problem Priority
    const isPriority = input.problemPriority === 'Yes' || input.problemPriority === 'Probably yes';
    detailedCriteriaAudit.push({
      criterionName: 'Problemets prioritet',
      judgment: input.problemPriority,
      whoRequirementSummary: 'Er helseproblemet en prioritert tilstand for målgruppen / befolkningen?',
      status: isPriority ? 'SUPPORTIVE' : input.problemPriority === 'No' || input.problemPriority === 'Probably no' ? 'BARRIER' : 'CAUTION'
    });

    // 2. Desirable vs Undesirable Effects & Balance
    const desirableScore = input.desirableEffects === 'Large' ? 3 : input.desirableEffects === 'Moderate' ? 2 : input.desirableEffects === 'Small' ? 1 : 0;
    const undesirableScore = input.undesirableEffects === 'Large' ? 3 : input.undesirableEffects === 'Moderate' ? 2 : input.undesirableEffects === 'Small' ? 1 : 0;
    const netBalancePositive = input.balanceOfEffects.includes('Favors intervention') || (desirableScore > undesirableScore);

    detailedCriteriaAudit.push({
      criterionName: 'Ønskede vs Uønskede effekter',
      judgment: `Ønskede: ${input.desirableEffects}, Uønskede: ${input.undesirableEffects} (Balanse: ${input.balanceOfEffects})`,
      whoRequirementSummary: 'Veier de gunstige gevinstene klart tyngre enn risiko for bivirkninger/ulemper?',
      status: netBalancePositive ? 'SUPPORTIVE' : input.balanceOfEffects.includes('Favors comparison') ? 'BARRIER' : 'CAUTION'
    });

    // 3. Certainty of Evidence (GRADE / CERQual)
    const isHighCertainty = input.certaintyOfEvidence === 'High' || input.certaintyOfEvidence === 'Moderate';
    detailedCriteriaAudit.push({
      criterionName: 'Evidensens sikkerhet (GRADE / CERQual)',
      judgment: input.certaintyOfEvidence,
      whoRequirementSummary: 'Hvor sikker er dokumentasjonen for de kritiske utfallene?',
      status: input.certaintyOfEvidence === 'High' ? 'SUPPORTIVE' : input.certaintyOfEvidence === 'Moderate' ? 'SUPPORTIVE' : input.certaintyOfEvidence === 'Low' ? 'CAUTION' : 'BARRIER'
    });

    // 4. Values & Preferences
    const valuesConsistent = input.valuesUncertainty === 'No important uncertainty' || input.valuesUncertainty === 'Probably no important uncertainty';
    detailedCriteriaAudit.push({
      criterionName: 'Pasient- / brukerverdier og preferanser',
      judgment: input.valuesUncertainty,
      whoRequirementSummary: 'Er det viktig variasjon i hvordan pasienter/brukere verdsetter utfallene?',
      status: valuesConsistent ? 'SUPPORTIVE' : 'CAUTION'
    });

    // 5. Resources & Cost-Effectiveness
    const resourceAcceptable = !input.resourcesRequired.includes('Large costs') || input.costEffectiveness.includes('Favors intervention');
    detailedCriteriaAudit.push({
      criterionName: 'Ressursbruk og kostnadseffektivitet',
      judgment: `Kostnad: ${input.resourcesRequired}, Kostnadseffektivitet: ${input.costEffectiveness}`,
      whoRequirementSummary: 'Er tiltaket kostnadseffektivt og forsvarlig ressursbruk?',
      status: resourceAcceptable ? 'SUPPORTIVE' : 'CAUTION'
    });

    // 6. Health Equity
    const equityPositive = input.equity === 'Increased equity' || input.equity === 'Probably increased' || input.equity === 'Probably no impact';
    detailedCriteriaAudit.push({
      criterionName: 'Sosial og helsemessig likhet (Equity)',
      judgment: input.equity,
      whoRequirementSummary: 'Vil tiltaket redusere eller øke helseforskjeller?',
      status: equityPositive ? 'SUPPORTIVE' : 'BARRIER'
    });

    // 7. Acceptability & Feasibility
    const acceptable = input.acceptability === 'Yes' || input.acceptability === 'Probably yes';
    const feasible = input.feasibility === 'Yes' || input.feasibility === 'Probably yes';
    detailedCriteriaAudit.push({
      criterionName: 'Akseptabilitet & Gjennomførbarhet',
      judgment: `Akseptabilitet: ${input.acceptability}, Gjennomførbarhet: ${input.feasibility}`,
      whoRequirementSummary: 'Er tiltaket akseptabelt for sentrale interessenter og realistisk å implementere?',
      status: (acceptable && feasible) ? 'SUPPORTIVE' : (!acceptable && !feasible) ? 'BARRIER' : 'CAUTION'
    });

    // Determine WHO Recommendation Type based on Handbook rules:
    // Strong recommendation requires: Clear balance of benefits > harms, moderate/high certainty (or explicit WHO exception), acceptable values, feasibility.
    let recommendationType: 'Strong recommendation for' | 'Conditional recommendation for' | 'Conditional recommendation against' | 'Strong recommendation against' | 'Recommendation for research only';
    let strengthRationale = '';

    if (input.balanceOfEffects === 'Favors comparison' || input.balanceOfEffects === 'Probably favors comparison' || input.equity === 'Reduced equity') {
      if (input.certaintyOfEvidence === 'High' || input.certaintyOfEvidence === 'Moderate') {
        recommendationType = 'Strong recommendation against';
        strengthRationale = 'Sterk anbefaling MOT tiltaket: Uønskede effekter/kostnader overstiger gevinstene med moderat/høy sikkerhet.';
      } else {
        recommendationType = 'Conditional recommendation against';
        strengthRationale = 'Betinget/svak anbefaling MOT tiltaket: Ubalanse i favør av kontroll/sammenligning, men evidensen har usikkerhet.';
      }
    } else if (input.certaintyOfEvidence === 'Very Low' || input.certaintyOfEvidence === 'No included studies') {
      recommendationType = 'Recommendation for research only';
      strengthRationale = 'Anbefaling om forskning: Svært lav evidenssikkerhet forhindrer klinisk retningslinjeanbefaling før ytterligere studier foreligger.';
    } else if (netBalancePositive && isHighCertainty && valuesConsistent && acceptable && feasible && equityPositive) {
      recommendationType = 'Strong recommendation for';
      strengthRationale = 'Sterk anbefaling FOR tiltaket: Klar overvekt av ønskede gevinster fremfor uønskede effekter, støttet av moderat/høy evidenssikkerhet, samstemte pasientverdier, god gjennomførbarhet og nøytral/positiv likhetseffekt.';
    } else if (netBalancePositive) {
      recommendationType = 'Conditional recommendation for';
      strengthRationale = 'Betinget/svak anbefaling FOR tiltaket: Tiltaket er fordelaktig, men betinges av lokal kontekst, variasjon i pasientpreferanser, lavere evidenssikkerhet eller ressursbegrensninger.';
    } else {
      recommendationType = 'Conditional recommendation for';
      strengthRationale = 'Betinget anbefaling basert på samlet drøfting i retningslinjepanelet.';
    }

    const implementationConsiderations: string[] = [];
    if (input.resourcesRequired.includes('costs')) {
      implementationConsiderations.push('Etablere budsjettmessig ramme og forhandle innkjøpsavtaler for å redusere enhetskostnader.');
    }
    if (!feasible) {
      implementationConsiderations.push('Sikre opplæringsprogrammer og klinisk veiledning for helsepersonell for å styrke gjennomføringsevnen.');
    }
    if (input.equity.includes('reduced')) {
      implementationConsiderations.push('Utforme målrettede tiltak for sårbare grupper for å motvirke økte helseforskjeller.');
    }
    if (implementationConsiderations.length === 0) {
      implementationConsiderations.push('Standard implementering i helsetjenesten med formidling via faglige veiledere og elektroniske pasientjournaler.');
    }

    const monitoringAndEvaluation: string[] = [
      'Overvåke adferdsendring og klinisk etterlevelse av retningslinjen etter 6 og 12 måneder.',
      'Registrere eventuelle uventede bivirkninger eller utilsiktede effekter i kvalitetsregistre.',
      'Planlegge systematisk oppdatering (Living Guidelines / 3-års revisjonssyklus) ved publisering av nye signifikante studier.'
    ];

    return {
      guidelineQuestion: input.guidelineQuestion,
      targetPopulation: input.targetPopulation,
      intervention: input.intervention,
      comparison: input.comparison,
      recommendationType,
      strengthRationale,
      detailedCriteriaAudit,
      implementationConsiderations,
      monitoringAndEvaluation,
      methodologicalStandard: 'WHO Handbook for Guideline Development (2nd Edition) & DECIDE Evidence-to-Decision Framework'
    };
  }
}

// -------------------------------------------------------------
// 8. PRISMA 2020 REPORTING ENGINE
// -------------------------------------------------------------
export class Prisma2020ReportingEngine {
  public static evaluateReporting(responses: Record<number, 'Yes' | 'Partial' | 'No' | 'Not applicable'>): Prisma2020EvaluationResult {
    const sections: { name: string; items: number[] }[] = [
      { name: 'Tittel & Sammendrag', items: [1, 2] },
      { name: 'Innledning (Rasjonale & Mål)', items: [3, 4] },
      { name: 'Metoder (Søk, Utvalg, RoB, Syntese)', items: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
      { name: 'Resultater (Flytskjema, Synteser, RoB)', items: [16, 17, 18, 19, 20, 21, 22] },
      { name: 'Diskusjon (Tolkning, Begrensninger)', items: [23, 24] },
      { name: 'Annen informasjon (Protokoll, Finansiering)', items: [25, 26, 27] }
    ];

    let totalYes = 0;
    let totalPartial = 0;
    let totalAssessed = 0;

    const sectionSummaries: Prisma2020SectionSummary[] = sections.map(sec => {
      let rep = 0;
      let part = 0;
      let notRep = 0;
      let na = 0;

      sec.items.forEach(num => {
        totalAssessed++;
        const val = responses[num] || 'No';
        if (val === 'Yes') {
          rep++;
          totalYes++;
        } else if (val === 'Partial') {
          part++;
          totalPartial++;
        } else if (val === 'Not applicable') {
          na++;
        } else {
          notRep++;
        }
      });

      const applicable = sec.items.length - na;
      const adh = applicable > 0 ? Math.round(((rep + part * 0.5) / applicable) * 100) : 100;

      return {
        sectionName: sec.name,
        totalItems: sec.items.length,
        reportedCount: rep,
        partialCount: part,
        notReportedCount: notRep,
        notApplicableCount: na,
        adherencePercentage: adh
      };
    });

    const flowDiagramComplete = responses[16] === 'Yes';
    const searchStrategyTransparent = responses[7] === 'Yes';
    const overallScore = Math.round(((totalYes + totalPartial * 0.5) / 27) * 100);

    return {
      checklistItemsEvaluated: 27,
      sectionSummaries,
      overallReportingCompleteness: overallScore,
      flowDiagramComplete,
      searchStrategyTransparent,
      methodologicalNotice: 'PRISMA 2020 er en rapporteringsstandard for åpenhet og etterprøvbarhet, IKKE et mål for studiekvalitet eller metodisk bias.'
    };
  }
}

// -------------------------------------------------------------
// 9. CFIR 2.0 (Consolidated Framework for Implementation Research) ENGINE
// -------------------------------------------------------------
export class Cfir2AssessmentEngine {
  public static evaluateDeterminants(constructs: Cfir2ConstructItem[]): Cfir2EvaluationResult {
    let facilitators = 0;
    let barriers = 0;
    let neutral = 0;

    const topFacilitators: string[] = [];
    const topBarriers: string[] = [];

    const domainCount: Record<string, number> = {
      innovation: 0,
      outer_setting: 0,
      inner_setting: 0,
      individuals: 0,
      process: 0
    };

    constructs.forEach(c => {
      if (c.classification.includes('Facilitator')) {
        facilitators++;
        topFacilitators.push(`${c.constructName} (${c.classification})`);
        domainCount[c.domainId] = (domainCount[c.domainId] || 0) + 1;
      } else if (c.classification.includes('Barrier')) {
        barriers++;
        topBarriers.push(`${c.constructName} (${c.classification})`);
        domainCount[c.domainId] = (domainCount[c.domainId] || 0) + 1;
      } else if (c.classification.includes('Neutral')) {
        neutral++;
      }
    });

    let dominantDomain = 'inner_setting';
    let maxDomainVal = -1;
    Object.entries(domainCount).forEach(([dom, count]) => {
      if (count > maxDomainVal) {
        maxDomainVal = count;
        dominantDomain = dom;
      }
    });

    const determinantsNarrative = `Kartleggingen identifiserte ${facilitators} fasilitatorer og ${barriers} barrierer fordelt over CFIR 2.0-domenene. Hovedtyngden av determinantene faller innen domenet: ${dominantDomain}.`;

    return {
      totalConstructsAssessed: constructs.length,
      facilitatorsCount: facilitators,
      barriersCount: barriers,
      neutralCount: neutral,
      dominantDomain,
      topFacilitators: topFacilitators.slice(0, 5),
      topBarriers: topBarriers.slice(0, 5),
      determinantsNarrative,
      methodologicalWarning: 'CFIR 2.0 er et teoretisk determinantrammeverk for kontekstanalyse, IKKE en matematisk poengskala for metodisk kvalitet.'
    };
  }
}

// -------------------------------------------------------------
// 10. KTA (Knowledge-to-Action Framework) ENGINE
// -------------------------------------------------------------
export class KtaAssessmentEngine {
  public static evaluateRoadmap(phases: KtaPhaseStatus[]): KtaEvaluationResult {
    const completed = phases.filter(p => p.status === 'Completed').length;
    const inProgress = phases.filter(p => p.status === 'In progress').length;
    const currentPhase = phases.find(p => p.status === 'In progress') || phases[0];

    let maturity: 'Initiation' | 'Contextual Adaptation' | 'Implementation & Monitoring' | 'Sustainment' = 'Initiation';
    if (completed >= 6) {
      maturity = 'Sustainment';
    } else if (completed >= 4) {
      maturity = 'Implementation & Monitoring';
    } else if (completed >= 2) {
      maturity = 'Contextual Adaptation';
    }

    const processRoadmapSummary = `KTA-prosessen har fullført ${completed} av 7 faser i handlingssyklusen. Aktivt fokus er på ${currentPhase?.phaseName || 'Kunnskapstranslasjon'}. Modenhetsnivå: ${maturity}.`;

    return {
      completedPhasesCount: completed,
      inProgressPhasesCount: inProgress,
      currentActivePhase: currentPhase?.phaseName || 'Steg 1: Problemidentifikasjon',
      knowledgeCreationFunnelStage: 'Knowledge Synthesis',
      actionCycleMaturity: maturity,
      processRoadmapSummary,
      methodologicalWarning: 'KTA er et prosessuelt handlingsrammeverk for implementering, IKKE en metodisk bias- eller kvalitetsscore.'
    };
  }
}

// -------------------------------------------------------------
// 11. ROBINS-I (Risk Of Bias In Non-randomized Studies of Interventions) ENGINE
// -------------------------------------------------------------
export interface RobinsIDomainEvaluation {
  domainId: 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7';
  domainTitle: string;
  riskOfBias: 'Low risk' | 'Moderate risk' | 'Serious risk' | 'Critical risk' | 'No information';
  signallingSummary: string;
}

export interface RobinsIEvaluationResult {
  domainEvaluations: RobinsIDomainEvaluation[];
  overallRiskOfBias: 'Low risk' | 'Moderate risk' | 'Serious risk' | 'Critical risk' | 'No information';
  algorithmRationale: string;
  methodologicalNote: string;
}

export class RobinsIAssessmentEngine {
  public static readonly DOMAINS = [
    { id: 'D1', title: 'Bias due to confounding (Konfunderende faktorer)', summary: 'Baseline and time-varying confounding' },
    { id: 'D2', title: 'Bias in selection of participants into the study (Seleksjon)', summary: 'Inception cohorts vs prevalent users' },
    { id: 'D3', title: 'Bias in classification of interventions (Intervensjonsklassifisering)', summary: 'Intervention definition and status misclassification' },
    { id: 'D4', title: 'Bias due to deviations from intended interventions (Avvik)', summary: 'Protocol deviations and non-adherence' },
    { id: 'D5', title: 'Bias due to missing data (Manglende data)', summary: 'Attrition and incomplete follow-up' },
    { id: 'D6', title: 'Bias in measurement of outcomes (Utfallsmåling)', summary: 'Outcome assessor blinding and subjective measures' },
    { id: 'D7', title: 'Bias in selection of the reported result (Rapporteringsseleksjon)', summary: 'Selective outcome and analysis reporting' }
  ];

  public static evaluate(domainResponses: Record<string, 'Low risk' | 'Moderate risk' | 'Serious risk' | 'Critical risk' | 'No information'>): RobinsIEvaluationResult {
    const list: RobinsIDomainEvaluation[] = this.DOMAINS.map(d => ({
      domainId: d.id as any,
      domainTitle: d.title,
      riskOfBias: domainResponses[d.id] || 'No information',
      signallingSummary: d.summary
    }));

    const hasCritical = list.some(d => d.riskOfBias === 'Critical risk');
    const hasSerious = list.some(d => d.riskOfBias === 'Serious risk');
    const hasModerate = list.some(d => d.riskOfBias === 'Moderate risk');
    const allLow = list.every(d => d.riskOfBias === 'Low risk');

    let overallRiskOfBias: 'Low risk' | 'Moderate risk' | 'Serious risk' | 'Critical risk' | 'No information';
    let algorithmRationale = '';

    if (hasCritical) {
      overallRiskOfBias = 'Critical risk';
      algorithmRationale = 'Kritisk risiko for bias: Minst ett domene har kritisk biasrisiko. Studien bør som regel ikke inngå i primær meta-analyse uten sensitivitetsanalyse.';
    } else if (hasSerious) {
      overallRiskOfBias = 'Serious risk';
      algorithmRationale = 'Alvorlig risiko for bias: Ett eller flere domener har alvorlig risiko for bias, men ingen har kritisk risiko.';
    } else if (hasModerate) {
      overallRiskOfBias = 'Moderate risk';
      algorithmRationale = 'Moderat risiko for bias: Studien gir et solid bevisgrunnlag for en ikke-randomisert studie, men er ikke sammenlignbar med en feilfri RCT.';
    } else if (allLow) {
      overallRiskOfBias = 'Low risk';
      algorithmRationale = 'Lav risiko for bias: Sammenlignbar med en velutført randomisert kontrollert studie over samtlige 7 domener.';
    } else {
      overallRiskOfBias = 'No information';
      algorithmRationale = 'Utilstrekkelig informasjon til å bedømme biasrisiko.';
    }

    return {
      domainEvaluations: list,
      overallRiskOfBias,
      algorithmRationale,
      methodologicalNote: 'ROBINS-I evaluerer risiko for bias i ikke-randomiserte studier mot en hypotetisk ideell pragmatisk randomisert studie (target trial).'
    };
  }
}

// -------------------------------------------------------------
// 12. ROBIS (Risk of Bias in Systematic Reviews) ENGINE
// -------------------------------------------------------------
export interface RobisEvaluationResult {
  phase1TargetDefined: boolean;
  phase2Domains: {
    domainId: number;
    domainName: string;
    riskOfBias: 'Low risk' | 'High risk' | 'Unclear';
    concernsSummary: string;
  }[];
  phase3OverallRiskOfBias: 'Low risk' | 'High risk' | 'Unclear';
  rationale: string;
  methodologicalNote: string;
}

export class RobisAssessmentEngine {
  public static evaluate(input: {
    phase1PicoAddressed: boolean;
    domain1Eligibility: 'Low risk' | 'High risk' | 'Unclear';
    domain2Identification: 'Low risk' | 'High risk' | 'Unclear';
    domain3DataCollection: 'Low risk' | 'High risk' | 'Unclear';
    domain4Synthesis: 'Low risk' | 'High risk' | 'Unclear';
    phase3Overall?: 'Low risk' | 'High risk' | 'Unclear';
  }): RobisEvaluationResult {
    const domains = [
      { domainId: 1, domainName: 'Domene 1: Studieseleksjonskriterier (Eligibility)', riskOfBias: input.domain1Eligibility, concernsSummary: 'Forhåndsdefinerte PICO og inklusjonskriterier' },
      { domainId: 2, domainName: 'Domene 2: Identifisering og utvelgelse (Identification & Selection)', riskOfBias: input.domain2Identification, concernsSummary: 'Søkestrategi, grå litteratur og duplikatscreening' },
      { domainId: 3, domainName: 'Domene 3: Datainnsamling og kvalitetsvurdering (Data collection & Appraisal)', riskOfBias: input.domain3DataCollection, concernsSummary: 'Dataekstraksjon og metodisk kvalitetsvurdering av primærstudier' },
      { domainId: 4, domainName: 'Domene 4: Syntese og funn (Synthesis & Findings)', riskOfBias: input.domain4Synthesis, concernsSummary: 'Heterogenitet, biasintegrasjon og publikasjonsbias' }
    ];

    const hasHighInPhase2 = domains.some(d => d.riskOfBias === 'High risk');
    let overallRiskOfBias = input.phase3Overall || (hasHighInPhase2 ? 'High risk' : 'Low risk');

    return {
      phase1TargetDefined: input.phase1PicoAddressed,
      phase2Domains: domains,
      phase3OverallRiskOfBias: overallRiskOfBias,
      rationale: hasHighInPhase2 
        ? 'Oversikten har HØY risiko for bias i henhold til ROBIS pga. metodiske mangler i ett eller flere fase 2-domener.'
        : 'Oversikten har LAV risiko for bias over samtlige fase 2-domener.',
      methodologicalNote: 'ROBIS (Whiting et al. 2016) er spesifikt utviklet for å vurdere risiko for bias i systematiske kunnskapsoppsummeringer.'
    };
  }
}

// -------------------------------------------------------------
// 13. QUADAS-2 (Quality Assessment of Diagnostic Accuracy Studies 2) ENGINE
// -------------------------------------------------------------
export interface Quadas2EvaluationResult {
  riskOfBiasDomains: {
    domainId: string;
    domainName: string;
    riskOfBias: 'Low risk' | 'High risk' | 'Unclear';
  }[];
  applicabilityConcerns: {
    domainId: string;
    domainName: string;
    concerns: 'Low concern' | 'High concern' | 'Unclear';
  }[];
  summaryVerdict: string;
  methodologicalNote: string;
}

export class Quadas2AssessmentEngine {
  public static evaluate(input: {
    robPatientSelection: 'Low risk' | 'High risk' | 'Unclear';
    robIndexTest: 'Low risk' | 'High risk' | 'Unclear';
    robReferenceStandard: 'Low risk' | 'High risk' | 'Unclear';
    robFlowTiming: 'Low risk' | 'High risk' | 'Unclear';
    appPatientSelection: 'Low concern' | 'High concern' | 'Unclear';
    appIndexTest: 'Low concern' | 'High concern' | 'Unclear';
    appReferenceStandard: 'Low concern' | 'High concern' | 'Unclear';
  }): Quadas2EvaluationResult {
    const robDomains = [
      { domainId: 'D1', domainName: 'Pasientutvelgelse (Patient Selection)', riskOfBias: input.robPatientSelection },
      { domainId: 'D2', domainName: 'Indekstest (Index Test)', riskOfBias: input.robIndexTest },
      { domainId: 'D3', domainName: 'Referansestandard (Reference Standard)', riskOfBias: input.robReferenceStandard },
      { domainId: 'D4', domainName: 'Flyt og timing (Flow and Timing)', riskOfBias: input.robFlowTiming }
    ];

    const appDomains = [
      { domainId: 'A1', domainName: 'Pasientutvelgelse (Patient Selection Applicability)', concerns: input.appPatientSelection },
      { domainId: 'A2', domainName: 'Indekstest (Index Test Applicability)', concerns: input.appIndexTest },
      { domainId: 'A3', domainName: 'Referansestandard (Reference Standard Applicability)', concerns: input.appReferenceStandard }
    ];

    const hasHighRob = robDomains.some(d => d.riskOfBias === 'High risk');
    const hasHighApp = appDomains.some(d => d.concerns === 'High concern');

    const summaryVerdict = (hasHighRob || hasHighApp)
      ? 'Studien har metodiske bekymringer knyttet til bias eller klinisk anvendelighet i diagnostisk testnøyaktighet.'
      : 'Lav risiko for bias og god klinisk relevans/anvendelighet for den diagnostiske testen.';

    return {
      riskOfBiasDomains: robDomains,
      applicabilityConcerns: appDomains,
      summaryVerdict,
      methodologicalNote: 'QUADAS-2 (Whiting et al. 2011) skiller strengt mellom risiko for bias (4 domener) og bekymringer ved klinisk anvendelighet (3 domener).'
    };
  }
}

// -------------------------------------------------------------
// 14. QUIPS & PROBAST ENGINES (Prognostic Factor vs Prediction Models)
// -------------------------------------------------------------
export class QuipsAssessmentEngine {
  public static evaluate(domains: {
    participation: 'Low risk' | 'Moderate risk' | 'High risk';
    attrition: 'Low risk' | 'Moderate risk' | 'High risk';
    factorMeasurement: 'Low risk' | 'Moderate risk' | 'High risk';
    outcomeMeasurement: 'Low risk' | 'Moderate risk' | 'High risk';
    confounding: 'Low risk' | 'Moderate risk' | 'High risk';
    statisticalAnalysis: 'Low risk' | 'Moderate risk' | 'High risk';
  }) {
    const list = [
      { id: 1, name: 'Studiedeltakelse (Study Participation)', risk: domains.participation },
      { id: 2, name: 'Frafall / Oppfølging (Study Attrition)', risk: domains.attrition },
      { id: 3, name: 'Måling av prognostisk faktor (Prognostic Factor Measurement)', risk: domains.factorMeasurement },
      { id: 4, name: 'Utfallsmåling (Outcome Measurement)', risk: domains.outcomeMeasurement },
      { id: 5, name: 'Konfunderende faktorer (Study Confounding)', risk: domains.confounding },
      { id: 6, name: 'Statistisk analyse og rapportering (Statistical Analysis & Reporting)', risk: domains.statisticalAnalysis }
    ];

    const hasHigh = list.some(d => d.risk === 'High risk');
    const hasMod = list.some(d => d.risk === 'Moderate risk');

    return {
      domains: list,
      overallRiskOfBias: hasHigh ? 'High risk' : hasMod ? 'Moderate risk' : 'Low risk',
      methodologicalNote: 'QUIPS (Hayden et al. 2013) er utviklet for studier av prognostiske faktorer, IKKE for multivariable prediksjonsmodeller.'
    };
  }
}

export class ProbastAssessmentEngine {
  public static evaluate(input: {
    participantsRoB: 'Low risk' | 'High risk' | 'Unclear';
    predictorsRoB: 'Low risk' | 'High risk' | 'Unclear';
    outcomeRoB: 'Low risk' | 'High risk' | 'Unclear';
    analysisRoB: 'Low risk' | 'High risk' | 'Unclear';
    participantsApplicability: 'Low concern' | 'High concern' | 'Unclear';
    predictorsApplicability: 'Low concern' | 'High concern' | 'Unclear';
    outcomeApplicability: 'Low concern' | 'High concern' | 'Unclear';
  }) {
    const robList = [
      { domain: 'Deltakere (Participants)', risk: input.participantsRoB },
      { domain: 'Prediktorer (Predictors)', risk: input.predictorsRoB },
      { domain: 'Utfall (Outcome)', risk: input.outcomeRoB },
      { domain: 'Statistisk analyse (Analysis - overfitting/sample size)', risk: input.analysisRoB }
    ];

    const appList = [
      { domain: 'Deltakere (Participants Applicability)', concern: input.participantsApplicability },
      { domain: 'Prediktorer (Predictors Applicability)', concern: input.predictorsApplicability },
      { domain: 'Utfall (Outcome Applicability)', concern: input.outcomeApplicability }
    ];

    const hasHighRoB = robList.some(d => d.risk === 'High risk');
    const hasHighApp = appList.some(d => d.concern === 'High concern');

    return {
      riskOfBiasDomains: robList,
      applicabilityDomains: appList,
      overallRiskOfBias: hasHighRoB ? 'High risk' : 'Low risk',
      overallApplicabilityConcerns: hasHighApp ? 'High concern' : 'Low concern',
      methodologicalNote: 'PROBAST (Wolff et al. 2019) evaluerer multivariable diagnostiske og prognostiske prediksjonsmodeller (utvikling, validering eller oppdatering).'
    };
  }
}

// -------------------------------------------------------------
// 15. MMAT 2018 (Mixed Methods Appraisal Tool) ENGINE
// -------------------------------------------------------------
export class MmatAssessmentEngine {
  public static evaluate(input: {
    screening1ClearQuestion: boolean;
    screening2DataAddressQuestion: boolean;
    selectedCategory: 1 | 2 | 3 | 4 | 5; // 1: Qual, 2: Quant RCT, 3: Quant Non-RCT, 4: Quant Descriptive, 5: Mixed Methods
    categoryResponses: { itemNumber: number; response: 'Yes' | 'No' | 'Can’t tell' }[];
  }) {
    const screeningPassed = input.screening1ClearQuestion && input.screening2DataAddressQuestion;

    const noCount = input.categoryResponses.filter(r => r.response === 'No').length;
    const cantTellCount = input.categoryResponses.filter(r => r.response === 'Can’t tell').length;
    const yesCount = input.categoryResponses.filter(r => r.response === 'Yes').length;

    let narrative = '';
    if (!screeningPassed) {
      narrative = 'Screening-kriterier ikke bestått (Spm S1/S2). Videre vurdering med MMAT er ikke hensiktsmessig.';
    } else {
      narrative = `Kategori ${input.selectedCategory} vurdert: ${yesCount} Ja, ${noCount} Nei, ${cantTellCount} Uavklart.`;
    }

    return {
      screeningPassed,
      selectedCategory: input.selectedCategory,
      responses: input.categoryResponses,
      methodologicalSummary: narrative,
      methodologicalWarning: 'MMAT forbyr eksplisitt å beregne en samlet numerisk poengsum eller prosent. Det skal gis en deskriptiv profil av metodiske styrker og svakheter.'
    };
  }
}

// -------------------------------------------------------------
// 16. REPORTING STANDARDS NOTICE & INTEGRITY ENGINE
// -------------------------------------------------------------
export class ReportingStandardNoticeEngine {
  public static readonly REPORTING_GUIDELINES = [
    { id: 'consort', name: 'CONSORT 2010', target: 'Randomiserte kontrollerte studier (RCT)' },
    { id: 'strobe', name: 'STROBE', target: 'Observasjonsstudier (Kohort, Kasus-kontroll, Tverrsnitt)' },
    { id: 'prisma', name: 'PRISMA 2020', target: 'Systematiske kunnskapsoppsummeringer og metaanalyser' },
    { id: 'stard', name: 'STARD 2015', target: 'Diagnostiske nøyaktighetsstudier' },
    { id: 'tripod', name: 'TRIPOD', target: 'Prediksjonsmodellstudier (Multivariat prediksjon)' },
    { id: 'care', name: 'CARE', target: 'Kasusrapporter (Case reports)' },
    { id: 'coreq', name: 'COREQ', target: 'Kvalitative fokusgrupper og dybdeintervjuer' },
    { id: 'srqr', name: 'SRQR', target: 'Kvalitativ forskningsrapportering' },
    { id: 'squire', name: 'SQUIRE 2.0', target: 'Kvalitetsforbedring og helsetjenesteforbedring' },
    { id: 'cheers', name: 'CHEERS 2022', target: 'Helseøkonomiske evalueringer' },
    { id: 'right', name: 'RIGHT', target: 'Kliniske retningslinjer' }
  ];

  public static getMethodologicalNotice(guidelineId: string): string {
    return `METODISK SKILLE: ${guidelineId.toUpperCase()} er en rapporteringsstandard (reporting guideline) utformet for å sikre transparent og etterprøvbar forskningsrapportering. Den er IKKE et risikovurderingsverktøy (risk of bias) eller en kvalitetsmåling, og må aldri summeres til en samlet metodisk poengsum.`;
  }
}

// -------------------------------------------------------------
// DEDICATED SEPARATE RATING & VALIDATION SERVICES (Section 17)
// -------------------------------------------------------------

export class Amstar2RatingService {
  public static readonly STANDARD_CRITICAL_DOMAINS = [2, 4, 7, 9, 11, 13, 15];

  public static evaluateStandard(
    itemResponses: Record<number, 'Yes' | 'Partial Yes' | 'No' | 'No meta-analysis conducted' | string>
  ): Amstar2EvaluationResult {
    return Amstar2AssessmentEngine.evaluate(itemResponses);
  }

  public static evaluateCustomAdaptation(
    itemResponses: Record<number, 'Yes' | 'Partial Yes' | 'No' | 'No meta-analysis conducted' | string>,
    customCriticalDomains: number[],
    adaptationRationale: string
  ): Amstar2EvaluationResult & { adaptationType: 'REVIEW_SPECIFIC_ADAPTATION'; customCriticalDomains: number[]; adaptationRationale: string } {
    let criticalFlawsCount = 0;
    let nonCriticalFlawsCount = 0;
    const criticalFlawItems: number[] = [];

    for (let i = 1; i <= 16; i++) {
      const response = itemResponses[i];
      const isCritical = customCriticalDomains.includes(i);

      if (isCritical) {
        if (response === 'No') {
          criticalFlawsCount++;
          criticalFlawItems.push(i);
        }
      } else {
        if (response === 'No') {
          nonCriticalFlawsCount++;
        }
      }
    }

    let overallConfidence: 'High' | 'Moderate' | 'Low' | 'Critically Low';
    if (criticalFlawsCount === 0) {
      overallConfidence = nonCriticalFlawsCount <= 1 ? 'High' : 'Moderate';
    } else if (criticalFlawsCount === 1) {
      overallConfidence = 'Low';
    } else {
      overallConfidence = 'Critically Low';
    }

    return {
      criticalFlawsCount,
      nonCriticalFlawsCount,
      criticalFlawItems,
      overallConfidence,
      confidenceRationale: `Gjennomført med review-spesifikk AMSTAR 2 tilpasning (kritiske domener: [${customCriticalDomains.join(', ')}]). Begrunnelse: ${adaptationRationale}`,
      methodologicalWarning: 'REVIEW-SPECIFIC ADAPTATION: Dette er en prosjektspesifikk tilpasning og må eksplisitt rapporteres som tilpasset AMSTAR 2, aldri som standard AMSTAR 2.',
      adaptationType: 'REVIEW_SPECIFIC_ADAPTATION',
      customCriticalDomains,
      adaptationRationale
    };
  }

  public static evaluate(
    itemResponses: Record<number, any> | Array<{ questionId?: number; itemId?: number; status?: string; answer?: string }>
  ): Amstar2EvaluationResult {
    if (Array.isArray(itemResponses)) {
      const record: Record<number, any> = {};
      itemResponses.forEach((it, idx) => {
        const id = it.questionId || it.itemId || (idx + 1);
        record[id] = it.answer || it.status || 'No';
      });
      return Amstar2AssessmentEngine.evaluate(record);
    }
    return Amstar2AssessmentEngine.evaluate(itemResponses);
  }

  public static validateInput(itemResponses: Record<number, any>, criticalDomains: number[] = this.STANDARD_CRITICAL_DOMAINS): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const keys = Object.keys(itemResponses).map(Number);

    if (keys.length !== 16) {
      errors.push(`Ugyldig antall items for AMSTAR 2: Mottok ${keys.length}, forventer 16 items.`);
    }

    for (let i = 1; i <= 16; i++) {
      if (!itemResponses[i]) {
        errors.push(`Mangler vurdering for AMSTAR 2 Item ${i}.`);
      } else {
        const val = itemResponses[i];
        const validValues = ['Yes', 'Partial Yes', 'No', 'No meta-analysis conducted'];
        if (!validValues.includes(val)) {
          errors.push(`Ugyldig svarverdi for Item ${i}: "${val}". Må være én av: ${validValues.join(', ')}`);
        }
      }
    }

    const invalidDomains = criticalDomains.filter(d => d < 1 || d > 16);
    if (invalidDomains.length > 0) {
      errors.push(`Ugyldige kritiske domene-indekser oppgitt: [${invalidDomains.join(', ')}].`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export class Agree2ScoringService {
  public static readonly DOMAINS = Agree2AssessmentEngine.DOMAINS;

  public static evaluate(ratings: Record<number, number>, reviewersCount: number = 1): Agree2EvaluationResult {
    return Agree2AssessmentEngine.evaluateDomainScores(ratings, reviewersCount);
  }

  public static calculateDomainScores(ratings: Record<number, number>, reviewersCount: number = 1): Agree2DomainScore[] {
    return Agree2AssessmentEngine.evaluateDomainScores(ratings, reviewersCount).domainScores;
  }

  public static validateRatings(ratings: Record<number, number>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (let i = 1; i <= 23; i++) {
      const val = ratings[i];
      if (val === undefined || val === null) {
        errors.push(`Mangler skår for AGREE II Item ${i}.`);
      } else if (typeof val !== 'number' || val < 1 || val > 7 || !Number.isInteger(val)) {
        errors.push(`Ugyldig skår for AGREE II Item ${i}: ${val}. Må være et heltall mellom 1 og 7.`);
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export class CaspValidationService {
  public static evaluateQualitative(responses: Record<number, 'Yes' | 'Can’t tell' | 'No'>): CaspQualitativeResult {
    return CaspAssessmentEngine.evaluateQualitative(responses);
  }

  public static validateQualitativeInput(responses: Record<number, string>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const val = responses[i];
      if (!val) {
        errors.push(`Mangler svar for CASP Qualitative Item ${i}.`);
      } else if (!['Yes', 'Can’t tell', 'No'].includes(val)) {
        errors.push(`Ugyldig svar for CASP Item ${i}: "${val}". Gyldige svar: Yes, Can’t tell, No.`);
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public static getNonOfficialNumericIndicatorNotice(): string {
    return 'NON-OFFICIAL LOCAL INDICATOR: CASP har ingen offisielt validert numerisk poengsum eller prosent. Eventuell opptelling i brukergrensesnittet er kun en lokal veiledende indikator.';
  }
}

export class JbiValidationService {
  public static evaluate(items: { questionId: number; status: string; justification?: string }[]) {
    return JbiQualitativeAssessmentEngine.evaluate(items);
  }

  public static validateInput(items: { questionId: number; status: string; justification?: string }[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!Array.isArray(items) || items.length !== 10) {
      errors.push(`JBI Qualitative (2017) krever nøyaktig 10 items. Mottok ${items?.length || 0}.`);
      return { isValid: false, errors };
    }

    const seenIds = new Set<number>();
    items.forEach(item => {
      if (seenIds.has(item.questionId)) {
        errors.push(`Duplikat item oppdaget for JBI Question ID ${item.questionId}.`);
      }
      seenIds.add(item.questionId);

      const valid = ['Ja', 'Nei', 'Uklart', 'Ikke relevant', 'Yes', 'No', 'Unclear', 'Not applicable'];
      if (!valid.some(v => v.toLowerCase() === (item.status || '').toLowerCase())) {
        errors.push(`Ugyldig svarkode for JBI Item ${item.questionId}: "${item.status}".`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export class Rob2ValidationService {
  public static evaluate(domainRisks: {
    d1Randomisation: 'Low risk' | 'Some concerns' | 'High risk';
    d2Deviations: 'Low risk' | 'Some concerns' | 'High risk';
    d3MissingData: 'Low risk' | 'Some concerns' | 'High risk';
    d4Measurement: 'Low risk' | 'Some concerns' | 'High risk';
    d5Selection: 'Low risk' | 'Some concerns' | 'High risk';
  }): Rob2EvaluationResult {
    return Rob2AssessmentEngine.evaluate(domainRisks);
  }
}

export class RobinsIValidationService {
  public static evaluate(domainResponses: Record<string, 'Low risk' | 'Moderate risk' | 'Serious risk' | 'Critical risk' | 'No information'>): RobinsIEvaluationResult {
    return RobinsIAssessmentEngine.evaluate(domainResponses);
  }
}

export class RobisValidationService {
  public static evaluate(input: Parameters<typeof RobisAssessmentEngine.evaluate>[0]): RobisEvaluationResult {
    return RobisAssessmentEngine.evaluate(input);
  }
}

export class Quadas2ValidationService {
  public static evaluate(input: Parameters<typeof Quadas2AssessmentEngine.evaluate>[0]): Quadas2EvaluationResult {
    return Quadas2AssessmentEngine.evaluate(input);
  }
}

export class QuipsValidationService {
  public static evaluate(domains: Parameters<typeof QuipsAssessmentEngine.evaluate>[0]) {
    return QuipsAssessmentEngine.evaluate(domains);
  }
}

export class ProbastValidationService {
  public static evaluate(input: Parameters<typeof ProbastAssessmentEngine.evaluate>[0]) {
    return ProbastAssessmentEngine.evaluate(input);
  }
}

export class MmatValidationService {
  public static evaluate(input: Parameters<typeof MmatAssessmentEngine.evaluate>[0]) {
    return MmatAssessmentEngine.evaluate(input);
  }
}

export class GradeCertaintyService {
  public static evaluateOutcome(input: Parameters<typeof GradeAssessmentEngine.evaluateOutcome>[0]) {
    return GradeAssessmentEngine.evaluateOutcome(input);
  }
}

export class GradeCerqualValidationService {
  public static evaluateFinding(input: Parameters<typeof GradeCerqualAssessmentEngine.evaluateFinding>[0]) {
    return GradeCerqualAssessmentEngine.evaluateFinding(input);
  }
}

export class Prisma2020ValidationService {
  public static evaluateReporting(responses: Record<number, 'Yes' | 'Partial' | 'No' | 'Not applicable'>) {
    return Prisma2020ReportingEngine.evaluateReporting(responses);
  }
}

export class Cfir2ValidationService {
  public static evaluateDeterminants(constructs: Cfir2ConstructItem[]) {
    return Cfir2AssessmentEngine.evaluateDeterminants(constructs);
  }
}

export class KtaValidationService {
  public static evaluateRoadmap(phases: KtaPhaseStatus[]) {
    return KtaAssessmentEngine.evaluateRoadmap(phases);
  }
}

