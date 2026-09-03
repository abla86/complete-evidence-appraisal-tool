# Repository consolidation and migration matrix

**Canonical repository:** `abla86/complete-evidence-appraisal-tool`
**Source repository under consolidation:** `abla86/evidence-appraisal-tool`
**Decision date:** 2026-09-03

## Rule
The complete-evidence-appraisal-tool repository is the only canonical application. Existing functionality is not copied when an equivalent implementation already exists. Standalone modules remain standalone repositories and are integrated through explicit contracts.

## Migration matrix

| Capability found in old repo | Main status | Decision |
|---|---|---|
| AMSTAR-2 | Implemented in main assessment engines/registry | Do not duplicate |
| CASP | Implemented in main registry/engines | Do not duplicate |
| JBI qualitative | Implemented in main JBI data/engine | Do not duplicate |
| AGREE II | Implemented in main assessment engines/registry | Do not duplicate |
| GRADE | Implemented in main assessment engines/registry | Do not duplicate |
| RoB 2 | Implemented in main assessment engines/tests | Do not duplicate |
| ROBINS-I | Present in main methodology/engine coverage | Do not duplicate |
| MMAT | Present in main instrument registry | Do not duplicate |
| QUADAS-2 | Present in main registry | Do not duplicate |
| CFIR 2.0 | Present in main registry and assessment engine | Do not duplicate |
| KTA | Present in main registry/engine | Do not duplicate |
| RE-AIM / Proctor outcomes | Present in main instrument registry | Do not duplicate |
| PRISMA | Present in main methodology/instrument layer | Do not duplicate |
| Document analysis | Main has documentAnalysisService/documentParserService/research-engine gateway | Do not duplicate |
| Bibliography import | Main has referenceImportService/referenceHubService | Do not duplicate |
| Evidence verification/provenance | Main has source-record/reference integrity/evidence bridge services | Do not duplicate |
| Universal appraisal session | Main has universalAppraisalService and workflow bridge | Canonical implementation |
| Methodology/version registry | Main has masterRegistry and methodology controls | Do not duplicate |
| Research workflow | Main has researchWorkflowService/API/routes/store | Do not duplicate |
| Research integrity gates | Main has integrity/methodology/workflow gates | Do not duplicate |
| Screening/data extraction | Main has workflow/evidence foundation coverage; verify UI linkage separately | Integration gap, not blind copy |
| Dual review/consensus | Main has dual-review types/services/components | Do not duplicate; verify end-to-end linkage |
| Inter-rater reliability | Main has inter-rater support/tests | Do not duplicate |
| Assessment export/report factory | Main has export/report services | Do not duplicate |
| Implementation persistence (CFIR/KTA database persistence + audit) | **Not found as an equivalent persistent implementation in main** | Requires deliberate TypeScript/server migration before old repo is archived |
| Implementation validation | Main has CFIR/KTA methodology/engine support, but old repo contains a dedicated full validation service | Compare rules and migrate only missing validation semantics |
| Implementation export (CSV/XLSX/DOCX/PDF) | Main has general export/PDF infrastructure, but old implementation-specific exporter is not equivalent | Migrate missing implementation-specific export behaviour into existing export layer |
| Research operations persistence/configuration/access | Old repo has dedicated backend models/endpoints; no equivalent full persistent backend found in main | Requires deliberate migration, not deletion |
| Research protocol/reviewer decision/consensus/PRISMA event persistence | Old repo has dedicated persistence models; main has workflow/audit concepts but not the same persistent backend | Requires deliberate migration |
| Access/reviewer audit persistence | Old repo has dedicated backend entities | Requires deliberate migration |
| Old .NET backend/API | Parallel application architecture | Do not copy as a second backend |
| Old React frontend | Parallel application architecture | Do not copy as a second frontend |
| Old tests | Many tests validate capabilities not yet fully covered in main | Port test intent/cases into main after the corresponding canonical implementation exists |
| CI/security files | Main has its own CI/security pipeline | Do not duplicate old pipeline |

## Standalone arms — KEEP

### academic-research-engine
Standalone research/search engine. Keep as its own repository and consume through the main repository's research-engine gateway/contract.

### research-privacy-inspector
Standalone privacy/metadata/accessibility inspection module. Keep as its own repository and consume through an explicit adapter/contract.

## Repositories that are not evidence-appraisal duplicates
Other projects under `abla86` were not classified as duplicate evidence-appraisal applications merely because they are active. They remain untouched unless separately identified as an evidence-appraisal component.

## Archive gate for evidence-appraisal-tool

Do **not** archive until all rows marked "Requires deliberate migration" are either:
1. implemented in the canonical main repository and tested, or
2. explicitly rejected as obsolete/non-canonical with the reason recorded.

After that gate is satisfied, `evidence-appraisal-tool` should be archived rather than kept as a second active development target.

## Current conclusion

The old repository is a substantial earlier implementation, not merely dead code. The main repository already contains most of its methodological surface, but the old repository contains additional **persistent research/implementation workflow functionality** that must not be lost. Those pieces are the remaining migration targets.

## Consolidated deferred / removed material

This section is the single review register for material intentionally kept outside the canonical Complete Evidence application. It replaces separate ecosystem/lab notes.

### Excluded from Complete Evidence

- Game Lab / developer-portfolio navigation: unrelated to evidence appraisal; not part of the application.
- Warroom/security-lab UI and operational tooling: belongs to the separate Security project.
- Experimental/offensive/internal security functionality: must not be copied into Complete Evidence.
- Duplicate application frontends/backends from older evidence repositories: do not maintain a second application architecture.
- Duplicate CI/security pipelines from source repositories: use the canonical repository pipeline only.

### Retained as standalone extensions

- academic-research-engine: standalone research/search capability; integration only through the existing research-engine gateway/contract.
- research-privacy-inspector: standalone inspection capability; integration only through an explicit adapter/contract.

### Deferred migration items that must not be deleted

These remain outside the main application until deliberately implemented and tested:

- persistent implementation workflow for CFIR/KTA;
- implementation-specific validation semantics not already covered by the canonical engine;
- implementation-specific CSV/XLSX/DOCX/PDF export behaviour;
- persistent research operations/configuration/access;
- persistent protocol/reviewer decision/consensus/PRISMA events;
- persistent access/reviewer audit records.

### Cleanup rule

No code is deleted merely because it is old or duplicated-looking. A candidate is removed from the application only when:
1. it is proven unrelated to the evidence-appraisal domain, or
2. an equivalent canonical implementation exists and the old implementation has no unique required behaviour.

All remaining migration work is tracked in this file. This is the only consolidation/deferred-work register.