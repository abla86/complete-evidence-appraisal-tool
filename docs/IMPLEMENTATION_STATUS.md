# Evidence Appraisal implementation status

This document is deliberately evidence-based. A capability is marked **implemented** when the corresponding code exists in the canonical repository; it is marked **verified** only when the current local test/build evidence supports that claim.

## Canonical application

Repository: `abla86/complete-evidence-appraisal-tool`

The repository is the canonical application. Methodological appraisal, evidence intake, reference management, validation, workflow, audit/integrity, export and research-workflow components belong here when they are part of the Evidence research workflow.

Standalone extensions must connect through explicit contracts/adapters rather than importing private implementation details.

## Current local verification evidence

The latest local verification supplied from the canonical `main` working tree reports:

- TypeScript check: **0 errors**
- Automated tests: **56/56 passed**
- Production build: **successful**
- `git diff --check`: **successful**
- The production build emits a Vite chunk-size warning; this is a performance warning, not a build failure.

These results are local evidence. They do not by themselves establish clinical, methodological, security, or scientific validity of an appraisal result.

## Implemented capability surface

The current main tree contains the following canonical capability areas:

- Research intake and workflow
- Document parsing/classification and evidence extraction
- Reference import, canonical reference records and verification gates
- Methodology registry and version controls
- JBI, AMSTAR 2, AGREE II, CASP, RoB 2, GRADE and CERQual assessment engines
- Universal appraisal sessions
- Dual review and consensus workflow
- Evidence traceability and audit/integrity mechanisms
- PDF evidence bridge
- Reference/export infrastructure
- Privacy/accessibility inspection signals
- Research workflow APIs, stores and bridges
- Google OAuth integration
- Project/export gates

## Integration boundary

The old `abla86/evidence-appraisal-tool` repository remains a source repository for migration comparison. Its functionality must not be copied blindly into the canonical application.

The consolidation matrix identifies additional functionality that requires deliberate migration or an explicit decision before the old repository can be archived, including:

- implementation-specific persistence
- implementation-specific validation semantics
- implementation-specific export behaviour
- research operations persistence/configuration/access
- protocol/reviewer/consensus persistence
- access/reviewer audit persistence

Those items are **not marked as complete merely because related TypeScript services exist in main**.

## Release rule

A feature is not release-ready merely because its file, route, or UI exists.

Before release, the canonical repository must have:

1. a stable domain contract;
2. executable implementation;
3. unit/integration coverage appropriate to the risk;
4. successful TypeScript check;
5. successful automated tests;
6. successful production build;
7. clean Git integrity checks; and
8. documentation that does not claim functionality or verification that has not actually been demonstrated.

## Repository hygiene

Generated local verification output is not source code and must not be committed. Temporary files and test/build output belong in the local working environment and are ignored by Git.

The `patches/` directory is retained as historical development material until the associated migration history is no longer needed; it is not part of the runtime application.

## Important distinction

A green software test demonstrates that the tested software behaviour passed its assertions. It does **not** certify the correctness of a research study, the truth of extracted evidence, the validity of a citation, or the methodological quality of an appraisal without the required human and source verification.
