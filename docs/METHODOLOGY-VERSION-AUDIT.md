# EVIDENCE APPRAISAL TOOL – METHODOLOGICAL, VERSION & SOURCE AUDIT REPORT

**Dato for revisjon:** 2024-11-15 / 2026-08-29 (Revidert etter metodisk integritetsrevisjon)  
**Formål:** Komplett inventarføring, kildekontroll, versjonsintegritet og metodologisk kvalitetssikring for *Evidence Appraisal Tool*.  
**Hovedprinsipp:** Ingen kritisk vurderingsmetode, sjekkliste, rammeverk eller skåringsmodell implementeres eller markedsføres som tilgjengelig før korrekt originalkilde, versjon, publikasjonsår og faktisk innhold er verifisert.

---

## 1. SAMLET AUDIT OVERSIKT & KORRIGERINGER

```text
========================================================================================
METHOD INTEGRITY AUDIT MATRIX & CORRECTIONS
========================================================================================
AMSTAR 2                 AUDITED (BMJ 2017, 16 items, 7 critical domains, no sum score)
CASP Qualitative         AUDITED (CASP UK 2018, 10 items, 3 sections, qualitative)
CASP RCT                 AUDITED (CASP UK 2020, 11 items, qualitative)
CASP Systematic Review   AUDITED (CASP UK 2018, 10 items, qualitative)
AGREE II                 AUDITED (CMAJ 2010 / 2017 User Guide, 23 items, 6 domains)
GRADE                    AUDITED (BMJ 2008 / JCE 2011, outcome certainty: 4 levels)
GRADE-CERQual            AUDITED (PLOS Med 2018, 4 components, qualitative confidence)
RoB 2                    AUDITED (BMJ 2019, 5 domains + signalling questions)
JBI Qualitative (2017)   AUDITED & CORRECTED (JBI 2017, 10 items, qualitative decision support without rigid cutoff)
PRISMA 2020              AUDITED (BMJ 2021, 27 items, reporting standard, no score)
CFIR 2.0                 AUDITED (Implement Sci 2022, 5 domains / 48 constructs, no score)
KTA Framework            AUDITED (JCEHP 2006, Knowledge Funnel + 7-phase Action Cycle)
----------------------------------------------------------------------------------------
WHO STANDARDS AUDIT      AUDITED & CORRECTED (WHO Handbook 2. utg. 2014; ingen eksterne sertifikater)
SOURCE AUDIT             PASS (Autoritative originalkilder og manualer bekreftet)
VERSION AUDIT            PASS (Ingen blanding av årsversjoner, eksplisitt versjonslås)
SCORING AUDIT            PASS (Ingen uautoriserte prosentberegninger eller 'fake scoring')
STUDY-DESIGN AUDIT       PASS (Aktiv studietype-gating og uoverensstemmelsesvarsler)
AI SAFETY AUDIT          PASS (Prinsipp: «Not found ≠ No», menneskelig verifikasjonskrav)
EVIDENCE TRACEABILITY    PASS (Direkte sitat, sidetall, seksjon og reviewer rationale)
AUDIT TRAIL              PASS (Sporbar endringslogg med aktør, tidsstempel og årsak)
EXPORT INTEGRITY         PASS (Deterministisk og etterprøvbar representasjon)
========================================================================================
```

### Sentrale metodiske rettelser utført under revisjonen:
1. **JBI Qualitative (2017):**
   - Fjernet vilkårlig algoritmisk terskel (`score.nei >= 3 => Ekskluder`) og kunstig skille mellom "kritiske" og "ikke-kritiske" spørsmål.
   - Endret til kvalitativ beslutningsstøtte (Decision Support) i henhold til JBI 2017-manualen, der inklusjon/eksklusjon overlates til forskerens helhetlige faglige skjønn med begrunnelsesplikt.
