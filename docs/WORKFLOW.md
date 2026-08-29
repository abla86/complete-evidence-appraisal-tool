# Research workflow

This document describes the recommended current workflow while preserving the distinction between historical/legacy functionality and the current recommended path.

## 1. Create a research project

Record the research question, protocol context, study-design expectations and project metadata.

## 2. Import and identify evidence

Import references/documents using the supported formats. Preserve source identity and provenance. Duplicate candidates are flagged rather than silently deleted.

## 3. Establish study design

The reviewer confirms the relevant study design before selecting an appraisal instrument.

## 4. Select the exact methodology

Select the specific instrument, variant and version. A family label such as "CASP" or "JBI" is not sufficient when the tool is study-design/version specific.

Existing assessments are bound to the exact methodology version used. New versions are added separately and do not silently replace historical assessments.

## 5. Appraise

Complete instrument-specific response options and record rationale plus evidence location. The application must not use a generic response model or generic quality score across all instruments.

## 6. Evidence verification

Document-analysis and AI-assisted features may identify candidate passages. The researcher verifies the original source. "Evidence not located" is not automatically treated as "No".

## 7. Independent review

Where the project requires it, a second reviewer performs an independent assessment. The system preserves both assessments and identifies disagreements.

## 8. Consensus

Resolve disagreements explicitly and record the consensus decision and rationale. Do not overwrite the original reviewer decisions.

## 9. Finalisation

Finalisation creates an integrity-preserving snapshot. Reopening requires an explicit reason and should create an audit event where the relevant persistence/audit feature is implemented.

## 10. Export and reproducibility

Record:

- exact methodology ID/version
- application Git commit or release
- source-document identity/hash where available
- reviewer decisions
- evidence locations
- verification status
- consensus decisions
- configuration and relevant workflow choices
- known limitations.

## Method-specific boundaries

### Critical appraisal

AMSTAR 2, CASP, JBI and AGREE II are not interchangeable. Each uses its own instrument structure and interpretation.

### Risk of bias

RoB 2 is a risk-of-bias methodology for randomised trials. Design variants must not be mixed. The repository's current RoB 2 workflow is explicitly a prototype where the complete algorithm has not been reproduced.

### Certainty of evidence

GRADE is used for certainty of a body of evidence/outcome and is not a universal quality score.

### Reporting

PRISMA 2020 is a reporting guideline, not a critical-appraisal score.

### Implementation

CFIR 2.0 and KTA are implementation/knowledge-translation frameworks and must not be represented as generic validated quality scores.

## Historical and legacy functionality

Legacy code, historical methodology versions and previous workflow components must not be removed solely because they are not visible in the recommended current UI.

Before removing a legacy component, check whether it:

- is referenced by persisted data
- is required for compatibility
- is used by another module
- represents a historical methodology/version
- is documented as part of the project's development history
- is required by tests or existing API consumers.

Prefer deprecation and explicit status labels over silent deletion.

## Release gate

A release must not describe an instrument as verified if its exact source/version, implementation fidelity and tests have not been checked.

Software tests establish software behaviour for the tested scenarios; they do not establish scientific or clinical validity.
