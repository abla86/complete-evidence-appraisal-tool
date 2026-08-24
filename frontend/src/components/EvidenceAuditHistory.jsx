import { useState } from 'react';

const API = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5237');

async function loadHistory(recordId) {
  const response = await fetch(`${API}/api/evidence/manual/${encodeURIComponent(recordId)}/history`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export default function EvidenceAuditHistory() {
  const [recordId, setRecordId] = useState('');
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function showHistory() {
    if (!recordId.trim()) return;
    setBusy(true); setError('');
    try { setHistory(await loadHistory(recordId.trim())); }
    catch (e) { setHistory([]); setError(e.message); }
    finally { setBusy(false); }
  }

  return <section className="research-hub" aria-labelledby="audit-heading">
    <p className="eyebrow">Sporbarhet</p>
    <h2 id="audit-heading">Audit trail for evidens</h2>
    <p>Verifikasjonsendringer lagres som nye historikkversjoner. Tidligere verifikasjonsstatus overskrives derfor ikke i historikken.</p>
    <section className="assessment-card">
      <label>Evidens-ID<input value={recordId} onChange={(e) => setRecordId(e.target.value)} placeholder="UUID fra evidensposten" /></label>
      <button type="button" className="primary-action" onClick={showHistory} disabled={!recordId.trim() || busy}>{busy ? 'Henter …' : 'Vis endringshistorikk'}</button>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {history.length === 0 && !error && <p className="muted">Ingen historikk hentet ennå.</p>}
      {history.length > 0 && <div className="evidence-table-wrap"><table><thead><tr><th>Versjon</th><th>Status</th><th>Reviewer</th><th>Notat</th><th>Tidspunkt</th><th>Handling</th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td>{item.version}</td><td>{item.status}</td><td>{item.reviewer}</td><td>{item.verificationNote || '—'}</td><td>{new Date(item.recordedAtUtc).toLocaleString('nb-NO')}</td><td>{item.action}</td></tr>)}</tbody></table></div>}
    </section>
    <section className="notice notice-warning"><strong>Metodisk avgrensning:</strong> Audit trail dokumenterer hva som ble registrert og endret. Den beviser ikke at forskerens metodiske vurdering er korrekt.</section>
  </section>;
}
