# Research and Evidence Workflow

This document defines the evidence-retrieval and traceability principles used by Evidence Appraisal Tool.

## Core workflow

1. Define the review or appraisal scope.
2. Search appropriate scholarly sources and record the database, query, filters, date and result count when available.
3. Deduplicate records using stable identifiers such as DOI, PMID and canonical URLs where available.
4. Screen records in a traceable sequence: title/abstract, then full text when available.
5. Extract study/document metadata without inventing missing fields.
6. Classify document type and study design before selecting an appraisal instrument.
7. Select an instrument that is appropriate for the confirmed design and purpose.
8. Preserve the instrument name, version and authoritative source used for the appraisal.
9. Record evidence anchors, reviewer rationale and verification status for appraisal decisions.
10. Preserve uncertainty, disagreement, missing material and contradictory evidence.

## Source and citation integrity

- Do not report a citation as verified unless the source metadata has actually been checked.
- Do not claim full-text review when only an abstract or metadata record was available.
- Distinguish peer-reviewed publications, preprints, guidelines, reports and other publication types.
- Do not treat citation counts, journal prestige or author reputation as substitutes for methodological assessment.
- Do not fabricate DOI, PMID, author, journal, result or conclusion fields.

## AI boundary

AI may propose candidate classifications, sources, evidence passages or appraisal answers. AI output remains a candidate until a human reviewer verifies it. The application must preserve the distinction between AI suggestion and human-verified decision.

## Reproducibility

Searches, screening decisions, document hashes, appraisal instrument versions and evidence anchors should remain traceable so another reviewer can reconstruct how an assessment was produced.

## Design principle

The application may use deterministic software services and external research APIs, but automated retrieval or classification does not itself establish scientific validity. Methodological validity comes from using the correct instrument, version and source, applying its published rules correctly, and preserving an auditable human review process.

This workflow is informed by established evidence-traceability patterns in scientific-agent tooling, including multi-database searching, citation verification, deduplication, explicit search records and qualitative-first scholarly evaluation.
