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
- `package-lock.json` is present and suitable for `npm ci`.
- No React Router audit paths were added; the application continues to use its existing tab-based navigation.

### Current verification state
- GitHub status data available to this integration does not expose a completed CI result for the latest `main` revision.
- Runtime success of `npm test` and `npm run build` is therefore not asserted.
- Release remains blocked until CI produces a successful verification result on the release candidate.
