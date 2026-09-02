# Reference Engine

The reference engine is intentionally separable from the Evidence Appraisal application.

## Purpose

Provide one reusable boundary for:

- APA 7 scholarly references
- Norwegian legal and regulatory references
- in-text citations
- reference completeness and syntax validation
- explicit distinction between formatted, validation-required, and independently verified references

## Integration contract

Consumers should call `src/services/sharedReferenceEngine.ts` rather than constructing APA/legal references inside UI components.

The engine is deterministic and local. Network-based DOI or bibliographic verification must remain an explicit, separate capability.

## Status semantics

- `INVALID`: required metadata or syntax is invalid; no reference is emitted.
- `VALIDATION_REQUIRED`: reference can be generated, but source truth has not been independently verified.
- `VALIDATED`: reserved for a future explicit verification workflow that actually checks the source against an authoritative bibliographic record.

A syntactically valid reference must never be labelled verified.
