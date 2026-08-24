# Evidence Appraisal Tool

![CI](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/codeql.yml/badge.svg)
![Dependabot](https://img.shields.io/badge/dependencies-Dependabot-blue)
![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4)
![React 19](https://img.shields.io/badge/React-19-61DAFB)
![License](https://img.shields.io/badge/license-proprietary-lightgrey)

**Live prototype:** https://evidence-appraisal-tool.onrender.com

A research-oriented web application for transparent, traceable critical appraisal and evidence-workflow support. The project is designed for researchers, master's students, reviewers and academic professionals who need structured appraisal data without delegating methodological judgement to software.

## Core principle

**The application assists; the researcher decides.**

Document analysis identifies candidate passages and structures evidence. It does not decide whether a study is methodologically sound, whether an AMSTAR 2/CASP/AGREE II/GRADE/RoB 2 judgement is correct, or whether evidence supports a clinical or policy recommendation.

The document-analysis workflow explicitly distinguishes **not found** from **No** and requires researcher verification before evidence can be treated as verified.

## Current capabilities

### Critical appraisal

- AMSTAR 2
- Cochrane Risk of Bias 2 (RoB 2) prototype workflow for randomized trials
- CASP
- AGREE II
- GRADE
- Structured rationale and evidence-location capture
- Methodological notices and validation
- Researcher-controlled final judgements
- Non-destructive AMSTAR 2 advisory consistency checks

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
8. **RoB 2 overall judgement remains subject to researcher review where methodological judgement is required.**
9. **Duplicate candidates are not silently deleted.**
10. **Finalization produces an integrity marker, not scientific certification.**

## Architecture

```text
frontend/                         React 19 + Vite 8
  src/components/                Research workflow UI
  src/api/                       API clients
  src/domain/                    Appraisal/domain logic

backend/EvidenceAppraisal.Api/   ASP.NET Core .NET 9
  Models/                        Typed research models
  Services/                      Validation, analysis, export and workflow services
  Data/                          EF Core persistence

tests/                            Backend regression tests
docs/                             Architecture, safety and methodology notes
```

The backend currently supports SQLite by default for local development and SQL Server when `DefaultConnection` is configured.

## Running locally

### Backend

```bash
dotnet restore EvidenceAppraisalTool.sln
dotnet build EvidenceAppraisalTool.sln
dotnet run --project backend/EvidenceAppraisal.Api
```

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

## CI and security

The repository has automated GitHub Actions for backend/frontend build and test plus CodeQL analysis. Dependabot is configured for NuGet, npm and GitHub Actions dependencies. The CI workflow targets .NET 9 and Node 24, matching the current project configuration.

The current CI workflow runs on pushes and pull requests targeting `main` and performs backend restore/build/test followed by frontend install/test/lint/build.

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

PRISMA is a reporting guideline and should not be used as a substitute for methodological quality appraisal. The application therefore treats PRISMA flow validation separately from AMSTAR 2, CASP, AGREE II, GRADE and RoB 2 judgement workflows.

PRISMA 2020 provides updated reporting guidance for systematic reviews and explicitly distinguishes reporting guidance from assessment of review conduct or methodological quality (Page et al., 2021).

## Project status

**Status: advanced research-tool prototype / published demonstration deployment.**

The repository contains substantially more than a checklist demo: it includes document analysis, evidence traceability, appraisal validation, RoB 2 prototype support, research workflow support, reviewer comparison, implementation modules, tests, CI, CodeQL, Dependabot and research-safety documentation.

The public deployment is a demonstration prototype. It is **not** a validated clinical decision-support system, not a certification of research quality, and not a replacement for the official appraisal instruments or researcher judgement.

## References

Page, M. J., McKenzie, J. E., Bossuyt, P. M., Boutron, I., Hoffmann, T. C., Mulrow, C. D., et al. (2021). The PRISMA 2020 statement: An updated guideline for reporting systematic reviews. *BMJ, 372*, n71. https://doi.org/10.1136/bmj.n71

Sterne, J. A. C., Savović, J., Page, M. J., Elbers, R. G., Blencowe, N. S., Boutron, I., et al. (2019). RoB 2: A revised tool for assessing risk of bias in randomised trials. *BMJ, 366*, l4898. https://doi.org/10.1136/bmj.l4898

## License

See [LICENSE](LICENSE). The repository source is publicly viewable as a professional portfolio; the original source code, architecture and documentation remain proprietary unless otherwise stated by their respective rights holders.
