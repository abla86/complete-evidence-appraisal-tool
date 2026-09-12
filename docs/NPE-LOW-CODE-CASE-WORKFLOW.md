# NPE-oriented low-code and case-workflow showcase

This document explains how the Evidence Appraisal Tool demonstrates transferable capabilities relevant to the Norwegian Patient Injury Compensation (NPE) low-code developer role.

## Scope

The application is **not** a Microsoft Power Platform or Pega product. It is an independent TypeScript/React implementation used to demonstrate enterprise workflow concepts in a transparent, inspectable codebase.

## Capability mapping

| NPE-oriented capability | Evidence in this repository |
|---|---|
| Understand and structure business needs | Evidence appraisal, screening, peer review and implementation workflows |
| Case-oriented work | `caseWorkflowService.ts` models a case with status, priority, stage, assignee, SLA and audit history |
| Workflow/configuration | Intake → Triage → Assessment → Peer review → Decision → Closure |
| Rules and routing | Stage progression, status transitions, priority and assignment rules |
| Change handling | Explicit case transitions and audit entries |
| Testing | Unit/integration test suites plus CI pipeline |
| Documentation | Architecture, data governance, methodology and release documentation |
| Version handling | Git/GitHub history and explicit methodology/version metadata |
| Traceability | Case audit trail and existing appraisal audit trail |
| Human decision points | Peer review, decision and qualified-professional interpretation gates |
| API/integration thinking | Research, evidence, reference and interoperability service boundaries |
| Privacy/security awareness | PII sanitisation, privacy controls and governance documentation |
| Modern delivery | React/TypeScript, automated CI, Docker and Azure-oriented deployment artifacts |

## Demonstration flow

1. Create a case.
2. Assign priority and owner.
3. Move the case through controlled stages.
4. Record a decision or note.
5. Inspect the audit trail.
6. Observe SLA and overdue status.
7. Close the case.

The same workflow concepts can be implemented with low-code platforms such as Microsoft Power Platform. The implementation here deliberately keeps the domain model and rules visible in source code so that engineering decisions can be reviewed.

## Production boundary

The current case store is browser-local storage and is intended as a portfolio/demo implementation. A production deployment would replace this with authenticated server-side persistence, role-based authorization, durable audit storage, controlled document storage, observability, backup/recovery and environment-specific configuration.

## Why this matters for the role

The strongest transferable capability is not a specific UI technology. It is the ability to translate a real professional process into explicit cases, stages, rules, responsibilities, validation, testing, documentation and controlled change. This repository is designed to make that capability demonstrable.
