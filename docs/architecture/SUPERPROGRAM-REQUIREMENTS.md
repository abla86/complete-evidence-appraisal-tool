# Superprogram — requirements and extension contract

This document is the additive master contract for the Evidence Appraisal superprogram. Existing JBI Qualitative functionality is preserved; new modules must integrate through shared domain contracts rather than replacing established appraisal surfaces.

## End-to-end research flow

Search → Import → Reference Hub → duplicate review → full text → SourceRecord → screening → PICO/PECO → appraisal → dual review → consensus → extraction → synthesis → GRADE/CERQual → PRISMA → writing → citation audit → export.

## Required capability groups

- Research search: PubMed, Europe PMC, OpenAlex, DOI/title/author/journal search, Boolean strategies, saved search history and reproducible search records.
- Import: PDF, DOCX, TXT, HTML, XML/JATS, RIS, BibTeX, EndNote XML, CSL JSON, CSV, DOI, PMID, URL.
- Reference Hub: one canonical record model; identifiers, metadata, collections/tags, PDF attachments, annotations, duplicate candidates, manual merge/keep-distinct decisions, immutable history, verification state and integrity alerts.
- SourceRecord: provenance, SHA-256, metadata status, screening state, PICO links and audit history.
- Screening/PRISMA: title/abstract and full-text decisions, standardized reasons, reviewer identity/timestamp, automatic flow counts from actual records.
- Appraisal: JBI Qualitative 2017 and other registry-backed instruments without inventing unsupported score models.
- Evidence: exact excerpts, pages/sections/tables/figures, source linkage, reviewer and timestamp, with researcher verification.
- AI: suggestions only; never silently promoted to verified evidence, appraisal judgement or bibliographic truth.
- Review: dual independent review, conflict display, Cohen/Fleiss kappa and consensus/adjudication with audit history.
- Synthesis: qualitative themes/categories/quotes/CERQual and quantitative effect-size/CI/heterogeneity/forest-plot data where the implemented method supports it.
- Integrity: reference validation, methodology/version checks, retraction/correction signals, privacy/accessibility observations, provenance and tamper-evident audit trail.
- Writing: source-grounded claims, evidence links, citation completeness and export gate.
- Output: JSON, CSV, RIS, BibTeX, EndNote XML/compatible XML, CSL JSON, PDF/print, Word-compatible material, references, PRISMA/appraisal/audit data.
- Collaboration: project roles and permissions are kept separate from scientific methodology.

## Non-negotiable guardrails

1. Never automatically delete duplicate records.
2. Never convert detected metadata to verified metadata without an explicit verification event.
3. Never present a missing external record as proof of invalidity.
4. Never claim peer review from Crossref metadata alone.
5. Never replace qualitative JBI interpretation with a generic numeric total.
6. Never mix reporting checklists with appraisal scores.
7. Privacy output is an observation/signal, not a GDPR certification.
8. Accessibility output is an observation/signal, not a WCAG certification.
9. Historical instrument/reference/appraisal versions remain recoverable.
10. New modules must expose stable service contracts so they can be extended without rewriting the core workflow.

## Extension rule

New features should preferably follow this pattern:

`domain contract → deterministic service → UI adapter → tests → App/header integration`

External APIs belong behind explicit adapters. Persistent state belongs to a single owning service. Compatibility with EndNote/Zotero/Mendeley/Paperpile is an import/export concern, not a second internal engine.
