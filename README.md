# Evidence Appraisal Tool

![CI](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/codeql.yml/badge.svg)
![Dependabot](https://img.shields.io/badge/dependencies-Dependabot-blue)
![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4)
![React 19](https://img.shields.io/badge/React-19-61DAFB)

## Status

**Advanced research-support prototype / public demonstration deployment.**

This repository demonstrates software engineering for evidence and research workflows. It is not presented as a clinically, scientifically or methodologically validated decision system.

## What it does

The application supports structured evidence workflows including critical appraisal, screening, extraction, reviewer comparison, evidence traceability, implementation-research workflows and integrity-preserving finalisation.

### Appraisal workflows

- AMSTAR 2
- CASP (study-design-specific variants)
- JBI qualitative 2017 (historical instrument)
- AGREE II
- GRADE
- RoB 2 prototype workflow; the current implementation is explicitly not presented as a complete RoB 2 implementation
- structured rationale and evidence-location capture
- researcher-controlled final judgements

### Research workflow

The recommended workflow is documented in [`docs/WORKFLOW.md`](docs/WORKFLOW.md). Methodology versions, evidence provenance, reviewer decisions and finalisation are treated as one traceable workflow. Historical and legacy components are preserved unless there is a documented compatibility/safety reason to remove them.


- RIS reference import
- DOI and metadata handling
- duplicate-candidate detection without automatic deletion
- PICO/PECO project setup
- screening and exclusion reasons
- structured extraction with source locations
- PRISMA flow-count validation
- reviewer comparison and conflict identification
- Cohen's kappa calculation
- consensus workflow support

### Evidence traceability

Supported inputs include PDF, DOCX, TXT, HTML/HTM and XML/JATS. The document workflow supports classification signals, extraction status, SHA-256 fingerprinting, candidate evidence passages, source/page locations, uncertainty notices, manual evidence entry, researcher verification and versioned verification history.

Automated text matching produces candidate findings only. It does not determine methodological quality or final appraisal judgements.

### Human verification

The workflow keeps provisional findings separate from researcher-reviewed findings and retains verification history where supported. The original source remains authoritative.

### Implementation research

The repository includes workflow support for CFIR 2.0 and Knowledge-to-Action (KTA), including implementation validation and audit-oriented workflow support.

### Collaboration and export

The collaboration workspace uses polling-based presence, field locks and conflict detection. These are workflow controls, not immutable audit infrastructure.

Exports and finalisation include structured outputs and SHA-256 integrity markers. The integrity marker identifies represented data; it is not scientific certification or an institutional information-security control.

## Architecture

```text
frontend/                       React 19 + Vite
  src/components/              Research workflow UI
  src/api/                     API clients
  src/domain/                  Appraisal/domain logic

backend/EvidenceAppraisal.Api/ ASP.NET Core .NET 9
  Models/                      Research models
  Services/                    Validation, analysis and workflow services
  Data/                        EF Core persistence

tests/                          Backend regression tests
docs/                           Architecture, safety and methodology notes
```

SQLite is supported for local development; SQL Server is supported when configured.

## Verification

### Backend

```bash
dotnet restore EvidenceAppraisalTool.sln
dotnet build EvidenceAppraisalTool.sln
dotnet test EvidenceAppraisalTool.sln
```

### Frontend

```bash
cd frontend
npm ci
npm test
npm run lint
npm run build
```

The repository contains GitHub Actions workflows for build/test validation and CodeQL analysis. CI status must be checked from GitHub Actions; the README does not claim a green build merely because the workflow exists.

A successful software test establishes the tested software behaviour for those scenarios. It does not establish methodological validity, scientific validity, clinical validity or agreement with expert reviewers.

## Reproducible research use

For reproducible use, record the appraisal/checklist version, application Git commit SHA or release tag, configuration and workflow choices, input-data provenance, verification/test results, known limitations and researcher decisions. See `docs/RESEARCH_USE.md` and [`docs/WORKFLOW.md`](docs/WORKFLOW.md).

## Deployment boundary

`render.yaml` contains deployment configuration for the public demonstration. The public deployment is for demonstration and non-sensitive material. Do not upload patient information, participant information, confidential unpublished research data, credentials, API keys or access tokens.

## Research-safety rules

1. Candidate evidence is not final evidence.
2. Methodology versions are immutable for existing assessments.
3. Not found is never equivalent to No.
4. Uncertain findings require researcher verification.
5. The original source remains authoritative.
6. Automated classification is a signal, not a methodological judgement.
7. AMSTAR 2 must not be reduced to an inappropriate numerical total score.
8. GRADE certainty is not inferred solely from text matching.
9. RoB 2 overall judgement remains subject to methodological review.
10. Duplicate candidates are not silently deleted.
11. Finalisation produces an integrity marker, not scientific certification.

## Portfolio / employer value

This project demonstrates full-stack application development, evidence traceability, human-in-the-loop design, structured research workflows, testing, CI/CD, security tooling and explicit validation boundaries.

## Reference

Page, M. J., McKenzie, J. E., Bossuyt, P. M., et al. (2021). The PRISMA 2020 statement: An updated guideline for reporting systematic reviews. *BMJ, 372*, n71. https://doi.org/10.1136/bmj.n71

Sterne, J. A. C., Savović, J., Page, M. J., et al. (2019). RoB 2: A revised tool for assessing risk of bias in randomised trials. *BMJ, 366*, l4898. https://doi.org/10.1136/bmj.l4898

## License

See [LICENSE](LICENSE).

## Change-control audit

See [docs/REPOSITORY-CHANGE-AUDIT-2026-08-28.md](docs/REPOSITORY-CHANGE-AUDIT-2026-08-28.md) for the repository change-control and traceability record.
