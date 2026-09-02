# Evidence Appraisal — release- og sluttkontroll

## Teknisk kontroll

- [ ] `npm ci` fullfører uten feil
- [ ] `npm test` er grønn lokalt
- [ ] `npm run lint` er grønn lokalt
- [ ] `npm run build` er grønn lokalt
- [ ] GitHub Actions har faktisk kjørt på release-kandidaten
- [ ] GitHub Actions `test`, `lint` og `build` er grønne

## Metodisk kontroll

- [ ] Master-instrumentregisteret er autoritativt
- [ ] Study-design compatibility gate håndheves
- [ ] JBI Qualitative 2017 brukes som spesialmodul, ikke som generell poengmotor
- [ ] AMSTAR 2 beholdes uten totalsum
- [ ] CASP beholdes uten kunstig totalskår
- [ ] AGREE II rapporterer domeneskår etter instrumentets metode
- [ ] RoB 2 / ROBINS-I-resultater presenteres som risiko for bias, ikke en generell kvalitetspoengsum
- [ ] GRADE og CERQual behandles som egne certainty/confidence-vurderinger

## Evidensintegritet

- [ ] EvidenceExtraction har sporbar kilde/lokasjon der dette kreves
- [ ] AcademicClaim kan spores til underliggende evidens
- [ ] AI-kandidatfunn kan ikke opptre som menneskelig verifiserte funn
## Gjennomgang og revisjon

- [ ] Reviewer A/B kan vurderes uavhengig
- [ ] Konflikter går til konsensus/adjudication
- [ ] Audit trail kan verifiseres med hash-kjede
- [ ] Låste vurderinger er ikke muterbare gjennom normal UI-flyt

## Eksport

- [ ] Prosjekteksport går gjennom integritetsgate
- [ ] Ulåst appraisal blokkerer eksport når regelen krever det
- [ ] Ulåst GRADE/CERQual blokkerer eksport når det inngår i prosjektets påkrevde kvalitetstrinn
- [ ] Referanser og evidens følger med i eksporten
- [ ] PRISMA og auditdata følger med der eksportformatet støtter dette

## Releasepåstand

Release kan omtales som **teknisk verifisert** først når alle relevante automatiske kontroller har dokumentert grønn status.

Metodisk gyldighet av en konkret forskningsvurdering må fortsatt vurderes av forsker/fagperson. En grønn software-CI-run er ikke en metodisk sertifisering av forskningsresultater.
