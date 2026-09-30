import { RbacService, type UserSession } from './rbacService';
import type {
  DualReviewConfig,
  ReviewComparison,
  ReviewDisagreement,
  ReviewInstance,
  ResolvedAppraisal,
} from '../types/researchWorkflow';

export type { ReviewComparison } from '../types/researchWorkflow';

export interface ReviewAuthorizationContext {
  session: UserSession;
  projectId: string;
}

export function assertReviewPermission(context: ReviewAuthorizationContext, permission: 'assign' | 'conduct' | 'adjudicate' | 'signOff'): void {
  if (!RbacService.authorizeProjectAccess(context.session, context.projectId)) {
    throw new Error(`Brukeren har ikke tilgang til prosjektet: ${context.projectId}`);
  }
  const required: Record<typeof permission, Parameters<typeof RbacService.checkPermission>[1]> = {
    assign: 'canConductDualReview',
    conduct: 'canConductAppraisal',
    adjudicate: 'canAdjudicateDisagreements',
    signOff: 'canSignOffConsensus',
  };
  if (!RbacService.checkPermission(context.session.role, required[permission])) {
    throw new Error(`Rollen ${context.session.role} har ikke tillatelse til handlingen: ${permission}`);
  }
}

export function assertReviewerIdentity(session: UserSession, reviewerId: string): void {
  if (!reviewerId.trim()) throw new Error('Reviewer ID er påkrevd.');
  if (session.role === 'admin' || session.role === 'lead_reviewer' || session.role === 'adjudicator') return;
  if (session.userId !== reviewerId) throw new Error('En reviewer kan bare endre sin egen review-instans.');
}


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




export function assignReviewsAuthorized(args: {
  appraisalId: string;
  studyId: string;
  instrumentId: string;
  reviewers: string[];
  config: DualReviewConfig;
  authorization: ReviewAuthorizationContext;
}): ReviewInstance[] {
  assertReviewPermission(args.authorization, 'assign');
  return assignReviews(args.appraisalId, args.studyId, args.instrumentId, args.reviewers, args.config);
}

export function submitReviewAuthorized(args: {
  review: ReviewInstance;
  authorization: ReviewAuthorizationContext;
}): ReviewInstance {
  assertReviewPermission(args.authorization, 'conduct');
  assertReviewerIdentity(args.authorization.session, args.review.reviewerId);
  if (args.review.status === 'completed' && !args.review.completedAt) {
    throw new Error('En completed review må ha completedAt.');
  }
  return { ...args.review };
}

export function resolveReviewAuthorized(args: {
  appraisalId: string;
  reviewer: string;
  disagreements: ReviewDisagreement[];
  method: DualReviewConfig['arbitrationMethod'];
  responses: Record<string, string | number | boolean | null>;
  rationale: string;
  authorization: ReviewAuthorizationContext;
}): ResolvedAppraisal {
  assertReviewPermission(args.authorization, 'adjudicate');
  if (args.authorization.session.userId !== args.reviewer && args.authorization.session.role !== 'admin' && args.authorization.session.role !== 'lead_reviewer') {
    throw new Error('Adjudikator-identiteten samsvarer ikke med innlogget bruker.');
  }
  return resolveAppraisal(args.appraisalId, args.reviewer, args.disagreements, args.method, args.responses, args.rationale);
}
