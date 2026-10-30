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

## 1.0.0 – 2026-10-30

- Local-first appraisal: sessions are created, saved and locked in the browser (previously required a server workflow that the UI never created). Fixed ROBINS-I answer options that the instrument rejected.
- Downloadable offline edition (single HTML file in a zip) and installable web app with full offline cache.
- Ed25519-signed licences: trial, online subscription and one-time download licence; manual issuing script.
- Network policy: every outbound request needs per-category consent (default off), host allow-list and local log. AI analysis no longer sends document text by default. Removed the server document upload endpoint.
- Workspace backup/restore as zip with SHA-256 verification; erasure now removes all app data.
- Legal pages (terms, withdrawal, privacy, cookies, disclaimer, conduct, accessibility) with seller identity.
- Navigation exposes all views; 13 previously unreachable views wired in; duplicate views removed; repaired mis-encoded Norwegian text in 50 files.
- Server: fixed SPA deep links on Express 4, JSON 404 for unknown API routes, CSP allows only the used metadata hosts, no internal error messages in responses.
- Removed archive/ and patches/ (kept in git history) and the duplicate readme.md / bun.lock.
