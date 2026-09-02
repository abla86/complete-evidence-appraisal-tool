# Unified Reference Hub

## Arkitekturregel

Superprogrammet har **én intern referanseplattform**:

- `src/services/referenceHubService.ts` — canonical ReferenceRecord, bibliotek, duplikatkandidater, vedlegg og annotasjoner
- `src/services/sharedReferenceEngine.ts` — felles adapter/grense
- `src/services/referenceIntegrityService.ts` — strukturell validering og verifikasjonsstatus
- `src/components/ReferenceHubView.tsx` — samlet brukerflate

EndNote, Zotero, Mendeley og Paperpile er **kompatibilitets- og migrasjonsmål**, ikke parallelle interne referansemotorer.

## Funksjonsmål

Reference Hub samler relevante styrker fra etablerte referanseprogrammer i én arbeidsflyt:

- sentralt forskningsbibliotek
- metadata, DOI, PMID, ISBN, ISSN og URL
- RIS, BibTeX, EndNote XML, CSL JSON, CSV og JSON
- PDF-vedlegg og andre kildefiler
- annotasjoner, markeringer, sitater og notater
- mapper, collections og tags
- duplikatdeteksjon uten automatisk sletting
- eksplisitt sammenslåing med historikk
- `VALIDATION_REQUIRED` / `VALIDATED` / `INVALID`
- in-text citations, bibliografi, fotnoter og sluttnoter via felles referansemodell
- Word, Google Docs og LibreOffice som integrasjonmål
- interoperabilitet med EndNote, Zotero, Mendeley og Paperpile
- kobling mot artikkel, screening, PICO, evidens, appraisal og syntese
- audit- og versjonssporing

## Styrker som skal inn i én motor

**EndNote:** store bibliotek, citation styles, Cite While You Write, recovery og oppdatering av referanser.

**Zotero:** bred nettinnsamling, PDF-leser/annotering, CSL-stiler, Word/LibreOffice/Google Docs og sterk import/eksport.

**Mendeley:** PDF-import, webimport, annotasjoner/notater, delte bibliotek og Word-citering.

**Paperpile:** hurtig webimport, PDF-organisering, duplikatopprydding, delte samlinger, annotasjoner og Google Docs/Word-støtte.

## Integritetsregel

Formattering eller syntaktisk DOI-gyldighet er ikke bibliografisk sannhetsverifisering. Reference Hub må aldri oppgradere en referanse til `VALIDATED` uten eksplisitt verifiseringshandling.

## Implementasjonsregel

Nye referansefunksjoner skal legges i Reference Hub eller eksisterende felles referansegrense. Nye parallelle EndNote-, Zotero-, Mendeley- eller Paperpile-motorer skal ikke opprettes.

## Avgrensning

Målet er ikke å påstå at superprogrammet er en full kopi av de kommersielle produktene. Målet er én sterk, sammenhengende forskningsreferanseplattform med høy interoperabilitet og tydelig kildeintegritet.
