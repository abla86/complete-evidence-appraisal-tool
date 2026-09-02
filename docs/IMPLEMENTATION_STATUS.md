# Evidence Appraisal implementation status

This file records implementation status without claiming remote verification that has not occurred.

## Implemented on main
- Evidence pipeline service and pipeline dashboard
- Universal appraisal session flow
- Universal dual-review panel alongside legacy JBI dual-review UI
- GRADE/CERQual assessment panel and appraisal-session linkage
- PDF annotation to academic evidence bridge
- Consolidated project export gate
- Persistent appraisal-session storage
- Reference Hub demo-record creation removed
- Existing hash-chained audit trail retained as canonical audit mechanism

## Verification state
- Local test baseline previously observed: 31/31 passed after commit `0c42559` and subsequent `ffb7e69`.
- Newer integration commits have not yet been remotely CI-verified.
- GitHub Actions workflow exists at `.github/workflows/ci.yml` and is configured for push/PR on `main`.
- As of this status update, GitHub reports no workflow run for the latest implementation commits.

## Remaining implementation work
- Complete UI-level end-to-end linkage across project state, dual review, GRADE/CERQual, PDF evidence, writing, and export.
- Complete true PDF text-selection/highlight experience if the current browser reader does not provide it natively.
- Add/expand integration tests for the new UI and persistence paths.
- Obtain a real GitHub Actions run and fix any TypeScript, lint, test, or build failures it exposes.

## Rule
No component is considered fully verified solely because a file, UI route, or service exists. Runtime and CI evidence are required before marking the feature verified.
