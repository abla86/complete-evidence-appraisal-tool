# Repository Change Audit — 2026-08-28

## Scope
This document records the change-control standard and the findings established from repository history. It does not rewrite Git history.

## Repository
`abla86/evidence-appraisal-tool`

## Verified finding
Functional repair/documentation commits are present in the audited period. Historical authorisation must not be inferred from commit titles alone.

## Required evidence chain
For every material change:
1. requested/approved scope;
2. working record describing intended work;
3. Git commit and file-level diff;
4. test/build/verification evidence;
5. README/status statement consistent with the evidence.

## Truthfulness rule
No claim of "fixed", "complete", "secure", "production-ready", or "verified" may be made without corresponding evidence.

## Historical integrity
If a change was made and later reverted, both events remain traceable. A revert does not erase the historical event.

## Audit limitation
Where the original working document or request is unavailable, this audit must mark authorisation as **not established**, rather than guessing.
