import type {
  DualReviewConfig,
  ReviewComparison,
  ReviewDisagreement,
  ReviewInstance,
  ResolvedAppraisal,
} from '../types/researchWorkflow';

export type { ReviewComparison } from '../types/researchWorkflow';

export function assignReviews(
  appraisalId: string,
  studyId: string,
  instrumentId: string,
  reviewers: string[],
  config: DualReviewConfig,
): ReviewInstance[] {
  const unique = [...new Set(reviewers.map(id => id.trim()).filter(Boolean))].slice(0, Math.max(2, config.minReviewers));
  if (unique.length < config.minReviewers) throw new Error(`Trenger minst ${config.minReviewers} vurderere.`);
  if (!Number.isFinite(config.conflictThreshold) || config.conflictThreshold < 0 || config.conflictThreshold > 1) {
    throw new Error('Konfliktterskel må være mellom 0 og 1.');
  }
  return unique.map((reviewerId, index) => ({
    id: `${appraisalId}-review-${index + 1}`,
    appraisalId,
    studyId,
    instrumentId,
    reviewerId,
    status: 'assigned',
    responses: {},
    comments: [],
  }));
}

export function calculateDisagreement(reviews: ReviewInstance[]): ReviewComparison {
  if (reviews.length !== 2) throw new Error('Disagreement calculation requires exactly two reviews.');
  const left = reviews[0].responses;
  const right = reviews[1].responses;
  const itemIds = new Set([...Object.keys(left), ...Object.keys(right)]);
  const items: ReviewDisagreement[] = [...itemIds].map(itemId => {
    const reviewer1Score = left[itemId] ?? null;
    const reviewer2Score = right[itemId] ?? null;
    return {
      itemId,
      reviewer1Score,
      reviewer2Score,
      disagreement: reviewer1Score !== reviewer2Score,
    };
  });
  const disagreements = items.filter(item => item.disagreement).length;
  const overallDisagreement = items.length === 0 ? 0 : disagreements / items.length;
  return {
    overallDisagreement,
    items,
    requiresArbitration: overallDisagreement > 0,
  };
}

export function resolveAppraisal(
  appraisalId: string,
  reviewer: string,
  disagreements: ReviewDisagreement[],
  method: DualReviewConfig['arbitrationMethod'],
  responses: Record<string, string | number | boolean | null>,
): ResolvedAppraisal {
  return {
    appraisalId,
    status: 'resolved',
    resolutionMethod: method,
    resolvedBy: reviewer,
    resolvedAt: new Date().toISOString(),
    disagreements,
    consensusResponses: { ...responses },
  };
}

/**
 * Compatibility adapter for the universal dual-review UI.
 * The canonical engine is calculateDisagreement + resolveAppraisal.
 */
export function resolveConflict(
  appraisalId: string,
  reviews: ReviewInstance[],
  reviewer: string,
  method: DualReviewConfig['arbitrationMethod'],
): ResolvedAppraisal {
  const comparison = calculateDisagreement(reviews);
  const consensusResponses = reviews.length
    ? { ...reviews[0].responses }
    : {};
  return resolveAppraisal(appraisalId, reviewer, comparison.items, method, consensusResponses);
}
