# Methodology source and version policy

This repository treats methodological instruments as versioned research dependencies.

## Rules

1. An instrument must have an identifiable authoritative source.
2. A study-design-specific checklist is a separate instrument from a generic family name.
3. Publication year and instrument version are separate fields.
4. A historical assessment must retain the exact instrument version used at the time.
5. "Latest" must never silently replace the version specified by an existing protocol or assessment.
6. The application must not invent numerical scores where the source methodology does not define one.
7. AI/document analysis may propose candidate evidence, but it does not make the final methodological judgement.
8. "Evidence not located" must never be converted automatically into "No".
9. Methodological frameworks such as KTA or CFIR must not be represented as validated numerical appraisal scores unless the authoritative methodology explicitly supports that use.
10. Instrument content must not be reproduced in the application unless licensing/copyright conditions permit it.

## Currently verified registry entries

| ID | Method | Version / date | Publication year | Primary use | Verification |
|---|---|---|---:|---|---|
| amstar2 | AMSTAR 2 | 2017 | 2017 | Critical appraisal of systematic reviews | Verified |
| agree2 | AGREE II | No separate version number in registry | 2010 | Appraisal of clinical practice guidelines | Verified |
| rob2 | Cochrane RoB 2 | 22 Aug 2019 (individual parallel-group RCTs) | 2019 | Risk of bias | Verified |
| prisma2020 | PRISMA 2020 | 2020 update | 2021 | Reporting guideline | Verified |
| cfir2 | CFIR 2.0 | 2022 | 2022 | Implementation determinant framework | Verified |
| kta | Knowledge-to-Action Framework | Original framework | 2006 | Knowledge translation / implementation framework | Verified |
| jbi-qualitative-2017 | JBI Critical Appraisal Checklist for Qualitative Research | 2017 | 2017 | Critical appraisal of qualitative research | Verified |
| casp-qualitative-2022 | CASP Qualitative Studies Checklist | 2022 | 2022 | Critical appraisal of qualitative studies | Verified |

## Important version notes

### AMSTAR 2

AMSTAR 2 has 16 items. Its overall confidence is based on weaknesses in critical and non-critical domains; it is not intended to generate an overall numerical score.

### AGREE II

AGREE II is a 23-item instrument organised into six domains. The registry deliberately does not label AGREE II as a 2017 version. The principal publication is from 2010.

### RoB 2

RoB 2 has design-specific variants. The current individually-randomised parallel-group version is dated 22 August 2019. Cluster-randomised and crossover versions have separate dates and must not be mixed.

### PRISMA 2020

PRISMA 2020 is the name of the update. The statement was published in 2021. The application must not confuse the update name with publication year.

### CFIR 2.0

The updated CFIR was published in 2022. CFIR is an implementation determinant framework and requires project-level operationalisation; it is not a generic quality score.

### KTA

The Knowledge-to-Action Framework originates from Graham et al. (2006). It is a conceptual implementation/knowledge-translation framework, not a validated numerical appraisal scale.

### JBI

The 2017 JBI qualitative checklist is explicitly versioned as a historical instrument. JBI has subsequently revised parts of its critical appraisal tool suite. A new JBI tool must therefore be added as a separate registry entry when its exact version/source has been verified; it must not silently overwrite an existing historical assessment.

### CASP

CASP publishes different checklists for different study designs and maintains an archive. "CASP" alone is not sufficiently specific to identify the instrument used.

## Required release gate

Before an instrument can be labelled Verified, the implementation must be checked for:

- authoritative source
- exact version/date
- publication year
- study-design compatibility
- item count
- response options
- scoring/interpretation model
- licensing/copyright constraints
- implementation fidelity
- tests
- provenance metadata

If any critical element is unknown, the status must not be Verified.

## Authoritative sources

- AMSTAR: https://amstar.ca/Amstar-2.php
- AGREE Trust: https://www.agreetrust.org/
- Cochrane RoB 2: https://www.riskofbias.info/welcome/rob-2-0-tool/current-version-of-rob-2
- PRISMA: https://www.prisma-statement.org/prisma-2020
- CFIR: https://cfirguide.org/
- CASP: https://casp-uk.net/casp-tools-checklists/
- JBI: https://jbi.global/critical-appraisal-tools
