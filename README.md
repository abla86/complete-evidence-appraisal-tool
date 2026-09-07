# Evidence Appraisal Tool & Forsk på Forskning (Integritetsvakt)
**Metavitenskapelig evalueringsplattform for forskningsmetode, retningslinjer og vitenskapelig integritet**

![Methodology Integrity](https://img.shields.io/badge/Methodology%20Integrity-Source%20Controlled-teal)
![Version Locking](https://img.shields.io/badge/Version%20Locking-Immutable-emerald)
![Test Pyramid](https://img.shields.io/badge/Test%20Pyramid-Level%201%20%7C%202%20%7C%203-blue)
![License](https://img.shields.io/badge/License-Academic%20%2F%20Open%20Access-slate)

---

## 1. FORMÅL OG BRUKSOMRÅDE

**Evidence Appraisal Tool & Forsk på Forskning** er et komplett metavitenskapelig verktøy utviklet for forskere, stipendiater, kunnskapssenter-analytikere og masterstudenter som gjennomfører kritisk vurdering (*Critical Appraisal*), kunnskapsoppsummeringer, metodeevalueringer og forskning på forskeres metode.

Plattformen håndterer:
- **Automatisk dokumentklassifisering:** Identifiserer om en fil/artikkel er kvalitativ primærforskning, randomisert kontrollert studie (RCT), systematisk oversikt, klinisk retningslinje, observasjonsstudie eller implementeringsrammeverk.
- **Integritetsvakt & Verktøyfinner:** Matcher automatisk studiens design mot autoritative, verifiserte metodiske instrumenter (JBI, AMSTAR 2, AGREE II, CASP, RoB 2, GRADE, PRISMA 2020 osv.).
- **Metodisk integritet:** Blokkerer uautoriserte prosentberegninger for verktøy som krever domenevurdering (f.eks. AMSTAR 2) eller kvalitativt skjønn (JBI / CASP).
- **Evidenssporbarhet:** Hvert enkelt spørsmål krever eksplisitt lokalisering (sidetall/avsnitt/figur), direkte sitat og forskerbegrunnelse.
- **Dual Review & Inter-Rater Reliabilitet:** Støtter uavhengig vurdering av to granskere med automatisk beregning av prosentvis overensstemmelse og Cohens Kappa ($\kappa$).
- **Gullstandard- og referansevalidering:** Har en eksplisitt valideringsstrategi mot referanseartikler og testdata; bestått programvaretest er ikke det samme som metodisk sertifisering av en studie.

---

## 2. ARKITEKTUR OG OPPBYGGING

Applikasjonen er bygget som en moderne fullstack TypeScript-applikasjon med Express backend og React/Tailwind frontend:

```text
├── METHODOLOGY-SOURCES-AND-VERSIONS.md   # Single Source of Truth for metoder og versjoner
├── README.md                            # Prosjektdokumentasjon og arkitekturoversikt
├── metadata.json                        # Applet metadata og plattformkonfigurasjon
├── server.ts                            # Express API-server med validerings- og skåringsendepunkter
├── src/
│   ├── components/                      # Modulære UI-visninger
│   │   ├── Header.tsx                   # Sticky toppnavigasjon og instrumentvelger
│   │   ├── MetaResearchLabView.tsx      # Forsk på Forskning (Integritetsvakt & Analyse)
│   │   ├── ReferenceLibraryView.tsx     # Referansevalideringsbibliotek & Gold Standard Diff
│   │   ├── ValidationDashboardView.tsx  # Utvikler- & revisjonsdashboard for Testpyramiden
│   │   ├── MethodologyAuditView.tsx     # 100% Kilde- og metoderevisjonsvisning
│   │   ├── MethodologyView.tsx          # Instrumentkatalog med DOI-kilder
│   │   ├── EvaluateView.tsx             # Interaktivt vurderingsskjema med evidenslokalisering
│   │   ├── DualReviewModal.tsx          # To-gransker sammenligning og konsensusadjudisering
│   │   ├── AuditTrailView.tsx           # Tidsstemplet, uforanderlig revisjonslogg
│   │   └── ...                          # Øvrige spesialiserte komponenter
│   ├── data/
│   │   ├── masterRegistry.ts            # Sentralt register over verifiserte instrumenter
│   │   ├── referenceValidationData.ts   # Ekte fagfellevurderte referanseartikler med DOI
│   │   └── jbiData.ts                   # Initialdata for JBI Qualitative 2017
│   ├── services/
│   │   ├── assessmentEngines.ts         # Dedikerte beregningsmotorer (Amstar2RatingService osv.)
│   │   ├── referenceValidationService.ts# Item-for-item diff mot gullstandarder
│   │   ├── methodologyContractTests.ts  # 3-nivås testpyramide
│   │   ├── studyDesignGateService.ts    # Studietype-kompatibilitetsgating
│   │   └── methodIntegrityGate.ts       # Systemomfattende metodisk regelvakt
│   └── types.ts                         # Felles TypeScript type- og grensesnittdefinisjoner
```

---

## 3. KJØRING OG UTVIKLINGSMILJØ

Applikasjonen kjører på standard Node.js med Vite og Express:

```bash
# Utviklingsserver (kjører på port 3000)
npm run dev

# Produksjonsbygg (kompilerer klient og server.cjs med sourcemaps)
npm run build

# Start produksjonsserver
npm start

# Validering og linting
npm run lint
```

---

## 4. KILDEHIERARKI & VERIFISERTE INSTRUMENTER

Plattformen håndhever et strengt kildehierarki:
1. **Nivå 1:** Offisiell originalpublikasjon (f.eks. *BMJ*, *CMAJ*, *PLOS Med*, *JBI Manual*).
2. **Nivå 2:** Offisiell bruksveiledning (*User Guide*) fra opphavsorganisasjonen.
3. **Nivå 3:** Fagfellevurderte validerings- og kalibreringsstudier.
4. **Nivå 4:** Tilpasninger (må merkes eksplisitt som tilpasset).

### Hovedinstrumenter:
- **JBI Qualitative (2017):** 10 items, kvalitativt skjønn (`Inkluder` / `Ekskluder` / `Vurder videre`).
- **AMSTAR 2 (2017):** 16 items, 7 kritiske domener, konfidenskategorier (`High`, `Moderate`, `Low`, `Critically Low`). Ingen sumskår.
- **AGREE II (2017/2010):** 23 items over 6 domener. Standardisert domeneskår: $(Oppnådd - Min) / (Maks - Min) \times 100\%$.
- **CASP (Qualitative, RCT, SR):** Seksjonert sjekkliste med screening-gating. Ingen offisiell poengsum.
- **RoB 2 (2019/2022):** 5 biasdomener for randomiserte studier.
- **GRADE & GRADE-CERQual:** Utfallssikkerhet og tillit til kvalitative funn.
- **PRISMA 2020 / CFIR 2.0 / KTA:** Rapporteringsstandarder og implementeringsrammeverk (ingen kvalitetsskår).

Se fullstendig oversikt i `METHODOLOGY-SOURCES-AND-VERSIONS.md`.

---

## 5. TESTPYRAMIDE & VALIDERINGSSTRATEGI

Systemet verifiseres i henhold til en 3-nivås testpyramide:

```text
       ▲
      / \     Level 3: Reference Validation Tests (Gullstandard-artikler med DOI)
     /   \    ------------------------------------------------------------------
    /     \   Level 2: Integration Tests (Studiedesign-gating, Version Locks, Snapshots)
   /       \  ------------------------------------------------------------------
  /_________\ Level 1: Unit Tests (Deterministisk skåring, Flaw-kombinasjoner, Formler)
```

- **Level 1 (Unit):** Tester alle kombinasjoner av kritiske og ikke-kritiske svakheter i AMSTAR 2, min/maks formelgrenser i AGREE II, CASP screening-gater og inputvalidering.
- **Level 2 (Integration):** Tester at uforenlige studietypedesign varsles i sanntid, at vurderingssnapshots er uforanderlige (*immutable*), og at audit logs opprettholdes.
- **Level 3 (Reference):** Kjører publiserte forskningsartikler med kjente referansevurderinger gjennom algoritmene og verifiserer overensstemmelse.

---

## 6. AI-SIKKERHET & BEGRENSNINGER

1. **«Not found ≠ No»:** Fravær av automatisk identifisert teksttolkning gir aldri et automatisk «Nei», men merkes som *«Kandidat ikke lokalisert – krever manuell gransking»*.
2. **Kandidatmerking:** Alle automatiske forslag markeres eksplisitt som *«AI-kandidatforslag»* inntil en menneskelig forsker har bekreftet eller overstyrt vurderingen.
3. **Akademisk integritetserklæring:** Bestått automatisk programvaretest bekrefter implementeringens tekniske determinisme, men erstatter aldri uavhengig vitenskapelig fagfellevurdering.

---

## 7. LISENS OG RETTIGHETER

Systemet respekterer alle opphavsrettslige rammer og Creative Commons-lisenser (f.eks. CC BY 4.0 for AMSTAR 2 og RoB 2, CC BY-NC-SA 4.0 for CASP UK, og åpen forskningsbruk for JBI og AGREE Research Trust).


## Google OAuth 2.0

Google sign-in is implemented by the Evidence app itself. It does **not** use Home Assistant's OAuth callback.

The application callback is:

`<APP_URL>/auth/google/callback`

For local development this is:

`http://localhost:3000/auth/google/callback`

Configure the Web application OAuth client in Google Auth Platform with the exact production and local redirect URIs that the deployment uses. Google requires an exact match for the scheme, host, path and trailing slash; a mismatch produces `redirect_uri_mismatch`.

Required deployment secrets:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_SESSION_SECRET`

The repository must contain no client secret. The client ID is not secret. The default scopes are `openid email profile`; additional Google API scopes should be added only when the corresponding Evidence feature actually needs them.

Authentication endpoints:

- `GET /auth/google` — start sign-in
- `GET /auth/google/callback` — OAuth callback
- `GET /api/auth/session` — current session
- `POST /api/auth/logout` — sign out
- `GET /api/auth/google/config` — non-secret runtime configuration

