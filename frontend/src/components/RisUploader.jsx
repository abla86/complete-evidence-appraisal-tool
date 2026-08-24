import { useState } from 'react';

async function sendRis(file, confirm) {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(confirm ? '/api/import/ris' : '/api/import/ris-preview', { method: 'POST', body });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'RIS-importen kunne ikke gjennomføres.');
  return payload;
}

export default function RisUploader() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function previewFile(selectedFile) {
    setFile(selectedFile); setPreview(null); setResult(null); setError('');
    if (!selectedFile) return;
    setBusy(true);
    try { setPreview(await sendRis(selectedFile, false)); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function confirmImport() {
    if (!file) return;
    setBusy(true); setError('');
    try { setResult(await sendRis(file, true)); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return <section className="research-hub" aria-labelledby="ris-import-heading">
    <p className="eyebrow">Referanser</p>
    <h2 id="ris-import-heading">Importer referanser</h2>
    <p>Importer bibliografiske referanser fra EndNote, Zotero eller databaser som kan eksportere RIS. Importen oppretter ikke en faglig vurdering.</p>
    <section className="assessment-card">
      <h3>RIS-import</h3>
      <p className="muted">Velg en .ris-fil. Først får du en forhåndsvisning. Ingenting lagres før du bekrefter.</p>
      <div className="document-upload-box">
        <input id="ris-file" className="document-file-input" type="file" accept=".ris" onChange={(e) => previewFile(e.target.files?.[0] ?? null)} disabled={busy} />
        <label htmlFor="ris-file" className="upload-button">+ Velg RIS-fil</label>
        <p className="upload-help">RIS · maks. 10 MB</p>
      </div>
      {file && <p className="notice"><strong>Valgt:</strong> {file.name}</p>}
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      {busy && <p role="status">Behandler RIS-fil …</p>}
      {preview && <div className="assessment-card">
        <h4>Forhåndsvisning: {preview.count} referanser</h4>
        <div className="evidence-table-wrap"><table><thead><tr><th>Tittel</th><th>Forfattere</th><th>År</th><th>DOI</th><th>Tidsskrift</th></tr></thead><tbody>{preview.studies.map((study) => <tr key={study.importFingerprint}><td>{study.title}</td><td>{study.authors.join('; ') || 'Ikke oppgitt'}</td><td>{study.year || 'Ikke oppgitt'}</td><td>{study.doi || 'Ikke oppgitt'}</td><td>{study.journal || 'Ikke oppgitt'}</td></tr>)}</tbody></table></div>
        <p className="muted">Kontroller listen før import. Manglende metadata blir ikke gjettet av systemet.</p>
        <button type="button" className="primary-action" disabled={busy} onClick={confirmImport}>Bekreft import av {preview.count} referanser</button>
      </div>}
      {result && <div className="notice notice-success" role="status"><strong>Import fullført:</strong> {result.imported} nye referanser importert. {result.skippedDuplicates} duplikater hoppet over.</div>}
    </section>
  </section>;
}
