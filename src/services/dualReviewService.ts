import type {
  DualReviewConfig,
  ReviewComparison,
  ReviewDisagreement,
  ReviewInstance,
  ResolvedAppraisal,
} from '../types/researchWorkflow';

export function assignReviews(
  appraisalId: string,
  studyId: string,
  instrumentId: string,
  reviewers: string[],
  config: DualReviewConfig,
): ReviewInstance[] {
  const unique = [...new Set(reviewers.filter(Boolean))].slice(0, Math.max(2, config.minReviewers));
  if (unique.length < config.minReviewers) throw new Error(`Trenger minst ${config.minReviewers} vurderere.`);
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

export function calculateDisagreement(reviews: ReviewInstance[], threshold = 0.3): ReviewComparison {
  if (reviews.length < 2) throw new Error('Dual review krever minst to vurderinger.');
  const [a, b] = reviews;
  const ids = [...new Set([...Object.keys(a.responses), ...Object.keys(b.responses)])].sort();
  const items: ReviewDisagreement[] = ids.map(itemId => {
    const left = a.responses[itemId] ?? null;
    const right = b.responses[itemId] ?? null;
    return {
      itemId,
      reviewer1Score: left,
      reviewer2Score: right,
      disagreement: JSON.stringify(left) !== JSON.stringify(right),
    };
  });
  const overallDisagreement = items.length === 0
    ? 0
    : items.filter(item => item.disagreement).length / items.length;
  return {
    overallDisagreement,
    items,
    requiresArbitration: overallDisagreement >= threshold,
  };
}

export function resolveConflict(
  appraisalId: string,
  reviews: ReviewInstance[],
  resolvedBy: string,
  method: DualReviewConfig['arbitrationMethod'],
): ResolvedAppraisal {
  if (reviews.length < 2) throw new Error('Konfliktløsning krever minst to vurderinger.');
  if (!resolvedBy.trim()) throw new Error('Konfliktløsning krever en navngitt beslutningstaker.');

  const comparison = calculateDisagreement(reviews, 1);
  const consensusResponses: Record<string, string | number | boolean | null> = {};
  const ids = [...new Set(reviews.flatMap(review => Object.keys(review.responses)))].sort();

  for (const id of ids) {
    const values = reviews.map(review => review.responses[id] ?? null);
    const distinct = [...new Set(values.map(value => JSON.stringify(value)))];

    if (distinct.length <= 1) {
      consensusResponses[id] = values[0] ?? null;
      continue;
    }

    // Human adjudication is required for disagreements. "autoResolve" may only
    // propose the majority value; it must never silently become the final result.
    if (method === 'autoResolve') {
      const counts = new Map<string, number>();
      values.forEach(value => {
        const key = JSON.stringify(value);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
      const proposed = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      consensusResponses[id] = proposed === undefined ? null : JSON.parse(proposed);
    } else {
      // Consensus/third-reviewer resolution stores the first reviewer only as a
      // provisional value; the UI should require explicit adjudicator confirmation.
      consensusResponses[id] = null;
    }
  }

  return {
    appraisalId,
    status: 'resolved',
    resolutionMethod: method,
    resolvedBy,
    resolvedAt: new Date().toISOString(),
    disagreements: comparison.items.filter(item => item.disagreement),
    consensusResponses,
  };
}
