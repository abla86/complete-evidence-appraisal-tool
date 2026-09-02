import { JBI_QUESTIONS } from '../data/jbiData';
import { JbiQualitativeAssessmentEngine } from './assessmentEngines';
import { createBlankAppraisalSession, upsertAppraisalResponse, type AppraisalSession } from './universalAppraisalService';

export type JbiAnswer = 'Ja' | 'Nei' | 'Uklart' | 'Ikke relevant';

export interface JbiQualitativeSessionResult {
  session: AppraisalSession;
  summary: ReturnType<typeof JbiQualitativeAssessmentEngine.evaluate>;
}

export function createJbiQualitativeSession(studyId: string, reviewerId: string): AppraisalSession {
  return createBlankAppraisalSession(studyId, 'jbi-qualitative-2017', reviewerId);
}

export function answerJbiQuestion(
  session: AppraisalSession,
  questionId: number,
  answer: JbiAnswer,
  rationale: string,
  evidence?: { quote?: string; page?: string; section?: string; sourceId?: string },
): AppraisalSession {
  const question = JBI_QUESTIONS.find(item => item.id === questionId);
  if (!question) throw new Error(`Ukjent JBI-spørsmål: ${questionId}`);
  return upsertAppraisalResponse(session, {
    itemId: questionId,
    answer,
    rationale,
    evidence,
  });
}

export function evaluateJbiQualitativeSession(session: AppraisalSession): JbiQualitativeSessionResult {
  if (session.instrumentId !== 'jbi-qualitative-2017') {
    throw new Error('Sessionen er ikke en JBI Qualitative 2017-vurdering.');
  }
  const items = session.responses.map(response => ({
    questionId: Number(response.itemId),
    status: String(response.answer ?? ''),
    justification: response.rationale,
  }));
  return {
    session,
    summary: JbiQualitativeAssessmentEngine.evaluate(items),
  };
}
