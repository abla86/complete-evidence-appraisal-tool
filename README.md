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
| Research-document analysis | Implemented | PDF, DOCX, TXT, HTML/HTM and XML extraction, classification and candidate findings |
| Manual evidence | Implemented | Manual evidence entry with source, reviewer, rationale and document hash |
| Evidence verification | Implemented | Candidate evidence can be reviewed and marked according to verification status |
| Persistent uploaded source files | Not implemented | Source files are analysed in memory; the analysis endpoint does not retain the original upload |
| Authentication/authorization | Not implemented | Public prototype must not be used for identifiable/confidential research data |
| Production research-data governance | Not implemented | Requires deployment-specific identity, access, encryption, backup, retention and institutional governance |

The table intentionally separates implemented software from production-readiness requirements.

## Research workflow

```text
Document
  ↓
Document classification
  ↓
Evidence extraction
  ↓
Candidate findings
  ↓
Instrument suitability
  ↓
Researcher verification
  ↓
Reviewer appraisal
  ↓
Second reviewer / disagreement
  ↓
Consensus
  ↓
Final appraisal
  ↓
Audit trail
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

Maximum upload size: 25 MB.

The application validates uploads, calculates a SHA-256 document hash and extracts text without modifying the original source. PDF documents are analysed page by page; other supported formats are converted into source units.

The analysis can:

- classify document type heuristically
- report confidence and classification signals
- assess instrument suitability as suitable/caution/not suitable/unknown
- locate candidate passages
- show source location and excerpts where available
- report SHA-256
- warn about missing selectable text
- identify candidate evidence.

It does **not** automatically determine AMSTAR 2 answers, CASP answers, AGREE II ratings, GRADE certainty, overall study quality, clinical recommendations or policy recommendations.

## Evidence verification and manual evidence

Candidate findings are not final scientific judgements.

The researcher can add evidence manually when:

- the automated extraction misses relevant information
- information is located in a supplement/protocol/registry
- a passage requires contextual interpretation
- the researcher needs to document a source that the automated analyser cannot safely identify.

Manual evidence is stored with document hash, instrument, item/domain, source type, source location, reviewer and rationale.

Verification statuses distinguish the researcher's decision from the automated candidate finding. **Not found is never equivalent to No.** If the application cannot establish a criterion from the available document, the researcher is told to inspect the original source and relevant supplementary material.

## Research-safety rules

The application must never invent:

- evidence
- page numbers
- DOI
- authors
- methods
- study characteristics
- source locations.

If information cannot be determined reliably, it must remain uncertain or require researcher verification.

A missing text match does not establish that the activity was not performed.

## Instrument safeguards

### AMSTAR 2

AMSTAR 2 contains 16 items and uses critical-domain judgements to inform overall confidence. The application does not calculate or present a numerical AMSTAR 2 total score.

If no meta-analysis was performed, the relevant AMSTAR 2 items are handled according to the instrument's own response options rather than by applying a generic "not applicable" rule to unrelated items.

### CASP

CASP checklists are design-specific. The researcher must select or confirm the checklist appropriate to the study design. The application does not use one generic CASP score across different designs.

### AGREE II

AGREE II uses 23 items across six domains with a seven-point response scale. Domain scores are calculated separately from the overall assessment.

### GRADE

GRADE is outcome/evidence-base oriented. It is not treated as a generic quality score for a single article. Certainty may remain undetermined when the evidence base is insufficient.

## CFIR 2.0 + KTA

The implementation module supports:

- CFIR 2.0 construct assessment
- rationale and evidence location
- reviewer information
- KTA's seven action-cycle phases
- implementation actions
- responsible person and deadline
- CFIR-to-KTA links
- EF Core persistence
- implementation audit events
- JSON, CSV, XLSX, DOCX and PDF export.

The application does not calculate a CFIR quality score and does not claim that a KTA action will automatically resolve a determinant. It is not a validated CFIR measurement instrument.

## Data and persistence

CFIR/KTA implementation records use EF Core. SQL Server/Azure SQL is used when `ConnectionStrings:DefaultConnection` is configured; local SQLite is available for prototype operation without LocalDB or an external database.

Uploaded research source files are currently processed in memory by document analysis and are not retained by that endpoint. This is not a production research-data governance solution.

## Export

Supported implementation/report exports include:

- JSON
- CSV
- XLSX
- DOCX
- PDF

Exports document the data and judgements stored in the application. They do not independently validate the underlying research appraisal.

## Security

The repository includes:

- CodeQL
- Dependabot
- automated backend/frontend checks
- least-privilege workflow permissions
- upload type/signature/size validation
- SHA-256 document identity
- safe error handling
- security headers.

**Production blocker:** authentication and authorization are not implemented. Do not use the public prototype for patient-identifiable information, health information or confidential research data.

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
