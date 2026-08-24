# Evidence Appraisal Tool

A research-oriented web application for transparent, traceable critical appraisal and evidence-workflow support. The project is designed for researchers, master's students, reviewers and academic professionals who need structured appraisal data without delegating methodological judgement to software.

## Core principle

**The application assists; the researcher decides.**

Document analysis identifies candidate passages and structures evidence. It does not decide whether a study is methodologically sound, whether an AMSTAR 2/CASP/AGREE II/GRADE judgement is correct, or whether evidence supports a clinical or policy recommendation.

The document-analysis workflow explicitly distinguishes **not found** from **No** and requires researcher verification before evidence can be treated as verified. This follows the project's research-safety design and the distinction between reporting support and methodological judgement.

## Current capabilities

### Critical appraisal

- AMSTAR 2
- CASP
- AGREE II
- GRADE
- Structured rationale and evidence-location capture
- Methodological notices and validation

### Research workflow

- RIS reference import for EndNote/Zotero workflows
- DOI and metadata handling
- Duplicate-candidate detection without automatic deletion
- PICO/PECO project setup
- Screening records and exclusion reasons
- Structured data extraction with source location
- PRISMA flow-count validation
- Reviewer comparison and conflict identification
- Cohen's kappa calculation
- Consensus-oriented workflow
- Final dataset integrity hash

### Evidence & traceability

Supported research-document input:

- PDF
- DOCX
- TXT
- HTML/HTM
- XML/JATS

The document-analysis workflow provides:

- document classification signals
- extraction status
- SHA-256 document fingerprint
- instrument suitability warnings
- candidate evidence passages
- source/page location
- uncertainty and methodological warnings
- manual evidence entry
- researcher verification status
- immutable verification-history records
- audit-history viewer

The application is deliberately conservative: an automated text match is a **candidate finding**, not an appraisal conclusion.

### Collaboration

The project includes a collaboration workspace with:

- reviewer presence
- heartbeat-based active-user status
- field locks with expiry
- conflict detection
- reviewer comparison

The current collaboration implementation uses polling. Presence and locks are convenience controls and do not replace durable audit history or database-level concurrency control.

### Implementation research

- CFIR 2.0
- Knowledge-to-Action (KTA)
- implementation validation
- implementation audit history
- implementation exports

### Export and integrity

- structured exports for supported appraisal workflows
- PDF/report generation where implemented
- CSV/XLSX/DOCX/PDF support in implementation workflows
- SHA-256 integrity markers for finalization packages

## Research-safety rules

1. **Candidate evidence is not final evidence.**
2. **Not found is never equivalent to No.**
3. **Uncertain findings require researcher verification.**
4. **The original source remains authoritative.**
5. **Automated classification is a signal, not a methodological judgement.**
6. **AMSTAR 2 is not reduced to an inappropriate numerical total score.**
7. **GRADE certainty is not inferred solely from text matching.**
8. **Duplicate candidates are not silently deleted.**
9. **Finalization produces an integrity marker, not scientific certification.**

## Architecture

```text
frontend/                         React + Vite
  src/components/                Research workflow UI
  src/api/                       API clients
  src/domain/                    Appraisal/domain logic

backend/EvidenceAppraisal.Api/   ASP.NET Core .NET 9
  Models/                        Typed research models
  Services/                      Validation, analysis, export and workflow services
  Data/                          EF Core persistence

 tests/                           Backend tests
docs/                            Architecture, safety and methodology notes
```

The backend currently supports SQLite by default for local development and SQL Server when `DefaultConnection` is configured.

## Running locally

### Backend

```bash
dotnet restore EvidenceAppraisalTool.sln
dotnet build EvidenceAppraisalTool.sln
dotnet run --project backend/EvidenceAppraisal.Api
```

The development API uses the configured launch settings and exposes `/health` and the documented API endpoints.

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

If required, set `VITE_API_URL` to the backend URL.

### Tests

```bash
dotnet test EvidenceAppraisalTool.sln

cd frontend
npm test
npm run lint
npm run build
```

## Production and academic-use limitations

This repository should **not** be described as a validated clinical decision-support system or as a substitute for authorised appraisal instruments.

Before handling confidential research material or deploying for multi-user production use, the following remain necessary engineering work:

- real authentication and authorization
- durable project/reviewer identity and permissions
- database-backed concurrency for the complete appraisal model
- production document storage and retention policy
- encrypted storage and transport configuration appropriate to the deployment
- secure secrets management
- formal backup/recovery procedures
- security testing and dependency review
- validated instrument content/version governance
- a genuinely blind dual-review workflow if blinding is required
- formal validation of any reporting-standard checklist before publication use

These are intentionally not faked by the application. The UI and documentation should make the boundary visible to researchers.

## Methodological scope

PRISMA is a reporting guideline and should not be used as a substitute for methodological quality appraisal. The application therefore treats PRISMA flow validation separately from AMSTAR 2, CASP, AGREE II and GRADE judgement workflows.

PRISMA 2020 provides updated reporting guidance for systematic reviews and explicitly distinguishes reporting guidance from assessment of review conduct or methodological quality (Page et al., 2021).

## Project status

**Status:** advanced research-tool prototype / development platform.

The repository contains substantially more than a checklist demo: it includes document analysis, evidence traceability, appraisal validation, research workflow support, reviewer comparison, implementation modules, tests and research-safety documentation. However, production deployment and formal methodological validation are separate activities and must not be implied by the presence of software functionality.

## References

Page, M. J., McKenzie, J. E., Bossuyt, P. M., Boutron, I., Hoffmann, T. C., Mulrow, C. D., et al. (2021). The PRISMA 2020 statement: An updated guideline for reporting systematic reviews. *BMJ, 372*, n71. https://doi.org/10.1136/bmj.n71

## License

See [LICENSE](LICENSE).
