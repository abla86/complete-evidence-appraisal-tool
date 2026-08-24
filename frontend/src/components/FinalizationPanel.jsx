import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5237');

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

export default function FinalizationPanel({ projectId }) {
  const [project, setProject] = useState(null);
  const [reviewer, setReviewer] = useState('');
  const [name, setName] = useState('Research project');
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await request(`/api/research/operations/projects/${projectId}`);
        if (active) {
          setProject(data);
          setName(data.name || 'Research project');
        }
      } catch (err) {
        if (err.message.includes('404')) {
          if (active) setProject(null);
        } else if (active) {
          setError(err.message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [projectId]);

  async function finalize() {
    if (!reviewer.trim()) {
      setError('Reviewer er påkrevd.');
      return;
    }

    setFinalizing(true);
    setError('');
    setResult(null);

    try {
      const data = await request(`/api/research/operations/projects/${projectId}/finalize`, {
        method: 'POST',
        body: JSON.stringify({
          reviewer: reviewer.trim(),
          name: name.trim() || 'Research project',
        }),
      });

      setResult(data);
      setProject({
        id: projectId,
        name: name.trim() || 'Research project',
        isLocked: true,
        finalHash: data.finalHash,
        lockedAtUtc: data.lockedAtUtc,
        lockedBy: data.lockedBy,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setFinalizing(false);
    }
  }

  if (loading) {
    return <section className="method-card"><p>Laster prosjektstatus …</p></section>;
  }

  return (
    <section className="method-card">
      <div className="method-card-heading">
        <div>
          <p className="eyebrow">Forskningskontroll</p>
          <h3>Finalisering og låsing</h3>
        </div>
        <span className={`pill ${project?.isLocked ? 'success' : ''}`}>
          {project?.isLocked ? 'Låst' : 'Åpen'}
        </span>
      </div>

      {error && <div className="notice notice-error" role="alert">{error}</div>}

      {project?.isLocked ? (
        <div className="result-box success">
          <strong>Prosjektet er finalisert og låst.</strong>
          <p>Finalisert av: {project.lockedBy || 'Ikke oppgitt'}</p>
          <p>Finalisert: {project.lockedAtUtc ? new Date(project.lockedAtUtc).toLocaleString() : 'Ikke oppgitt'}</p>
          <p className="mono">SHA-256: {project.finalHash || 'Ikke tilgjengelig'}</p>
          <p className="muted">
            Låsing er en integritetskontroll. Den er ikke en metodisk godkjenning av forskningen.
          </p>
        </div>
      ) : (
        <>
          <p>
            Finalisering lager en SHA-256-integritetsmarkør og låser prosjektkontrollen.
            Kontroller forskningsmaterialet og audit-sporet før finalisering.
          </p>

          <div className="research-grid">
            <label>
              Prosjektnavn
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={500} />
            </label>
            <label>
              Reviewer
              <input value={reviewer} onChange={(event) => setReviewer(event.target.value)} maxLength={100} />
            </label>
          </div>

          <button type="button" className="primary-button" onClick={finalize} disabled={finalizing}>
            {finalizing ? 'Finaliserer …' : 'Finaliser og lås prosjekt'}
          </button>
        </>
      )}

      {result && <div className="result-box"><strong>Finalisering fullført.</strong><p className="mono">{result.finalHash}</p></div>}
    </section>
  );
}
