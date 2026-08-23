import { useState } from 'react';
import { analyzeEvidenceDocument } from '../api/evidenceApi';

const instruments = [
  ['amstar2', 'AMSTAR 2'],
  ['casp', 'CASP'],
  ['agree2', 'AGREE II'],
  ['grade', 'GRADE'],
];

const acceptedFormats = '.pdf,.docx,.txt,.html,.htm,.xml';

function statusClass(status) {
  if (status === 'Suitable') return 'status-success';
  if (status === 'Not suitable') return 'status-error';
  if (status === 'Caution') return 'status-warning';
  return '';
}

export default function EvidenceLibrary() {
  const [file, setFile] = useState(null);
  const [selected, setSelected] = useState(['amstar2']);
  const [includePageText, setIncludePageText] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function toggleInstrument(id) {
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  }

  async function analyse() {
    if (!file || selected.length === 0) return;
    setBusy(true);
    setError('');
    try {
      setResult(await analyzeEvidenceDocument(file, selected, includePageText));
    } catch (e) {
      setError(e.message || 'Kunne ikke analysere dokumentet.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="research-hub" aria-labelledby="evidence-heading">
    <p className="eyebrow">Sporbarhet</p>
    <h2 id="evidence-heading">Evidence &amp; traceability</h2>
    <p>Last opp en forskningsartikkel, systematisk oversikt, retningslinje eller annet støttet forskningsdokument. Programmet ekstraherer tekst, klassifiserer dokumenttypen heuristisk og lokaliserer kandidatpassasjer for valgte vurderingsinstrumenter.</p>

    <section className="assessment-card evidence-analyser">
      <p className="eyebrow">Dokumentanalyse</p>
      <h3>Analyser forskningsdokument</h3>
      <p className="muted">Støttede formater: PDF, DOCX, TXT, HTML/HTM og XML/JATS. Maksimal filstørrelse er 25 MB.</p>

      <label htmlFor="evidence-document">Velg dokument</label>
      <input
        id="evidence-document"
        type="file"
        accept={acceptedFormats}
        onChange={(event) => { setFile(event.target.files?.[0] ?? null); setResult(null); setError(''); }}
      />

      {file && <div className="notice" aria-live="polite">
        <strong>Valgt dokument:</strong> {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)
      </div>}

      <fieldset>
        <legend>Vurderingsinstrumenter</legend>
        <p className="muted">Velg ett eller flere instrumenter. Instrumentegnethet blir kontrollert etter dokumentanalysen, men forskeren må bekrefte dokumenttype og valg av instrument.</p>
        <div className="research-grid">
          {instruments.map(([id, label]) => <label key={id} className="checkbox-card">
            <input type="checkbox" checked={selected.includes(id)} onChange={() => toggleInstrument(id)} />
            <span>{label}</span>
          </label>)}
        </div>
      </fieldset>

      <label className="checkbox-card">
        <input type="checkbox" checked={includePageText} onChange={(event) => setIncludePageText(event.target.checked)} />
        <span>Ta med ekstraherte tekster i resultatet</span>
      </label>

      <button type="button" className="primary-action" disabled={!file || selected.length === 0 || busy} onClick={analyse}>
        {busy ? 'Analyserer dokument …' : 'Analyser dokument'}
      </button>
    </section>

    {error && <section className="notice notice-error" role="alert"><h3>Analyse kunne ikke gjennomføres</h3><p>{error}</p></section>}

    {result && <section className="assessment-card" aria-live="polite">
      <p className="eyebrow">Dokumentanalyse</p>
      <h3>{result.fileName}</h3>
      <p><strong>Dokumenttype:</strong> {result.classification?.documentType ?? result.documentType} · <strong>Klassifiseringsgrad:</strong> {result.classification?.confidence ?? 'Ikke oppgitt'} · {result.sourceUnitCount ?? result.pageCount} kildenheter · {result.extractionStatus}</p>
      <p className="muted">SHA-256: <code>{result.documentHashSha256}</code></p>

      <div className="notice notice-warning">
        <strong>Forskerkontroll kreves.</strong> {result.methodologicalNotice}
      </div>

      {result.classification?.signals?.length > 0 && <div>
        <h4>Klassifiseringssignaler</h4>
        <ul>{result.classification.signals.map((signal) => <li key={signal}>{signal}</li>)}</ul>
      </div>}

      {result.instrumentSuitability?.length > 0 && <section>
        <h4>Instrumentegnethet</h4>
        <div className="evidence-table-wrap"><table><thead><tr><th>Instrument</th><th>Status</th><th>Begrunnelse</th></tr></thead><tbody>{result.instrumentSuitability.map((item) => <tr key={item.instrument}><td>{item.instrument}</td><td><strong className={statusClass(item.status)}>{item.status}</strong></td><td>{item.reason}</td></tr>)}</tbody></table></div>
      </section>}

      {result.warnings?.length > 0 && <div><h4>Varsler</h4><ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}

      <h4>Evidence map – kandidatfunn</h4>
      {result.findings?.length === 0 ? <p>Ingen kandidatpassasjer ble identifisert. Dette betyr ikke at informasjonen mangler i dokumentet.</p> : <div className="evidence-table-wrap"><table><thead><tr><th>Instrument</th><th>Område</th><th>Side/kildenhet</th><th>Treff</th><th>Passasje</th></tr></thead><tbody>{result.findings.map((finding, index) => <tr key={`${finding.instrument}-${finding.topic}-${finding.page}-${index}`}><td>{finding.instrument.toUpperCase()}</td><td>{finding.topic}</td><td>{finding.page}</td><td><code>{finding.matchedTerm}</code></td><td>{finding.excerpt}</td></tr>)}</tbody></table></div>}

      {result.sourceUnits?.length > 0 && <details><summary>Ekstrahert dokumenttekst</summary>{result.sourceUnits.map((unit) => <article key={unit.page}><h5>Kildenhet {unit.page}</h5><pre>{unit.text}</pre></article>)}</details>}
    </section>}

    <div className="research-grid">
      <article className="assessment-card"><h3>Kildereferanse</h3><p>Behold DOI, full referanse eller offisiell URL sammen med vurderingen.</p></article>
      <article className="assessment-card"><h3>Evidenslokasjon</h3><p>Bruk side, tabell, figur, avsnitt eller vedlegg. Dokumentanalysen foreslår lokasjoner som må verifiseres.</p></article>
      <article className="assessment-card"><h3>Forskerens begrunnelse</h3><p>Den endelige begrunnelsen skal komme fra forskeren, ikke fra et automatisk teksttreff.</p></article>
      <article className="assessment-card"><h3>Sporbarhet</h3><p>Dokumenthash og lokasjonsdata gjør det mulig å kontrollere hvilket dokument som ble analysert.</p></article>
    </div>

    <section className="notice notice-warning"><h3>Metodisk grense</h3><p>Verktøyet finner og strukturerer mulig relevant dokumentasjon. Det avgjør ikke AMSTAR 2-, CASP-, AGREE II- eller GRADE-vurderingen. Originaldokumentet, autoriserte instrumenter og forskerens faglige skjønn er fortsatt grunnlaget for endelig vurdering.</p></section>
  </section>;
}
