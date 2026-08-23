import { useState } from 'react';

const TYPES = '.pdf,.docx,.txt,.html,.htm,.xml,.jats';

export default function DocumentAnalysisPanel({ onAnalyze }) {
  const [file, setFile] = useState(null);
  const [instruments, setInstruments] = useState(['AMSTAR2']);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const toggle = (id) => setInstruments((current) => current.includes(id)
    ? current.filter((x) => x !== id)
    : [...current, id]);

  const analyze = async () => {
    if (!file) return setError('Velg et dokument først.');
    if (!instruments.length) return setError('Velg minst ett vurderingsinstrument.');
    setError('');
    try {
      const data = await onAnalyze(file, instruments);
      setResult(data);
    } catch (e) {
      setError(e?.message || 'Dokumentet kunne ikke analyseres.');
    }
  };

  return (
    <section aria-labelledby="document-analysis-title" className="evidence-panel">
      <h2 id="document-analysis-title">Analyser forskningsdokument</h2>
      <p>Last opp et dokument og velg hvilke vurderingsrammeverk som skal brukes. Resultater er kandidatfunn og må kontrolleres av forskeren.</p>

      <label htmlFor="evidence-file">Dokument</label>
      <input id="evidence-file" type="file" accept={TYPES} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <p className="muted">Støtter PDF, DOCX, TXT, HTML og XML/JATS. Skannede dokumenter kan kreve OCR.</p>

      <fieldset>
        <legend>Vurderingsinstrumenter</legend>
        {[
          ['AMSTAR2', 'AMSTAR 2'],
          ['CASP', 'CASP'],
          ['AGREE2', 'AGREE II'],
          ['GRADE', 'GRADE'],
        ].map(([id, label]) => (
          <label key={id}>
            <input type="checkbox" checked={instruments.includes(id)} onChange={() => toggle(id)} /> {label}
          </label>
        ))}
      </fieldset>

      {file && <p><strong>Valgt:</strong> {file.name} ({Math.round(file.size / 1024)} KB)</p>}
      {error && <div role="alert">{error}</div>}
      <button type="button" onClick={analyze} disabled={!file || !instruments.length}>Analyser dokument</button>

      {result && (
        <div className="evidence-results" aria-live="polite">
          <h3>Dokumentanalyse</h3>
          <p><strong>Dokument:</strong> {result.fileName}</p>
          <p><strong>Tekst ekstrahert:</strong> {result.textExtracted ? 'Ja' : 'Nei'}</p>
          {result.requiresOcr && <div role="alert">Dokumentet ser ut til å være skannet eller uten tilgjengelig tekst. OCR må brukes før innholdet kan vurderes.</div>}
          <h4>Kandidatfunn</h4>
          {result.findings?.length ? result.findings.map((finding, index) => (
            <article key={`${finding.page}-${index}`} className="evidence-finding">
              <strong>{finding.instrumentId} · {finding.topic}</strong>
              <span>Side {finding.page}</span>
              <p>{finding.excerpt}</p>
              <small>{finding.verificationStatus}</small>
            </article>
          )) : <p>Ingen relevante kandidatfunn identifisert.</p>}
          {result.warnings?.map((warning) => <div key={warning} role="alert">{warning}</div>)}
        </div>
      )}
    </section>
  );
}
