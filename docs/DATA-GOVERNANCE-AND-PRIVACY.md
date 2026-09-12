# Data Governance, Privacy and Security Architecture

## Scope

This document translates the DMP into software-level controls. It does not constitute a legal determination, DPIA, research ethics approval or institutional security approval.

## Data minimisation

The core appraisal workflow requires research-publication metadata and appraisal judgments. It should operate without patient identifiers or clinical case information.

Free-text fields are a residual privacy risk because users can voluntarily enter information that the application does not require. Production deployments should therefore provide visible warnings and, where practical, server-side detection/validation for clearly prohibited identifiers.

## Data classification

| Class | Example | Default handling |
|---|---|---|
| Public | instrument metadata, public DOI | publishable if rights permit |
| Internal | project configuration | authenticated access |
| Confidential | reviewer identity, unpublished appraisal work | restricted project access |
| Restricted | personal/special-category data if ever approved | dedicated approved environment; minimised access |

Classification must be determined from the actual data and processing context.

## Threat model

Primary threats include:

- unauthorized account access;
- insecure OAuth/session handling;
- cross-project data exposure;
- malicious or malformed uploaded documents;
- prompt injection through uploaded research documents when AI is used;
- accidental disclosure through logs;
- insecure direct object references;
- dependency vulnerabilities;
- secret leakage in source control;
- unauthorized alteration of finalized assessments.

## Security invariants

1. Authorization is enforced on the server for every protected resource.
2. A user cannot access another project's assessment by changing an identifier in a URL or request body.
3. Finalized assessment snapshots are immutable; corrections create a new version or documented adjudication event.
4. Authentication secrets are never exposed to the browser or repository.
5. AI-generated content cannot directly overwrite a human appraisal decision.
6. Logs contain operational identifiers rather than sensitive document contents.
7. File uploads are validated by type/size and processed in a restricted context.
8. Production secrets are supplied through the deployment secret store/environment, not source files.

## OAuth/session baseline

Google OAuth uses the application's own callback. Redirect URIs must exactly match the configured deployment. Session cookies should be Secure, HttpOnly and appropriately SameSite-configured in production. Authentication endpoints should be rate-limited and failures should not reveal unnecessary account information.

## Upload security

Research PDFs and office documents are untrusted input. The application should:

- enforce size limits;
- validate file type using content as well as extension where feasible;
- avoid executing uploaded content;
- isolate parsing operations where practical;
- reject unsupported formats;
- avoid placing raw uploaded text into logs;
- treat document content as untrusted input for AI workflows.

## AI threat controls

A paper can contain text that attempts to influence an AI system. Therefore extracted document text must be treated as data, not instructions. The AI layer must not be granted direct write authority over final appraisal records.

Recommended flow:

`document -> extraction -> candidate evidence -> human review -> persisted appraisal`

not:

`document -> AI -> final appraisal`.

## Audit trail

Audit records should capture event type, actor, timestamp, assessment/version identifier and application/methodology version. They should not routinely contain full document text, access tokens, passwords or other secrets.

## Backup and recovery

Production deployments must define backup frequency, retention, restore testing and recovery objectives appropriate to the project. A backup that has never been restored in testing should not be treated as a verified recovery mechanism.

## Incident response

The deployment owner must have a procedure for detecting, containing, documenting and reporting security/privacy incidents. Any suspected breach involving personal data must be handled under the applicable institutional and legal procedures.

## Verification checklist

- [ ] No secrets committed to Git
- [ ] Secret scanning enabled
- [ ] Dependency scanning enabled
- [ ] Static security analysis enabled
- [ ] Authentication tests pass
- [ ] Authorization/isolation tests pass
- [ ] Upload validation tests pass
- [ ] Audit-trail integrity tests pass
- [ ] AI cannot directly finalize an appraisal
- [ ] Production TLS enabled
- [ ] Secure session-cookie configuration verified
- [ ] Backup restore tested
- [ ] Privacy/security assessment completed for the actual deployment
