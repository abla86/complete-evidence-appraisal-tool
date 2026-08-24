import { useEffect, useState } from 'react';

const FALLBACK_FORMATS = [
  { extension: '.ris', name: 'RIS' },
  { extension: '.bib', name: 'BibTeX' },
  { extension: '.bibtex', name: 'BibTeX' },
  { extension: '.nbib', name: 'PubMed/MEDLINE' },
  { extension: '.xml', name: 'PubMed XML / bibliografisk XML' },
  { extension: '.enw', name: 'EndNote Tagged' },
];

async function send(file, confirm) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(confirm ? '/api/import/bibliography' : '/api/import/bibliography-preview', { method: 'POST', body });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Importfeil (${response.status})`);
  return payload;
}

export default function BibliographyUploader() {
  const [formats, setFormats] = useState(FALLBACK_FORMATS);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/import/bibliography-formats').then(r => r.ok ? r.json() : null).then(data => data?.length && setFormats(data)).catch(() => {});
  }, []);

  async function choose(selected) {
    setFile(selected); setPreview(null); setResult(null); setError('');
    if (!selected) return;
    setBusy(true);
    try { setPreview(await send(selected, false)); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function confirm() {
    if (!file) return;
    setBusy(true); setError('');
    try { setResult(await send(file, true)); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  const accept = formats.map(x => x.extension).join(',');
  const selectedExtension = file ? `.${file.name.split('.').pop()?.toLowerCase()}` : '';

  return <section className="research-hub" aria-labelledby="bibliography-import-heading">
    <p className="eyebrow">Referansebibliotek</p>
    <h2 id="bibliography-import-heading">Importer bibliografiske referanser</h2>
    <p>Velg eksportfilen fra databasen eller referanseverktøyet. Programmet leser bibliografiske metadata, viser en forhåndsvisning og lagrer først etter eksplisitt bekreftelse.</p>
    <section className="assessment-card">
      <h3>1. Velg fil</h3>
      <div className="document-upload-box">
        <input id="bibliography-file" className="document-file-input" type="file" accept={accept} onChange={e => choose(e.target.files?.[0] ?? null)} disabled={busy} />
        <label htmlFor="bibliography-file" className="upload-button">+ Velg bibliografifil</label>
        <p className="upload-help">Støttede formater: {formats.map(x => x.extension).join(' · ')} · maks. 10 MB</p>
      </div>
      {file && <div className="notice"><strong>Valgt:</strong> {file.name}<br /><span className="muted">Format: {formats.find(x => x.extension === selectedExtension)?.name || 'Bibliografisk fil'}</span></div>}
      {busy && <p role="status">Leser filen og bygger forhåndsvisning …</p>}
      {error && <div className="notice notice-error" role="alert">{error}</div>}
    </section>
    {preview && <section className="assessment-card">
      <h3>2. Forhåndsvisning — kontroller før import</h3>
      <p><strong>{preview.count} referanser</strong> ble lest fra <strong>{preview.format}</strong>.</p>
      <div className="evidence-table-wrap"><table><thead><tr><th>Tittel</th><th>Forfattere</th><th>År</th><th>DOI</th><th>Tidsskrift</th></tr></thead><tbody>{preview.studies.map(study => <tr key={study.importFingerprint}><td>{study.title}</td><td>{study.authors?.join('; ') || 'Ikke oppgitt'}</td><td>{study.year || 'Ikke oppgitt'}</td><td>{study.doi || 'Ikke oppgitt'}</td><td>{study.journal || 'Ikke oppgitt'}</td></tr>)}</tbody></table></div>
      <div className="notice notice-warning"><strong>Kontroller spesielt:</strong> antall referanser, titler, forfattere, år og DOI. Manglende metadata blir ikke gjettet.</div>
      <p className="muted">Importen oppretter bibliografiske poster. Den avgjør ikke inklusjon, eksklusjon, risiko for bias eller evidenssikkerhet.</p>
      <button type="button" className="primary-action" onClick={confirm} disabled={busy || !file}>Bekreft import av {preview.count} referanser</button>
    </section>}
    {result && <div className="notice notice-success" role="status"><strong>Import fullført:</strong> {result.imported} nye referanser fra {result.format}. {result.skippedDuplicates} duplikater ble hoppet over.</div>}
  </section>;
}
