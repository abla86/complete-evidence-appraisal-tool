# Changelog

## 0.9.0 — Stabilization

### Changed
- SourceRecord workflow uses the canonical audit gateway.
- Appraisal session creation is initiated through the research-workflow API.
- Research-to-appraisal requires explicit human verification provenance.
- Added a local TypeScript declaration for `http-cache-semantics`.

### Removed
- Temporary patch-record files that did not participate in runtime behavior.

### Verification
- CI and Docker require `package-lock.json` because they use `npm ci`.
- The release remains blocked until the lockfile is generated from the current dependency manifest and CI passes on `main`.
- No React Router audit paths were added; the application continues to use its existing tab-based navigation.

### Not claimed as complete
- A successful `npm test` / `npm run build` run has not been established from the current `main` revision through the available GitHub status data.
