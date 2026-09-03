import { Amstar2AssessmentEngine, Agree2AssessmentEngine, Rob2AssessmentEngine } from './assessmentEngines';
import { CaspValidationService } from './caspValidationService';

export function buildAppraisalResult(session: { instrumentId: string; instrumentVersion: string; studyId: string; reviewerId: string; responses: Array<{ itemId: number | string; answer: unknown; rationale: string }> }) {
  const answers = session.responses.reduce<Record<string, unknown>>((acc, response) => {
    acc[String(response.itemId)] = response.answer;
    return acc;
  }, {});
  const status = session.responses.length > 0 ? 'IN_REVIEW' : 'DRAFT';
  const completionPercent = session.responses.length;

  switch (session.instrumentId) {
    case 'amstar-2': {
      const result = Amstar2AssessmentEngine.evaluate(answers as Record<number, 'Yes' | 'Partial Yes' | 'No' | 'No meta-analysis conducted' | string>);
      return { instrumentId: session.instrumentId, instrumentVersion: session.instrumentVersion, studyId: session.studyId, reviewerId: session.reviewerId, status, completionPercent, result, methodologicalWarning: result.methodologicalWarning };
    }
    case 'agree-ii': {
      const numericRatings = Object.fromEntries(session.responses.map(r => [Number(r.itemId), typeof r.answer === 'number' ? r.answer : Number(r.answer)])) as Record<number, number>;
      const result = Agree2AssessmentEngine.evaluateDomainScores(numericRatings, 1);
      return { instrumentId: session.instrumentId, instrumentVersion: session.instrumentVersion, studyId: session.studyId, reviewerId: session.reviewerId, status, completionPercent, result, methodologicalWarning: result.methodologicalNote };
    }
    case 'rob-2': {
      const map = session.responses.reduce<Record<string, string>>((acc, r) => { acc[String(r.itemId)] = String(r.answer); return acc; }, {});
      const result = Rob2AssessmentEngine.evaluate({
        d1Randomisation: (map['1'] || 'Some concerns') as 'Low risk' | 'Some concerns' | 'High risk',
        d2Deviations: (map['2'] || 'Some concerns') as 'Low risk' | 'Some concerns' | 'High risk',
        d3MissingData: (map['3'] || 'Some concerns') as 'Low risk' | 'Some concerns' | 'High risk',
        d4Measurement: (map['4'] || 'Some concerns') as 'Low risk' | 'Some concerns' | 'High risk',
        d5Selection: (map['5'] || 'Some concerns') as 'Low risk' | 'Some concerns' | 'High risk',
      });
      return { instrumentId: session.instrumentId, instrumentVersion: session.instrumentVersion, studyId: session.studyId, reviewerId: session.reviewerId, status, completionPercent, result, methodologicalWarning: result.algorithmRationale };
    }
    default: {
      if (session.instrumentId.startsWith('casp-')) {
        const qualitative = session.instrumentId === 'casp-qualitative';
        if (qualitative) {
          const mapped = Object.fromEntries(session.responses.map(r => [Number(r.itemId), String(r.answer)]));
          const result = CaspValidationService.evaluateQualitative(mapped as Record<number, 'Yes' | 'Can’t tell' | 'No'>);
          return { instrumentId: session.instrumentId, instrumentVersion: session.instrumentVersion, studyId: session.studyId, reviewerId: session.reviewerId, status, completionPercent, result };
        }
      }
      return { instrumentId: session.instrumentId, instrumentVersion: session.instrumentVersion, studyId: session.studyId, reviewerId: session.reviewerId, status, completionPercent, result: null };
    }
  }
}
