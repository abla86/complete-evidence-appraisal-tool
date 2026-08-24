import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5237');

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export default function ResearchCollaborationPanel({ projectId }) {
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('eat-reviewer-name') || 'Researcher');
  const [reviewerId] = useState(() => localStorage.getItem('eat-reviewer-id') || crypto.randomUUID());
  const [room, setRoom] = useState({ participants: [], locks: [] });
  const [error, setError] = useState('');

  useEffect(() => { localStorage.setItem('eat-reviewer-id', reviewerId); }, [reviewerId]);
  useEffect(() => { localStorage.setItem('eat-reviewer-name', displayName); }, [displayName]);

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      try {
        await request(`/api/research/collaboration/${encodeURIComponent(projectId)}/heartbeat`, {
          method: 'POST', body: JSON.stringify({ reviewerId, displayName })
        });
        const next = await request(`/api/research/collaboration/${encodeURIComponent(projectId)}`);
        if (!cancelled) { setRoom(next); setError(''); }
      } catch (e) { if (!cancelled) setError(e.message); }
    };
    sync();
    const timer = window.setInterval(sync, 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [projectId, reviewerId, displayName]);

  const others = useMemo(() => room.participants.filter((x) => x.reviewerId !== reviewerId), [room.participants, reviewerId]);

  return <section className="assessment-card" aria-labelledby="collaboration-heading">
    <div className="method-card-heading"><div><p className="eyebrow">Samarbeid</p><h3 id="collaboration-heading">Live reviewer-status</h3></div><span className="pill">{others.length + 1} aktive</span></div>
    <div className="research-grid">
      <label>Navn som vises for andre<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label>
      <div><strong>Aktive reviewere</strong><ul>{room.participants.map((person) => <li key={person.reviewerId}>{person.displayName}{person.reviewerId === reviewerId ? ' (deg)' : ''}</li>)}</ul></div>
    </div>
    {room.locks.length > 0 && <div className="notice notice-warning"><strong>Aktive feltlåser:</strong>{room.locks.map((lock) => <div key={`${lock.projectId}-${lock.fieldId}`}>{lock.fieldId} · {lock.displayName} · utløper {new Date(lock.expiresAtUtc).toLocaleTimeString('nb-NO')}</div>)}</div>}
    {error && <div className="notice notice-error" role="alert">Live-status er midlertidig utilgjengelig: {error}</div>}
    <p className="muted">Presence og låser er hjelpemidler for samarbeid. De erstatter ikke versjonering, audit trail eller databasebasert concurrency-kontroll.</p>
  </section>;
}
