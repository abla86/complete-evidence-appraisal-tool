# Evidence Appraisal Tool

## Status

**Advanced research-support application.**

Evidence Appraisal Tool supports structured evidence workflows including critical appraisal, screening, extraction, reviewer comparison, evidence traceability, implementation-research workflows and integrity-preserving finalisation.

The application is designed to operate as a self-contained research-support tool. It is not an automated substitute for methodological judgement and is not presented as a clinically, scientifically or methodologically validated decision system.

## What it does

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

The recommended workflow is documented in [docs/WORKFLOW.md](docs/WORKFLOW.md). Methodology versions, evidence provenance, reviewer decisions and finalisation are treated as one traceable workflow. Historical and legacy components are preserved unless there is a documented compatibility/safety reason to remove them.

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

The application includes workflow support for CFIR 2.0 and Knowledge-to-Action (KTA), including implementation validation and audit-oriented workflow support.

### Collaboration and export

The collaboration workspace uses polling-based presence, field locks and conflict detection. These are workflow controls, not immutable audit infrastructure.

Exports and finalisation include structured outputs and SHA-256 integrity markers. The integrity marker identifies represented data; it is not scientific certification or an institutional information-security control.

## Architecture

```
frontend/                       React + Vite
  src/components/              Research workflow UI
  src/api/                     API clients
  src/domain/                  Appraisal/domain logic

backend/EvidenceAppraisal.Api/ ASP.NET Core
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

A successful software test establishes the tested software behaviour for those scenarios. It does not establish methodological validity, scientific validity, clinical validity or agreement with expert reviewers.

## Reproducible research use

For reproducible use, record the exact application release/version, configuration, workflow choices, input-data provenance, verification/test results, known limitations and researcher decisions. See [docs/RESEARCH_USE.md](docs/RESEARCH_USE.md) and [docs/WORKFLOW.md](docs/WORKFLOW.md).

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

## Reference

Page, M. J., McKenzie, J. E., Bossuyt, P. M., et al. (2021). The PRISMA 2020 statement: An updated guideline for reporting systematic reviews. *BMJ, 372*, n71. https://doi.org/10.1136/bmj.n71

Sterne, J. A. C., Savović, J., Page, M. J., et al. (2019). RoB 2: A revised tool for assessing risk of bias in randomised trials. *BMJ, 366*, l4898. https://doi.org/10.1136/bmj.l4898

## License

See [LICENSE](LICENSE).
