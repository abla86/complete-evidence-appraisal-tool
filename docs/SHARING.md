# Evidence Appraisal Tool — deling og lokal kjøring

## Formål

Dette dokumentet beskriver den enkleste og mest etterprøvbare måten å dele og kjøre Evidence Appraisal-superprogrammet på.

Repoet er et samlet Evidence-system. JBI Qualitative 2017 er én spesialmodul i instrumentregisteret, ikke systemets hovedarkitektur.

## Kjør lokalt

Forutsetter Node.js 20 eller kompatibel moderne Node-versjon.

```bash
git clone https://github.com/abla86/complete-evidence-appraisal-tool.git
cd complete-evidence-appraisal-tool
npm ci
npm run dev
```

Valider lokalt med:

```bash
npm test
npm run lint
npm run build
```

## Hovedflyt

```text
Search
  ↓
Import
  ↓
Reference Hub
  ↓
Duplicate Check
  ↓
Fulltext / PDF
  ↓
Screening
  ↓
PICO
  ↓
Appraisal
  ↓
Dual Review
  ↓
Consensus / Adjudication
  ↓
Extraction
  ↓
Synthesis
  ↓
GRADE / CERQual
  ↓
PRISMA / Reporting
  ↓
Writing
  ↓
Export
```

## Delingsmåter

### GitHub-repo

Autoritativ kildekode og dokumentasjon:

```text
https://github.com/abla86/complete-evidence-appraisal-tool
```

### GitHub Codespaces

Repoet har en `.devcontainer/devcontainer.json` som installerer Node 20-miljøet og videresender port 3000. Åpne repoet i Codespaces og kjør:

```bash
npm run dev
```

Codespaces er den praktiske måten å kjøre den eksisterende Express/Vite-applikasjonen uten lokal Node-installasjon.

### GitHub Pages

Repoet har en separat Pages-workflow for klientdelen. Pages kan bare servere statiske filer; den eksisterende `npm run build` bygger også `dist/server.cjs` for Express. Pages-versjonen skal derfor ikke omtales som den komplette serverbaserte applikasjonen før backend er deployet separat.

Pages er en klientbasert delingsflate, ikke en erstatning for full lokal/Codespaces-kjøring.

### Release

En release bør bygges fra en konkret verifisert commit og inneholde:

- kildekodeversjon
- `dist/` fra vellykket build
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/RELEASE-CHECKLIST.md`
- changelog/release notes

Ikke opprett en release som «Verified» før CI og relevante release-kontroller faktisk er grønne.

## PWA-status

PWA skal ikke beskrives som offline-komplett bare ved å legge inn et minimalt manifest og en tom fetch-handler. En reell PWA krever blant annet korrekt base path på GitHub Pages, web app manifest, ikoner og en service-worker/caching-strategi som faktisk cacher klientressurser. Repoet skal derfor ikke markedsføre offline-funksjonalitet før dette er implementert og verifisert.

## Sentrale integrasjoner

### Reference Hub

Reference Hub er den sentrale referanseflaten. Referanser skal ikke dupliseres i parallelle biblioteker. Duplikater identifiseres og vises for kontroll; systemet skal ikke automatisk slette dem.

### Appraisal

Instrumenter velges fra masterregisteret og vurderingen lagres som en versjonert appraisal-session. Instrumentets egne metoderegler skal respekteres. For eksempel skal AMSTAR 2 ikke reduseres til en totalsum, og JBI Qualitative skal ikke behandles som en generell prosentmodell.

### Dual Review

To uavhengige vurderinger kan sammenlignes. Konflikter skal kunne håndteres gjennom konsensus/adjudication med sporbar historikk.

### PDF → evidence → claim

PDF-markeringer og uttrekk kan knyttes til `EvidenceExtraction`, videre til `AcademicClaim`, slik at påstander kan spores tilbake til den konkrete kilden og lokasjonen.

### GRADE / CERQual

Kvalitetsvurderinger lagres separat fra appraisal, men kan kobles til appraisal-session via `appraisalSessionId`. Vurderinger skal være eksplisitte og låsbare.

### Audit og state

Systemet bruker en hash-kjedet auditmotor for sporbarhet. Viktige arbeidssteg skal kunne knyttes til aktør, tidspunkt, endring og begrunnelse.

### Pipeline

Arbeidsflyten håndheves sekvensielt. Et senere trinn skal ikke kunne hoppes over uten at forrige trinn er fullført og nødvendige tilgangsregler er oppfylt.

### Export integrity

Prosjekteksport skal gå gjennom integritetskontroller før eksport. Ufullførte eller ulåste vurderinger, manglende evidensgrunnlag og andre identifiserte integritetsbrudd skal kunne blokkere eksport.

## AI-bruk

Automatiske forslag er assistanse, ikke verifisering. `Not found` skal ikke behandles som `No`, og AI-funn skal kreve menneskelig kontroll før de inngår som verifiserte forskningsfunn.

## Verifikasjonsstatus

CI skal ikke omtales som grønn eller verifisert før GitHub Actions har en faktisk vellykket run for relevant commit. En tom liste over workflow-runs er ikke et grønt resultat.
