import {
  ReferenceValidationArticle,
  GoldStandardDiffResult,
  GoldStandardDiffItem,
  DiffSeverity,
  GoldStandardMatchStatus,
  ArticleAppraisal
} from '../types';
import { REFERENCE_VALIDATION_ARTICLES } from '../data/referenceValidationData';
import {
  Amstar2RatingService,
  Agree2AssessmentEngine,
  Agree2ScoringService,
  JbiQualitativeAssessmentEngine,
  Rob2AssessmentEngine
} from './assessmentEngines';

export class ReferenceValidationService {
  public static getAllReferenceArticles(): ReferenceValidationArticle[] {
    return REFERENCE_VALIDATION_ARTICLES;
  }

  public static findReferenceArticle(identifier: string): ReferenceValidationArticle | undefined {
    const idClean = identifier.toLowerCase().trim();
    return REFERENCE_VALIDATION_ARTICLES.find(
      ref => ref.id.toLowerCase() === idClean ||
        ref.doi.toLowerCase().includes(idClean) ||
        ref.title.toLowerCase().includes(idClean)
    );
  }

  public static getReferenceArticleById(id: string): ReferenceValidationArticle | undefined {
    return this.findReferenceArticle(id);
  }

  public static compareAgainstGoldStandard(
    referenceArticle: ReferenceValidationArticle,
    appResponses: Record<number, string>
  ): GoldStandardDiffResult {
    const itemDiffs: GoldStandardDiffItem[] = [];
    let matchingItemsCount = 0;
    let criticalMismatches = 0;
    let highMismatches = 0;
    let mediumMismatches = 0;
    let lowMismatches = 0;
    const criticalDomainItems = [2, 4, 7, 9, 11, 13, 15];

    referenceArticle.itemData.forEach(refItem => {
      const appResp = appResponses[refItem.itemNumber] || 'Ikke vurdert';
      const refResp = refItem.referenceResponse;
      const isExactMatch = this.normalizeResponse(appResp) === this.normalizeResponse(refResp);
      const isPartialMatch = !isExactMatch && this.isPartialAgreement(appResp, refResp);

      let diffDesc = '';
      if (isExactMatch) {
        matchingItemsCount++;
        diffDesc = 'Full overensstemmelse med publisert referansevurdering.';
      } else if (isPartialMatch) {
        diffDesc = `Delvis samsvar: Applikasjon svarte "${appResp}", mens referanse er "${refResp}".`;
      } else {
        diffDesc = `Avvik: Applikasjon svarte "${appResp}", mens referanse er "${refResp}".`;
      }

      let severity: DiffSeverity = 'LOW';
      if (!isExactMatch) {
        if (referenceArticle.instrumentId === 'amstar-2' && criticalDomainItems.includes(refItem.itemNumber)) {
          severity = 'CRITICAL';
          criticalMismatches++;
        } else if (refItem.itemNumber <= 2 && referenceArticle.instrumentId.includes('casp')) {
          severity = 'CRITICAL';
          criticalMismatches++;
        } else if (isPartialMatch) {
          severity = 'MEDIUM';
          mediumMismatches++;
        } else {
          severity = 'HIGH';
          highMismatches++;
        }
      }

      itemDiffs.push({
        itemNumber: refItem.itemNumber,
        itemTitle: refItem.itemTitle,
        referenceResponse: refResp,
        applicationResponse: appResp,
        difference: diffDesc,
        referenceSource: refItem.referenceSource,
        evidenceSnippet: refItem.evidenceSnippet,
        severity,
        isMatch: isExactMatch
      });
    });

    const totalItems = referenceArticle.itemData.length;
    const matchPercentage = totalItems > 0 ? Math.round((matchingItemsCount / totalItems) * 100) : 0;

    let matchStatus: GoldStandardMatchStatus = 'MISMATCH';
    if (totalItems === 0) {
      matchStatus = 'UNABLE_TO_COMPARE';
    } else if (matchPercentage === 100) {
      matchStatus = 'MATCH';
    } else if (matchPercentage >= 70 && criticalMismatches === 0) {
      matchStatus = 'PARTIAL_MATCH';
    }

    const summaryMessage = matchStatus === 'MATCH'
      ? `100% fullstendig samsvar (${matchingItemsCount}/${totalItems} items) med publisert gullstandard fra ${referenceArticle.journal} (${referenceArticle.year}).`
      : matchStatus === 'PARTIAL_MATCH'
        ? `Delvis metodisk overensstemmelse (${matchPercentage}% - ${matchingItemsCount}/${totalItems} items). Ingen kritiske domeneavvik.`
        : matchStatus === 'UNABLE_TO_COMPARE'
          ? 'Sammenligning kunne ikke utfÃ¸res fordi gullstandarden mangler vurderingspunkter.'
          : `Metodisk avvik registrert (${matchingItemsCount}/${totalItems} items samsvarer, ${criticalMismatches} kritiske avvik).`;

    return {
      articleId: referenceArticle.id,
      articleTitle: referenceArticle.title,
      instrumentId: referenceArticle.instrumentId,
      instrumentVersion: referenceArticle.instrumentVersion,
      referenceAssessmentType: referenceArticle.referenceAssessmentType,
      totalItemsCompared: totalItems,
      matchingItemsCount,
      mismatchingItemsCount: totalItems - matchingItemsCount,
      matchPercentage,
      matchStatus,
      criticalMismatchesCount: criticalMismatches,
      highMismatchesCount: highMismatches,
      mediumMismatchesCount: mediumMismatches,
      lowMismatchesCount: lowMismatches,
      itemDiffs,
      summaryMessage,
      scientificValidityNotice: 'AKADEMISK INTEGRITETSERKLÃ†RING: En bestÃ¥tt algoritmetest eller diff-sjekk verifiserer programvarens deterministiske beregningsevne, men erstatter aldri uavhengig fagfellevurdert forskerbedÃ¸mmelse.'
    };
  }

