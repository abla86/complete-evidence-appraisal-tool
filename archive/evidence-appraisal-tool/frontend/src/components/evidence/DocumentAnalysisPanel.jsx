import { useState } from 'react';

const TYPES = '.pdf,.docx,.txt,.html,.htm,.xml,.jats';

export default function DocumentAnalysisPanel({ onAnalyze, onAddManualEvidence }) {
  const [file, setFile] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showSourceText, setShowSourceText] = useState(false);

  const toggle = (id) => setInstruments((current) => current.includes(id)
    ? current.filter((x) => x !== id)
    : [...current, id]);

  const analyze = async () => {
    if (!file) return setError('Velg et dokument først.');
    setError('');
    try {
      const data = await onAnalyze(file, instruments, showSourceText);
      setResult(data);
    } catch (e) {
      setError(e?.message || 'Dokumentet kunne ikke analyseres.');
    }
  };

  return (
    <section aria-labelledby="document-analysis-title" className="evidence-panel">
      <h2 id="document-analysis-title">Analyser forskningsdokument</h2>
      <p>Last opp dokumentet først. Systemet klassifiserer dokumenttype og studiedesign før vurderingsinstrument velges. Automatisk analyse finner kun kandidatpassasjer; forskeren må kontrollere originalkilden og gjøre den faglige vurderingen.</p>

      <label htmlFor="evidence-file">Dokument</label>
      <input id="evidence-file" type="file" accept={TYPES} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <p className="muted">PDF, DOCX, TXT, HTML/HTM og XML/JATS. Maksimal filstørrelse er 25 MB. Skannede dokumenter kan kreve OCR.</p>

      <fieldset>
        <legend>Vurderingsinstrumenter</legend>
        {[
          ['amstar2', 'AMSTAR 2'],
          ['casp', 'CASP'],
          ['agree2', 'AGREE II'],
          ['grade', 'GRADE'],
        ].map(([id, label]) => (
          <label key={id}>
            <input type="checkbox" checked={instruments.includes(id)} onChange={() => toggle(id)} /> {label}
          </label>
        ))}
      </fieldset>

      <label>
        <input type="checkbox" checked={showSourceText} onChange={(e) => setShowSourceText(e.target.checked)} />
        Vis ekstrahert kildetekst
      </label>

      {file && <p><strong>Valgt:</strong> {file.name} ({Math.round(file.size / 1024)} KB)</p>}
      {error && <div role="alert">{error}</div>}
      <button type="button" onClick={analyze} disabled={!file}>Analyser og klassifiser dokument</button>

      {result && (
        <div className="evidence-results" aria-live="polite">
          <h3>Dokumentanalyse</h3>
          <p><strong>Dokument:</strong> {result.fileName}</p>
          <p><strong>Dokumenttype:</strong> {result.classification?.documentType || 'Ikke sikkert klassifisert'}</p>
          <p><strong>Klassifiseringskonfidens:</strong> {result.classification?.confidence || 'Ukjent'}</p>
          <p><strong>Tekststatus:</strong> {result.extractionStatus}</p>
          <p><strong>SHA-256:</strong> <code>{result.documentHashSha256}</code></p>
          <p><strong>Kildeenheter:</strong> {result.sourceUnitCount}</p>

          <div className="methodological-notice" role="note">
            {result.methodologicalNotice}
          </div>

          <h4>Anbefalte instrumenter</h4>
          {result.recommendedInstruments?.length ? <ul>{result.recommendedInstruments.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Ingen instrumentanbefaling kan gis sikkert fra tilgjengelig informasjon.</p>}

          <h4>Instrumentegnethet</h4>
          {result.instrumentSuitability?.map((item) => (
            <div key={item.instrument} className={`suitability suitability-${item.status.toLowerCase().replaceAll(' ', '-')}`}>
              <strong>{item.instrument}: {item.status}</strong>
              <p>{item.reason}</p>
            </div>
          ))}

          <h4>Kandidatfunn</h4>
          {result.findings?.length ? result.findings.map((finding, index) => (
            <article key={`${finding.instrument}-${finding.topic}-${finding.page}-${index}`} className="evidence-finding">
              <strong>{finding.instrument} · {finding.topic}</strong>
              <span>Side/kildeenhet {finding.page}</span>
              <p>{finding.excerpt}</p>
              <small>Status: {finding.status} · Match: {finding.matchedTerm}</small>
              <small>{finding.uncertainty}</small>
              {onAddManualEvidence && (
                <button type="button" onClick={() => onAddManualEvidence({
                  documentHashSha256: result.documentHashSha256,
                  instrument: finding.instrument,
                  itemOrDomain: finding.topic,
                  evidenceText: finding.excerpt,
                  page: String(finding.page),
                })}>
                  Legg til / verifiser manuelt
                </button>
              )}
            </article>
          )) : <p>Ingen relevante kandidatfunn identifisert.</p>}

          {result.warnings?.map((warning) => <div key={warning} role="alert">{warning}</div>)}

          {showSourceText && result.sourceUnits?.length > 0 && (
            <details>
              <summary>Ekstrahert kildetekst</summary>
              {result.sourceUnits.map((unit) => (
                <section key={unit.page}>
                  <h5>Kildeenhet {unit.page}</h5>
                  <pre>{unit.text}</pre>
                </section>
              ))}
            </details>
          )}
        </div>
      )}
    </section>
  );
}
