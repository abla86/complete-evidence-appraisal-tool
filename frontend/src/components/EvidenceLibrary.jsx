import { useState } from 'react';
import { addManualEvidence, analyzeEvidenceDocument, getManualEvidence } from '../api/evidenceApi';

const instruments = [
  ['amstar2', 'AMSTAR 2'],
  ['casp', 'CASP'],
  ['agree2', 'AGREE II'],
  ['grade', 'GRADE'],
];

const acceptedFormats = '.pdf,.docx,.txt,.html,.htm,.xml';
const sourceTypes = ['Main article', 'Supplement', 'Protocol', 'Registry', 'Author correspondence', 'External source', 'Manual note'];

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
  const [manualEvidence, setManualEvidence] = useState([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manual, setManual] = useState({ itemOrDomain: '', evidenceText: '', sourceType: 'Main article', page: '', section: '', table: '', figure: '', url: '', doi: '', reviewer: '', rationale: '' });
  const [busy, setBusy] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [error, setError] = useState('');
  const [manualError, setManualError] = useState('');

  function handleFile(event) {
    setFile(event.target.files?.[0] ?? null);
    setResult(null);
    setManualEvidence([]);
    setShowManualForm(false);
    setError('');
  }

  function toggleInstrument(id) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function analyse() {
    if (!file || selected.length === 0) return;
    setBusy(true);
    setError('');
    setManualError('');
    try {
      const analysis = await analyzeEvidenceDocument(file, selected, includePageText);
      setResult(analysis);
      setManualEvidence(await getManualEvidence(analysis.documentHashSha256));
    } catch (e) {
      setError(e.message || 'Kunne ikke analysere dokumentet.');
    } finally {
      setBusy(false);
    }
  }

  async function saveManualEvidence(event) {
    event.preventDefault();
    if (!result) return;
    setSavingManual(true);
    setManualError('');
    try {
      const saved = await addManualEvidence({
        documentHashSha256: result.documentHashSha256,
        instrument: selected[0] ?? 'manual',
        ...manual,
      });
      setManualEvidence((current) => [...current, saved]);
      setManual({ itemOrDomain: '', evidenceText: '', sourceType: 'Main article', page: '', section: '', table: '', figure: '', url: '', doi: '', reviewer: '', rationale: '' });
      setShowManualForm(false);
    } catch (e) {
      setManualError(e.message || 'Kunne ikke lagre manuell evidens.');
    } finally {
      setSavingManual(false);
    }
  }

  return <section className="research-hub" aria-labelledby="evidence-heading">
    <p className="eyebrow">Sporbarhet</p>
    <h2 id="evidence-heading">Evidence &amp; traceability</h2>
    <p>Last opp en forskningsartikkel, systematisk oversikt, retningslinje eller annet støttet forskningsdokument. Programmet ekstraherer tekst, klassifiserer dokumenttypen heuristisk og lokaliserer kandidatpassasjer for valgte vurderingsinstrumenter.</p>

    <section className="assessment-card evidence-analyser">
      <p className="eyebrow">Dokumentanalyse</p>
      <h3>Analyser forskningsdokument</h3>
      <p className="muted">Legg inn PDF eller annet forskningsmateriale. Støttede formater: PDF, DOCX, TXT, HTML/HTM og XML/JATS. Maksimal filstørrelse er 25 MB.</p>

      <div className="document-upload-box">
        <input id="evidence-document" className="document-file-input" type="file" accept={acceptedFormats} onChange={handleFile} />
        <label htmlFor="evidence-document" className="upload-button">+ Legg til forskningsdokument</label>
        <p className="upload-help">PDF, DOCX, TXT, HTML/HTM eller XML/JATS · maks. 25 MB</p>
      </div>

      {file && <div className="notice" aria-live="polite"><strong>Valgt dokument:</strong> {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)</div>}

      <fieldset>
        <legend>Vurderingsinstrumenter</legend>
        <p className="muted">Velg ett eller flere instrumenter. Instrumentegnethet blir kontrollert etter dokumentanalysen, men forskeren må bekrefte dokumenttype og valg av instrument.</p>
        <div className="research-grid">
          {instruments.map(([id, label]) => <label key={id} className="checkbox-card"><input type="checkbox" checked={selected.includes(id)} onChange={() => toggleInstrument(id)} /><span>{label}</span></label>)}
        </div>
      </fieldset>

      <label className="checkbox-card"><input type="checkbox" checked={includePageText} onChange={(event) => setIncludePageText(event.target.checked)} /><span>Ta med ekstraherte tekster i resultatet</span></label>
      <button type="button" className="primary-action" disabled={!file || selected.length === 0 || busy} onClick={analyse}>{busy ? 'Analyserer dokument …' : 'Analyser dokument'}</button>
    </section>

    {error && <section className="notice notice-error" role="alert"><h3>Analyse kunne ikke gjennomføres</h3><p>{error}</p></section>}

    {result && <section className="assessment-card" aria-live="polite">
      <p className="eyebrow">Dokumentanalyse</p>
      <h3>{result.fileName}</h3>
      <p><strong>Dokumenttype:</strong> {result.classification?.documentType ?? result.documentType} · <strong>Klassifiseringsgrad:</strong> {result.classification?.confidence ?? 'Ikke oppgitt'} · {result.sourceUnitCount ?? result.pageCount} kildenheter · {result.extractionStatus}</p>
      <p className="muted">SHA-256: <code>{result.documentHashSha256}</code></p>

      <div className="notice notice-warning"><strong>Forskerkontroll kreves.</strong> {result.methodologicalNotice}</div>

      {result.classification?.signals?.length > 0 && <div><h4>Klassifiseringssignaler</h4><ul>{result.classification.signals.map((signal) => <li key={signal}>{signal}</li>)}</ul></div>}

      {result.instrumentSuitability?.length > 0 && <section><h4>Instrumentegnethet</h4><div className="evidence-table-wrap"><table><thead><tr><th>Instrument</th><th>Status</th><th>Begrunnelse</th></tr></thead><tbody>{result.instrumentSuitability.map((item) => <tr key={item.instrument}><td>{item.instrument}</td><td><strong className={statusClass(item.status)}>{item.status}</strong></td><td>{item.reason}</td></tr>)}</tbody></table></div></section>}

      {result.warnings?.length > 0 && <div><h4>Varsler</h4><ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}

      <h4>Evidence map – kandidatfunn</h4>
      {result.findings?.length === 0 ? <p>Ingen kandidatpassasjer ble identifisert. Dette betyr ikke at informasjonen mangler i dokumentet. Kontroller originaldokumentet og supplement manuelt.</p> : <div className="evidence-table-wrap"><table><thead><tr><th>Instrument</th><th>Område</th><th>Side/kildenhet</th><th>Treff</th><th>Passasje</th><th>Status</th></tr></thead><tbody>{result.findings.map((finding, index) => <tr key={`${finding.instrument}-${finding.topic}-${finding.page}-${index}`}><td>{finding.instrument.toUpperCase()}</td><td>{finding.topic}</td><td>{finding.page}</td><td><code>{finding.matchedTerm}</code></td><td>{finding.excerpt}</td><td><strong>{finding.status}</strong><br /><small>{finding.confidence}</small></td></tr>)}</tbody></table></div>}

      <section className="assessment-card">
        <h4>Manuell evidens</h4>
        <p className="muted">Hvis programmet ikke finner relevant informasjon, eller du finner informasjonen selv i artikkelen, supplementet eller en registrering, kan den legges inn manuelt. Manuelt innlagt evidens merkes og lagres med dokumenthash, reviewer og begrunnelse.</p>
        <button type="button" className="secondary-action" onClick={() => setShowManualForm((value) => !value)}>{showManualForm ? 'Avbryt' : '+ Legg til evidens manuelt'}</button>

        {showManualForm && <form className="manual-evidence-form" onSubmit={saveManualEvidence}>
          <label>Instrument<input value={selected[0] ?? 'manual'} readOnly /></label>
          <label>Item / domain<input required value={manual.itemOrDomain} onChange={(e) => setManual({ ...manual, itemOrDomain: e.target.value })} /></label>
          <label>Evidenstekst<textarea required value={manual.evidenceText} onChange={(e) => setManual({ ...manual, evidenceText: e.target.value })} /></label>
          <label>Kildetype<select value={manual.sourceType} onChange={(e) => setManual({ ...manual, sourceType: e.target.value })}>{sourceTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <div className="research-grid">
            <label>Side<input value={manual.page} onChange={(e) => setManual({ ...manual, page: e.target.value })} /></label>
            <label>Seksjon<input value={manual.section} onChange={(e) => setManual({ ...manual, section: e.target.value })} /></label>
            <label>Tabell<input value={manual.table} onChange={(e) => setManual({ ...manual, table: e.target.value })} /></label>
            <label>Figur<input value={manual.figure} onChange={(e) => setManual({ ...manual, figure: e.target.value })} /></label>
          </div>
          <label>DOI<input value={manual.doi} onChange={(e) => setManual({ ...manual, doi: e.target.value })} /></label>
          <label>URL<input type="url" value={manual.url} onChange={(e) => setManual({ ...manual, url: e.target.value })} /></label>
          <label>Reviewer<input required value={manual.reviewer} onChange={(e) => setManual({ ...manual, reviewer: e.target.value })} /></label>
          <label>Begrunnelse<textarea required value={manual.rationale} onChange={(e) => setManual({ ...manual, rationale: e.target.value })} /></label>
          {manualError && <p className="notice notice-error" role="alert">{manualError}</p>}
          <button type="submit" className="primary-action" disabled={savingManual}>{savingManual ? 'Lagrer …' : 'Lagre manuell evidens'}</button>
        </form>}

        {manualEvidence.length > 0 && <div className="evidence-table-wrap"><table><thead><tr><th>Item/domain</th><th>Evidens</th><th>Kilde</th><th>Reviewer</th><th>Status</th></tr></thead><tbody>{manualEvidence.map((item) => <tr key={item.id}><td>{item.itemOrDomain}</td><td>{item.evidenceText}</td><td>{item.sourceType}{item.page ? ` · s. ${item.page}` : ''}</td><td>{item.reviewer}</td><td><strong>Manually added</strong></td></tr>)}</tbody></table></div>}
      </section>

      {result.sourceUnits?.length > 0 && <details><summary>Ekstraheret dokumenttekst</summary>{result.sourceUnits.map((unit) => <article key={unit.page}><h5>Kildenhet {unit.page}</h5><pre>{unit.text}</pre></article>)}</details>}
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
