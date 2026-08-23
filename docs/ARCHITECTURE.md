# Architecture

## System overview

Evidence Appraisal Tool is a full-stack research application designed to make critical appraisal and implementation documentation structured, traceable and auditable without replacing researcher judgement.

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
   +--> CFIR 2.0 / KTA implementation workflows
   +--> Evidence & traceability document analysis
   |      +--> PDF / DOCX / TXT / HTML / XML
   |      +--> heuristic document classification
   |      +--> instrument suitability warnings
   |      +--> candidate Evidence Map
   |      +--> manual evidence entry
   |      +--> SHA-256 document identity
   |
   +--> structural and methodological-boundary validation
   +--> EF Core persistence
   +--> reviewer / audit / project overview
   +--> Word / PDF / Excel / CSV / JSON export
```

## Document-analysis boundary

The document-analysis service is deliberately conservative:

1. validate upload and file signature where applicable
2. calculate SHA-256
3. extract text into source units
4. classify document type heuristically
5. assess instrument suitability
6. locate candidate passages
7. report uncertainty and methodological warnings
8. allow researcher verification and manual evidence entry.

A candidate text match is never a final appraisal judgement.

If no relevant passage is found, the result explicitly states that this does not establish that the information is absent from the source. The researcher is asked to inspect the original document and relevant supplementary/protocol/registry material.

## Evidence lifecycle

```text
Candidate finding
      |
      +---- verified by researcher
      |
      +---- rejected
      |
      +---- uncertain / not found
      |
      +---- manually added evidence
      |
      v
Research appraisal
```

Manual evidence is persisted with document hash, instrument, item/domain, source information, reviewer, rationale and timestamp. Uploaded source files themselves are not persisted by the analysis endpoint.

## Frontend

React and Vite provide:

- research dashboard and workspace navigation
- critical-appraisal workflows
- CFIR 2.0 + KTA implementation workflow
- structured input and validation feedback
- project overview, reviewer and audit views
- evidence/traceability workspace
- visible research-document upload
- candidate evidence display
- manual evidence workflow
- export initiation.

## Backend

ASP.NET Core provides:

- REST endpoints
- instrument-specific validation/calculation services
- document analysis and text extraction
- evidence candidate generation
- manual evidence persistence
- CFIR/KTA implementation validation
- EF Core persistence
- audit-event recording
- project overview queries
- implementation and appraisal export generation.

The CFIR/KTA implementation aggregate is represented by `ImplementationAssessment`, which contains one `CfirAssessment` and one `KtaAssessment`. This keeps the transport/workflow model explicit without introducing a generic untyped assessment dictionary.

## Persistence

CFIR/KTA implementation records are persisted through `ImplementationDbContext` with entities for:

- CFIR assessments and assessment items
- KTA assessments and phases
- KTA implementation actions
- CFIR-to-action links
- implementation audit events

Research evidence records are persisted through `EvidenceDbContext` with:

- document hash
- instrument
- item/domain
- evidence text
- source type
- page/section/table/figure where supplied
- DOI/URL where supplied
- reviewer
- rationale
- status
- timestamp.

When no `DefaultConnection` is configured, SQLite is used for local/prototype operation. This is not a production research-data governance solution. Production use requires appropriate authentication, authorization, encryption, backup, retention and institutional research-data governance.

## Methodological safety

- Not found is not No.
- Uncertain classification remains visible.
- Instrument suitability is advisory.
- Automated findings require source verification.
- Manual evidence is explicitly labelled.
- AMSTAR 2 is not reduced to a numerical total.
- CASP remains design-specific.
- AGREE II retains its six-domain/23-item/7-point structure.
- GRADE remains outcome/body-of-evidence oriented.

## Security and integrity

The repository demonstrates:

- CodeQL analysis
- Dependabot monitoring
- least-privilege GitHub Actions permissions
- local secret exclusion
- SHA-256 document identity
- upload size/type/signature validation
- in-memory processing of uploaded source files
- explicit persistence of manually submitted evidence only
- automated backend and frontend checks
- security headers.

The application does not claim enterprise identity management, clinical validation or security certification.

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

The repository must not claim production research-data readiness until the following are addressed for the intended deployment context:

- authentication and authorization
- managed production database and migrations
- backup/restore and retention controls
- institutionally appropriate research-data governance
- rate limiting where required
- dedicated end-to-end browser testing
- operational monitoring and incident response
- OCR for scanned documents
- richer structured extraction for tables, figures and JATS sections.

These limitations are intentionally documented rather than hidden.
