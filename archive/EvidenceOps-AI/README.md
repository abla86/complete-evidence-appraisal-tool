# EvidenceOps-AI — LEGACY

This repository is retained as a historical implementation snapshot.

## Canonical project

Use [`abla86/complete-evidence-appraisal-tool`](https://github.com/abla86/complete-evidence-appraisal-tool) for active development and the consolidated evidence-appraisal platform.

## Consolidation decision

The application surface overlaps substantially with the canonical project. The original orchestrator and evidence corpus were reviewed rather than copied wholesale because they contain synthetic/default evidence data and hard-coded approval/report defaults that are not suitable as production evidence-processing behavior.

Reusable algorithms are migrated only after they are made deterministic, dependency-complete, and safe for production use.

No active development should be started here.