2. **WHO Handbook & Valideringstjeneste:**
   - Korrigert referanseår for WHO Handbook for Guideline Development (2nd Edition) til **2014** (ikke 2024).
   - Fjernet påstander om at WHO/JBI utsteder offisielle sertifikater for enkeltstudier; rapporten fungerer nå som et internt kvalitetsrevisjonsnotat for transparens og revisjonsspor.
3. **Bevaring av stringenskrav:**
   - Fullstendighetskrav (alle 10 kriterier må besvares), begrunnelsesplikt (>15 tegn) og evidensforankring (sitater/sidetall) opprettholdes fullt ut.

---

## 2. DETALJERT INSTRUMENTINVENTAR & METODEANALYSE

### A. JBI Critical Appraisal Checklist for Qualitative Research (2017)
1. **Instrumentnavn:** JBI Critical Appraisal Checklist for Qualitative Research
2. **Studiedesign / Formål:** Kvalitative primærstudier (fenomenologi, grounded theory, hermeneutikk, etnografi, tematisk analyse).
3. **Versjon:** 2017 (JBI Manual for Evidence Synthesis 2024 review).
4. **År:** 2017.
5. **Originalkilde:** Joanna Briggs Institute (2017). Critical Appraisal Checklist for Qualitative Research. Adelaide: JBI.
6. **Offisiell kilde:** https://jbi.global/sites/default/files/2019-05/JBI_Critical_Appraisal-Checklist_for_Qualitative_Research2017_0.pdf
7. **DOI / Permanent Identifier:** `10.1097/XEB.0000000000000062` (Lockwood et al., 2015).
8. **Antall items:** 10 items.
9. **Svaralternativer:** `Ja (Yes)`, `Nei (No)`, `Uklart (Unclear)`, `Ikke relevant (Not applicable)`.
10. **Scoring / Tolkningsmodell:** `qualitative-judgement`. JBI foreskriver *ikke* en rigid matematisk cut-off score (f.eks. 70%) for inklusjon/eksklusjon. Vurderingen er en helhetlig kvalitativ bedømmelse basert på metodisk samsvar (spm 1–5), forskerrefleksivitet (spm 6 & 7), etikk (spm 9) og datadokumentasjon (spm 8 & 10).
11. **Hva som faktisk er implementert:** Fullstendig 10-punkts skjema med separat registrering av forskerens skjønn (status), skriftlig begrunnelse (rationale), empirisk sitat (evidence quote) og sideangivelse (location).
12. **Eventuelle avvik:** Ingen avvik. Evalueringsmotoren markerer tydelig at numeriske skårer er veiledende og at inklusjonsvedtak krever faglig vurdering.
13. **Lisens / Opphavsrett:** Open Access for forsknings- og utdanningsformål med kildeangivelse (© Joanna Briggs Institute).
14. **Verifikasjonsstatus:** **VERIFIED**

---

### B. AMSTAR 2 – A MeaSurement Tool to Assess Systematic Reviews (2017)
1. **Instrumentnavn:** AMSTAR 2
2. **Studiedesign / Formål:** Kritiske vurderinger av systematiske oversikter over randomiserte og/eller ikke-randomiserte intervensjonsstudier.
3. **Versjon:** 2017.
4. **År:** 2017.
5. **Originalkilde:** Shea, B. J., et al. (2017). AMSTAR 2: a critical appraisal tool for systematic reviews that include randomised or non-randomised studies of healthcare interventions, or both. *BMJ*, 358, j4008.
6. **Offisiell kilde:** https://www.bmj.com/content/358/bmj.j4008
7. **DOI:** `10.1136/bmj.j4008`
8. **Antall items:** 16 items.
9. **Svaralternativer:** `Yes`, `Partial Yes`, `No`, `No meta-analysis conducted`.
10. **Scoring / Tolkningsmodell:** `domain-based`. 7 kritiske domener (Item 2, 4, 7, 9, 11, 13, 15). Oppsummeres i 4 konfidenskategorier: *High*, *Moderate*, *Low*, *Critically Low*.
11. **Hva som faktisk er implementert:** Registrert som et domenebasert verktøy. Ingen uautorisert prosent- eller sumskår beregnes.
12. **Forbudte mønstre forhindret:** Ingen «82% kvalitetsscore» eller summering av poeng.
13. **Lisens:** Open Access (CC BY 4.0).
14. **Verifikasjonsstatus:** **VERIFIED**

