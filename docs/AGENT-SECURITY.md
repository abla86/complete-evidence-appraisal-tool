# Agent Security Module

This module is a deterministic application-layer security core for AI-agent workflows.

It is intentionally separate from the evidence-appraisal domain. It does **not** claim to make an LLM intrinsically safe and it does not replace model-level safety controls.

## Security problem addressed

The security boundary is the transition from untrusted context to consequential agent actions.

The module therefore tracks:

1. provenance of context;
2. trust classification;
3. requested tool/action;
4. action risk;
5. allow/deny policy;
6. human-confirmation requirements;
7. a reproducible decision record.

This addresses a gap that is broader than lexical prompt filtering: an agent should not be authorized merely because text passed a prompt filter.

## Design

`src/security/`

- `types.ts` — security domain types.
- `hash.ts` — SHA-256 and canonical JSON utilities.
- `provenance.ts` — provenance graph and untrusted-path detection.
- `authorization.ts` — deterministic least-privilege authorization decisions.
- `agentSecurityEngine.ts` — assessment orchestration.
- `securitySelfTest.ts` — executable adversarial policy tests.

## Decision model

`ALLOW` means the request satisfies the configured policy.

`DENY` means at least one hard policy boundary was violated.

`CONFIRM` means the request is permitted only after an explicit human confirmation step.

The engine checks:

- tool allow-list;
- explicitly denied actions;
- maximum permitted risk;
- untrusted provenance;
- confirmation requirements.

## Important limitation

This is **not** a prompt-injection detector by itself. A malicious instruction can be linguistically subtle, and no deterministic lexical rule can establish that arbitrary natural language is safe.

The stronger security boundary implemented here is:

> untrusted context must not automatically become authorization to perform a consequential action.

That distinction is deliberate and is consistent with current agent-security guidance emphasizing least privilege, authorization boundaries, provenance/context risks, confirmation for consequential actions, and adversarial validation.

## Run the self-test

```bash
npm run test:security
```

The test suite is dependency-light and uses deterministic fixtures. It verifies trusted low-risk access, untrusted provenance denial, tool allow-list enforcement, denied actions, and human confirmation for high-risk actions.

## Research / portfolio direction

The module is designed to support future measurable experiments rather than a claim of novelty. Useful extensions include:

- attack-case corpus with provenance labels;
- policy-ablation experiments;
- false-allow / false-deny measurement;
- end-to-end tool-call simulations;
- policy regression tests in CI;
- decision-ledger export;
- MCP-specific tool poisoning and intent-flow scenarios.

The research question should be stated as an empirical question, not as a claim that the implementation is novel.

## Why this is separate from Evidence Appraisal

Evidence appraisal evaluates research methodology and evidence quality.

Agent Security evaluates whether an AI-enabled application can maintain a security boundary between data, instructions, provenance and authorized actions.

They can coexist in the same repository without sharing domain logic.
