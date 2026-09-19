> **Update 2026-09-19:** all repositories listed below (including academic-research-engine and research-privacy-inspector) were merged with full history into `archive/<name>/` in this repository and the old repositories were deleted. Extract a folder with `git subtree split` if an independent repo is needed again.

# Repository consolidation — 2026-09-15

## Canonical evidence platform

`abla86/complete-evidence-appraisal-tool` is the canonical evidence/research application repository.

It already contains the consolidated TypeScript/Express/React application surface, methodology registry and engines, research workflow, evidence traceability, document analysis, reference workflows, dual review, PRISMA/reporting, audit/integrity services, tests, CI/security workflows and deployment infrastructure.

## Evidence repositories reviewed

| Repository | Decision | Reason |
|---|---|---|
| `abla86/evidence-appraisal-tool` | **Legacy source** | Parallel ASP.NET Core + React implementation. Its broad application surface is already represented in the canonical platform; copying it wholesale would create a second application stack. |
| `abla86/complete-evidence-appraisal-tool-` | **Separate extension arm** | Browser-extension/collector-oriented repository. It is related, but has a distinct deployment/runtime boundary and is not a second copy of the canonical application. |
| `abla86/evidence-practice-proof` | **Legacy/archived** | Historical evidence-practice work; not an active canonical application. |
| `abla86/implementation-trace` | **Legacy/archived** | Narrow implementation-tracing experiment superseded by the canonical research/implementation workflow. |
| `abla86/change-impact-mapper` | **Legacy/archived** | Narrow implementation/change experiment; retain concepts only where useful to the canonical implementation workflow. |
| `abla86/academic-research-engine` | **Standalone** | Reusable research-engine component with an independent lifecycle. Do not duplicate it into the main application. |
| `abla86/research-privacy-inspector` | **Standalone** | Reusable privacy-analysis component with an independent lifecycle. Do not duplicate it into the main application. |

## Action completed in this consolidation pass

`abla86/evidence-appraisal-tool` has been explicitly marked as a **LEGACY REPOSITORY** in its README, with the canonical repository identified. This prevents future development from splitting across two parallel evidence applications.

## Remaining source-only migration boundary

The historical ASP.NET Core repository contains implementation-specific persistence and validation code. The canonical application must implement any still-useful semantics in its own TypeScript architecture rather than copying the old backend wholesale.

Required before the legacy repository can be safely archived:

- persistent implementation assessment/audit semantics where still needed;
- implementation-specific validation semantics;
- implementation/project/reviewer/access persistence where required by the product scope;
- protocol/reviewer/consensus/PRISMA event persistence where required;
- canonical tests for each migrated behaviour.

## Safety rule

Do not delete historical source code merely because repository names overlap. Archive only after the useful behaviour has been migrated or explicitly rejected and the canonical build/test pipeline has passed.

## Current conclusion

The evidence family is **not** a case for maintaining two full application stacks. The canonical product is `complete-evidence-appraisal-tool`; `evidence-appraisal-tool` is now explicitly legacy; `complete-evidence-appraisal-tool-` remains a specialized extension arm; reusable research/privacy components remain standalone.
