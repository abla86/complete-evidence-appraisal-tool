#!/usr/bin/env node
// Writes THIRD-PARTY-NOTICES.txt for every production dependency (name, version, licence and licence text).
// Used by the offline package and served with the web build so open-source licence terms are met.
import fs from 'node:fs';
import path from 'node:path';

export function buildThirdPartyNotices(root = process.cwd()) {
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const entries = Object.entries(lock.packages || {})
    .filter(([location, meta]) => location.startsWith('node_modules/') && !meta.dev && !meta.devOptional)
    .map(([location, meta]) => {
      const dir = path.join(root, location);
      const name = location.slice(location.lastIndexOf('node_modules/') + 'node_modules/'.length);
      const licenseFile = fs.existsSync(dir) ? fs.readdirSync(dir).find(file => /^(licen[cs]e|copying|notice)(\.|$)/i.test(file)) : undefined;
      const text = licenseFile ? fs.readFileSync(path.join(dir, licenseFile), 'utf8').trim() : '';
      return { name, version: meta.version || '', license: meta.license || 'UNKNOWN', text };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const unique = [...new Map(entries.map(entry => [`${entry.name}@${entry.version}`, entry])).values()];
  const header = 'Evidence Appraisal Tool bruker følgende tredjeparts programvare med åpen kildekode.\nThis product includes the following third-party open-source software.\n';
  return header + unique.map(entry => `\n${'='.repeat(78)}\n${entry.name}@${entry.version} — ${entry.license}\n${'='.repeat(78)}\n${entry.text || '(No licence file shipped in the package; see the licence identifier above.)'}\n`).join('');
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('third-party-notices.mjs')) {
  const out = process.argv[2] || 'dist/THIRD-PARTY-NOTICES.txt';
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buildThirdPartyNotices());
  console.log(`Wrote ${out}`);
}
