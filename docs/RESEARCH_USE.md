# Research use and master-study boundary

## Purpose

Evidence Appraisal Tool is an advanced research-tool prototype intended to support structured evidence appraisal and evidence-workflow activities. It is a research support system, not an automated substitute for methodological judgement.

## What the software may support

The application can support activities such as:

- bibliographic import and metadata handling;
- structured critical-appraisal workflows;
- evidence-location capture and traceability;
- candidate document-analysis findings that require researcher verification;
- reviewer comparison and conflict identification where implemented;
- versioned research-workflow records;
- exports and integrity markers where implemented.

The exact capabilities of a release must be verified against the corresponding Git tag/commit and test results. Documentation must not be used as evidence that a feature exists if the implementation or tests do not support the claim.

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

The public demonstration environment is intended for public, synthetic, or otherwise non-sensitive material. Do not upload identifiable participant information, patient information, confidential unpublished research data, credentials, access tokens, or other restricted information to the public deployment, GitHub issues, pull requests, or example datasets.

If a master project or research project involves personal data or other restricted research data, the data must be processed only within the institutionally approved research setup and according to the applicable data-management, privacy, security, and ethics requirements. The existence of technical security controls in this repository does not by itself establish regulatory compliance for a particular study.

## Reproducibility

For research use, record at minimum:

1. repository URL;
2. exact Git commit SHA or release tag;
3. appraisal-instrument/version used;
4. relevant application configuration;
5. input-data provenance;
6. material software changes made during the study;
7. test/verification results relevant to the release;
8. known limitations and deviations.

Do not rely on a mutable `main` branch as the sole identifier of the software version used in a study.

## Prototype status

The application may be functionally mature while still being described as a **research prototype**. Functional completeness does not imply methodological validation, clinical validation, medical-device certification, GDPR compliance for arbitrary deployments, or scientific certification of appraisal results.

## Intellectual property

The repository's `LICENSE` remains the controlling statement for the author's original source code and documentation. Third-party libraries, frameworks, trademarks, and appraisal instruments remain subject to their respective rights and licences.
