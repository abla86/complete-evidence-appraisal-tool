# Evidence Tool — System Architecture

## Overview

The application is designed as a connected evidence workflow:

```
Input
→ Evidence Intelligence
→ Screening
→ Full Text
→ Appraisal
→ Dual Review
→ Consensus
→ GRADE/CERQual
→ CFIR/KTA
→ Export
```

The architecture separates evidence retrieval and metadata verification from methodological appraisal. External metadata does not by itself establish peer review, study validity, or appraisal results.

## 1. Evidence Intelligence Layer

**Responsibility:** retrieve, verify, and normalize publication metadata.

Current capabilities include:

- DOI verification
- Crossref metadata retrieval
- Europe PMC search
- retraction/correction signalling
- metadata normalization
- explicit distinction between missing metadata and negative evidence
- explicit distinction between publication metadata and peer-review status

**Important rule:** a missing external record is not equivalent to an invalid publication.

## 2. Study Design Layer

**Responsibility:** identify study-design information and route the study toward an appropriate appraisal method.

The architecture supports:

- study-design signals from available metadata/text
- study-design gating
- manual review where automated classification is insufficient
- separation between classification evidence and the final methodological judgement

## 3. Instrument Registry Layer

**Responsibility:** maintain versioned definitions and rules for appraisal instruments.

The repository includes or is structured around instruments such as:

- AMSTAR 2
- AGREE II
- JBI
- CASP
- RoB 2
- ROBINS-I
- QUADAS-2
- MMAT
- GRADE
- CERQual

Instrument-specific rules must remain instrument-specific. For example, AMSTAR 2 should not be reduced to an unsupported overall numerical score.

## 4. Appraisal Layer

**Responsibility:** record and evaluate methodological appraisal items.

Core principles:

- each item is assessed explicitly
- absence of reported information is not automatically coded as a negative finding
- appraisal results remain distinct from automated evidence retrieval
- item-level provenance can be attached to the assessment

## 5. Dual Review Layer

**Responsibility:** support independent assessment by two reviewers followed by comparison and adjudication.

The workflow is:

```
Reviewer 1
     ↓
Reviewer 2
     ↓
Independent comparison
     ↓
Disagreement identification
     ↓
Adjudication
     ↓
Consensus
```

Reviewer 2 must have an independent assessment state. Copying Reviewer 1 responses into Reviewer 2 would invalidate inter-rater agreement calculations.

## 6. Screening Layer

**Responsibility:** manage evidence identification and screening.

Conceptual workflow:

```
Search
→ Results
→ Deduplication
→ Title/abstract screening
→ Full-text assessment
→ Included / Excluded
```

Screening status must remain separate from appraisal status.

## 7. Evidence Traceability Layer

**Responsibility:** preserve the relationship between an appraisal judgement and its supporting evidence.

Traceability may include:

- page
- section/paragraph
- text excerpt
- reviewer
- timestamp
- AI-assisted analysis, where applicable
- manual correction
- revision history

Automated suggestions must remain distinguishable from human decisions.

## 8. Implementation Layer

**Responsibility:** support implementation-oriented work using the repository's CFIR/KTA functionality.

The implementation workflow is separate from publication appraisal but can consume appropriately structured evidence outputs.

## 9. Export Layer

**Responsibility:** produce structured outputs from the same underlying assessment data.

Planned/available output categories include:

- appraisal data
- consensus data
- audit/traceability data
- implementation data
- JSON
- ZIP packages

Export should serialize existing state rather than recreate or reinterpret methodological judgements.

## 10. CI / Build Layer

The repository should be considered build-verified only after the configured CI pipeline has successfully completed the relevant checks.

Expected checks include:

- dependency installation
- lint
- build
- automated tests
- integration tests where configured

Architecture documentation does not itself constitute a successful build or methodological validation.

## Integration Principle

All layers must exchange explicit, typed data and preserve provenance. A result from one layer must not silently acquire a stronger meaning when passed to another layer.

The central design principle is:

```
Evidence retrieval
≠
Evidence appraisal
≠
Methodological validation
≠
Human research judgement
```

The system assists and structures research work; it does not manufacture external validation or replace the researcher's methodological responsibility.
