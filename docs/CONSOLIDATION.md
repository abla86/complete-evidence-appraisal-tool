# Repository Consolidation

This repository is the canonical public implementation for the Evidence & Research system.

## Absorbed capability areas

The canonical boundary covers the overlapping work previously developed as separate repositories:

- evidence appraisal and methodology registry
- research workflow and project setup
- evidence/document traceability
- research integrity and provenance controls
- implementation-research workflow (CFIR/KTA)
- privacy/data-governance support
- reviewer comparison and consensus support
- reference/metadata handling
- article/document analysis

## Source repositories

Related repositories are treated as source material or historical implementations rather than parallel products:

- `evidence-appraisal-tool`
- `complete-evidence-appraisal-tool-`
- `Evidence-OS`
- `EvidenceOps-AI`
- `ResearchForge-OS`
- `CritiqEvidence`
- `academic-research-engine`
- `research-privacy-inspector`
- `Artikkelanalysator-Pr`
- `implementation-trace`
- `evidence-practice-proof`
- `change-impact-mapper`

## Merge rule

A capability is considered consolidated only when its useful behaviour exists in this repository's executable source, tests or documented integration boundary. A README claim alone is not sufficient evidence.

## Deliberate split

The system remains a single product repository because the capabilities share the same research-project, evidence, appraisal and provenance domain. Standalone deployment is supported through internal module/service boundaries where appropriate; separate repositories would duplicate contracts and validation.

## Safety boundary

Historical code is not copied merely for volume. Superseded implementations are retained only when they provide unique tested behaviour, migration evidence or useful provenance. Secrets, credentials, generated artifacts, caches and unrelated experiments do not belong here.
