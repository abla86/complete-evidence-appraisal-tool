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
    throw new Error('Konfliktterskel mÃ¥ vÃ¦re mellom 0 og 1.');
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
  rationale = '',
): ResolvedAppraisal {
  if (!appraisalId.trim() || !reviewer.trim()) throw new Error('appraisalId og adjudicator er pÃ¥krevd.');
  if (disagreements.some(item => item.disagreement) && !rationale.trim()) throw new Error('Adjudication krever eksplisitt begrunnelse nÃ¥r det finnes uenighet.');
  if (disagreements.some(item => item.disagreement) && method === 'autoResolve') throw new Error('autoResolve er ikke tillatt for metodisk appraisal-uenighet.');
  const unresolved = disagreements.filter(item => item.disagreement).filter(item => responses[item.itemId] === null || responses[item.itemId] === undefined);
  if (unresolved.length) throw new Error(`Alle uenigheter mÃ¥ ha en eksplisitt consensus-respons: ${unresolved.map(item => item.itemId).join(', ')}`);
  if (method !== 'consensus' && method !== 'thirdReviewer') throw new Error('Methodisk appraisal-uenighet mÃ¥ lÃ¸ses ved consensus eller third reviewer.');
  if (!rationale.trim()) throw new Error('Adjudication krever eksplisitt begrunnelse.');
  if (disagreements.some(item => item.disagreement) && disagreements.some(item => responses[item.itemId] === null || responses[item.itemId] === undefined)) throw new Error('Alle konfliktitems mÃ¥ ha eksplisitt consensus-respons.');
  return {
    appraisalId,
    status: 'resolved',
    resolutionMethod: method,
    resolvedBy: reviewer,
    resolvedAt: new Date().toISOString(),
    disagreements,
    consensusResponses: { ...responses },
    proposedResponses: { ...responses },
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
  consensusResponses?: Record<string, string | number | boolean | null>,
  rationale = '',
): ResolvedAppraisal {
  const comparison = calculateDisagreement(reviews);
  const proposedResponses = consensusResponses ?? {};
  if (method === 'consensus' && Object.keys(proposedResponses).length === 0 && comparison.requiresArbitration) throw new Error('Consensus krever eksplisitte valgte svar.');
  return resolveAppraisal(appraisalId, reviewer, comparison.items, method, proposedResponses, rationale);
}


