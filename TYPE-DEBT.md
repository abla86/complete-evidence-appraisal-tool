# TypeScript type-debt inventory

The production build is currently separated from the TypeScript audit because the codebase contains accumulated type inconsistencies that should be repaired rather than hidden.

The first CI audit identified issues in:

- `src/components/ArticleDetailView.tsx`
- `src/components/HelpAndExamplesView.tsx`
- `src/components/MetaResearchLabView.tsx`
- `src/components/PeerReviewStudioView.tsx`
- `src/components/UniversalAppraisalView.tsx`
- `src/components/WhoValidationHubView.tsx`
- `src/components/guidance/YggdrasilVisualizer.tsx`
- `src/services/appraisalResultService.ts`
- `src/services/buildSourceRecord.ts`
- `src/services/caseWorkflowService.test.ts`
- `src/services/documentClassifierService.ts`
- `src/services/jbiValidationService.ts`
- `src/services/methodologyContractTests.ts`
- `src/services/referenceValidationService.ts`
- `src/services/researchRetrievalService.ts`
- `test/referenceHubDomain.test.ts`

The dominant problems are stale type contracts, mojibake UTF-8 literals, missing test dependencies, and API/service signatures that have drifted.

## Repair rule

Do not silence these errors with `any`, blanket `@ts-nocheck`, or compiler suppression. Repair the source contract or data model and add a regression test where behavior is affected.

## Completion criterion

The CI `Typecheck audit` step should eventually be converted back to a blocking gate with zero diagnostics.
