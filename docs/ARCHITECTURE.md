# Architecture

## System overview

Evidence Appraisal Tool is a full-stack research application intended to make critical-appraisal and implementation documentation structured and traceable without replacing researcher judgement.

```text
Researcher
   |
   v
React + Vite
   |
   | REST / JSON / multipart upload
   v
ASP.NET Core API (.NET 9)
   |
   +--> AMSTAR 2 / CASP / AGREE II / GRADE workflows
   +--> RoB 2 prototype workflow
   +--> CFIR 2.0 / KTA implementation workflows
   +--> Evidence & traceability document analysis
   |      +--> PDF / DOCX / TXT / HTML / XML/JATS inputs where supported
   |      +--> heuristic document classification
   |      +--> instrument suitability warnings
   |      +--> candidate evidence findings
   |      +--> SHA-256 document identity
   |
   +--> structural and methodological-boundary validation
   +--> EF Core persistence for implementation records
   +--> reviewer / audit / project views
   +--> Word / PDF / Excel / CSV / JSON export where implemented
```

## Document-analysis boundary

The document-analysis service is deliberately conservative:

1. validate upload and file characteristics where applicable
2. calculate SHA-256
3. extract text into source units
4. classify document type heuristically
5. assess instrument suitability
6. locate candidate passages
7. report uncertainty and methodological warnings
8. require researcher verification.

A candidate text match is never a final appraisal judgement.

If no relevant passage is found, the result explicitly states that this does not establish that the information is absent from the source. The researcher must inspect the original document and relevant supplementary, protocol or registry material where applicable.

Research-document uploads used by the analysis endpoint are processed without being persisted by that endpoint. This does not by itself constitute a production storage, retention or privacy control.

## Frontend

React and Vite provide the current user interface for:

- research dashboard and workspace navigation
- critical-appraisal workflows
- CFIR 2.0 + KTA implementation workflow
- structured input and validation feedback
- project/reviewer/audit views
- evidence/traceability workspace
- research-document upload
- candidate evidence display
- export initiation.

A dedicated persistent Evidence Map/manual-evidence workflow remains a future extension; manual evidence entry exists in the current research-document workflow but is not equivalent to a complete persistent evidence-map system.

## Backend

ASP.NET Core provides:

- REST endpoints
- instrument-specific validation/calculation services
- document analysis and text extraction
- candidate evidence generation
- CFIR/KTA implementation validation
- EF Core persistence for implementation records
- audit-event recording where implemented
- project overview queries
- implementation and appraisal export generation where implemented.

The CFIR/KTA implementation aggregate is represented by `ImplementationAssessment`, which contains one `CfirAssessment` and one `KtaAssessment`. This keeps the transport/workflow model explicit without introducing a generic untyped assessment dictionary.

## Persistence

CFIR/KTA implementation records are persisted through `ImplementationDbContext` with entities for:

- CFIR assessments and assessment items
- KTA assessments and phases
- KTA implementation actions
- CFIR-to-action links
- implementation audit events

Research-document uploads are not persisted by the analysis endpoint. Persistent evidence-map records are a future extension.

When no `DefaultConnection` is configured, SQLite is used for local/prototype operation. This is not a production research-data governance solution. Production use requires appropriate authentication, authorization, encryption, backup, retention and institutional research-data governance.

## Methodological safety

- Not found is not No.
- Uncertain classification remains visible.
- Instrument suitability is advisory.
- Automated findings require source verification.
- AMSTAR 2 is not reduced to a numerical total.
- CASP remains design-specific.
- AGREE II retains its six-domain/23-item/7-point structure.
- GRADE remains outcome/body-of-evidence oriented.
- RoB 2 workflow output remains subject to researcher review and should not be described as independently validated merely because it is implemented.

## Security and integrity

The repository currently demonstrates:

- CodeQL workflow
- Dependabot configuration
- least-privilege GitHub Actions permissions in the CI/CodeQL workflows
- local secret exclusion
- SHA-256 document identity
- upload validation controls where implemented
- in-memory processing for the document-analysis endpoint
- automated backend and frontend checks
- security headers where implemented.

These controls do not constitute enterprise identity management, clinical validation, GDPR compliance, penetration-test certification or general security certification.

## AI boundary

Any future AI functionality must preserve:

- human verification
- provenance
- uncertainty
- auditability
- source location
- document-version identity
- methodological boundaries.

AI output must remain candidate evidence and must never be presented as an automatically validated scientific appraisal.

## Production-hardening gaps

The repository must not claim production research-data readiness until the following are addressed and verified for the intended deployment context:

- authentication and authorization
- managed production database and migrations
- backup/restore and retention controls
- institutionally appropriate research-data governance
- rate limiting where required
- dedicated end-to-end browser testing
- operational monitoring and incident response
- OCR for scanned documents
- richer structured extraction for tables and figures
- complete persistent evidence-map/manual-evidence anchoring
- full collaborative access/concurrency controls.

These limitations are documented rather than hidden.