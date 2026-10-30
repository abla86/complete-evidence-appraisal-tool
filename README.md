# Evidence Appraisal Tool

Verktøy for strukturert og etterprøvbar kritisk vurdering av forskning – for studenter, forskere og vurderingsteam.

Selger: **Andersen**, org.nr. 835 983 102, Utsiragata 88, 5537 Haugesund (eier: Anne Beth Andersen).

> Verktøyet støtter kritisk vurdering. Det erstatter ikke faglig skjønn, det offisielle instrumentet eller en fagfellevurdering, og det er ikke medisinsk utstyr. Kontroller resultater mot originalkilden før bruk.

## To utgaver, én kodebase

| | Nettutgave | Nedlastbar utgave |
|---|---|---|
| Leveres som | Nettside fra `server.ts`, kan installeres som app (PWA) | `evidence-appraisal-offline.zip` med én HTML-fil |
| Uten nett | Ja, etter første besøk | Ja, alltid – ingen server |
| Plattformer | Windows, macOS, Linux, ChromeOS, iOS, iPadOS, Android | Windows, macOS, Linux, ChromeOS (Chrome, Edge, Firefox) |
| Lisens | Prøve, nettilgang (abonnement) eller nedlastingslisens | Nedlastingslisens (engangskjøp) |

Lisensnøkler er signert med Ed25519 og kontrolleres lokalt, også uten nett. Se [docs/MONETIZATION.md](docs/MONETIZATION.md).

## Funksjoner

- **Kritisk vurdering** med fullstendige vurderingspunkter for AMSTAR 2 (16), AGREE II (23), JBI kvalitativ (10), CASP kvalitativ (10), RoB 2 (5 domener) og ROBINS-I (7 domener). Instrumentkatalogen har 49 instrumenter; de som mangler vurderingspunkter er tydelig merket og kan ikke fylles ut.
- Svar krever begrunnelse; ferdige vurderinger låses og loggføres i en hash-kjedet revisjonslogg.
- Dobbel vurdering, fagfelle-/konsensusflyt, Cohen’s κ.
- Litteratursøk (PubMed, Europe PMC, Crossref, OpenAlex, DOAJ, Semantic Scholar) og DOI-verifisering – bare når du slår det på.
- Referansehub: RIS/BibTeX-import/-eksport, APA 7, duplikatkontroll, PDF-vedlegg med SHA-256.
- Dokumentstudio: lokal tolking av PDF og DOCX (IMRaD), markering av evidens med sidetall.
- Metaforskning og PRISMA, GRADE-tabell, meta-analyse (DerSimonian–Laird) med forest plot, kontroll av dataekstraksjon.
- Skrivestudio for master/PhD med kildekontroll før eksport.
- Sikkerhetskopi av alle arbeidsdata som **zip** (last ned / last opp, kontrollsum per fil).

## Personvern og sikkerhet

- Forskningsdata, PDF-er og dokumenter blir på enheten. Serveren har **ingen** opplastingsendepunkt for dokumenter.
- Alle nettverkskategorier (litteratursøk, skysynk, KI, FHIR) er **av som standard**. All klientkode går gjennom `guardedFetch` (`src/services/networkPolicy.ts`), som håndhever samtykke og en liste over godkjente mottakere, og fører en lokal logg (adresse og tid, aldri innhold). En test hindrer direkte `fetch()` i klientkoden.
- KI (Google Gemini) er valgfri, krever samtykke og bekreftelse ved hver analyse, og resultatet er et forslag som må verifiseres.
- Streng Content-Security-Policy i både nettutgaven og den nedlastbare filen.
- Bare strengt nødvendige informasjonskapsler. Ingen sporing.
- Begrensning: lokal lagring er ikke manipulasjonssikker, og klientside-lisenskontroll er ikke kopibeskyttelse.

Se [SECURITY.md](SECURITY.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) og juridiske tekster i appen (Meny → Vilkår, personvern & ansvar).

## Kom i gang (utvikling)

Krever Node.js 20.19 eller nyere. Fungerer likt på Windows, macOS og Linux.

```sh
npm ci
npm run dev          # http://127.0.0.1:10000 (utviklingsbygg uten lisenskrav)
npm run lint         # TypeScript
npm test             # enhetstester og integrasjonstester
npm run build        # nettutgave (dist/), nedlastbar zip (release/) og server (dist/server.cjs)
npm start            # produksjonsserver
```

Produksjon krever `AUTH_SESSION_SECRET` (minst 32 tegn). Lisensnøkler: `npm run license:keygen`. Alle variabler står i [.env.example](.env.example).

### Utstede lisens manuelt (f.eks. skole med faktura)

```sh
LICENSE_PRIVATE_KEY=... npm run license:issue -- --product offline --licensee "Skole AS" --seats 30
LICENSE_PRIVATE_KEY=... npm run license:issue -- --product online --licensee kari@example.no --days 365
```

## Drift

- Docker: `docker build --build-arg VITE_LICENSE_PUBLIC_KEY=... -t evidence-appraisal .` og kjør med `LICENSE_PRIVATE_KEY`, `AUTH_SESSION_SECRET` og et persistent volum på `/app/data`.
- Render: `render.yaml` (betalt plan med persistent disk for prøveregister og synkroniserte data).
- Serverdata lagres på lokalt filsystem. Sett opp persistent volum og sikkerhetskopi før du stoler på dem.

## Kjente begrensninger

- 43 av 49 registrerte instrumenter mangler fortsatt vurderingspunkter (vises som ikke implementert).
- Vurderingspunktene er norske arbeidsformuleringer, ikke offisielle oversettelser. Kontroller lisensvilkårene til instrumentene før kommersiell bruk ([docs/SALG-OG-LANSERING.md](docs/SALG-OG-LANSERING.md)).
- Enkelte moduler fra tidligere varianter er ikke flyttet inn ennå ([docs/SISTE-VERSJON-GAP.md](docs/SISTE-VERSJON-GAP.md)).
- Ikke testet manuelt på fysiske iOS- og Android-enheter.
- Tester og automatiske kontroller beviser ikke at all funksjonalitet er feilfri.

## Tredjepartsprogramvare

Lisenser for alle produksjonsavhengigheter genereres til `THIRD-PARTY-NOTICES.txt` ved bygging og følger med begge utgaver.
