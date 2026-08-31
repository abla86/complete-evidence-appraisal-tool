# Unified Research Architecture

The repository is the single application unit for evidence identification, critical appraisal, evidence traceability, research workflow, synthesis and implementation-oriented work.

## Integration rule

The uploaded JBI qualitative assessment project is treated as a source of reusable methodology and workflow functionality, not as a second application. Existing backend JBI validation remains authoritative for the API contract. The frontend exposes the same contract through the unified research workspace.

## Capability map

- Evidence ingestion and document analysis
- Reference import and duplicate detection
- Study-design confirmation and methodology selection
- Version-specific critical appraisal: AMSTAR 2, CASP, JBI qualitative 2017, AGREE II
- Risk-of-bias prototype workflows
- GRADE certainty and research synthesis support
- PRISMA workflow validation
- Dual-review and consensus workflows
- Evidence provenance and human verification
- Hash-based integrity markers and versioned audit records
- CFIR 2.0 and KTA implementation workflows
- Export and reproducibility support

## Safety boundaries

1. Automated classification produces candidate signals only.
2. Missing evidence is never silently converted to a negative response.
3. Instrument versions are explicit; historical assessments are not silently migrated.
4. AMSTAR 2 is not represented as a summed numerical quality score.
5. GRADE certainty is not inferred from a single appraisal result.
6. A software validation pass does not establish scientific or clinical validity.
7. The original research source remains authoritative.

## Extension boundary

A new instrument should add a versioned registry definition, a dedicated domain model/validation engine, reference-validation cases and a UI adapter. It should not introduce a second competing source of truth.

A new document source should add an ingestion adapter and provenance mapping without changing instrument rules.

## Current production blockers

The project remains a research-support application rather than a validated clinical or institutional research information system. Before handling real confidential research data in a deployed multi-user environment, authentication/authorization, deployment-specific secrets management, operational backups, retention controls, and institutional privacy/security review must be completed.
