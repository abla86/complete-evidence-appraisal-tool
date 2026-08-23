# Evidence Appraisal Tool

[![CI](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/ci.yml)
[![CodeQL](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/codeql.yml/badge.svg)](https://github.com/abla86/evidence-appraisal-tool/actions/workflows/codeql.yml)

## Live demo

[Open Evidence Appraisal Tool](https://evidence-appraisal-tool.onrender.com)

A full-stack research application for transparent, structured and traceable critical appraisal. It supports AMSTAR 2, CASP, AGREE II, GRADE and an implementation-science extension using CFIR 2.0 and the Knowledge-to-Action (KTA) framework.

## Research workspace

The frontend is organised as an academic research workspace rather than a generic application menu:

- dashboard with project and implementation status
- critical-appraisal workspace for AMSTAR 2, CASP, AGREE II and GRADE
- CFIR 2.0 + KTA implementation workspace
- project overview with reviewer roles, consensus status and audit trail
- evidence and traceability workspace for source location and rationale documentation
- responsive navigation for desktop and smaller screens

## CFIR 2.0 + KTA

The implementation module is integrated into the main application and supports:

- five CFIR 2.0 domains and the structured 48-construct catalogue
- researcher-entered determinant judgements with rationale and evidence location
- multi-reviewer fields and consensus documentation
- seven KTA action-cycle phases represented as an iterative/bidirectional process
- implementation actions with owner, deadline, status and explicit CFIR links
- EF Core persistence for CFIR assessments, KTA phases, actions and links
- persistent project audit events recording reviewer, field, old/new value, reason and timestamp
- JSON, CSV, XLSX, DOCX and PDF export for implementation records
- project overview endpoints and reviewer/audit-trail UI
- validation before persistence and export

**Methodological boundary:** CFIR is a determinant framework and KTA is a knowledge-to-action/action-cycle framework. The application does not calculate a CFIR quality score or an implementation-effectiveness percentage, and it does not infer that a selected KTA action will solve a determinant.

**CFIR scope limitation:** the application exposes the structured 48-construct catalogue. CFIR 2.0 includes project-specific operationalization and subconstruct considerations; researchers must document these where relevant. The application must not be described as a validated CFIR questionnaire.

## Persistence and database configuration

Implementation persistence uses EF Core. If `ConnectionStrings:DefaultConnection` is supplied, SQL Server/Azure SQL is used. When no connection string is supplied, the application uses a local SQLite database (`implementation.db`) so the prototype can run without LocalDB or an external database.

The SQLite fallback is suitable for local/prototype use and should not be treated as a durable production research-data store. A production deployment requires an appropriate managed database, authentication, authorization, encryption and research-data governance.

## Export

The implementation module provides server-side JSON, CSV, XLSX, DOCX and PDF exports. Export is performed only after structural validation. Exports are documentation of entered data, not automated scientific conclusions.

## Other research modules

### AMSTAR 2
- all 16 items
- critical-domain prespecification and rationale
- evidence location and researcher rationale
- researcher-confirmed overall confidence
- Word, PDF, Excel and JSON export
- no prohibited numerical total score

### CASP
- researcher-selected authorised design-specific checklist
- checklist title, version and official source URL
- Yes/No/Cannot tell responses with rationale and evidence location
- structural completeness validation without an automatic quality total

### AGREE II
- 23 item ratings on the 1–7 scale
- item rationale and evidence location
- six standardised domain scores
- overall quality and recommendation recorded separately
- no unsupported single aggregate quality score

### GRADE
- outcome-level certainty assessment
- PICO, effects, studies and participants
- downgrade and upgrade domains
- provisional certainty category kept separate from researcher confirmation

## Methodological safeguards

The application validates structure and documentation. It does not read articles, infer answers, determine research quality automatically or replace methodological judgement. Researchers must use the authorised instrument and current official guidance alongside the application.

Do not enter personal health information, confidential research data or directly identifying information into the public demo. Use pseudonymous reviewer codes and an appropriately governed database for real research data.

## Security and DevSecOps

- CodeQL analysis for C# and JavaScript/TypeScript
- Dependabot monitoring for NuGet, npm and GitHub Actions
- automated backend build and tests
- automated frontend tests, lint and production build
- least-privilege GitHub Actions permissions
- local secret exclusion through `.gitignore`
- published security policy
- production browser security headers
- SHA-256 verification for exported AMSTAR 2 reports
- strict repository audit script

## Strict local audit

Run from PowerShell at the repository root:

    .\tools\audit-and-build.ps1

A passing audit means the configured software checks passed on the machine where the audit was run. It does not establish methodological validity, clinical validity, security certification or production readiness.

## Technology

Frontend: React, Vite, JavaScript, Vitest, Testing Library and ESLint.

Backend: ASP.NET Core, .NET 9, C#, xUnit, EF Core SQL Server/SQLite, Open XML SDK, PDFsharp and MigraDoc.

## Run locally

Backend:

    dotnet run --project .\backend\EvidenceAppraisal.Api\EvidenceAppraisal.Api.csproj

Frontend:

    Set-Location .\frontend
    npm install
    npm run dev

Frontend: http://localhost:5173
API: http://localhost:5237

## Verification

Backend:

    dotnet build EvidenceAppraisalTool.sln
    dotnet test EvidenceAppraisalTool.sln --no-build

Frontend:

    Set-Location .\frontend
    npm ci
    npm test
    npm run lint
    npm run build

## Methodological sources

AGREE Next Steps Consortium. (2017). *The AGREE II instrument* (electronic version). https://www.agreetrust.org/resource-centre/agree-ii/

Critical Appraisal Skills Programme. (2024). *CASP checklists*. https://casp-uk.net/casp-tools-checklists/

Damschroder, L. J., Reardon, C. M., Opra Widerquist, M. A., & Lowery, J. (2022). The updated Consolidated Framework for Implementation Research based on user feedback. *Implementation Science, 17*, 75. https://doi.org/10.1186/s13012-022-01245-0

Graham, I. D., Logan, J., Harrison, M. B., Straus, S. E., Tetroe, J., Caswell, W., & Robinson, N. (2006). Lost in knowledge translation: Time for a map? *Journal of Continuing Education in the Health Professions, 26*(1), 13–24. https://doi.org/10.1002/chp.47

GRADE Working Group. (n.d.). *GRADE*. https://www.gradeworkinggroup.org/

Shea, B. J., Reeves, B. C., Wells, G., Thuku, M., Hamel, C., Moran, J., Moher, D., Tugwell, P., Welch, V., Kristjansson, E., & Henry, D. A. (2017). AMSTAR 2: A critical appraisal tool for systematic reviews that include randomised or non-randomised studies of healthcare interventions, or both. *BMJ, 358*, j4008. https://doi.org/10.1136/bmj.j4008

## Ownership and licence

Copyright © 2026 Anne Beth Andersen. All rights reserved.

The repository is publicly visible as a professional portfolio. The author's original source code, architecture, implementation and documentation are proprietary. No open-source licence is granted. Viewing the public repository does not grant permission to copy, modify, redistribute, rebrand, sublicense or commercially exploit the author's original work without written permission.

See [`LICENSE`](LICENSE) for the complete ownership and usage terms. Third-party appraisal instruments, trademarks, libraries and other third-party material remain subject to their respective rights and licences.
