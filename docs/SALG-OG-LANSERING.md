# Sjekkliste før salg og publisering

Denne listen skiller mellom det som er gjort i koden og det selger må gjøre selv. Juridiske tekster i appen er utkast og bør gjennomgås av jurist før salg.

## Gjort i koden

- [x] Selgeridentitet (navn, org.nr., adresse) i vilkår, kvittering/zip og bunntekst (e-handelsloven § 8).
- [x] Bruksvilkår, angrerett/refusjon, personvernerklæring (GDPR art. 13), informasjonskapsler, ansvarsfraskrivelse, atferdsregler og erklæring om universell utforming – i appen og tilgjengelig før kjøp.
- [x] Kun strengt nødvendige informasjonskapsler; ingen sporing eller analyse.
- [x] All nettverksbruk fra appen er av som standard, styres per kategori og logges lokalt. PDF-er og dokumenter tolkes bare lokalt; serveren har ikke noe opplastingsendepunkt.
- [x] KI er valgfri, krever samtykke og bekreftelse hver gang, og resultatet merkes som forslag som må verifiseres.
- [x] Streng Content-Security-Policy i nettutgaven (HTTP-header) og i den nedlastbare filen (meta-tag).
- [x] Tredjepartslisenser (`THIRD-PARTY-NOTICES.txt`) følger med både nettutgaven og zip-filen.
- [x] Påstander i UI, README og salgsside er kontrollert mot koden (f.eks. antall ferdige instrumenter, at lokal lagring ikke er manipulasjonssikker).

## Må gjøres av selger før salg

- [ ] **E-postadresse for kunder** (påkrevd etter e-handelsloven og angrerettloven): sett `VITE_SELLER_EMAIL`.
- [ ] **MVA-status:** sett `VITE_SELLER_VAT_REGISTERED=true` hvis foretaket er registrert i Merverdiavgiftsregisteret, og oppgi priser inkl. mva til forbrukere.
- [ ] **Instrumentlisenser (viktig):** Kontroller vilkårene til hvert vurderingsinstrument for kommersiell bruk, f.eks. JBI, CASP (CC BY-NC-SA), AMSTAR 2, RoB 2/ROBINS-I, AGREE II og GRADE. Verktøyet bruker egne norske formuleringer, men navn, struktur og skåringsregler kan likevel være beskyttet eller ha lisensvilkår. Innhent tillatelse der det kreves.
- [ ] **Kildekodens synlighet:** Hvis GitHub-repoet er offentlig, kan hvem som helst bygge appen selv. Vurder privat repo eller en eksplisitt lisens (LICENSE-fil) som regulerer kommersiell bruk.
- [ ] **Stripe:** opprett produkter/Payment Links, krev aksept av vilkår, og bekreftelse om angrerett for nedlastingslisensen (se `docs/MONETIZATION.md`).
- [ ] **Databehandleravtaler:** Stripe og Google (OAuth/Gemini) og driftsleverandøren (f.eks. Render) – bekreft avtaler og overføringsgrunnlag. Oppdater personvernerklæringen hvis du bytter leverandør.
- [ ] **Regnskap:** oppbevar salgsdokumentasjon i 5 år (bokføringsloven).
- [ ] **Persistent lagring og sikkerhetskopi** for serverdata (prøveregister, synkroniserte data) – `render.yaml` bruker en betalt plan med disk.
- [ ] **Tilgjengelighet:** gjennomfør en WCAG 2.1 AA-test og oppdater erklæringen.
- [ ] **Juridisk gjennomgang** av vilkår, angrerett og personvernerklæring.

## Plattformstøtte

| Plattform | Nettutgave / installert app (PWA) | Nedlastbar zip (én HTML-fil) |
|---|---|---|
| Windows | Chrome, Edge, Firefox | Chrome, Edge, Firefox – testet automatisk i Chrome |
| macOS | Chrome, Edge, Firefox, Safari | Chrome, Edge, Firefox (Safari støttes ikke for lokale filer) |
| Linux / ChromeOS | Chrome, Edge, Firefox | Chrome, Edge, Firefox |
| iOS / iPadOS / Android | Ja – «Legg til på Hjem-skjerm» | Nei (mobile nettlesere åpner ikke lokale HTML-apper pålitelig) |

Ikke testet manuelt på ekte iOS- og Android-enheter i denne runden; gjør en manuell test før lansering.
