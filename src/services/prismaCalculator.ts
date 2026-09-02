import type { PRISMAFlow } from '../types/researchWorkflow';

export interface PRISMAStages {
  databases: number;
  otherSources: number;
  totalIdentified: number;
  duplicatesRemoved: number;
  screened: number;
  screeningExcluded: number;
  fullTextsAssessed: number;
  fullTextsExcluded: Array<{ reason: string; count: number }>;
  finalIncluded: number;
  qualityAssessed: number;
}

function nonNegativeInteger(value: number): number {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

export function calculatePRISMA(stages: PRISMAStages): PRISMAFlow {
  const databases = nonNegativeInteger(stages.databases);
  const otherSources = nonNegativeInteger(stages.otherSources);
  const totalIdentified = nonNegativeInteger(stages.totalIdentified);
  const duplicatesRemoved = Math.min(nonNegativeInteger(stages.duplicatesRemoved), totalIdentified);
  const screened = Math.min(nonNegativeInteger(stages.screened), totalIdentified - duplicatesRemoved);
  const screeningExcluded = Math.min(nonNegativeInteger(stages.screeningExcluded), screened);
  const fullTextsAssessed = Math.min(nonNegativeInteger(stages.fullTextsAssessed), screened - screeningExcluded);
  const fullTextExclusions = stages.fullTextsExcluded
    .filter(item => item.reason.trim())
    .map(item => ({ reason: item.reason.trim(), count: nonNegativeInteger(item.count) }));
  const finalIncluded = Math.min(
    nonNegativeInteger(stages.finalIncluded),
    Math.max(0, fullTextsAssessed - fullTextExclusions.reduce((sum, item) => sum + item.count, 0)),
  );
  const qualityAssessed = Math.min(nonNegativeInteger(stages.qualityAssessed), finalIncluded);

  return {
    identification: {
      recordsFromDatabases: databases,
      recordsFromOtherSources: otherSources,
      totalIdentified,
      duplicatesRemoved,
    },
    screening: {
      recordsScreened: screened,
      recordsExcluded: screeningExcluded,
    },
    eligibility: {
      fullTextsAssessed,
      fullTextsExcluded: fullTextExclusions,
    },
    included: {
      studiesFinalSynthesis: finalIncluded,
      studiesQualityAssessment: qualityAssessed,
    },
  };
}

export function generatePRISMAMermaid(flow: PRISMAFlow): string {
  const afterDuplicates = Math.max(
    0,
    flow.identification.totalIdentified - flow.identification.duplicatesRemoved,
  );
  const screenedIncluded = Math.max(
    0,
    flow.screening.recordsScreened - flow.screening.recordsExcluded,
  );
  const eligibilityExcluded = flow.eligibility.fullTextsExcluded.reduce((sum, item) => sum + item.count, 0);

  return [
    'flowchart TD',
    `A[Records identified: ${flow.identification.totalIdentified}] --> B[Records after duplicates: ${afterDuplicates}]`,
    `B --> C[Records screened: ${flow.screening.recordsScreened}]`,
    `C --> D[Records excluded: ${flow.screening.recordsExcluded}]`,
    `C --> E[Reports sought/full-text stage: ${screenedIncluded}]`,
    `E --> F[Full texts assessed: ${flow.eligibility.fullTextsAssessed}]`,
    `F --> G[Full texts excluded: ${eligibilityExcluded}]`,
    `F --> H[Studies included: ${flow.included.studiesFinalSynthesis}]`,
    `H --> I[Studies quality assessed: ${flow.included.studiesQualityAssessment}]`,
  ].join('\n');
}
