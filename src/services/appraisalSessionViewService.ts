import type { AppraisalSession } from './universalAppraisalService';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';
import { getQualityAssessmentsForSession, type StoredQualityAssessment } from './qualityAssessmentService';

export interface AppraisalItemView {
  itemId: string;
  itemNumber: number;
  title: string;
  question: string;
  answer: string | number | boolean | null;
  rationale: string;
  evidence?: AppraisalSession['responses'][number]['evidence'];
  isCritical: boolean;
}

export interface AppraisalSessionView {
  id: string;
  studyId: string;
  reviewerId: string;
  instrumentId: string;
  instrumentName: string;
  instrumentVersion: string;
  locked: boolean;
  items: AppraisalItemView[];
  qualityAssessments: StoredQualityAssessment[];
  updatedAt: string;
}

export function getAppraisalSessionView(session: AppraisalSession): AppraisalSessionView {
  const instrument = MASTER_INSTRUMENTS_REGISTRY.find(item => item.id === session.instrumentId);
  if (!instrument) throw new Error(`Instrument finnes ikke i registry: ${session.instrumentId}`);

  const responseMap = new Map(session.responses.map(response => [String(response.itemId), response]));
  const items = (instrument.questions ?? []).map((question, index) => {
    const response = responseMap.get(String(question.id));
    return {
      itemId: String(question.id),
      itemNumber: question.itemNumber ?? index + 1,
      title: question.shortTitle,
      question: question.officialQuestion || question.questionText,
      answer: response?.answer ?? null,
      rationale: response?.rationale ?? '',
      evidence: response?.evidence,
      isCritical: Boolean(question.isCritical),
    };
  });

  return {
    id: session.id,
    studyId: session.studyId,
    reviewerId: session.reviewerId,
    instrumentId: session.instrumentId,
    instrumentName: instrument.name,
    instrumentVersion: instrument.version,
    locked: session.locked,
    items,
    qualityAssessments: getQualityAssessmentsForSession(session.id),
    updatedAt: session.updatedAt,
  };
}

export function getSessionViews(sessions: AppraisalSession[]): AppraisalSessionView[] {
  return sessions.map(getAppraisalSessionView);
}
