# Architecture

## System overview

Evidence Appraisal Tool is a full-stack research application designed to make critical appraisal and implementation documentation structured, traceable and auditable without replacing researcher judgement.

```text
Researcher
   |
   v
React + Vite
   |
   | REST / JSON
   v
ASP.NET Core API (.NET 9)
   |
   +--> AMSTAR 2 / CASP / AGREE II / GRADE workflows
   +--> CFIR 2.0 / KTA implementation workflows
   +--> structural and methodological-boundary validation
   +--> EF Core persistence for CFIR/KTA implementation records
   +--> audit trail and project overview
   +--> Word / PDF / Excel / CSV / JSON export
```

## Methodological boundary

The application structures and validates researcher-entered documentation. It does not read articles, infer appraisal answers, determine research quality automatically or replace methodological judgement.

CFIR 2.0 is used as an implementation-determinant framework and KTA as an iterative knowledge-to-action framework. Neither is converted into an unsupported quality score or implementation-effectiveness percentage.

Researcher rationale and evidence location are first-class data rather than optional explanatory text.

## Frontend

React and Vite provide:

- research dashboard and workspace navigation
- critical-appraisal workflows
- CFIR 2.0 + KTA implementation workflow
- structured input and validation feedback
- project overview, reviewer and audit views
- evidence/traceability workspace
- export initiation

The frontend is JavaScript-based; TypeScript is not claimed as implemented in this repository.

## Backend

ASP.NET Core provides:

- REST endpoints
- instrument-specific validation/calculation services
- CFIR/KTA implementation validation
- EF Core persistence using SQLite by default and SQL Server/Azure SQL when configured
- audit-event recording
- project overview queries
- implementation and appraisal export generation
- integrity verification services

The CFIR/KTA implementation aggregate is represented by `ImplementationAssessment`, which contains one `CfirAssessment` and one `KtaAssessment`. This keeps the transport/workflow model explicit without introducing a generic untyped assessment dictionary.

## Persistence

CFIR/KTA implementation records are persisted through `ImplementationDbContext` with entities for:

- CFIR assessments and assessment items
- KTA assessments and phases
- KTA implementation actions
- CFIR-to-action links
- implementation audit events

When no `DefaultConnection` is configured, SQLite is used for local/prototype operation. This is not a production research-data governance solution. Production use requires appropriate authentication, authorization, encryption, backup, retention and institutional research-data governance.

## Security and integrity

The repository demonstrates:

- CodeQL analysis
- Dependabot monitoring
- least-privilege GitHub Actions permissions
- local secret exclusion
- SHA-256 verification for exported AMSTAR 2 reports
- automated backend and frontend checks

The application does not claim enterprise identity management, clinical validation or security certification.

## AI boundary

AI-assisted development may be used to develop the software, but the application does not claim automatic article interpretation or autonomous appraisal judgement.

Any future AI functionality should preserve:

- human verification
- provenance
- uncertainty
- auditability
- methodological boundaries

## Current architecture gaps

Not currently implemented:

- OAuth2/OIDC/Entra ID authentication and authorization
- production-grade managed research-data infrastructure
- automated PDF/article content analysis
- production cloud infrastructure as code
- OpenTelemetry observability
- dedicated end-to-end browser test suite

These are production-hardening gaps, not prerequisites for the local research-prototype workflow.
