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

export function calculatePRISMA(stages: PRISMAStages): PRISMAFlow {
  return {
    identification: {
      recordsFromDatabases: stages.databases,
      recordsFromOtherSources: stages.otherSources,
      totalIdentified: stages.totalIdentified,
      duplicatesRemoved: stages.duplicatesRemoved,
    },
    screening: {
      recordsScreened: stages.screened,
      recordsExcluded: stages.screeningExcluded,
    },
    eligibility: {
      fullTextsAssessed: stages.fullTextsAssessed,
      fullTextsExcluded: stages.fullTextsExcluded,
    },
    included: {
      studiesFinalSynthesis: stages.finalIncluded,
      studiesQualityAssessment: stages.qualityAssessed,
    },
  };
}

export function generatePRISMAMermaid(flow: PRISMAFlow): string {
  const excludedEligibility = flow.eligibility.fullTextsExcluded.reduce((sum, item) => sum + item.count, 0);
  return [
    'flowchart TD',
    `A[Identified: ${flow.identification.totalIdentified}] --> B[After duplicates: ${flow.identification.totalIdentified - flow.identification.duplicatesRemoved}]`,
    `B --> C[Screened: ${flow.screening.recordsScreened}]`,
    `C --> D[Excluded at screening: ${flow.screening.recordsExcluded}]`,
    `C --> E[Full text assessed: ${flow.eligibility.fullTextsAssessed}]`,
    `E --> F[Excluded at eligibility: ${excludedEligibility}]`,
    `E --> G[Included: ${flow.included.studiesFinalSynthesis}]`,
    `G --> H[Quality assessed: ${flow.included.studiesQualityAssessment}]`,
  ].join('\n');
}
