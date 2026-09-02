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
  const unique = [...new Set(reviewers)].slice(0, Math.max(2, config.minReviewers));
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
  const ids = [...new Set([...Object.keys(a.responses), ...Object.keys(b.responses)])];
  const items: ReviewDisagreement[] = ids.map(itemId => {
    const left = a.responses[itemId] ?? null;
    const right = b.responses[itemId] ?? null;
    return { itemId, reviewer1Score: left, reviewer2Score: right, disagreement: JSON.stringify(left) !== JSON.stringify(right) };
  });
  const comparable = items.length || 1;
  const overallDisagreement = items.filter(item => item.disagreement).length / comparable;
  return { overallDisagreement, items, requiresArbitration: overallDisagreement >= threshold };
}

export function resolveConflict(
  appraisalId: string,
  reviews: ReviewInstance[],
  resolvedBy: string,
  method: DualReviewConfig['arbitrationMethod'],
): ResolvedAppraisal {
  const comparison = calculateDisagreement(reviews, 1);
  const consensusResponses: Record<string, string | number | boolean | null> = {};
  const ids = [...new Set(reviews.flatMap(review => Object.keys(review.responses)))];
  for (const id of ids) {
    const values = reviews.map(review => review.responses[id] ?? null);
    if (method === 'autoResolve') {
      const counts = new Map(values.map(value => [JSON.stringify(value), 0]));
      values.forEach(value => counts.set(JSON.stringify(value), (counts.get(JSON.stringify(value)) ?? 0) + 1));
      const winner = [...counts.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];
      consensusResponses[id] = winner === undefined ? null : JSON.parse(winner);
    } else {
      consensusResponses[id] = values[0] ?? null;
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
