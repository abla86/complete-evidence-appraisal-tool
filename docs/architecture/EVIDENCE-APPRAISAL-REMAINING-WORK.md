# Evidence Appraisal Superprogram — Remaining Work

This is the implementation gap list for `main`. It deliberately separates what already exists from what still needs real executable integration.

## Already present in the repository

- JBI Qualitative 2017 appraisal surface with the 10-question qualitative judgement workflow.
- Evidence/rationale/location fields and audit trail support.
- SourceRecord workflow, screening lifecycle, provenance and SHA-256 integrity fields.
- Study-design advisory and methodology/instrument registry.
- CASP, AMSTAR 2, AGREE II, RoB 2 and other instrument registrations/engines where implemented.
- Research search and document-analysis services.
- Dual-review, peer-review and consensus infrastructure.
- Autosave/snapshot/restore and project import/export infrastructure.
- Privacy and accessibility inspection signals.
- Reference Hub with a single reference boundary, import/export support and explicit verification semantics.
- Academic Writing Studio, claim/evidence structures and citation audit/export gating.
- Meta-research/integrity surfaces.
- GitHub repository privacy and a CI workflow definition.

## Remaining work before external test-group release

### P0 — Must be executable end-to-end

1. **Reference ↔ SourceRecord ↔ Evidence identity adapter**
   - Stop assuming `sourceRecordId === reference.id`.
   - Resolve by stable identifiers (DOI/PMID/PMCID/ISBN) and explicit linkage IDs.
   - Citation audit, evidence extraction, appraisal and writing must use the same canonical source.

2. **Reference Hub real persistent master state**
   - Keep references independent from article-derived records.
   - Migrate legacy article references into the master library without deletion or silent verification.
   - Keep edits/history in the master record.

3. **Real research-search integration**
   - PubMed/Europe PMC/OpenAlex search adapters.
   - DOI lookup and metadata merge.
   - Search history and reproducible query records.
   - Import selected search results directly into Reference Hub and SourceRecord workflow.

4. **PDF evidence workflow**
   - Actual PDF page rendering.
   - Page-aware text selection/highlight.
   - Annotation persistence with page/quote/coordinates.
   - Link annotation → EvidenceExtraction → AcademicClaim → appraisal item.
   - Preserve local-first privacy and SHA-256 fingerprint.

5. **End-to-end screening → appraisal flow**
   - Included SourceRecord can become a study/article record without losing provenance.
   - Full-text eligibility decision, standard exclusion reason, rationale and evidence location.
   - Appraisal opens on the correct instrument/version.

6. **Final export gate**
   - Block final export when citation/evidence integrity gates fail.
   - Export project package containing sources, evidence, appraisal, screening, PRISMA data and audit trail.
   - Keep detected/unverified/AI-generated content visibly distinguished.

### P1 — Methodology completeness

7. **JBI qualitative completeness audit**
   - Verify all 10 questions support rationale + evidence + quote + page + section where applicable.
   - Preserve whole-assessment qualitative interpretation.
   - No universal sum score.

8. **CASP / AMSTAR 2 / AGREE II / RoB 2 / ROBINS-I implementation coverage**
   - Registry entry is not enough.
   - Each advertised instrument needs a real usable form, domain logic, evidence capture and appropriate interpretation.

9. **GRADE / GRADE-CERQual real workflows**
   - Certainty domains, downgrade/upgrade rationale and transparent evidence basis.
   - CERQual four components and overall confidence.

10. **Reporting-guideline workflows**
    - PRISMA 2020, CONSORT, STROBE, COREQ, SRQR, ARRIVE, SQUIRE and CARE as reporting checks, not appraisal scores.

11. **PRISMA data model and validation**
    - Counts derive from actual SourceRecord/screening states.
    - Full-text exclusion reasons remain traceable to records.
    - Generate a reproducible flow model.

12. **Structured extraction and synthesis**
    - Evidence tables and extraction schemas linked to source records.
    - Qualitative themes/categories and supporting studies.
    - Quantitative effect-size/CI/heterogeneity structures without pretending to perform a meta-analysis unless the calculation engine is actually implemented.

### P2 — Collaboration, integrity and release safety

13. **RBAC enforcement**
    - Roles must affect allowed actions, not merely appear in a selector.
    - Researcher, Reviewer, Second Reviewer, Lead Reviewer, Adjudicator, Auditor, Read-only.

14. **Peer-review locking and audit integrity**
    - Immutable review history.
    - Adjudication creates a new decision; it does not overwrite prior reviewer decisions.

15. **Retraction/correction watcher**
    - External status checks with source, timestamp and warning semantics.
    - Never auto-delete or silently invalidate a source.

16. **Academic-writing consistency audit**
    - Research question ↔ results ↔ conclusion consistency.
    - Unsupported claims, unused references, missing citations and conflicting claims.

17. **Extension integration**
    - Keep the Research Privacy Inspector as a thin collector/inspection client.
    - Reuse the same DOI/APA/legal validation boundary where practical.
    - Do not create a second reference database in the extension.

18. **Actual CI verification**
    - GitHub Actions must run on current `main`.
    - Verify lint, unit/integration tests and production build.
    - Do not label the repository green until observed from GitHub Actions.

19. **Runtime smoke test**
    - Health endpoint.
    - Application startup.
    - Search → import → Reference Hub → screening → appraisal → evidence → writing → export.
    - Verify no tab/component crashes and no broken transitions.

## Definition of external-ready

The application is ready for colleagues only when P0 is complete, P1 advertised capabilities are either implemented or explicitly labelled prototype, current CI is green, and the runtime smoke path succeeds.
