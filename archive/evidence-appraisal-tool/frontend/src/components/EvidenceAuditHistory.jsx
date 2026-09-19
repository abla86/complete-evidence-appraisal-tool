import { useState } from 'react';

const API = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5237');

async function loadHistory(recordId) {
  const response = await fetch(`${API}/api/evidence/manual/${encodeURIComponent(recordId)}/history`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

async function exportHistory(recordId, status, reviewer) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (reviewer.trim()) params.set('reviewer', reviewer.trim());
  const query = params.toString();
  const response = await fetch(`${API}/api/evidence/manual/${encodeURIComponent(recordId)}/history/export${query ? `?${query}` : ''}`);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Export failed (${response.status})`);
  }
  return response.blob();
}

export default function EvidenceAuditHistory() {
  const [recordId, setRecordId] = useState('');
  const [status, setStatus] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function showHistory() {
    if (!recordId.trim()) return;
    setBusy(true); setError('');
    try {
      const rows = await loadHistory(recordId.trim());
      setHistory(rows.filter((item) => (!status || item.status === status) && (!reviewer.trim() || item.reviewer === reviewer.trim())));
    } catch (e) { setHistory([]); setError(e.message); }
    finally { setBusy(false); }
  }

  async function downloadCsv() {
    if (!recordId.trim()) return;
    setBusy(true); setError('');
    try {
      const blob = await exportHistory(recordId.trim(), status, reviewer);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `evidence-audit-${recordId.replace(/[^a-z0-9-]/gi, '')}.csv`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return <section className="research-hub" aria-labelledby="audit-heading">
    <p className="eyebrow">Sporbarhet</p>
    <h2 id="audit-heading">Audit trail for evidens</h2>
    <p>Verifikasjonsendringer lagres som nye historikkversjoner. Tidligere verifikasjonsstatus overskrives derfor ikke i historikken.</p>
    <section className="assessment-card">
      <div className="research-grid">
        <label>Evidens-ID<input value={recordId} onChange={(e) => setRecordId(e.target.value)} placeholder="UUID fra evidensposten" /></label>
        <label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Alle</option><option>Needs review</option><option>Verified</option><option>Rejected</option><option>Uncertain</option><option>Not found</option><option>Manually added</option></select></label>
        <label>Reviewer<input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Eksakt reviewer-navn" /></label>
      </div>
      <div className="action-row">
        <button type="button" className="primary-action" onClick={showHistory} disabled={!recordId.trim() || busy}>{busy ? 'Henter …' : 'Vis endringshistorikk'}</button>
        <button type="button" className="secondary-action" onClick={downloadCsv} disabled={!recordId.trim() || busy}>Eksporter filtrert CSV</button>
      </div>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {history.length === 0 && !error && <p className="muted">Ingen historikk samsvarer med valgt filter.</p>}
      {history.length > 0 && <div className="evidence-table-wrap"><table><thead><tr><th>Versjon</th><th>Status</th><th>Reviewer</th><th>Notat</th><th>Tidspunkt</th><th>Handling</th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td>{item.version}</td><td>{item.status}</td><td>{item.reviewer}</td><td>{item.verificationNote || '—'}</td><td>{new Date(item.recordedAtUtc).toLocaleString('nb-NO')}</td><td>{item.action}</td></tr>)}</tbody></table></div>}
    </section>
    <section className="notice notice-warning"><strong>Metodisk avgrensning:</strong> Audit trail dokumenterer hva som ble registrert og endret. Den beviser ikke at forskerens metodiske vurdering er korrekt.</section>
  </section>;
}
