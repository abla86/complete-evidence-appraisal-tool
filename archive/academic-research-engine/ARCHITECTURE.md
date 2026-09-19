# Architecture

The standalone Academic Research Engine is a reusable shared research service. The Complete Evidence Appraisal Tool is the primary consumer/super-application.

```text
                    COMPLETE EVIDENCE APPRAISAL TOOL
                              (SUPER APP)
                                     |
              +----------------------+----------------------+
              |                      |                      |
        Research Engine       Appraisal Engines        Audit/Validation
              |                      |                      |
       +------+------+        +------+------+        +-------------+
       |             |        | AMSTAR2     |        | provenance  |
    Documents      Search     | JBI        |        | audit trail |
       |             |        | CASP       |        | dual review |
       +------+------+
              |
       Evidence provenance
       document -> location -> quote

Standalone mode:
Any compatible application -> Research Engine
```

## Boundary

Research Engine owns document ingestion, extraction, source search, source-grounded question answering, evidence provenance and citation formatting.

The super-app owns appraisal decisions, methodology-specific scoring/rating rules, validation, dual review and audit workflows.

AI suggestions are candidates only. The engine does not silently convert AI output into appraisal decisions.

## Integration modes

1. HTTP API integration.
2. TypeScript module integration.
3. Embedded service in the Complete Evidence Appraisal Tool.
4. Standalone browser/API application.

## Single-source principle

There should be one research/evidence pipeline. Consumer applications should call the Research Engine rather than copying its document, search and citation logic.
