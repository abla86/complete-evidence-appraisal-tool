# Security Policy

## Supported versions

The default branch (`main`) is the supported development line.

## Security controls

This repository uses layered security controls, including:

- GitHub CodeQL code scanning
- OpenSSF Scorecard
- dependency review on pull requests
- scheduled and push-triggered `npm audit`
- Dependabot updates for npm and GitHub Actions
- least-privilege GitHub Actions permissions
- protected, non-fast-forward `main` branch rules
- CI build, test and Docker validation
- `persist-credentials: false` for security-sensitive checkouts

Security checks are intended to fail closed where practical. Type checking is also a required CI gate; compiler errors must be fixed rather than suppressed.

## Secrets

Never commit API keys, tokens, passwords, `.env` files, certificates, private keys, credentials, or other secrets.

Use GitHub Actions secrets or environment-level secret storage for CI credentials. Workflows should request only the permissions they need.

## Reporting a vulnerability

Do not disclose security vulnerabilities in public issues.

Use GitHub's private vulnerability reporting if it is enabled for this repository. If private reporting is unavailable, contact the repository owner privately before disclosure.

Please include:

- affected version or commit
- affected component/file
- reproduction steps or proof of concept
- security impact
- suggested mitigation, if known

Do not include real patient data, personal data, production credentials, or other sensitive information in a report.

## Healthcare and evidence-processing boundary

The application may process research and evidence-related information. It must not be treated as an autonomous clinical decision-maker. AI-generated classifications, summaries, or suggestions require human verification before being used for research or clinical purposes.

## Data flows (summary)

| Data | Leaves the device? | Control |
|---|---|---|
| PDFs, DOCX and pasted documents | Never. Parsed in the browser; the server has no upload endpoint. | `pdfRuntime.ts`, `documentParserService.ts` |
| Appraisals, references, notes, audit log | Only if the user enables cloud sync | `networkPolicy.ts` category `cloud` (default off) |
| Search terms, DOIs, PubMed IDs | Only if the user enables literature search | category `metadata`, host allow-list |
| Document text for AI suggestions | Only with AI consent and per-analysis confirmation | category `ai`; server applies PII filtering and output guardrails |
| Licence key | Sent to the app's own server only to enable server features or renew a subscription | `licenseClient.ts` |

Defence in depth: a strict Content-Security-Policy is sent as an HTTP header (web edition) and embedded as a meta tag (downloadable edition), so the browser itself blocks requests to hosts outside the allow-list. The licence private key (`LICENSE_PRIVATE_KEY`) must only exist in the server's secret store and must never be placed in a `VITE_` variable (those are embedded in client bundles).

Known limitations: browser local storage is not tamper-proof, and client-side licence checks are not copy protection.
