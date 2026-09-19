# Research use boundary

## Purpose

Evidence Appraisal Tool is an advanced research-support application intended to support structured evidence appraisal and evidence-workflow activities. It is a research support system, not an automated substitute for methodological judgement.

## What the software may support

The application can support activities such as:

- bibliographic import and metadata handling;
- structured critical-appraisal workflows;
- evidence-location capture and traceability;
- candidate document-analysis findings that require researcher verification;
- reviewer comparison and conflict identification where implemented;
- versioned research-workflow records;
- exports and integrity markers where implemented.

The exact capabilities of a release must be verified against the corresponding application release/version and test results. Documentation must not be used as evidence that a feature exists if the implementation or tests do not support the claim.

## Researcher responsibility

The researcher remains responsible for:

- selecting the appropriate appraisal instrument;
- interpreting the source material;
- verifying candidate evidence;
- making methodological judgements;
- checking exported results;
- documenting deviations from the intended workflow;
- deciding whether a software release is suitable for a particular study.

Automated text analysis is advisory. A candidate match is not a methodological conclusion.

## Data boundary

Any deployment intended for general use should define its approved data boundary before processing sensitive research material. Do not upload identifiable participant information, patient information, confidential unpublished research data, credentials, access tokens, or other restricted information to an environment that has not been approved for that material.

If a research project involves personal data or other restricted research data, the data must be processed only within the institutionally approved research setup and according to the applicable data-management, privacy, security, and ethics requirements. The existence of technical security controls in the application does not by itself establish regulatory compliance for a particular study.

## Reproducibility

For research use, record at minimum:

1. exact application release/version;
2. appraisal-instrument/version used;
3. relevant application configuration;
4. input-data provenance;
5. material software changes made during the study;
6. test/verification results relevant to the release;
7. known limitations and deviations.

Do not rely on a mutable development state as the sole identifier of the software version used in a study.

## Prototype and validation status

The application may be functionally mature while still requiring formal methodological validation for a particular research use. Functional completeness does not imply methodological validation, clinical validation, medical-device certification, privacy compliance for arbitrary deployments, or scientific certification of appraisal results.

## Intellectual property

The application's licence remains the controlling statement for the author's original source code and documentation. Third-party libraries, frameworks, trademarks, and appraisal instruments remain subject to their respective rights and licences.