---

### C. CASP (Critical Appraisal Skills Programme)
1. **Instrumentfamilie:** CASP UK Checklists.
2. **Studiedesign-differensiering:** Systemet skiller eksplisitt mellom:
   - **CASP Qualitative Checklist (2018):** 10 items, 3 seksjoner (Screening, Metodisk stringens, Lokal verdi). Svar: `Yes`, `Can’t tell`, `No`. Scoring: `qualitative-judgement`.
   - **CASP RCT Checklist (2020):** 11 items.
   - **CASP Systematic Review Checklist (2018):** 10 items.
3. **Offisiell kilde:** https://casp-uk.net/casp-tools-checklists/
4. **Lisens:** Creative Commons Attribution-NonCommercial-ShareAlike (CC BY-NC-SA 4.0).
5. **Metodisk regel:** Ingen numerisk totalscore.
6. **Verifikasjonsstatus:** **VERIFIED**

---

### D. AGREE II – Appraisal of Guidelines for Research & Evaluation
1. **Instrumentnavn:** AGREE II
2. **Studiedesign / Formål:** Kliniske retningslinjer og behandlingsanbefalinger.
3. **Versjon:** 2017 User Guide / Brouwers et al. (2010).
4. **År:** 2010 / 2017.
5. **Originalkilde:** Brouwers, M. C., et al. (2010). AGREE II: advancing guideline development, reporting and evaluation in healthcare. *CMAJ*, 182(18), E839-E842.
6. **Offisiell kilde:** https://www.agreetrust.org/agree-ii/
7. **DOI:** `10.1503/cmaj.090449`
8. **Antall items:** 23 items fordelt på 6 uavhengige domener.
9. **Svaralternativer:** 7-punkts Likert-skala (`1 (Sterkt uenig)` til `7 (Sterkt enig)`).
10. **Scoring:** `domain-based`. Standardisert domeneskår: $(Oppnådd - Min) / (Maks - Min) \times 100\%$. Domeneskårer slås *ikke* sammen til én obligatorisk total kvalitetsscore.
11. **Lisens:** Copyright © AGREE Research Trust. Fri bruk med kildeangivelse.
12. **Verifikasjonsstatus:** **VERIFIED**

---

### E. RoB 2 – Cochrane Risk of Bias Tool for Randomized Trials
1. **Instrumentnavn:** RoB 2
2. **Studiedesign / Formål:** Randomiserte kontrollerte studier (RCT).
3. **Versjon:** 2019 / 2022 Update.
4. **År:** 2019.
5. **Originalkilde:** Sterne, J. A., et al. (2019). RoB 2: a revised tool for assessing risk of bias in randomised trials. *BMJ*, 366, l4898.
6. **Offisiell kilde:** https://www.riskofbias.info/welcome/rob-2-0-tool
7. **DOI:** `10.1136/bmj.l4898`
8. **Antall items:** 5 bias-domener med signalspørsmål.
9. **Svaralternativer:** `Low risk`, `Some concerns`, `High risk`.
10. **Scoring:** `domain-based` med Cochrane-algoritme.
11. **Lisens:** Open Access (CC BY 4.0).
12. **Verifikasjonsstatus:** **VERIFIED**

---

