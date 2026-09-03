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

export function calculateDisagreement(reviews: ReviewInstance[], threshold = 0.3): ReviewComparison {
  if (reviews.length < 2) throw new Error('Dual review krever minst to vurderinger.');
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new Error('Konfliktterskel må være mellom 0 og 1.');
  const [a, b] = reviews;
  if (a.studyId !== b.studyId || a.instrumentId !== b.instrumentId) {
    throw new Error('Reviewerinstansene må gjelde samme studie og instrument.');
  }
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
  if (reviews.some(review => review.appraisalId !== appraisalId)) throw new Error('Alle reviewerinstanser må tilhøre samme appraisal.');
  if (reviews.some(review => review.status !== 'completed' && review.status !== 'disputed')) {
    throw new Error('Alle reviewerinstanser må være ferdige før konfliktløsning.');
  }

  const comparison = calculateDisagreement(reviews, 1);
  const consensusResponses: Record<string, string | number | boolean | null> = {};
  const proposedResponses: Record<string, string | number | boolean | null> = {};
  const ids = [...new Set(reviews.flatMap(review => Object.keys(review.responses)))].sort();

  for (const id of ids) {
    const values = reviews.map(review => review.responses[id] ?? null);
    const distinct = [...new Set(values.map(value => JSON.stringify(value)))];

    if (distinct.length <= 1) {
      consensusResponses[id] = values[0] ?? null;
      continue;
    }

    const counts = new Map<string, number>();
    values.forEach(value => {
      const key = JSON.stringify(value);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    const proposedKey = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (proposedKey !== undefined) proposedResponses[id] = JSON.parse(proposedKey);
    consensusResponses[id] = null;
  }

  const hasDisagreements = comparison.items.some(item => item.disagreement);
  if (!hasDisagreements) {
    return {
      appraisalId,
      status: 'resolved',
      resolutionMethod: method,
      resolvedBy,
      resolvedAt: new Date().toISOString(),
      disagreements: [],
      consensusResponses,
    };
  }

  return {
    appraisalId,
    status: 'pendingAdjudication',
    resolutionMethod: method,
    resolvedBy,
    resolvedAt: new Date().toISOString(),
    disagreements: comparison.items.filter(item => item.disagreement),
    consensusResponses,
    proposedResponses,
  };
}
