# Test Group Readiness – Complete Evidence Appraisal Tool

## Status

**LOCAL TEST SUITE: READY**

The current local verification baseline is 31/31 tests passing. GitHub Actions status is **not yet certified in this document** until a successful workflow run is visible for the current `main` commit.

## Verified locally

- [x] 31/31 automated tests pass
- [x] Audit trail hash-chain integrity and tamper detection tested
- [x] Shared reference boundary tested
- [x] APA 7 draft generation tested
- [x] Norwegian law reference handling tested
- [x] `VALIDATION_REQUIRED` remains distinct from `VALIDATED`
- [x] SourceRecord schema validation tested
- [x] SourceRecord intake tested
- [x] Screening transition and PICO linkage tested
- [x] Privacy inspector contract tested as local-only signal detection
- [x] Accessibility inspector contract tested as heuristic signals
- [x] Existing JBI application surface preserved by feature-inventory tests
- [x] Permanent recovery branch `backup-before-superprogram-integration` retained

## GitHub CI gate

- [ ] Successful GitHub Actions run for current `main`
- [ ] `npm run lint` passes in CI
- [ ] `npm test` passes in CI
- [ ] `npm run build` passes in CI
- [ ] Build artifact upload succeeds

## Runtime verification gate

- [ ] JBI routes render in the browser
- [ ] `source_workflow` tab is reachable
- [ ] SourceRecord JSON import works end-to-end in the UI
- [ ] Intake starts in `unassigned`
- [ ] Screening flow works: `unassigned → awaiting-review → reviewed → included/excluded`
- [ ] PICO attachment is blocked before required screening state
- [ ] Draft references remain unverified until explicit verification
- [ ] Audit events appear after completed actions
- [ ] Invalid imports fail without creating partial research records

## Security and integrity gate

- [ ] No reference-engine network requirement
- [ ] Privacy findings remain observational and local-only
- [ ] Accessibility findings remain heuristic and non-certifying
- [ ] Duplicate candidates are not silently deleted
- [ ] Historical methodology/version context remains preserved
- [ ] Module failures fail locally rather than corrupting unrelated workflow state

## Methodological gate

The application must distinguish software correctness from scientific validity. A passing software test does not certify a research study, appraisal conclusion, citation truth, GDPR compliance, or WCAG conformance.

## Known limitations

- Privacy inspection covers resources visible to the local inspection surface; it does not prove the absence of hidden network activity.
- Reference formatting/validation is not independent bibliographic verification.
- Some methodology entries may be registry/prototype level even when they are documented in the master inventory; these must not be presented as independently validated implementations without supporting evidence.

## Current main commit

The current implementation has the locally verified test baseline described above. GitHub CI must be checked against the latest commit before external test-group release.
