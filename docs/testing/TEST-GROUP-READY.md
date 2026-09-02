# Testgruppe – klarhetskriterier

Dette dokumentet beskriver hva som må være sant før ekstern testing starter.

## Samlet flyt

1. En SourceRecord kan importeres som JSON.
2. Importen valideres mot `src/schemas/source-record.schema.json` og den runtime-baserte validatoren.
3. Systemet genererer et nytt `recordId` ved mottak.
4. Kilden står først som `unassigned` og påvirker ikke PRISMA-screeningtellinger.
5. Kilden kan kobles til en screening-batch.
6. Screening kan gå videre til `reviewed`, og derfra til `included` eller `excluded`.
7. En kilde kan kobles til PICO/PECO først etter at screeningkravet er oppfylt.
8. Hver handling gir en separat audit-hendelse.
9. Audit-kjeden kan valideres og manipulasjon oppdages.
10. Referanser viser forskjellen mellom lokal strukturell validering og faktisk kildeverifikasjon.
11. Privacy- og accessibility-resultater er signaler, ikke sertifiseringer.

## Ingen falsk sikkerhet

- `VALIDATION_REQUIRED` skal ikke vises som verifisert.
- Detected metadata skal ikke vises som kildebekreftet.
- Privacy-signaler skal ikke omtales som GDPR-compliance.
- Accessibility-signaler skal ikke omtales som WCAG-konformitetssertifisering.
- Automatiske kandidatfunn skal ikke automatisk bli `Yes`/`No` i en appraisal.

## Feilhåndtering

En modulfeil skal være lokal til handlingen som feilet. Dataposter skal ikke bli delvis opprettet som om operasjonen lyktes. Feil skal være synlige og, der handlingen endrer forskningsdata, spores i audit-laget.
