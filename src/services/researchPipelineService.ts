/**
 * Shared research-pipeline contracts and deterministic helpers.
 *
 * This is intentionally orchestration-only: it does not replace JBI/CASP/
 * AMSTAR/AGREE/RoB/GRADE engines. It keeps the superprogram extensible by
 * expressing the links between modules without collapsing their semantics.
 */

export type PipelineStage =
  | 'SEARCH'
  | 'IMPORT'
  | 'REFERENCE_HUB'
  | 'DUPLICATE_REVIEW'
  | 'FULLTEXT'
  | 'SOURCE_RECORD'
  | 'SCREENING'
  | 'PICO'
  | 'APPRAISAL'
  | 'DUAL_REVIEW'
  | 'CONSENSUS'
  | 'EXTRACTION'
  | 'SYNTHESIS'
  | 'CERTAINTY'
  | 'PRISMA'
  | 'WRITING'
  | 'EXPORT';

export interface PipelineLink {
  id: string;
  from: PipelineStage;
  to: PipelineStage;
  recordIds: string[];
  createdAt: string;
  actor: string;
  rationale?: string;
}

export interface PipelineSnapshot {
  currentStage: PipelineStage;
  links: PipelineLink[];
  blocked: boolean;
  blockingReasons: string[];
}

export const DEFAULT_PIPELINE: PipelineStage[] = [
  'SEARCH', 'IMPORT', 'REFERENCE_HUB', 'DUPLICATE_REVIEW', 'FULLTEXT',
  'SOURCE_RECORD', 'SCREENING', 'PICO', 'APPRAISAL', 'DUAL_REVIEW',
  'CONSENSUS', 'EXTRACTION', 'SYNTHESIS', 'CERTAINTY', 'PRISMA', 'WRITING', 'EXPORT'
];

export function createPipelineLink(
  from: PipelineStage,
  to: PipelineStage,
  recordIds: string[],
  actor: string,
  rationale?: string,
): PipelineLink {
  return {
    id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    from,
    to,
    recordIds: [...recordIds],
    createdAt: new Date().toISOString(),
    actor,
    rationale,
  };
}

export function buildPipelineSnapshot(
  currentStage: PipelineStage,
  links: PipelineLink[],
  blockingReasons: string[] = [],
): PipelineSnapshot {
  return {
    currentStage,
    links: [...links],
    blocked: blockingReasons.length > 0,
    blockingReasons: [...blockingReasons],
  };
}

export function nextPipelineStage(stage: PipelineStage): PipelineStage | null {
  const index = DEFAULT_PIPELINE.indexOf(stage);
  return index >= 0 && index < DEFAULT_PIPELINE.length - 1 ? DEFAULT_PIPELINE[index + 1] : null;
}
