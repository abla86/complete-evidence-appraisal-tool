#!/usr/bin/env node
// Packages the offline edition (dist-offline/index.html) into release/evidence-appraisal-offline.zip.
// The zip is what licensed customers download: one HTML file plus instructions, terms and notices.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { buildThirdPartyNotices } from './third-party-notices.mjs';

const root = process.cwd();
const html = path.join(root, 'dist-offline', 'index.html');
if (!fs.existsSync(html)) throw new Error('dist-offline/index.html is missing. Run "npm run build:offline" first.');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const appFile = 'Evidence-Appraisal-Tool.html';
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');

const readme = `EVIDENCE APPRAISAL TOOL – NEDLASTBAR UTGAVE ${pkg.version}
Selger: Andersen, org.nr. 835 983 102, Utsiragata 88, 5537 Haugesund

SLIK BRUKER DU PROGRAMMET
1. Pakk ut hele zip-filen til en mappe du har tilgang til (f.eks. Dokumenter).
   - Windows: høyreklikk zip-filen → «Pakk ut alle».
   - macOS: dobbeltklikk zip-filen.
   - Linux/ChromeOS: åpne zip-filen i filbehandleren og velg «Pakk ut».
2. Åpne ${appFile} i Google Chrome, Microsoft Edge eller Mozilla Firefox
   (høyreklikk → «Åpne med» hvis en annen nettleser åpnes). Safari støttes ikke for den nedlastbare filen.
3. Lim inn lisensnøkkelen første gang. Den kontrolleres lokalt – ingen nett trengs.

MOBIL OG NETTBRETT (iOS, iPadOS, Android)
Bruk nettutgaven og velg «Legg til på Hjem-skjerm». Den virker uten nett etter første besøk.

DATA OG PERSONVERN
- Alt du legger inn lagres lokalt i nettleseren på denne datamaskinen. PDF-er og dokumenter lastes aldri opp.
- Programmet kontakter ingen servere med mindre du slår på «Litteratursøk og DOI-oppslag»
  under Personvern. Da sendes bare søkeord/DOI-er direkte til Crossref, OpenAlex, PubMed, Europe PMC, DOAJ
  og Semantic Scholar.
- Data er knyttet til nettleseren og plasseringen av filen. Flytter du filen eller bytter nettleser,
  bruk «Sikkerhetskopi (zip)» under Personvern for å flytte dataene. Ta sikkerhetskopi jevnlig.

ANSVARSFRASKRIVELSE
Verktøyet støtter kritisk vurdering og erstatter ikke faglig skjønn. Kontroller alle resultater mot
originalartikkelen og den offisielle versjonen av instrumentet. Ikke legg inn identifiserbare pasientdata.
Fullstendige vilkår, angrerett og personvernerklæring finnes i programmet (Meny → Vilkår, personvern & ansvar).

LISENS
Bruk krever gyldig nedlastingslisens. Det er ikke tillatt å dele filen eller lisensnøkkelen utover antall
brukere lisensen gjelder. Tredjeparts programvare: se THIRD-PARTY-NOTICES.txt.

KONTROLLSUM
SHA-256 for ${appFile} står i SHA256SUMS.txt.
`;

const htmlBytes = fs.readFileSync(html);
const zip = new JSZip();
zip.file(appFile, htmlBytes);
zip.file('LES-MEG.txt', readme.replace(/\n/g, '\r\n'));
zip.file('THIRD-PARTY-NOTICES.txt', buildThirdPartyNotices(root));
zip.file('SHA256SUMS.txt', `${sha256(htmlBytes)}  ${appFile}\r\n`);

const outDir = path.join(root, 'release');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'evidence-appraisal-offline.zip');
fs.writeFileSync(out, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } }));
console.log(`Wrote ${path.relative(root, out)} (${(fs.statSync(out).size / 1024 / 1024).toFixed(1)} MB)`);