### F. GRADE & GRADE-CERQual
1. **GRADE (2020/2024):** Vurderer tillit til evidens på utfallsnivå (outcome-level certainty: *High*, *Moderate*, *Low*, *Very Low*). Vurderer 5 nedgraderingsfaktorer (Risk of bias, Inconsistency, Indirectness, Imprecision, Publication bias) og 3 oppgraderingsfaktorer.
2. **GRADE-CERQual (2018):** Transparent vurdering av tillit til kvalitative syntesefunn. Vurderer 4 komponenter: Metodiske begrensninger, Koherens, Tilstrekkelighet, Relevans.
3. **DOI:** `10.1371/journal.pmed.1002470` (Lewin et al., PLOS Med 2018).
4. **Scoring:** `qualitative-judgement`.
5. **Verifikasjonsstatus:** **VERIFIED**

---

### G. CFIR 2.0 & KTA (Implementeringsrammeverk)
1. **CFIR 2.0 (2022):** Damschroder et al., *Implementation Science* 2022. 5 domener (Innovation, Outer Setting, Inner Setting, Individuals, Implementation Process) og 48 konstrukter. Formål: Determinantkartlegging, ikke skåring. `scoringModel: none`.
2. **KTA Framework (2006):** Graham et al., *JCEHP* 2006. Kunnskapsskapingstrakt og 7-trinns handlingssyklus. Formål: Prosess- og translasjonsmodell. `scoringModel: none`.
3. **Verifikasjonsstatus:** **VERIFIED**

---

## 3. METODOLOGISKE SIKKERHETSMEKANISMER

1. **Studiedesign-Gating:** Forskere advares aktivt dersom et instrument velges som ikke matcher studiens design (f.eks. valg av AMSTAR 2 for en kvalitativ intervjustudie).
2. **«Not found ≠ No»:** Hvis tekst- eller dokumentanalyse ikke finner evidens på en side, markeres det eksplisitt som «Evidence not located. Researcher verification required.» og aldri som «Nei».
3. **Immutable Version Locking:** Hver vurdering låses til instrument-ID, versjon, utgave og sjekksum ved oppstart for å forhindre feil ved fremtidige instrumentoppdateringer.
4. **Skille mellom Evidens, Skjønn og AI-forslag:**
   - *Evidence:* Eksakt sitat / sidetall / figur / tabell fra artikkelen.
   - *Reviewer Judgement:* Forskerens faglige begrunnelse (rationale).
   - *AI Candidate Suggestion:* Foreslått tekstutdrag markert med verifikasjonskrav.
5. **Statistisk Reliabilitet:** Systemet skiller matematisk mellom rå overensstemmelsesprosent (Percent Agreement) og formell inter-rater reliabilitet (Cohen's Kappa $\kappa$).

---

## 4. STATUSRAPPORT FOR FUNKSJONER

| Funksjon | Status | Kommentar |
| :--- | :--- | :--- |
| Instrument Master Registry | **Already exists** | Sentral maskinlesbar registrering i `src/data/masterRegistry.ts` |
| Source Provenance | **Already exists** | Autoritativ kilde, originalartikkel og DOI dokumentert |
| Version Locking | **Already exists** | `VersionLockMetadata` lagres med vurderingsposter |
| Study-design compatibility gate | **Already exists** | `StudyDesignGateService` med automatisk validering |
| Methodological integrity gate | **Already exists** | `MethodIntegrityService` for systemomfattende kontroll |
| Reviewer management & Dual review | **Already exists** | Uavhengige vurderinger (R1/R2) og konsensusprosess |
| Inter-rater statistics | **Already exists** | Beregning av Cohen's Kappa $\kappa$ og agreement % |
| Evidence traceability | **Already exists** | Sidetall, sitater, seksjoner og begrunnelsesplikt |
| Document integrity / hash | **Already exists** | SHA-256 kontrollsum for instrumenter og dokumenter |
| Audit trail | **Already exists** | Tidsstempel, aktør, forrige verdi, ny verdi og årsak |
| AI provenance & safety | **Already exists** | «Not found ≠ No» og kandidat-evidens merking |
| Export integrity | **Already exists** | Formaterte eksportfunksjoner for Markdown, TXT og JSON |
| License tracking | **Already exists** | Dokumentert opphavsrett og CC-lisenser |
