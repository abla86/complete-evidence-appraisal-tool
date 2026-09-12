# Assessment Data Model and Provenance

The model is designed to preserve the distinction between **source evidence**, **reviewer judgment**, **derived computation** and **AI candidate output**.

## Core entities

```text
Project
  └── Assessment
        ├── StudyReference
        ├── MethodologyVersion
        ├── Reviewer(s)
        ├── ItemResponses
        │     ├── Answer
        │     ├── EvidenceLocation
        │     ├── Rationale
        │     └── ReviewerId
        ├── DerivedAssessment
        ├── AI_CandidateEvidence (optional)
        └── AuditEvents
```

## Assessment identity

Every assessment should have a stable identifier. A finalized version should also have a version number and creation timestamp.

## Methodology lock

An assessment must reference an immutable methodology record containing at least:

- instrument name;
- exact version/date;
- source identifier (DOI/official URL where applicable);
- item definitions;
- response rules;
- critical-domain rules where applicable;
- calculation/interpretation rules;
- licensing metadata.

Changing methodology definitions must create a new version rather than silently modifying historical assessments.

## Evidence provenance

Evidence locations should use a structured representation when possible, for example:

```json
{
  "sourceType": "article",
  "page": 7,
  "section": "Methods",
  "locationDetail": "Risk of bias assessment",
  "quote": "...",
  "reviewerRationale": "..."
}
```

Quoted text must remain subject to copyright and applicable source-use limits. The application should prefer short evidence excerpts and precise source locations rather than storing complete copyrighted publications unnecessarily.

## Derived results

Derived results must identify the calculation engine/version that produced them. The system should be deterministic for identical inputs and methodology versions.

## Instrument-specific interpretation

The data model must not impose a universal numeric score on all instruments. Some tools are intentionally qualitative. AMSTAR 2, for example, uses critical-domain weaknesses to derive an overall confidence category and explicitly states that item responses should not be summed into an overall score (Shea et al., 2017).

## AI candidate records

AI suggestions should be stored separately from final reviewer responses:

```text
AI candidate
    -> reviewer accepts / rejects / edits
    -> final human judgment
```

An AI candidate must never be indistinguishable from a human-authored appraisal decision.

## Audit events

Recommended event types:

- `ASSESSMENT_CREATED`
- `ITEM_UPDATED`
- `AI_CANDIDATE_GENERATED`
- `AI_CANDIDATE_ACCEPTED`
- `AI_CANDIDATE_REJECTED`
- `ASSESSMENT_SUBMITTED`
- `ASSESSMENT_FINALIZED`
- `ADJUDICATION_RECORDED`
- `ASSESSMENT_EXPORTED`
- `ASSESSMENT_DELETED`

Each event should include actor, timestamp, assessment ID, version and application version. Sensitive payloads should not be copied into audit logs.

## Dual review

For independent reviewers, the system should preserve the original assessments and create an explicit adjudication record. Consensus must not overwrite the evidence trail of the independent assessments.

Agreement statistics should identify the statistic and its input definition. For Cohen's kappa, the implementation must document how missing values, categories and prevalence affect the calculation.
