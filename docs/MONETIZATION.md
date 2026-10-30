# Lisens- og salgsmodell

Selger: Andersen, org.nr. 835 983 102, Utsiragata 88, 5537 Haugesund (eier: Anne Beth Andersen).

## Produkter

| Produkt | Betaling | Hvor | Uten nett | Teknisk |
|---|---|---|---|---|
| Prøvetilgang | Gratis, én gang per Google-konto | Nettutgaven | Ja, etter første besøk (PWA) | Signert lisens med utløp (`TRIAL_DAYS`, standard 7) |
| Nettilgang | Abonnement (Stripe) | Nettutgaven / installert app | Ja, frem til fornyelse | Signert lisens som utløper ved periodeslutt + 3 dager, fornyes automatisk mot Stripe |
| Nedlastingslisens | Engangskjøp (Stripe), dyrest | Nedlastbar zip + nettutgaven | Ja, alltid | Varig signert lisens; gir nedlasting av `evidence-appraisal-offline.zip` |
| Institusjon/skole | Faktura | Begge | Ja | Utstedes manuelt: `npm run license:issue -- --product offline --licensee "Skole AS" --seats 30` |

Priser settes i Stripe og vises i appen via `PRICE_LABEL_ONLINE` / `PRICE_LABEL_OFFLINE`. Ingen priser er hardkodet.

## Hvordan lisensene virker

- Lisensnøkler har formatet `EAT1.<payload>.<Ed25519-signatur>` og signeres med selgers private nøkkel (`LICENSE_PRIVATE_KEY`, kun på serveren).
- Appen har den offentlige nøkkelen innebygd (`VITE_LICENSE_PUBLIC_KEY`) og kontrollerer nøkkelen lokalt – også uten nett.
- Den nedlastbare utgaven godtar bare nedlastingslisens. Nettutgaven godtar alle gyldige lisenser.
- Etter Stripe-betaling sendes kjøperen til `/purchase-complete?session_id=…`; serveren bekrefter betalingen hos Stripe og leverer nøkkelen i URL-fragmentet (sendes ikke til servere eller logger).
- Serverfunksjoner (skysynk, KI) krever i tillegg innlogging og kontrollerer lisensen på serveren.

**Ærlig begrensning:** Klientside-lisenskontroll er ikke kopibeskyttelse. En teknisk kyndig bruker med full kontroll over egen maskin kan omgå den. Vilkårene forbyr det, og serverfunksjoner kontrolleres på serveren.

## Oppsett (én gang)

1. `npm run license:keygen` → lagre `LICENSE_PRIVATE_KEY` som hemmelighet i driftsmiljøet og `VITE_LICENSE_PUBLIC_KEY` som byggvariabel. Mister du den private nøkkelen, kan du ikke utstede nye nøkler som eksisterende installasjoner godtar.
2. Lag to Stripe Payment Links (abonnement og engangskjøp) med suksess-URL `https://<domene>/purchase-complete?session_id={CHECKOUT_SESSION_ID}`. Slå på krav om å godta vilkår, og for engangskjøpet en egen bekreftelse om at levering starter straks og at angreretten da bortfaller (angrerettloven § 22 bokstav n).
3. Sett `STRIPE_*`- og `PRICE_LABEL_*`-variablene (se `.env.example`).

Se også `docs/SALG-OG-LANSERING.md` for juridisk sjekkliste før salg.
