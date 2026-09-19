# Contributing

Thank you for contributing to Academic Research Engine.

## Development

Requirements:

- Node.js 24+
- npm

Install and verify locally:

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Pull requests

1. Keep changes focused and explain the problem being solved.
2. Add or update tests for behavioral changes.
3. Do not commit credentials, private research data, generated `dist/` output, or uploaded documents.
4. Preserve evidence provenance and verification boundaries.
5. Keep AI-generated content clearly distinguishable from verified evidence.
6. Ensure all CI checks pass before requesting review.

For larger architectural changes, open an issue first so the design can be discussed before implementation.

## Research integrity

This project supports research workflows but does not determine whether evidence is scientifically valid or whether an appraisal conclusion is correct. Contributions must preserve explicit provenance and human verification.
