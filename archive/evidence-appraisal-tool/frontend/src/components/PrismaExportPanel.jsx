import { useState } from 'react';

const API = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5237');

const defaultPrisma = {
  recordsIdentified: 0,
  recordsRemovedBeforeScreening: 0,
  recordsScreened: 0,
  recordsExcluded: 0,
  reportsSought: 0,
  reportsNotRetrieved: 0,
  reportsAssessed: 0,
  reportsExcludedWithReasons: 0,
  studiesIncluded: 0,
  reportsIncluded: 0,
};

function loadPrisma() {
  try {
    return { ...defaultPrisma, ...JSON.parse(localStorage.getItem('eat-prisma') || '{}') };
  } catch {
    return defaultPrisma;
  }
}

export default function PrismaExportPanel() {
  const [prisma, setPrisma] = useState(loadPrisma);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(key, value) {
    setPrisma((current) => ({ ...current, [key]: Math.max(0, Number(value) || 0) }));
  }

  async function exportFormat(format) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API}/api/research/prisma/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prisma),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Eksport feilet (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = format === 'svg' ? 'prisma-flow-diagram.svg' : 'prisma-flow-data.json';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || 'Eksport feilet.');
    } finally {
      setBusy(false);
    }
  }

  const labels = {
    recordsIdentified: 'Identifisert',
    recordsRemovedBeforeScreening: 'Fjernet før screening',
    recordsScreened: 'Screenet',
    recordsExcluded: 'Ekskludert',
    reportsSought: 'Rapporter søkt',
    reportsNotRetrieved: 'Ikke hentet',
    reportsAssessed: 'Vurdert for inklusjon',
    reportsExcludedWithReasons: 'Ekskludert med grunn',
    studiesIncluded: 'Inkluderte studier',
    reportsIncluded: 'Inkluderte rapporter',
  };

  return (
    <section className="research-hub" aria-labelledby="prisma-export-heading">
      <p className="eyebrow">PRISMA</p>
      <h2 id="prisma-export-heading">Eksporter PRISMA-flyt</h2>
      <p>Verdiene hentes fra den eksisterende forskningsflyten i nettleseren. Serveren stopper eksport dersom tallene ikke er internt konsistente.</p>

      {error && <div className="notice notice-error" role="alert">{error}</div>}

      <div className="research-grid prisma-grid">
        {Object.entries(labels).map(([key, label]) => (
          <label key={key}>
            {label}
            <input type="number" min="0" value={prisma[key]} onChange={(event) => update(key, event.target.value)} />
          </label>
        ))}
      </div>

      <div className="action-row">
        <button type="button" className="primary-button" onClick={() => exportFormat('svg')} disabled={busy}>Eksporter SVG-diagram</button>
        <button type="button" className="secondary-action" onClick={() => exportFormat('json')} disabled={busy}>Eksporter JSON-metadata</button>
      </div>

      <div className="notice notice-warning">
        <strong>Metodisk avgrensning:</strong> Dette er en PRISMA-stil visualisering basert på registrerte og validerte flyttall. Den erstatter ikke forskerens kontroll av PRISMA 2020-rapporteringen eller andre nødvendige rapporteringsopplysninger.
      </div>
    </section>
  );
}
