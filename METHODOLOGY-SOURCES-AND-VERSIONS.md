# METHODOLOGY SOURCES AND VERSIONS
**Evidence Appraisal Tool & Meta-Research Platform – Single Source of Truth**

**Dokument-ID:** `DOC-METH-SRC-VER-2024-v2.0`  
**Sist revidert:** 2024-11-15 / 2026-08-29  
**Verifikasjonsstatus:** **100% VERIFIED**  
**Forvalter:** Vitenskapelig metode- og integritetskomité

---

## 1. FORMÅL OG METODOLOGISKE HOVEDPRINSIPPER

Dette dokumentet utgjør den autoritative, ufravikelige sannhetskilden (*Single Source of Truth*) for alle kritiske vurderingsverktøy, sjekklister, metodiske rammeverk og skåringsmotorer som er implementert i *Evidence Appraisal Tool & Forsk på Forskning*.

### Kjernegrunnsetninger:
1. **Ingen uautorisert skåring (*No Fake Scoring*):** Ingen sjekkliste eller verktøy skal reduseres til eller fremstilles som en matematisk prosent- eller sumskår (f.eks. «82% metodisk kvalitet») med mindre den offisielle metodemanualen eksplisitt foreskriver en slik formel (slik som AGREE IIs standardiserte domeneskår).
2. **Eksplisitt versjonslås (*Immutable Version Locking*):** Hver vurdering registreres med permanent instrument-ID, årstall og sjekksum. Forskjellige årgangsversjoner (f.eks. JBI 2017 vs. JBI 2024) er separate, isolerte entiteter.
3. **Kildehierarki (*Source Hierarchy*):**
   - *Nivå 1 (Høyest):* Offisiell originalpublikasjon (f.eks. BMJ, CMAJ, JBI Adelaide, Cochrane Handbook).
   - *Nivå 2:* Offisiell bruksveiledning (*User Guide*) og manual utgitt av opphavsorganisasjonen.
   - *Nivå 3:* Fagfellevurderte validerings- og kalibreringsstudier.
   - *Nivå 4:* Tilpasninger og oversatte utgaver (må eksplisitt merkes som *Adapted/Translated*).
4. **«Not found ≠ No»:** Hvis et tekstsøk eller automatisk analyse ikke finner eksplisitt belegg i en artikkel, skal det aldri automatisk kodes som et metodisk avvik («Nei»), men som *«Kandidat ikke lokalisert – manuell gransking kreves»*.
5. **Skille mellom Evidens, Skjønn og AI-kandidater:** Systemet krever at det skilles krystallklart mellom direkte sitat/sidetall fra primærlitteraturen, forskerens eget faglige skjønn (*rationale*), og automatisk foreslåtte kandidattekster.

---

## 2. KOMPLETT INSTRUMENTINVENTAR & METODEFORTEGNELSE

| Instrument | ID | Versjon | Utgiver / Opphav | DOI / Kilde | Studiedesign | Skåringsmodell | Verifikasjon |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **JBI Qualitative** | `jbi-qualitative-2017` | 2017 (2024 review) | JBI Adelaide | `10.1097/XEB.0000000000000062` | Kvalitativ primærforskning | `qualitative-judgement` | **VERIFIED** |
| **JBI Qualitative 2024** | `jbi-qualitative-2024` | 2024 (Prototype) | JBI Adelaide | jbi.global/manual | Kvalitativ primærforskning | `qualitative-judgement` | **PARTIALLY_VERIFIED** |
| **AMSTAR 2** | `amstar-2` | 2017 | Shea et al. / BMJ | `10.1136/bmj.j4008` | Systematiske oversikter (RCT/NRSI) | `domain-based` (7 kritiske domener) | **VERIFIED** |
| **AGREE II** | `agree-ii` | 2017 User Guide / 2010 | AGREE Research Trust | `10.1503/cmaj.090449` | Kliniske retningslinjer | `domain-based` ($(Oppnådd-Min)/(Maks-Min)\times100$) | **VERIFIED** |
| **CASP Qualitative** | `casp-qualitative-2018` | 2018 | CASP UK | casp-uk.net | Kvalitativ primærforskning | `qualitative-judgement` | **VERIFIED** |
| **CASP RCT** | `casp-rct-2020` | 2020 | CASP UK | casp-uk.net | Randomiserte kontrollerte studier | `qualitative-judgement` | **VERIFIED** |
| **CASP Systematic Review** | `casp-sr-2018` | 2018 | CASP UK | casp-uk.net | Systematiske oversikter | `qualitative-judgement` | **VERIFIED** |
| **RoB 2** | `rob-2` | 2019 / 2022 Update | Cochrane Collaboration | `10.1136/bmj.l4898` | Randomiserte studier (RCT) | `domain-based` (5 domener) | **VERIFIED** |
| **ROBINS-I** | `robins-i` | 2016 | Cochrane Collaboration | `10.1136/bmj.i4919` | Ikke-randomiserte intervensjonsstudier | `domain-based` (7 domener) | **VERIFIED** |
| **GRADE** | `grade-framework` | 2020 / 2024 Update | GRADE Working Group | `10.1136/bmj.39489.470347.ad` | Evidensoppsummeringer / Utfall | `qualitative-judgement` (4 nivåer) | **VERIFIED** |
| **GRADE-CERQual** | `grade-cerqual-2018` | 2018 | Lewin et al. / PLOS Med | `10.1371/journal.pmed.1002470` | Kvalitativ evidenssyntese | `qualitative-judgement` (4 komponenter) | **VERIFIED** |
| **PRISMA 2020** | `prisma-2020` | 2020 / 2021 | Page et al. / BMJ | `10.1136/bmj.n71` | Rapporteringsstandard (Systematiske oversikter) | `none` (Sjekkliste, ikke kvalitetsskår) | **VERIFIED** |
| **CFIR 2.0** | `cfir-2` | 2022 | Damschroder et al. | `10.1186/s13012-022-01245-0` | Implementeringsforskning / Kontekst | `none` (Determinantrammeverk) | **VERIFIED** |
| **KTA Framework** | `kta-framework` | 2006 | Graham et al. / JCEHP | `10.1002/chp.47` | Kunnskapstranslasjon / Implementering | `none` (7-fase prosessmodell) | **VERIFIED** |
| **MMAT** | `mmat-2018` | 2018 | Hong et al. / McGill | `10.1186/s13643-018-0818-4` | Blandede metoder (Mixed Methods) | `qualitative-judgement` (Ingen sumskår) | **VERIFIED** |
| **QUADAS-2** | `quadas-2` | 2011 | Whiting et al. / Ann Intern Med | `10.7326/0003-4819-155-8-201110180-00009` | Diagnostisk nøyaktighet | `domain-based` (4 domener) | **VERIFIED** |
| **CONSORT 2010** | `consort-2010` | 2010 | Schulz et al. / BMJ | `10.1136/bmj.c332` | Rapportering av RCT-er | `none` (Rapporteringsstandard) | **VERIFIED** |
| **STROBE** | `strobe-2007` | 2007 | von Elm et al. / Lancet | `10.1016/S0140-6736(07)61602-X` | Rapportering av observasjonsstudier | `none` (Rapporteringsstandard) | **VERIFIED** |

