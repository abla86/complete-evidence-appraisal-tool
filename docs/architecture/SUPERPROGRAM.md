# Superprogram architecture

## Target

The project is the master application. Feature modules may also exist as independently demonstrable components, but they must remain merge-ready.

## Structure

- `src/` — core application and integrated research workflow
- `src/features/` — independently demonstrable product features
- `src/shared/` — shared contracts, utilities and integration boundaries
- `src/services/` — domain services
- `docs/architecture/` — integration and boundary documentation

## Merge rule

A standalone feature is not a separate product fork. Its code must be designed so it can be merged into the master application without duplicating business logic or changing the source-of-truth semantics.

## Reference engine

The reference engine is intentionally maintained as a separate reusable project. The superprogram consumes it through an explicit adapter/contract. No component may silently implement a second APA/legal formatter when the shared engine is available.

## Status semantics

Formatting, metadata completeness and source verification are separate concepts.

- `COMPLETE`: required metadata is present and a deterministic reference can be generated.
- `INCOMPLETE`: a draft may be possible, but required metadata is missing.
- `UNVERIFIABLE`: the available local evidence is insufficient to establish source truth.
- `VALIDATION_REQUIRED`: syntax and required fields pass local validation, but this is not proof that the bibliographic source is true.
- `INVALID`: the input fails validation.

A syntactically valid reference must never be represented as independently verified unless an explicit verification step has actually succeeded.
