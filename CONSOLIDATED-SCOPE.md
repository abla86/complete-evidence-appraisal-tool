> **Status 2026-09-19:** the repositories listed here have been merged, with full git history, into `archive/<name>/` of the canonical repository and the standalone repositories were removed after every file was verified.

# Consolidated scope

This is the canonical Evidence & Research platform for the portfolio. Related repositories are source material, not parallel products.

## Covered capabilities

- Critical appraisal: AMSTAR 2, CASP, JBI, AGREE II, GRADE, RoB 2 prototype
- Research workflow: PICO/PECO, screening, extraction, PRISMA counts, reviewer comparison, Cohen's kappa and consensus
- Evidence traceability: source/page location, candidate passages, SHA-256 fingerprints, verification history
- Research integrity: methodology registry/version locking, human verification, explicit uncertainty
- Implementation research: CFIR 2.0 and KTA workflow support
- Privacy/data governance and reproducibility documentation
- Authentication and controlled exports

## Absorbed/source repositories

`evidence-appraisal-tool`, `complete-evidence-appraisal-tool-`, `Evidence-OS`, `EvidenceOps-AI`, `ResearchForge-OS`, `CritiqEvidence`, `academic-research-engine`, `research-privacy-inspector`, `Artikkelanalysator-Pr`, `implementation-trace`, `evidence-practice-proof`, and `change-impact-mapper` are treated as source implementations or concepts for this canonical platform.

## Boundary

A feature is considered consolidated only when it is implemented here or explicitly marked as planned. Documentation alone does not count as implementation. Where a capability has a fundamentally independent deployment/security boundary, it may remain a separate service, but it must have a clear integration contract rather than a duplicate UI/codebase.

## Public-release gate

Before any previously private source is copied into this public repository, inspect it for secrets, credentials, private keys, personal data, proprietary material and unsafe configuration. Public GitHub repositories expose their contents to everyone and can be forked. See GitHub's repository visibility guidance.