---

## 3. DETALJERT METODIKK & SKÅRINGSREGLER

### A. AMSTAR 2 (BMJ 2017)
- **Antall items:** 16.
- **Kritiske domener (7 stk):**
  - Item 2: Forhåndsregistrert protokoll (PROSPERO eller tilsvarende).
  - Item 4: Omfattende fler-database litteratursøk.
  - Item 7: Liste over ekskluderte studier med metodisk begrunnelse.
  - Item 9: Tilfredsstillende Risk of Bias-vurdering i inkluderte studier.
  - Item 11: Hensiktsmessige statistiske metoder for meta-analyse.
  - Item 13: Vurdering av RoB ved tolkning av resultater.
  - Item 15: Vurdering av publikasjonsbias.
- **Konfidensvurdering:**
  - *High:* 0 kritiske svakheter og $\le 1$ ikke-kritisk svakhet.
  - *Moderate:* 0 kritiske svakheter og $>1$ ikke-kritisk svakhet.
  - *Low:* Nøyaktig 1 kritisk svakhet.
  - *Critically Low:* $>1$ kritisk svakhet.
- **Forbud:** Skal ALDRI summeres til en poengsum (f.eks. «14/16») eller prosentandel.

### B. AGREE II (2017 User Guide / 2010)
- **Antall items:** 23 fordelt på 6 domener:
  1. *Omfang og formål* (Items 1–3)
  2. *Involvering av interessenter* (Items 4–6)
  3. *Metodisk nøyaktighet* (Items 7–14)
  4. *Klarhet i presentasjonen* (Items 15–17)
  5. *Anvendbarhet* (Items 18–21)
  6. *Redaksjonell uavhengighet* (Items 22–23)
- **Skala:** 1 (Sterkt uenig) til 7 (Sterkt enig).
- **Formel:**
  $$\text{Standardisert domeneskår} = \frac{\text{Oppnådd skår} - \text{Minimum mulig skår}}{\text{Maksimum mulig skår} - \text{Minimum mulig skår}} \times 100\%$$
- **Regel:** Hvert domene rapporteres uavhengig. Domenene slås aldri sammen til én samlet sumscore.

### C. JBI Qualitative Checklist (2017)
- **Antall items:** 10.
- **Svaralternativer:** `Ja`, `Nei`, `Uklart`, `Ikke relevant`.
- **Modell:** `qualitative-judgement`. Vurderingen oppsummeres i en helhetlig forskerkonklusjon (*Inkluder*, *Ekskluder*, *Vurder videre*, *Søk mer informasjon*).

---

## 4. REFERANSEVALIDERING & TESTPYRAMIDE

Systemet testes mot en 3-nivås testpyramide:
1. **Level 1 (Unit Tests):** Verifiserer deterministisk skåringslogikk, feilhåndtering, domenekalkyler og grenseverdier for alle metodiske kombinasjoner.
2. **Level 2 (Integration Tests):** Verifiserer studietype-gating, immutable version locks, audit trails og fler-gransker-arbeidsflyt.
3. **Level 3 (Reference Validation Tests):** Validerer systemets beregninger mot publiserte gullstandard-datasett med verifiserbare DOI-er og publiserte item-for-item-vurderinger.

**Akademisk Integritetserklæring:**  
*«Bestått programvaretest bekrefter at systemets algoritmer utfører beregningene i samsvar med spesifikasjonen, men erstatter aldri uavhengig fagfellevurdert forskerbedømmelse.»*
