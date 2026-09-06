# Evidence — Private Product & IP Boundary

## Status

Evidence is developed as a **private, proprietary software product**. The GitHub repository is a private source-code repository and is not an open-source distribution channel.

This document defines the product boundary so that future engineering work does not accidentally turn proprietary implementation, research projects, credentials, or protected source material into public assets.

## 1. Product boundary

### Private by default

The following remain private unless an explicit release decision says otherwise:

- application source code;
- backend and frontend implementation;
- agent orchestration and internal prompts;
- proprietary skills and evaluation logic;
- research projects and user workspaces;
- appraisal records and audit trails;
- internal test fixtures containing non-public research material;
- credentials, tokens, OAuth secrets and deployment configuration;
- private model configuration;
- internal operational telemetry.

### Potentially distributable

A future commercial or controlled release may expose:

- compiled application binaries;
- a hosted web application;
- licensed desktop/web software;
- public documentation;
- intentionally released examples;
- non-sensitive demonstration datasets;
- an API, where appropriate.

Distribution of the program does **not** imply distribution of the source code.

## 2. Evidence and research-data boundary

Evidence must distinguish between:

1. bibliographic metadata;
2. licensed or user-provided full text;
3. extracted evidence;
4. researcher interpretation;
5. AI candidate suggestions;
6. verified appraisal decisions.

The system must not assume that a source being discoverable online grants redistribution rights. Copyright, database rights, publisher terms, API terms, and applicable licences must be respected.

## 3. Architecture principle

The core should remain provider-neutral:

```text
Evidence Product
      |
      +-- Research Workspace
      +-- Evidence Store
      +-- Retrieval
      +-- Appraisal Engines
      +-- Verification
      +-- Synthesis
      +-- Citation/Provenance
      +-- Agent Orchestration
      +-- Skills
      +-- Audit/Observability
      |
      +-- Model Provider Adapter
             +-- Google/Gemini
             +-- OpenAI
             +-- Other supported providers
```

Provider-specific integrations must not become a requirement for the core evidence model.

## 4. Research integrity boundary

AI-generated output is never equivalent to verified evidence.

The product must preserve:

```text
Claim
  -> Evidence record
  -> Source
  -> Exact location
  -> Verification status
  -> Human decision
```

Automatic retrieval or extraction may produce a candidate. It must not silently convert a missing finding into a negative finding.

## 5. Repository rules

- Keep the repository private.
- Never commit secrets.
- Never commit real patient-identifiable information.
- Never commit confidential research material unless explicitly authorised and appropriately protected.
- Use synthetic or public-domain fixtures for automated tests where possible.
- Do not add third-party source text merely because it is useful for a demo.
- Treat public README/documentation as potentially discoverable even while the repository is private.
- Before any public release, perform a dedicated IP, licence, security and data review.

## 6. Release model

No public source-code release is assumed.

A future release decision should explicitly choose one of:

- private internal deployment;
- licensed desktop/web application;
- hosted SaaS;
- controlled institutional deployment;
- selected public components with the proprietary core retained privately.

Until such a decision is made, **private proprietary** is the default.

## 7. Definition of done for productisation

Before Evidence is distributed outside the development environment, the release candidate should have:

- reproducible production build;
- automated tests;
- security review;
- dependency/licence review;
- secrets scan;
- data-boundary review;
- authentication and authorisation review;
- audit/provenance verification;
- backup/recovery plan;
- documented deployment procedure;
- documented user-facing limitations;
- explicit separation between AI suggestions and researcher decisions.
