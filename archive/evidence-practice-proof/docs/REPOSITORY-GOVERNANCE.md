# Repository governance

## Purpose
This repository covers **evidence/process verification**.

## Integrity rules
- Existing functionality, historical implementations and legacy components are preserved unless there is a documented technical, security, compatibility or legal reason to remove them.
- Current, historical, prototype and deprecated functionality must be distinguishable.
- Documentation must describe the actual implementation; it must not claim a feature is complete or verified without evidence.
- Interfaces between UI, services, APIs, data and automation must use a single documented contract where applicable.
- Tests and CI validate software behaviour; they do not by themselves establish scientific, clinical, regulatory or operational validity.
- External standards, frameworks and methodologies must identify their exact version and authoritative source when they are used.

## Change workflow
1. Inspect existing behaviour and dependencies.
2. Preserve compatible legacy behaviour.
3. Change the smallest necessary surface.
4. Update documentation and tests together with code.
5. Run the repository's available checks.
6. Record unresolved limitations rather than hiding them.

## Audit boundary
This file is a governance baseline. It does not claim that every component of the repository has passed a complete functional audit. Such claims require a recorded audit result and reproducible checks.
