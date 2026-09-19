# Open-source roadmap

## Current objective

Make Academic Research Engine a small, reusable research-software package that can be consumed independently of the Evidence Appraisal application.

## Priorities

1. Maintain deterministic tests and production builds.
2. Keep document-to-evidence provenance explicit and verifiable.
3. Publish stable TypeScript declarations with the package build.
4. Maintain HTTP and TypeScript integration compatibility.
5. Add adapters for common research workflows without coupling appraisal methodology to ingestion/search.
6. Improve contributor documentation and regression coverage before expanding scope.
7. Pursue upstream contributions in TypeScript, Node.js, GitHub Actions, research tooling and security projects where this engine provides relevant experience.

## Integrity boundary

The engine can retrieve, extract, structure and contextualize research evidence. It must not silently turn AI-generated candidate content into a verified research finding or appraisal decision.

## Good contribution areas

- extraction edge cases
- provenance regression tests
- citation formatting
- API validation
- TypeScript ergonomics
- documentation
- interoperability adapters
- security and supply-chain hardening
