import type { AppraisalSession } from './universalAppraisalService';
import {
  Amstar2AssessmentEngine,
  Agree2AssessmentEngine,
  JbiQualitativeAssessmentEngine,
  Rob2AssessmentEngine,
  CaspValidationService,
} from './assessmentEngines';

export interface AppraisalResultEnvelope {
  instrumentId: string;
  instrumentVersion: string;
  studyId: string;
  reviewerId: string;
  status: 'COMPLETE' | 'INCOMPLETE' | 'LOCKED';
  completionPercent: number;
  result: unknown;
  methodologicalWarning?: string;
}

export function calculateCompletion(session: AppraisalSession, expectedItemCount: number): number {
  if (expectedItemCount <= 0) return 100;
  return Math.min(100, Math.round((session.responses.filter(r => r.answer !== null && r.answer !== '').length / expectedItemCount) * 100));
}

export function calculateAppraisalResult(session: AppraisalSession, expectedItemCount: number): AppraisalResultEnvelope {
  const completionPercent = calculateCompletion(session, expectedItemCount);
  const status: AppraisalResultEnvelope['status'] = session.locked ? 'LOCKED' : completionPercent === 100 ? 'COMPLETE' : 'INCOMPLETE';
  const answers = Object.fromEntries(session.responses.map(r => [Number(r.itemId), r.answer]));

  switch (session.instrumentId) {
    case 'jbi-qualitative-2017': {
      const result = JbiQualitativeAssessmentEngine.evaluate(session.responses.map(r => ({
        questionId: Number(r.itemId),
        status: String(r.answer ?? ''),
        justification: r.rationale,
      })));
      return { instrumentId: session.instrumentId, instrumentVersion: session.instrumentVersion, studyId: session.studyId, reviewerId: session.reviewerId, status, completionPercent, result, methodologicalWarning: result.methodologicalNote };
    }
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
        d1Randomisation: (map['1'] || 'Some concerns') as any,
        d2Deviations: (map['2'] || 'Some concerns') as any,
        d3MissingOutcome: (map['3'] || 'Some concerns') as any,
        d4OutcomeMeasurement: (map['4'] || 'Some concerns') as any,
        d5SelectiveReporting: (map['5'] || 'Some concerns') as any,
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
      return {
        instrumentId: session.instrumentId,
        instrumentVersion: session.instrumentVersion,
        studyId: session.studyId,
        reviewerId: session.reviewerId,
        status,
        completionPercent,
        result: { responses: session.responses },
        methodologicalWarning: 'Dette instrumentet er registrert og har felles vurderingsflate, men har foreløpig ikke en instrumentspesifikk beregningsmotor. Resultatet viser derfor rå vurderingsdata uten oppfunnet totalscore.',
      };
    }
  }
}
