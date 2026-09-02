# Evidence Appraisal Superprogram

`complete-evidence-appraisal-tool` is the master application and the single system of record for the complete research-support workflow.

## Integrated capability map

### 1. Critical appraisal and methodological assessment
- AMSTAR 2
- CASP variants
- JBI qualitative
- AGREE II
- GRADE
- GRADE-CERQual
- RoB 2 workflow/prototype where explicitly scoped
- structured rationale and evidence-location capture
- instrument/study-design compatibility gating
- methodology integrity rules

### 2. Research workflow
- PICO / PECO project setup
- study/document classification
- screening and exclusion reasons
- duplicate-candidate detection without silent deletion
- structured data extraction
- PRISMA flow-count validation
- reviewer comparison
- inter-rater agreement and Cohen's kappa
- consensus/adjudication workflow

### 3. Evidence traceability and verification
- PDF, DOCX, TXT, HTML/HTM and XML/JATS inputs
- candidate evidence passages
- page/section/table/figure locations
- extraction/classification status
- SHA-256 fingerprints
- human verification
- verification history
- immutable assessment/version metadata where supported
- candidate evidence is never silently promoted to final evidence

### 4. Methodology and integrity control
- single methodology/source registry
- source hierarchy and authority metadata
- instrument version locking
- methodology audit view
- study-design gate
- method-integrity gate
- reference/golden-standard regression tests
- unit, integration and reference-test layers
- explicit distinction between software correctness and scientific/methodological validity

### 5. Reference and citation capability
The superprogram uses a shared reference boundary rather than constructing APA/legal references independently in UI components.

Supported reference-domain capability includes:
- APA 7 scholarly references
- Norwegian laws and regulations
- in-text citations
- DOI normalization and validation
- RIS import/export
- bibliographic metadata handling
- completeness and syntax validation
- explicit `VALIDATION_REQUIRED` versus `VALIDATED` semantics
- future online source verification only as an explicit capability

A syntactically valid reference is never labelled independently verified without an explicit verification step.

### 6. Metadata / DOI inspection
Local inspection may supply:
- title
- authors
- publication date
- journal
- volume/issue
- pages
- DOI
- ISSN
- description
- provenance (`citation-meta`, OpenGraph, schema.org, document or manual)

Detected metadata remains detection until independently verified.

### 7. Privacy inspection
The integrated privacy inspector is local-first and produces observable signals, not compliance certification.

It can inspect:
- external resources
- external hosts
- configured tracking indicators
- evidence explaining why a host was classified as a signal

`localOnlyAnalysis: true` is part of the module contract for the local inspector. A lack of detected signals is never presented as proof that a page has no tracking or data transfer.

### 8. Accessibility inspection
The integrated accessibility inspector provides lightweight local signals for:
- missing `alt`
- empty `alt`
- unnamed buttons
- H1 count
- main landmarks
- heading count

These are heuristic checks and must not be presented as WCAG conformance certification.

### 9. Collaboration and finalisation
- dual-review workflows
- reviewer conflict identification
- field-lock/presence controls where implemented
- consensus support
- finalisation state
- audit trail
- integrity markers
- reproducible project/version information

### 10. Implementation research
- CFIR 2.0 workflow support
- Knowledge-to-Action (KTA)
- implementation validation
- barriers/facilitators and implementation workflow data

## Reusable modules

The following capabilities may also be maintained as independently runnable projects for demonstration, testing or reuse:

- Research Privacy Inspector
- Reference Engine
- focused metadata/DOI inspector
- focused accessibility inspector
- future document/evidence modules

These are not competing products. Their implementation boundaries are designed to merge back into the superprogram without duplicating source-of-truth logic.

## Architectural rules

1. `complete-evidence-appraisal-tool` remains the master application.
2. Existing, richer domain implementations are preferred over simplified duplicate implementations.
3. Shared contracts are used when a capability is exposed both inside and outside the superprogram.
4. UI components must not silently recreate reference, scoring, integrity or classification business rules.
5. Automated findings remain candidates until a researcher verifies them where the workflow requires human judgement.
6. `Not found` is never automatically converted to `No`.
7. Instrument-specific scoring rules must be respected; no inappropriate universal quality score is invented.
8. Software tests do not constitute scientific certification.
9. Privacy signals are observations, not proof of GDPR compliance or non-compliance.
10. Accessibility signals are observations, not proof of WCAG conformance.
11. External/network verification must be explicit, disclosed and separately permissioned from local inspection.
