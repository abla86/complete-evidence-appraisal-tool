# Architecture and Extensibility

Evidence Appraisal Tool is treated as a set of explicit application capabilities with stable boundaries rather than one monolithic workflow.

## Capability boundaries

- Document ingestion and validation
- Text extraction and document processing
- Metadata and source identification
- Document/study classification
- Research search and search-history capture
- Methodology/instrument registry and version control
- Instrument-specific appraisal engines
- Evidence-anchor and reviewer records
- Validation/reference cases
- Persistence and audit history
- Reporting/export

Each capability should expose a clear contract to adjacent layers. Presentation code must not contain authoritative appraisal algorithms.

## Extension rule

Adding a new appraisal instrument should primarily require a new instrument definition, its rules/engine and validation cases. Existing instrument engines must not be modified unless shared infrastructure genuinely changes.

Adding a new document source should primarily require a source adapter and provenance mapping rather than changes throughout the appraisal domain.

## Source of truth

Instrument metadata and version information must have one authoritative application registry. Duplicate scoring rules, duplicated checklists and conflicting constants are defects.

## Safe change rule

A refactor is acceptable only when existing supported behaviour remains intact or a change is explicitly documented. Remove dead code only after its consumers have been checked.

## Testing boundary

- Unit tests verify deterministic domain rules.
- Integration tests verify contracts between modules and persistence.
- End-to-end tests verify user-visible workflows.
- Reference validation verifies implementation against legitimate external reference material.

Passing a build is not evidence that an appraisal methodology is correct; methodology correctness requires source/version verification and tests of the implemented rules.
