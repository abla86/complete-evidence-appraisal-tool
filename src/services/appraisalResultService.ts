import { Amstar2AssessmentEngine, Agree2AssessmentEngine, Rob2AssessmentEngine, CaspValidationService } from './assessmentEngines';

type AppraisalSession = {
  instrumentId: string;
  instrumentVersion: string;
  studyId: string;
  reviewerId: string;
  responses: Array<{ itemId: number | string; answer: unknown; rationale: string }>;
};

const hasAnswer = (value: unknown) => value !== null && value !== undefined && String(value).trim() !== '';

export function buildAppraisalResult(session: AppraisalSession) {
  const answers = session.responses.reduce<Record<string, unknown>>((acc, response) => {
    acc[String(response.itemId)] = response.answer;
    return acc;
  }, {});
  const status = session.responses.length > 0 ? 'IN_REVIEW' : 'DRAFT';
  const completionPercent = session.responses.length;

  const base = {
    instrumentId: session.instrumentId,
    instrumentVersion: session.instrumentVersion,
    studyId: session.studyId,
    reviewerId: session.reviewerId,
    status,
    completionPercent,
  };

  switch (session.instrumentId) {
    case 'amstar-2': {
      const complete = Array.from({ length: 16 }, (_, i) => answers[String(i + 1)]).every(hasAnswer);
      if (!complete) return { ...base, result: null, methodologicalWarning: 'Ufullstendig AMSTAR 2-vurdering: ingen samlet vurdering beregnes før alle 16 items er besvart.' };
      const result = Amstar2AssessmentEngine.evaluate(answers as Record<number, string>);
      return { ...base, result, methodologicalWarning: result.methodologicalWarning };
    }
    case 'agree-ii': {
      const complete = Array.from({ length: 23 }, (_, i) => answers[String(i + 1)]).every(hasAnswer);
      if (!complete) return { ...base, result: null, methodologicalWarning: 'Ufullstendig AGREE II-vurdering: domeneskårer beregnes ikke før alle 23 items er besvart.' };
      const numericRatings = Object.fromEntries(
        session.responses.map(r => [Number(r.itemId), typeof r.answer === 'number' ? r.answer : Number(r.answer)]),
      ) as Record<number, number>;
      const result = Agree2AssessmentEngine.evaluateDomainScores(numericRatings);
      return { ...base, result, methodologicalWarning: result.methodologicalNote };
    }
    case 'rob-2': {
      const map = session.responses.reduce<Record<string, string>>((acc, r) => {
        acc[String(r.itemId)] = String(r.answer);
        return acc;
      }, {});
      const required = ['1', '2', '3', '4', '5'];
      if (!required.every(id => hasAnswer(map[id]))) return { ...base, result: null, methodologicalWarning: 'Ufullstendig RoB 2-vurdering: ingen samlet risiko-for-bias-vurdering beregnes før alle fem domener er vurdert.' };
      const result = Rob2AssessmentEngine.evaluate({
        d1Randomisation: map['1'] as 'Low risk' | 'Some concerns' | 'High risk',
        d2Deviations: map['2'] as 'Low risk' | 'Some concerns' | 'High risk',
        d3MissingData: map['3'] as 'Low risk' | 'Some concerns' | 'High risk',
        d4Measurement: map['4'] as 'Low risk' | 'Some concerns' | 'High risk',
        d5Selection: map['5'] as 'Low risk' | 'Some concerns' | 'High risk',
      });
      return { ...base, result, methodologicalWarning: result.algorithmRationale };
    }
    default: {
      if (session.instrumentId === 'casp-qualitative') {
        const mapped = Object.fromEntries(session.responses.map(r => [Number(r.itemId), String(r.answer)]));
        const result = CaspValidationService.evaluateQualitative(mapped as Record<number, 'Yes' | "Can't tell" | 'No'>);
        return { ...base, result };
      }
      return { ...base, result: null };
    }
  }
}
