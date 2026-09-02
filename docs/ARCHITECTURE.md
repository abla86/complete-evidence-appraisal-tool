# Complete Evidence Appraisal Tool — Canonical Architecture

## System role

`complete-evidence-appraisal-tool` is the superprogram. It owns research workflow, study/design classification, critical appraisal, evidence synthesis, validation, dual review, and auditability.

## Shared Research Engine

`academic-research-engine` is the reusable research subsystem. It can run standalone and can also be embedded in this superprogram.

The Research Engine owns:
- document ingestion/extraction
- source library
- deterministic source search
- source-grounded AI assistance
- evidence provenance
- citation formatting
- reusable integration API

The superprogram owns:
- appraisal instruments and methodology contracts
- AMSTAR 2
- JBI
- CASP
- AGREE II
- RoB 2
- GRADE / CERQual integration
- study-design gating
- dual review and consensus
- gold-standard/reference validation
- audit trail

## Single-flow principle

The canonical data flow is:

`source -> document -> extracted evidence -> location/quote -> study design -> appraisal -> synthesis -> report`

AI may propose candidate extraction or classification. It must not silently convert candidate output into a human appraisal decision.

## No duplicate services

The superprogram's existing `DocumentParserService` and `EvidenceIntelligenceService` remain authoritative for the superprogram. The standalone Research Engine must expose a compatible boundary rather than duplicating or replacing those domain services.

## Reuse modes

### Integrated

`complete-evidence-appraisal-tool` calls the Research Engine for source/workspace capabilities and passes the resulting evidence objects into appraisal workflows.

### Standalone

`academic-research-engine` provides the same research capabilities without requiring the appraisal UI or domain modules.

### Other applications

The same engine may be mounted behind another application through its HTTP API or TypeScript service boundary.