  public static runLevel3ReferenceTestSuite(): {
    totalArticles: number;
    passedArticles: number;
    failedArticles: number;
    results: {
      articleId: string;
      title: string;
      instrument: string;
      expectedVerdict: string;
      calculatedVerdict: string;
      status: 'PASS' | 'FAIL' | 'UNABLE_TO_COMPARE';
      executionTimeMs: number;
    }[];
  } {
    const results: {
      articleId: string;
      title: string;
      instrument: string;
      expectedVerdict: string;
      calculatedVerdict: string;
      status: 'PASS' | 'FAIL' | 'UNABLE_TO_COMPARE';
      executionTimeMs: number;
    }[] = [];

    let passed = 0;
    let failed = 0;

    REFERENCE_VALIDATION_ARTICLES.forEach(art => {
      const startTime = performance.now();
      let calculatedVerdict = '';
      let isPass = false;
      let comparable = true;

      if (art.instrumentId === 'amstar-2') {
        const itemMap: Record<number, any> = {};
        art.itemData.forEach(it => {
          itemMap[it.itemNumber] = it.referenceResponse;
        });
        const evalRes = Amstar2RatingService.evaluateStandard(itemMap);
        calculatedVerdict = evalRes.overallConfidence;
        isPass = calculatedVerdict === art.expectedOverallScoreOrVerdict;
      } else if (art.instrumentId === 'jbi-qualitative-2017') {
        const items = art.itemData.map(it => ({
          questionId: it.itemNumber,
          status: it.referenceResponse,
          justification: it.referenceRationale
        }));
        const evalRes = JbiQualitativeAssessmentEngine.evaluate(items);
        calculatedVerdict = evalRes.verdict;
        isPass = calculatedVerdict === art.expectedOverallScoreOrVerdict;
      } else if (art.instrumentId === 'agree-ii') {
        const ratings: Record<number, number> = {};
        art.itemData.forEach(it => {
          ratings[it.itemNumber] = Number.isFinite(Number.parseInt(it.referenceResponse, 10)) ? Number.parseInt(it.referenceResponse, 10) : 0;
        });
        for (let i = 1; i <= 23; i++) {
          if (ratings[i] === undefined) ratings[i] = 7;
        }
        const evalRes = Agree2AssessmentEngine.evaluateDomainScores(ratings, 1);
        calculatedVerdict = evalRes.overallRecommendation;
        isPass = calculatedVerdict === art.expectedOverallScoreOrVerdict;
      } else if (art.instrumentId === 'rob-2') {
        const domainMap: { d1Randomisation: 'Low risk' | 'Some concerns' | 'High risk'; d2Deviations: 'Low risk' | 'Some concerns' | 'High risk'; d3MissingData: 'Low risk' | 'Some concerns' | 'High risk'; d4Measurement: 'Low risk' | 'Some concerns' | 'High risk'; d5Selection: 'Low risk' | 'Some concerns' | 'High risk' } = {
          d1Randomisation: 'Low risk',
          d2Deviations: 'Low risk',
          d3MissingData: 'Low risk',
          d4Measurement: 'Low risk',
          d5Selection: 'Low risk'
        };
        art.itemData.forEach(it => {
          if (it.itemNumber === 1) domainMap.d1Randomisation = it.referenceResponse;
          if (it.itemNumber === 2) domainMap.d2Deviations = it.referenceResponse;
          if (it.itemNumber === 3) domainMap.d3MissingData = it.referenceResponse;
          if (it.itemNumber === 4) domainMap.d4Measurement = it.referenceResponse;
          if (it.itemNumber === 5) domainMap.d5Selection = it.referenceResponse;
        });
        const evalRes = Rob2AssessmentEngine.evaluate(domainMap);
        calculatedVerdict = evalRes.overallRiskOfBias;
        isPass = calculatedVerdict === art.expectedOverallScoreOrVerdict;
      } else {
        comparable = false;
        calculatedVerdict = 'UNABLE_TO_COMPARE';
      }

      const elapsed = Math.round(performance.now() - startTime);
      const status = !comparable ? 'UNABLE_TO_COMPARE' : isPass ? 'PASS' : 'FAIL';
      if (status === 'PASS') passed++;
      if (status === 'FAIL') failed++;

      results.push({
        articleId: art.id,
        title: art.title,
        instrument: `${art.instrumentName} (${art.instrumentVersion})`,
        expectedVerdict: art.expectedOverallScoreOrVerdict || 'N/A',
        calculatedVerdict,
        status,
        executionTimeMs: elapsed
      });
    });

    return {
      totalArticles: REFERENCE_VALIDATION_ARTICLES.length,
      passedArticles: passed,
      failedArticles: failed,
      results
    };
  }

  private static normalizeResponse(str: string): string {
    const s = (str || '').toLowerCase().trim();
    if (['ja', 'yes', 'low risk', 'high', '7', '6'].includes(s)) return 'positive';
    if (['nei', 'no', 'high risk', 'critically low', '1', '2'].includes(s)) return 'negative';
    if (['partial yes', 'some concerns', 'moderate', 'uklart', 'unclear', 'canâ€™t tell', "can't tell", '3', '4', '5'].includes(s)) return 'neutral';
    if (['no meta-analysis conducted', 'ikke relevant', 'not applicable'].includes(s)) return 'na';
    return s;
  }

  private static isPartialAgreement(a: string, b: string): boolean {
    const na = this.normalizeResponse(a);
    const nb = this.normalizeResponse(b);
    return (na === 'neutral' && (nb === 'positive' || nb === 'negative')) ||
      (nb === 'neutral' && (na === 'positive' || na === 'negative'));
  }
}


