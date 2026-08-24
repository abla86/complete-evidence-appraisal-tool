# Evidence Appraisal Tool

[![CI](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/ci.yml)
[![CodeQL](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/codeql.yml/badge.svg)](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/codeql.yml)

## Live application

[Open Evidence Appraisal Tool](https://evidence-appraisal-tool.onrender.com)

A full-stack research workspace for transparent, structured and traceable critical appraisal. It supports AMSTAR 2, CASP, AGREE II, GRADE and an implementation-science extension using CFIR 2.0 and the Knowledge-to-Action (KTA) framework.

The application supports researchers; it does not replace researcher judgement. Automated document analysis produces candidate findings only.

## Current implementation status

| Area | Status | Scope |
|---|---|---|
| AMSTAR 2 | Implemented | 16-item workflow, critical-domain handling, validation and export; no numerical total score |
| CASP | Implemented | Design-specific checklist workflow; no generic quality total |
| AGREE II | Implemented | 23 items, six domains, 1–7 scale and domain calculations |
| GRADE | Implemented | Outcome-level assessment workflow; final certainty remains a researcher judgement |
| CFIR 2.0 | Implemented | Integrated construct assessment and traceability |
| KTA | Implemented | Seven-phase action-cycle documentation integrated with CFIR |
| CFIR → KTA links | Implemented | Explicit links between determinants and implementation actions |
| Research-document analysis | Implemented | PDF, DOCX, TXT, HTML/HTM and XML/JATS extraction, classification and candidate findings |
| RIS reference import | Implemented | Preview → researcher confirmation → metadata persistence with duplicate fingerprint protection |
| Manual evidence | Implemented | Manual evidence entry with source, reviewer, rationale and document hash |
| Evidence verification | Implemented | Candidate evidence can be reviewed and marked according to verification status |
| PRISMA validation | Implemented | Reconciliation checks for identification, screening, eligibility and inclusion counts |
| Cohen's kappa | Implemented | Category-based observed/expected agreement calculation before consensus |
| Deduplication | Implemented | DOI matching plus title/year/first-author similarity candidates |
| Screening workspace | Implemented | Include/Exclude/Maybe, reviewer and exclusion-reason fields |
| Data-extraction workspace | Implemented | Study, field, value, unit, source location and reviewer fields |
| PICO/PECO setup | Implemented | Population, intervention/exposure, comparison, outcome, timeframe and design fields |
| Conflict comparison | Implemented | Reviewer comparison and explicit conflict listing before consensus |
| Final integrity marker | Implemented | Canonical submitted dataset receives SHA-256 integrity hash and finalization timestamp |
| Local draft resilience | Implemented | Research workflow drafts are retained in browser local storage |
| Persistent uploaded source files | Not implemented | Source files are analysed in memory; the analysis endpoint does not retain the original upload |
| Authentication/authorization | Not implemented | Public prototype must not be used for identifiable/confidential research data |
| Production research-data governance | Not implemented | Requires deployment-specific identity, access, encryption, backup, retention and institutional governance |

The table intentionally separates implemented software from production-readiness requirements.

## Research workflow

```text
Reference import (RIS)
  ↓
Reference preview and duplicate check
  ↓
Study/reference library
  ↓
PICO / PECO framing
  ↓
Screening
  ↓
PRISMA reconciliation
  ↓
Full-text/document analysis
  ↓
Candidate evidence
  ↓
Researcher verification
  ↓
Critical appraisal
  ↓
Data extraction
  ↓
Second reviewer / disagreement
  ↓
Inter-rater reliability
  ↓
Consensus
  ↓
GRADE / synthesis
  ↓
Final integrity marker
  ↓
Export
```

## Research document analysis

From **Evidence & traceability**, select **+ Legg til forskningsdokument**.

Supported formats:

- PDF
- DOCX
- TXT
- HTML / HTM
- XML / JATS XML where supplied by the publisher

The application validates uploads, calculates a SHA-256 document hash and extracts text without modifying the original source. PDF documents are analysed page by page; other supported formats are converted into source units.

The analysis can classify document type heuristically, report confidence and signals, assess instrument suitability, locate candidate passages and report source locations where available.

It does **not** automatically determine AMSTAR 2 answers, CASP answers, AGREE II ratings, GRADE certainty, overall study quality, clinical recommendations or policy recommendations.

### Human verification rule

The application follows the explicit safety rule:

> **AI/machine extraction proposes; the researcher verifies.**

If a passage is not found, the application must not infer that the study did not perform the activity. The researcher can inspect the original article, supplement, protocol, registry or other source and add evidence manually.

## Reference import and deduplication

The RIS workflow supports EndNote/Zotero-style `.ris` imports with preview and confirmation. DOI and bibliographic fingerprints prevent straightforward duplicate imports. The research workflow also exposes a second-stage deduplication service that identifies identical DOI records and high-similarity title/year/first-author candidates. Candidate duplicates are flagged for researcher confirmation rather than silently merged.

## Screening and PRISMA

The research workspace now provides an explicit screening table with:

- Include
- Exclude
- Maybe
- reviewer
- exclusion reason
- notes

PRISMA validation reconciles identification → screening, screening → eligibility and eligibility → inclusion counts and reports inconsistencies instead of silently correcting them.

## Data extraction

Extraction records can capture:

- study
- field
- value
- unit
- page/table/figure/source location
- reviewer

The application treats extraction as researcher-controlled data capture. It does not silently normalise, invent or correct numerical study data.

## PICO / PECO

The workspace provides structured Population, Intervention/Exposure, Comparison and Outcome fields, with optional timeframe, study design and research-question fields. This is a framing aid and does not determine eligibility automatically.

## Inter-rater and conflict handling

Cohen's kappa is calculated from paired reviewer ratings before consensus. Reviewer disagreement is separately exposed through a conflict comparison endpoint and workspace. Consensus must not be inserted into the pre-consensus kappa input.

## Evidence verification and manual evidence

Candidate findings are not final scientific judgements. The researcher can add evidence manually when automated extraction misses relevant information, when evidence is in a supplement/protocol/registry, or when contextual interpretation is required.

Manual evidence is stored with document hash, instrument, item/domain, source type, source location, reviewer and rationale. Verification status distinguishes the researcher's decision from automated candidate findings.

**Not found is never equivalent to No.**

## Finalization and integrity

The research workflow can submit the complete working dataset to the finalization endpoint. The server creates a SHA-256 integrity marker and UTC timestamp for the submitted dataset. This is a tamper-evident integrity marker, not a cryptographic signature, legal certification or methodological approval.

Finalization does not claim that the underlying appraisal is correct. A future production implementation should additionally enforce immutable project state and authenticated authorization before allowing finalization to become a legally or institutionally relied-upon record.

## Instrument safeguards

### AMSTAR 2

AMSTAR 2 contains 16 items and uses critical-domain judgements to inform overall confidence. The application does not calculate or present a numerical AMSTAR 2 total score.

### CASP

CASP checklists are design-specific. The researcher must select or confirm the checklist appropriate to the study design. The application does not use one generic CASP score across different designs.

### AGREE II

AGREE II uses 23 items across six domains with a seven-point response scale. Domain scores are calculated separately from the overall assessment.

### GRADE

GRADE is outcome/evidence-base oriented. It is not treated as a generic quality score for a single article. Certainty may remain undetermined when the evidence base is insufficient.

## CFIR 2.0 + KTA

The implementation module supports CFIR 2.0 construct assessment, rationale/evidence location, reviewer information, KTA's seven action-cycle phases, implementation actions, CFIR-to-KTA links, EF Core persistence, audit events and JSON/CSV/XLSX/DOCX/PDF export.

## Security and production boundary

The repository includes CodeQL, Dependabot, automated checks, upload validation, SHA-256 document identity, safe error handling and security headers.

**Production blocker:** authentication and authorization are not implemented in the current prototype branch. Do not use the public deployment for patient-identifiable information, health information or confidential research data.

A production release additionally requires authenticated identity, role-based authorization, encrypted storage, managed secrets, backup/restore testing, retention policy, access auditing, rate limiting and institutional governance appropriate to the data being processed.

## Ownership

Copyright © 2026 Anne Beth Andersen. All rights reserved.

The repository is publicly visible as a professional portfolio. The author's original source code, architecture, implementation and documentation are proprietary. No open-source licence is granted. Third-party instruments, trademarks, libraries and third-party material remain subject to their respective rights and licences.

## Local verification

From repository root:

```powershell
.\tools\audit-and-build.ps1
```

This runs backend restore/build/tests and frontend install/tests/lint/build. A passing software audit does not establish methodological validity, security certification or regulatory approval.

## Methodological sources

AGREE Next Steps Consortium. (2017). *The AGREE II instrument*. https://www.agreetrust.org/resource-centre/agree-ii/

Critical Appraisal Skills Programme. (2024). *CASP checklists*. https://casp-uk.net/casp-tools-checklists/

Damschroder, L. J., Reardon, C. M., Opra Widerquist, M. A., & Lowery, J. (2022). The updated Consolidated Framework for Implementation Research based on user feedback. *Implementation Science, 17*, 75. https://doi.org/10.1186/s13012-022-01245-0

Graham, I. D., Logan, J., Harrison, M. B., Straus, S. E., Tetroe, J., Caswell, W., & Robinson, N. (2006). Lost in knowledge translation: Time for a map? *Journal of Continuing Education in the Health Professions, 26*(1), 13–24. https://doi.org/10.1002/chp.47

GRADE Working Group. (2026). *GRADE Book*. https://book.gradepro.org/

Shea, B. J., Reeves, B. C., Wells, G., Thuku, M., Hamel, C., Moran, J., Moher, D., Tugwell, P., Welch, V., Kristjansson, E., & Henry, D. A. (2017). AMSTAR 2: A critical appraisal tool for systematic reviews that include randomised or non-randomised studies of healthcare interventions, or both. *BMJ, 358*, j4008. https://doi.org/10.1136/bmj.j4008

## Scope

Evidence Appraisal Tool is a research-support application. It is not itself a validated measurement instrument, medical device, clinical decision-support system or guarantee of methodological correctness. Researchers remain responsible for confirming source evidence, selecting the correct appraisal instrument, applying current guidance and making the final scientific judgement.
