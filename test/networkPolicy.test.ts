import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { isRequestAllowed } from '../src/services/networkPolicy';

test('metadata requests may only reach the listed bibliographic services over HTTPS', () => {
  for (const url of ['https://api.crossref.org/works/10.1/x', 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', 'https://www.ebi.ac.uk/europepmc/webservices/rest/search', 'https://api.openalex.org/works', 'https://doaj.org/api/v2/search/articles/x', 'https://api.semanticscholar.org/graph/v1/paper/search']) {
    assert.equal(isRequestAllowed('metadata', new URL(url)), true, url);
  }
  for (const url of ['http://api.crossref.org/works', 'https://evil.example/works', 'https://api.crossref.org.evil.example/']) {
    assert.equal(isRequestAllowed('metadata', new URL(url)), false, url);
  }
});

test('clinical (FHIR) requests require HTTPS', () => {
  assert.equal(isRequestAllowed('clinical', new URL('https://fhir.example.no/Observation')), true);
  assert.equal(isRequestAllowed('clinical', new URL('http://fhir.example.no/Observation')), false);
});

test('client code never calls fetch() directly outside the network policy and licence client', async () => {
  const { readdir } = await import('node:fs/promises');
  const files: string[] = [];
  const walk = async (dir: string) => { for (const entry of await readdir(dir, { withFileTypes: true })) { const p = `${dir}/${entry.name}`; if (entry.isDirectory()) await walk(p); else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.test.ts')) files.push(p); } };
  await walk('src');
  const allowed = new Set(['src/services/networkPolicy.ts', 'src/services/licenseClient.ts', 'src/services/licenseServer.ts', 'src/runtime/edition.ts', 'src/components/LicenseGate.tsx']);
  const offenders: string[] = [];
  for (const file of files) {
    if (allowed.has(file)) continue;
    const source = await readFile(file, 'utf8');
    if (/(?<![\w.])fetch\(/.test(source)) offenders.push(file);
  }
  assert.deepEqual(offenders, [], `Use guardedFetch() from networkPolicy instead of fetch() in: ${offenders.join(', ')}`);
});

test('the server has no document upload endpoint (documents and PDFs are parsed in the browser)', async () => {
  const server = await readFile('server.ts', 'utf8');
  assert.doesNotMatch(server, /parse-file/);
});
