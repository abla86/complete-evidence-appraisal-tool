# Superprogram integration

This repository is an independently demonstrable product module for the broader research superprogram.

## Role

Research Privacy Inspector provides browser-side research inspection: scholarly metadata detection, DOI detection, privacy signals and accessibility signals.

It must remain merge-ready for integration into the master Evidence Appraisal application.

## Boundary

The extension does not own academic reference truth. Citation formatting and validation belong behind the reusable reference-engine contract.

Local inspection may report detected metadata and deterministic drafts, but must not label them as independently verified.

## Integration contract

The future superprogram adapter should provide:

- normalized scholarly metadata
- normalized legal-source metadata
- reference status
- APA 7 reference output
- in-text citation output
- validation errors and warnings

The browser extension may continue to run locally and independently when the master application is not present.
