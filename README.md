# Evidence Appraisal Tool

![CI](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/codeql.yml/badge.svg)
![Dependabot](https://img.shields.io/badge/dependencies-Dependabot-blue)
![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4)
![React 19](https://img.shields.io/badge/React-19-61DAFB)

## Status at a glance

**Advanced research-support prototype / public demonstration deployment.**

This repository demonstrates software engineering for evidence and research workflows. It is not presented as a clinically, scientifically or methodologically validated decision system.

**Key evidence:** structured appraisal workflows, source/evidence traceability, researcher verification, automated tests/CI, CodeQL and documented research-safety boundaries.

**Live demonstration:** https://evidence-appraisal-tool.onrender.com

## Why this project matters

The application is designed to help researchers and reviewers organise appraisal information and research workflow data. It deliberately separates **software assistance** from **researcher judgement**.

> **The application assists; the researcher decides.**

Automated document analysis produces candidate findings and evidence locations. It does not decide whether a study is methodologically sound or whether an appraisal, certainty or recommendation judgement is correct.

## Implemented workflow areas

### Critical appraisal

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

Supported document inputs include PDF, DOCX, TXT, HTML/HTM and XML/JATS.

The document workflow includes document-classification signals, extraction status, SHA-256 fingerprinting, instrument-suitability warnings, candidate evidence passages, source/page locations, uncertainty and methodological warnings, manual evidence entry, researcher verification status and versioned verification history.

An automated text match remains a **candidate finding**, not an appraisal conclusion.

### Human verification

The verification workflow supports provisional findings pending researcher review, reviewer identity/notes where supported, retained verification history, source-first verification, reviewer comparison and conflict identification.

These features support research workflow. They do not by themselves establish inter-rater reliability, methodological validity or scientific validity.

### Implementation research

The repository includes workflow support for CFIR 2.0, Knowledge-to-Action (KTA), implementation validation, implementation audit history and implementation exports.

### Collaboration

The collaboration workspace includes reviewer presence, heartbeat-based active-user status, field locks with expiry and conflict detection. The current collaboration implementation uses polling; these controls are convenience controls, not immutable audit infrastructure.

### Export and integrity

Implemented export/integrity functionality includes supported structured exports and SHA-256 integrity markers for finalization packages. An integrity hash identifies represented data; it is not a substitute for institutional information-security controls or scientific verification.

## Architecture

```text
frontend/                         React 19 + Vite
  src/components/                Research workflow UI
  src/api/                        API clients
  src/domain/                    Appraisal/domain logic

backend/EvidenceAppraisal.Api/   ASP.NET Core .NET 9
  Models/                        Research models
  Services/                      Validation, analysis, export and workflow services
  Data/                          EF Core persistence

tests/                            Backend regression tests
docs/                             Architecture, safety and methodology notes
```

The backend supports SQLite for local development and SQL Server when configured.

## Verification and reproducibility

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

The repository also contains GitHub Actions workflows for build/test validation and CodeQL analysis. A successful CI run demonstrates the tested software behaviour for that workflow; it does not establish scientific validity.

For reproducible research use, record the appraisal methodology/checklist version, application Git commit SHA or release tag, configuration/workflow choices, input-data provenance, verification/test results, known limitations and researcher decisions. See [`docs/RESEARCH_USE.md`](docs/RESEARCH_USE.md).

## Deployment boundary

`render.yaml` contains deployment configuration for the public demonstration. Runtime availability must be checked from the deployment platform rather than inferred from a GitHub build result.

The public deployment is intended for demonstration, synthetic or otherwise non-sensitive material. Do not upload patient information, participant information, confidential unpublished research data, credentials, API keys or access tokens.

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

## Validation boundary

This is **research-support software**, not a self-validating scientific instrument. Technical tests establish software behaviour for tested scenarios; they do not establish methodological validity, construct validity, clinical validity, agreement with expert reviewers or scientific certification.

Claims about automated agreement with expert reviewers would require a separate empirical validation study with a defined sample, reference standard, reviewer procedure and appropriate accuracy/reliability analyses.

The project must not be presented as a CE-marked medical device or clinically validated decision-support system solely because the software exists.

## Portfolio / employer view

This project demonstrates:

- translating a complex professional/research workflow into software
- full-stack application development
- evidence traceability and human-in-the-loop design
- explicit safety and validation boundaries
- testing, CI/CD and security tooling
- documentation intended to make technical and methodological limitations inspectable

## Reference

Page, M. J., McKenzie, J. E., Bossuyt, P. M., Boutron, I., Hoffmann, T. C., Mulrow, C. D., et al. (2021). The PRISMA 2020 statement: An updated guideline for reporting systematic reviews. *BMJ, 372*, n71. https://doi.org/10.1136/bmj.n71

Sterne, J. A. C., Savović, J., Page, M. J., Elbers, R. G., Blencowe, N. S., Boutron, I., et al. (2019). RoB 2: A revised tool for assessing risk of bias in randomised trials. *BMJ, 366*, l4898. https://doi.org/10.1136/bmj.l4898

## License

See [LICENSE](LICENSE). The repository source and documentation are subject to the licence and rights stated in the repository.
