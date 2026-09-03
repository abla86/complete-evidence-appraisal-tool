# Release Notes — 0.9.0

## Status

This release documents the current stabilization work. It must not be considered production-ready until CI completes successfully on the exact `main` revision.

## Stabilization

- Source-record workflow now writes audit events through the canonical audit gateway.
- Appraisal sessions are created through the research-workflow API before synchronization.
- Research-to-appraisal payloads require explicit human verification provenance.
- A local TypeScript declaration covers `http-cache-semantics` for the current dependency graph.
- Temporary patch-record artifacts were removed from the repository.

## Verification gate

The repository CI workflow performs, in order:

1. `npm ci`
2. `npm run lint`
3. `npm run build`
4. `npm test`
5. Docker build and container health verification

`package-lock.json` is required because CI and Docker both use `npm ci`. The lockfile is currently tracked as an open repository prerequisite and must be generated from the current `package.json` before the CI gate can pass reproducibly.

## Known release blocker

`package-lock.json` is absent from `main`. Do not publish a release or claim a green CI state until it has been generated, committed, and validated by CI.

## Architecture notes

The existing audit service uses a hash-chained `AuditEntry` model and asynchronous canonical append operations. The release does not replace that model with a simplified in-memory payload API.

The application uses tab-based navigation in `App.tsx`; no React Router audit routes are introduced by this stabilization work.
