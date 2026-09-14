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
