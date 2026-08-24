# Production-readiness audit

## Purpose

This document distinguishes functionality that is actually implemented in the repository from functionality proposed in earlier design discussions. A feature is not marked implemented merely because example code or a design sketch exists.

## Verified implemented on `feature/research-complete`

- AMSTAR 2 structural validation and critical-domain handling
- CASP validation
- AGREE II calculations
- GRADE outcome-level certainty workflow
- CFIR 2.0 and KTA validation/persistence
- Research-document extraction and candidate evidence location
- RIS import with DOI normalization and import fingerprints
- PRISMA reconciliation validation
- Screening workspace
- Data extraction workspace
- PICO/PECO framing
- Duplicate-candidate detection
- Reviewer conflict comparison
- Cohen's kappa calculation
- Final dataset SHA-256 integrity marker
- Export workflows and automated tests

## Explicitly NOT implemented

The following proposals from earlier design material must not be described as production functionality until implemented and tested end-to-end:

- Authentication and authorization
- True blind dual-review with isolated reviewer views
- Institution-managed identity and roles
- Persistent encrypted document storage
- OCR for scanned PDFs
- PDF text annotation/evidence anchors with persistent coordinates
- SignalR-based multi-user collaboration
- Field locking/presence management
- Immutable append-only audit storage with independently verifiable chain integrity
- Finalize-and-lock enforcement at the authorization/database layer
- Reviewer access tokens with expiry and revocation
- Full access auditing of document views/exports
- 3-2-1 backup, PITR and tested restore procedures
- GDPR/retention/deletion workflows validated for a specific controller/processor arrangement
- Normen compliance or other institutional security certification
- Automated AI appraisal decisions
- AI confidence scores that have been empirically calibrated
- RoB 2, ROBINS-I, QUADAS-2 or JBI as validated instruments unless their complete official algorithms/content and permissions are implemented
- CONSORT/STROBE/PRISMA reporting checklists beyond the currently implemented PRISMA reconciliation workflow
- Automated meta-analysis/forest-plot calculations
- Full GRADE Summary-of-Findings generation from validated effect data

## Methodological corrections

1. **AMSTAR 2 is not a numerical total-score instrument.** The application must preserve domain-level judgements and critical-domain reasoning.
2. **Cohen's kappa is an agreement statistic, not proof of reviewer quality.** It should be reported with the paired-rating population and interpreted in context.
3. **GRADE is applied to outcomes/bodies of evidence, not as a generic single-study quality score.**
4. **PRISMA reconciliation is not the same as generating the complete PRISMA 2020 flow diagram.**
5. **A SHA-256 hash is an integrity marker, not a digital signature, legal certification or proof of scientific correctness.**
6. **Candidate evidence extraction is not appraisal.** The researcher remains responsible for the final judgement.
7. **A machine failure to locate evidence must never be mapped to a negative methodological answer.**
8. **A generic `confidence` value from an AI model must not be presented as empirical probability of correctness without calibration evidence.**
9. **GDPR compliance cannot be asserted from code alone.** It depends on the processing purpose, data categories, roles, legal basis, contracts, retention, security controls and institutional governance.
10. **Blind review requires access isolation, not merely hiding another review in the UI.**

## Priority order for production work

### P0 — mandatory before confidential research data

1. Authentication and authorization.
2. Tenant/project-level access control.
3. Encrypted persistent file storage and managed secrets.
4. Access audit and security logging.
5. Finalize/lock enforcement on the server and database.
6. Backup/restore strategy with tested recovery.
7. Security and privacy threat model.
8. Deployment-specific GDPR/institutional governance review.

### P1 — mandatory for a credible collaborative systematic-review workflow

1. True independent dual-review storage and release rules.
2. Consensus workflow with immutable pre-consensus records.
3. Evidence anchors linked to exact source locations.
4. Robust data-extraction schema for effect estimates and study characteristics.
5. Reviewer assignment and conflict management.
6. Reproducible screening and PRISMA data model.

### P2 — advanced research capabilities

1. OCR.
2. RoB 2 / ROBINS-I / QUADAS-2 / JBI modules after methodological and licensing review.
3. PRISMA 2020 flow-diagram export.
4. GRADE Summary-of-Findings generation.
5. Effect-size and forest-plot analysis with independently tested statistical routines.
6. Optional AI evidence retrieval with provenance and human verification.

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

unless the claim is supported by a corresponding test, validation study, security assessment, governance decision or other verifiable evidence.

The repository should instead describe the current implementation, known boundaries and verification status explicitly.
