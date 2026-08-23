# Evidence Appraisal Tool

[![CI](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/ci.yml)
[![CodeQL](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/codeql.yml/badge.svg)](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/codeql.yml)

## Live application

[Open Evidence Appraisal Tool](https://evidence-appraisal-tool.onrender.com)

A full-stack research workspace for transparent, structured and traceable critical appraisal. It supports AMSTAR 2, CASP, AGREE II, GRADE and an implementation-science extension using CFIR 2.0 and the Knowledge-to-Action (KTA) framework.

The application is designed to **support researchers, not replace researcher judgement**. Automated document analysis produces candidate findings only. It must never be interpreted as an automatic scientific conclusion.

## Research workflow

The intended workflow is:

```text
Document
  ↓
Document classification
  ↓
Evidence extraction
  ↓
Evidence Map
  ↓
Instrument suitability
  ↓
Candidate findings
  ↓
Researcher verification
  ↓
Reviewer appraisal
  ↓
Second reviewer
  ↓
Disagreement / consensus
  ↓
Final appraisal
  ↓
Audit trail
  ↓
Export
```

The application is organised as an academic research workspace rather than a generic application menu:

- dashboard and project overview
- critical appraisal for AMSTAR 2, CASP, AGREE II and GRADE
- CFIR 2.0 + KTA implementation workspace
- reviewer and consensus information
- evidence and traceability workspace
- research-document upload and analysis
- manual evidence entry when automated extraction is incomplete
- responsive navigation for desktop, laptop, tablet and smaller screens

## Research document analysis

From **Evidence & traceability**, the user can select **+ Legg til forskningsdokument** and upload supported research material.

Supported formats:

- PDF
- DOCX
- TXT
- HTML / HTM
- XML / JATS XML where supplied by the publisher

The current upload limit is 25 MB.

The application validates the file type/signature where applicable, calculates a SHA-256 hash and extracts text without modifying the original document. PDF files are analysed page by page. DOCX, TXT, HTML and XML are converted into source units for analysis.

For XML/JATS, text is extracted from the XML structure. Detailed section/table/figure semantics are still treated conservatively and must be verified against the original article.

### What the analysis does

The analysis can:

- classify a document type heuristically
- report classification confidence and signals
- assess whether a selected instrument appears suitable, unsuitable or requires caution
- locate potentially relevant passages
- report source page/kildenhet where reliably available
- show matched terms and excerpts
- calculate and display the document SHA-256 hash
- flag missing selectable text
- warn when no candidate passage is found
- identify candidate evidence for the selected instrument areas

### What the analysis does NOT do

It does not automatically decide:

- AMSTAR 2 answers
- CASP answers
- AGREE II ratings
- GRADE certainty
- overall study quality
- clinical recommendations
- policy recommendations.

A text match is **candidate evidence**, not a final judgement.

## Non-negotiable research-safety rules

### Not found is not No

If the application cannot find information, it must not convert that absence into a negative answer.

For example:

> "No protocol information was identified in the available document. This does not establish that no protocol exists. Check the article, supplement, registry or protocol manually."

The researcher can then add the evidence manually.

### Uncertainty is preserved

The application explicitly distinguishes candidate, uncertain and verified information. If context cannot be interpreted reliably, the researcher is asked to inspect the original source.

The application must never invent:

- evidence
- page numbers
- DOI
- authors
- methods
- source locations
- study characteristics.

If information cannot be determined reliably, the application reports that limitation rather than guessing.

### Manual evidence

Researchers can use **+ Legg til evidens manuelt** when information is found in:

- the main article
- supplementary material
- protocol
- registry
- author correspondence
- external source
- a manual research note.

Manual evidence is labelled **Manually added** and is persisted with:

- document hash
- instrument
- item/domain
- evidence text
- source type
- page/section/table/figure where supplied
- DOI/URL where supplied
- reviewer
- rationale
- timestamp.

This keeps researcher-added evidence distinguishable from automated candidate findings.

## Document version identity

Every analysed document receives a SHA-256 hash. The hash identifies the exact file version used for the analysis. Existing appraisal data must not be silently mixed with a different document version.

## Instrument safeguards

### AMSTAR 2

- 16 items
- critical-domain handling
- evidence location and rationale
- researcher-controlled final judgement
- **no numerical total score**

AMSTAR 2 is a critical-appraisal instrument for systematic reviews of healthcare interventions. The application does not turn it into a generic quality score.

### CASP

CASP is design-specific. The researcher must select or confirm the appropriate checklist for the study design. The application does not use one generic CASP score across unrelated designs.

### AGREE II

- 23 items
- six domains
- 1–7 response scale
- standardised domain calculations
- rationale and evidence location
- separate overall assessment

The application does not invent an unsupported single aggregate quality score.

### GRADE

GRADE is outcome/evidence-base oriented. It is not treated as a generic quality score for a single article.

The intended workflow is outcome-based and includes the relevant certainty domains, rationale and supporting evidence. If the evidence base is insufficient, the certainty assessment can remain undetermined.

## CFIR 2.0 + KTA

The implementation module is integrated into the main application and supports:

- CFIR 2.0 construct catalogue
- researcher-entered determinant judgements
- rationale and evidence location
- reviewer and consensus fields
- seven KTA action-cycle phases
- implementation actions
- owner, deadline and status
- explicit CFIR links
- EF Core persistence
- project audit events
- JSON, CSV, XLSX, DOCX and PDF export
- project overview and audit endpoints.

**Methodological boundary:** CFIR is a determinant framework and KTA is a knowledge-to-action/action-cycle framework. The application does not calculate a CFIR quality score or claim that a KTA action will solve a determinant.

The application should not be described as a validated CFIR questionnaire.

## Persistence and database configuration

Implementation and manually entered evidence use EF Core. If `ConnectionStrings:DefaultConnection` is supplied, SQL Server/Azure SQL is used. When no connection string is supplied, local SQLite databases are used so the application can run without LocalDB or an external database.

The public prototype is not a substitute for an institutionally governed research-data environment. Production research use requires appropriate authentication, authorisation, encryption, access control, backup, retention and institutional governance.

## Export

The implementation module provides server-side JSON, CSV, XLSX, DOCX and PDF exports. Existing AMSTAR 2 reporting/export remains available.

Research-document/evidence reporting is intended to distinguish:

- automated candidate findings
- researcher-verified evidence
- final judgements
- disagreements
- consensus
- unresolved items
- methodological warnings.

## Methodological safeguards

The application validates structure and documentation. It does not read articles and declare them high- or low-quality automatically.

Researchers must verify candidate findings against:

1. the original document
2. surrounding context
3. supplementary material when relevant
4. protocol/registry when relevant
5. the authorised appraisal instrument
6. current official methodological guidance.

A missing text match must never be interpreted as evidence that an activity did not occur.

## AI boundary

If an AI layer is added, it must operate as an assistant only. AI output must remain a candidate finding with evidence, location, confidence and uncertainty. It must be possible to accept, edit, reject or comment on the finding.

AI must never be presented as having completed or validated a scientific appraisal automatically.

The application must not send research documents to an external AI service without an explicitly controlled server-side integration, appropriate data-processing information and protection of API credentials.

## Security and DevSecOps

- CodeQL for C# and JavaScript/TypeScript
- Dependabot monitoring
- automated backend build and tests
- automated frontend tests, lint and production build
- least-privilege GitHub Actions permissions
- secret exclusion through `.gitignore`
- published security policy
- production security headers
- upload type/signature/size validation
- SHA-256 document identity
- in-memory document analysis rather than automatic persistence of uploaded source files
- explicit manual-evidence persistence rather than silent storage of uploaded files
- safe error handling.

Do not place API keys, database passwords or deployment secrets in source code, frontend code or the public repository.

## Ownership and licence

Copyright © 2026 Anne Beth Andersen. All rights reserved.

The repository is publicly visible as a professional portfolio. The author's original source code, architecture, implementation and documentation are proprietary. No open-source licence is granted. Viewing the public repository does not grant permission to copy, modify, redistribute, rebrand, sublicense or commercially exploit the author's original work without written permission.

See [`LICENSE`](LICENSE) for the complete ownership and usage terms. Third-party appraisal instruments, trademarks, libraries and other third-party material remain subject to their respective rights and licences.

## Local development

Backend:

```powershell
dotnet run --project .\backend\EvidenceAppraisal.Api\EvidenceAppraisal.Api.csproj
```

Frontend:

```powershell
Set-Location .\frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

API: `http://localhost:5237`

## Verification

Backend:

```powershell
dotnet build EvidenceAppraisalTool.sln
dotnet test EvidenceAppraisalTool.sln --no-build
```

Frontend:

```powershell
Set-Location .\frontend
npm ci
npm test
npm run lint
npm run build
```

Strict repository audit:

```powershell
.\tools\audit-and-build.ps1
```

A passing software audit does not establish methodological validity, clinical validity, security certification or regulatory approval.

## Methodological sources

AGREE Next Steps Consortium. (2017). *The AGREE II instrument* (electronic version). https://www.agreetrust.org/resource-centre/agree-ii/

Critical Appraisal Skills Programme. (2024). *CASP checklists*. https://casp-uk.net/casp-tools-checklists/

Damschroder, L. J., Reardon, C. M., Opra Widerquist, M. A., & Lowery, J. (2022). The updated Consolidated Framework for Implementation Research based on user feedback. *Implementation Science, 17*, 75. https://doi.org/10.1186/s13012-022-01245-0

Graham, I. D., Logan, J., Harrison, M. B., Straus, S. E., Tetroe, J., Caswell, W., & Robinson, N. (2006). Lost in knowledge translation: Time for a map? *Journal of Continuing Education in the Health Professions, 26*(1), 13–24. https://doi.org/10.1002/chp.47

GRADE Working Group. (2026). *GRADE Book*. https://book.gradepro.org/

Shea, B. J., Reeves, B. C., Wells, G., Thuku, M., Hamel, C., Moran, J., Moher, D., Tugwell, P., Welch, V., Kristjansson, E., & Henry, D. A. (2017). AMSTAR 2: A critical appraisal tool for systematic reviews that include randomised or non-randomised studies of healthcare interventions, or both. *BMJ, 358*, j4008. https://doi.org/10.1136/bmj.j4008

## Scope statement

Evidence Appraisal Tool is a research-support application. It is not itself a validated measurement instrument, medical device, clinical decision-support system or guarantee of methodological correctness. Researchers remain responsible for confirming source evidence, selecting the correct appraisal instrument, applying current guidance and making the final scientific judgement.
