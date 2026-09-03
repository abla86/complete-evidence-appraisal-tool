# Old evidence-appraisal-tool migration status

Source: abla86/evidence-appraisal-tool
Canonical target: abla86/complete-evidence-appraisal-tool

## Completed consolidation decision
The old repository is a parallel application architecture (ASP.NET Core + React). The canonical application already contains the majority of its appraisal and research surface. The old implementation must not be copied wholesale because that would create a second backend/frontend and duplicate methodology engines.

## Functionality retained in the canonical repository
- AMSTAR-2, CASP, JBI, AGREE II, GRADE and risk-of-bias methodology coverage
- CFIR/KTA and implementation methodology coverage
- document parsing/analysis
- reference import and reference hub
- evidence provenance/integrity
- universal appraisal sessions/workflow
- research workflow
- dual review/inter-rater support
- PRISMA
- reporting/export infrastructure
- audit and integrity services

## Source-only functionality requiring canonical implementation
The old repository contains source implementations/tests for:
- persistent implementation assessment/audit storage
- dedicated implementation validation semantics
- implementation-specific export behaviour
- persistent research-operation/project/reviewer/access records
- protocol/reviewer/consensus/PRISMA event persistence

These are migration requirements, not permission to retain the old application as a second active product.

## Archive rule
Do not archive the source repository until the source-only functionality above has been implemented or explicitly rejected in the canonical repository and the canonical build/tests have been run successfully.

## Standalone arms
academic-research-engine and research-privacy-inspector remain separate, reusable repositories. They are not to be duplicated into the main repository as independent copies.
