# Evidence Appraisal Tool

![CI](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/codeql.yml/badge.svg)
![Dependabot](https://img.shields.io/badge/dependencies-Dependabot-blue)
![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4)
![React 19](https://img.shields.io/badge/React-19-61DAFB)
![License](https://img.shields.io/badge/license-proprietary-lightgrey)

**Live application:** https://evidence-appraisal-tool.onrender.com

**Status:** Advanced research-support prototype / public demonstration deployment.

A research-oriented web application for structured critical appraisal and evidence-workflow support. The application is intended to assist researchers and reviewers with organising appraisal information and research workflow data; it does not replace methodological judgement.

## Core principle

**The application assists; the researcher decides.**

Automated document analysis produces candidate findings and evidence locations. It does not determine whether a study is methodologically sound or whether an appraisal, certainty or recommendation judgement is correct.

The workflow distinguishes **not found** from **No** and keeps candidate findings subject to researcher verification.

## Implemented workflow areas

### Critical appraisal

The repository contains workflow support for:

- AMSTAR 2
- CASP
- AGREE II
- GRADE
- Cochrane Risk of Bias 2 (RoB 2) prototype workflow
- structured rationale and evidence-location capture
- researcher-controlled final judgements
- validation and methodological notices

### Research workflow

- RIS reference import
- DOI and metadata handling
- duplicate-candidate detection without automatic deletion
- PICO/PECO project setup
- screening records and exclusion reasons
- structured data extraction with source location
- PRISMA flow-count validation
- reviewer comparison and conflict identification
- Cohen's kappa calculation
- consensus-oriented workflow
- project finalization with an integrity hash

### Evidence traceability

Supported document inputs include:

- PDF
- DOCX
- TXT
- HTML/HTM
- XML/JATS

The document workflow includes functionality for:

- document classification signals
- extraction status
- SHA-256 document fingerprinting
- instrument-suitability warnings
- candidate evidence passages
- source/page locations
- uncertainty and methodological warnings
- manual evidence entry
- researcher verification status
- versioned verification history
- audit-history viewing

An automated text match remains a **candidate finding**, not an appraisal conclusion.

### Human verification

The verification workflow supports:

- provisional automated findings pending researcher review
- reviewer identity and verification notes where supported
- retained verification history
- source-first verification
- reviewer comparison and conflict identification

These features support research workflow. They do not by themselves establish inter-rater reliability, methodological validity or scientific validity.

### Methodology provenance

For reproducible research use, record:

- the appraisal methodology and checklist version
- the application Git commit SHA or release tag
- relevant configuration and workflow choices
- input-data provenance
- verification and test results
- known limitations and researcher decisions

Software versioning does not itself establish scientific validity.

### Collaboration

The collaboration workspace includes:

- reviewer presence
- heartbeat-based active-user status
- field locks with expiry
- conflict detection
- reviewer comparison

The current collaboration implementation uses polling. Presence and locks are convenience controls and should not be interpreted as cryptographically immutable audit infrastructure or a substitute for database-level concurrency controls.

### Implementation research

The repository includes implementation-oriented workflow support for:

- CFIR 2.0
- Knowledge-to-Action (KTA)
- implementation validation
- implementation audit history
- implementation exports

### Export and integrity

Implemented export/integrity functionality includes supported structured exports and SHA-256 integrity markers for finalization packages.

An integrity hash is an identifier for the represented data. It is not a substitute for institutional information-security controls, authenticated audit infrastructure or independent scientific verification.

## Research-safety rules

1. Candidate evidence is not final evidence.
2. Not found is never equivalent to No.
3. Uncertain findings require researcher verification.
4. The original source remains authoritative.
5. Automated classification is a signal, not a methodological judgement.
6. AMSTAR 2 must not be reduced to an inappropriate numerical total score.
7. GRADE certainty is not inferred solely from text matching.
8. RoB 2 overall judgement remains subject to methodological review.
9. Duplicate candidates are not silently deleted.
10. Finalization produces an integrity marker, not scientific certification.

## Architecture

```text
frontend/                         React 19 + Vite 8
  src/components/                Research workflow UI
  src/api/                       API clients
  src/domain/                    Appraisal/domain logic

backend/EvidenceAppraisal.Api/   ASP.NET Core .NET 9
  Models/                        Research models
  Services/                      Validation, analysis, export and workflow services
  Data/                          EF Core persistence

tests/                            Backend regression tests
docs/                             Architecture, safety and methodology notes
```

The backend supports SQLite for local development and SQL Server when the configured connection is used.

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

If required, set `VITE_API_URL` to the backend URL. In the published same-origin deployment, the frontend uses the application origin and calls `/api/...` directly.

### Tests

```bash
dotnet test EvidenceAppraisalTool.sln

cd frontend
npm test
npm run lint
npm run build
```

## Deployment

Render configuration is stored in [`render.yaml`](render.yaml). The repository includes configuration for a Docker-based deployment, a `/health` endpoint and serving the frontend through the ASP.NET application.

The public deployment is a demonstration environment. Runtime availability should be checked from the deployment platform rather than inferred from a GitHub build result.

## CI and security

The repository contains GitHub Actions workflows for build/test validation and CodeQL analysis. Dependabot configuration is included for supported dependency ecosystems.

A successful CI build demonstrates the tested software behaviour for the workflow that ran. It does not establish methodological validity, clinical validity or scientific certification.

## Validation and scientific-use boundary

This is **research-support software**, not a self-validating scientific instrument. Software tests establish technical behaviour for tested scenarios; they do not establish methodological validity, construct validity, clinical validity, agreement with expert reviewers or scientific certification of appraisal results.

Claims about automated agreement with expert reviewers would require a separate empirical validation study with a defined sample, reference standard, reviewer procedure and appropriate accuracy/reliability analyses.

## Privacy, security and deployment boundary

The public deployment is intended for demonstration, synthetic or otherwise non-sensitive material. Do not upload patient information, participant information, confidential unpublished research data, credentials, API keys, access tokens or other restricted information to the public deployment or public repository workflows.

If restricted research data are processed, the responsible organisation must assess the applicable privacy, information-security, research-governance and ethics requirements. The controls in this repository do not by themselves establish GDPR compliance, ISO certification, institutional approval or authorisation for a particular research project.

## Regulatory boundary

This repository must not be presented as a CE-marked medical device or clinically validated decision-support system solely because the software exists. The regulatory classification of a particular deployment or use case must be assessed for its intended purpose and context by the responsible organisation and relevant authorities.

## Reproducible research use

Record the exact Git commit SHA or release tag, relevant configuration, input-data provenance, software changes, verification/test results and known limitations. See [`docs/RESEARCH_USE.md`](docs/RESEARCH_USE.md).

## Methodological scope

PRISMA is a reporting guideline and is kept separate from methodological quality appraisal. PRISMA flow validation therefore does not replace AMSTAR 2, CASP, AGREE II, GRADE or RoB 2 judgement.

## Project status

**Advanced research-support prototype / public demonstration deployment.**

The project contains substantially more than a static checklist interface, but the software should not be represented as methodologically, clinically or scientifically validated merely because the implementation and automated tests are functional.

## Reference

Page, M. J., McKenzie, J. E., Bossuyt, P. M., Boutron, I., Hoffmann, T. C., Mulrow, C. D., et al. (2021). The PRISMA 2020 statement: An updated guideline for reporting systematic reviews. *BMJ, 372*, n71. https://doi.org/10.1136/bmj.n71

Sterne, J. A. C., Savović, J., Page, M. J., Elbers, R. G., Blencowe, N. S., Boutron, I., et al. (2019). RoB 2: A revised tool for assessing risk of bias in randomised trials. *BMJ, 366*, l4898. https://doi.org/10.1136/bmj.l4898

## License

See [LICENSE](LICENSE). The repository source and documentation are subject to the licence and rights stated in the repository.
