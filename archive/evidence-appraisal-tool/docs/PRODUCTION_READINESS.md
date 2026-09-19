# Production-readiness audit

## Purpose

This document distinguishes functionality verified in the current `main` branch from functionality that remains incomplete or requires deployment-specific validation. A feature is not marked implemented merely because example code or a design sketch exists.

## Verified in the current `main` branch

The repository currently contains implementation and/or tests for:

- AMSTAR 2 structural validation and critical-domain handling
- researcher-controlled AMSTAR 2 judgement with non-destructive advisory consistency checks
- CASP validation
- AGREE II calculations
- GRADE outcome-level workflow
- CFIR 2.0 and KTA implementation validation/persistence
- research-document extraction and candidate evidence location
- RIS import with DOI normalization and import fingerprints
- PRISMA flow-count/reconciliation validation
- screening workspace
- data-extraction workspace
- PICO/PECO framing
- duplicate-candidate detection
- reviewer conflict comparison
- Cohen's kappa calculation
- final dataset SHA-256 integrity marker
- export workflows
- backend and frontend automated tests
- GitHub Actions CI
- CodeQL analysis
- Dependabot configuration

These statements describe repository functionality. They do not constitute independent methodological validation, clinical validation, security certification or production-readiness certification.

## Explicitly incomplete or deployment-dependent

The following must not be described as completed production controls unless they are implemented and verified for the relevant deployment:

- authentication and authorization
- institution-managed identity and roles
- project-level access control/ownership
- true blind dual-review with server-side access isolation
- persistent encrypted research-document storage and retention controls
- production backup/restore and tested recovery
- complete database-backed concurrency enforcement for collaborative research records
- server/database enforcement of finalization and locking across the full appraisal model
- full access auditing of document views and exports
- independently verifiable immutable audit-chain integrity
- reviewer access tokens with expiry/revocation where required
- GDPR/retention/deletion workflows for a defined controller/processor arrangement
- Normen compliance or other institutional security certification
- security testing and deployment-specific threat assessment
- validated instrument content/version governance
- OCR for scanned documents
- persistent evidence-map/manual-evidence anchors
- SignalR or equivalent real-time collaboration; the current collaboration implementation uses polling
- automated AI appraisal decisions
- empirically calibrated AI confidence probabilities
- automated meta-analysis/forest-plot calculations unless independently validated
- full GRADE Summary-of-Findings generation from validated effect data

RoB 2 is currently represented as a prototype workflow in the application. It must not be described as an independently validated implementation of the official instrument merely because the workflow exists in code.

## Methodological corrections

1. **AMSTAR 2 is not a numerical total-score instrument.** Domain-level judgements and critical-domain reasoning must be preserved.
2. **Cohen's kappa is an agreement statistic, not proof of reviewer quality.** It should be reported with the paired-rating population and interpreted in context.
3. **GRADE is applied to outcomes/bodies of evidence, not as a generic single-study quality score.**
4. **PRISMA reconciliation is not the same as generating a complete PRISMA 2020 flow diagram.**
5. **A SHA-256 hash is an integrity marker, not a digital signature, legal certification or proof of scientific correctness.**
6. **Candidate evidence extraction is not appraisal.** The researcher remains responsible for the final judgement.
7. **Failure to locate evidence must never be mapped automatically to a negative methodological answer.**
8. **A generic AI confidence value must not be presented as an empirical probability of correctness without calibration evidence.**
9. **GDPR compliance cannot be asserted from code alone.** It depends on purpose, data categories, roles, legal basis, contracts, retention, security controls and governance.
10. **Blind review requires access isolation, not merely hiding another review in the user interface.**

## Production priorities

### P0 — before confidential research data

1. Authentication and authorization.
2. Project-level access control.
3. Encrypted persistent file storage and managed secrets.
4. Access auditing and security logging.
5. Server/database enforcement of finalization and locking.
6. Backup/restore strategy with tested recovery.
7. Security/privacy threat assessment.
8. Deployment-specific GDPR and institutional governance review.

### P1 — for a credible collaborative systematic-review workflow

1. True independent dual-review storage and release rules.
2. Consensus workflow with immutable pre-consensus records.
3. Evidence anchors linked to exact source locations.
4. Robust data-extraction schema for effect estimates and study characteristics.
5. Reviewer assignment and conflict management.
6. Reproducible screening and PRISMA data model.

### P2 — advanced research capabilities

1. OCR.
2. Additional appraisal instruments only after methodological and licensing review.
3. PRISMA 2020 flow-diagram export.
4. GRADE Summary-of-Findings generation.
5. Effect-size and forest-plot analysis with independently tested statistical routines.
6. Optional AI-assisted evidence retrieval with provenance and human verification.

## Release-language rule

Do not use phrases such as:

- "100% complete"
- "error-free"
- "GDPR compliant"
- "Normen compliant"
- "production ready"
- "gold standard"
- "scientifically validated"
- "more secure than commercial tools"

unless the claim is supported by corresponding tests, validation evidence, security assessment, governance decision or other verifiable evidence.

The repository should describe the current implementation, known limitations and verification status explicitly.