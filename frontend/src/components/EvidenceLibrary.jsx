import { useState } from 'react';
import { addManualEvidence, analyzeEvidenceDocument, getEvidenceSummary, getManualEvidence, verifyEvidence } from '../api/evidenceApi';
import EvidenceDocumentViewer from './EvidenceDocumentViewer';

const instruments = [['amstar2', 'AMSTAR 2'], ['casp', 'CASP'], ['agree2', 'AGREE II'], ['grade', 'GRADE']];
const acceptedFormats = '.pdf,.docx,.txt,.html,.htm,.xml,.jats';
const sourceTypes = ['Main article', 'Supplement', 'Protocol', 'Registry', 'Author correspondence', 'External source', 'Manual note'];
const verificationStatuses = ['Needs review', 'Verified', 'Rejected', 'Uncertain', 'Not found'];

function statusClass(status) {
  if (status === 'Suitable') return 'status-success';
  if (status === 'Not suitable') return 'status-error';
  if (status === 'Caution') return 'status-warning';
  return '';
}

export default function EvidenceLibrary() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState(['amstar2']);
  const [includePageText, setIncludePageText] = useState(false);
  const [result, setResult] = useState(null);
  const [manualEvidence, setManualEvidence] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manual, setManual] = useState({ itemOrDomain: '', evidenceText: '', sourceType: 'Main article', page: '', section: '', table: '', figure: '', url: '', doi: '', reviewer: '', rationale: '' });
  const [busy, setBusy] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verificationDrafts, setVerificationDrafts] = useState({});
  const [error, setError] = useState('');
  const [manualError, setManualError] = useState('');

  function handleFile(nextFile) {
    setFile(nextFile ?? null);
    setResult(null); setManualEvidence([]); setSummary(null); setShowManualForm(false); setError('');
  }
  function handleFileInput(event) { handleFile(event.target.files?.[0]); }
  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }
  function toggleInstrument(id) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  async function refreshEvidence(hash) { const [records, counts] = await Promise.all([getManualEvidence(hash), getEvidenceSummary(hash)]); setManualEvidence(records); setSummary(counts); }
  async function analyse() {
    if (!file || selected.length === 0 || busy) return;
    setBusy(true); setError(''); setManualError('');
    try { const analysis = await analyzeEvidenceDocument(file, selected, includePageText); setResult(analysis); await refreshEvidence(analysis.documentHashSha256); }
    catch (e) { setResult(null); setError(e.message || 'Kunne ikke analysere dokumentet.'); }
    finally { setBusy(false); }
  }
  async function saveManualEvidence(event) {
    event.preventDefault(); if (!result) return;
    setSavingManual(true); setManualError('');
    try { await addManualEvidence({ documentHashSha256: result.documentHashSha256, instrument: selected[0] ?? 'manual', ...manual }); setManual({ itemOrDomain: '', evidenceText: '', sourceType: 'Main article', page: '', section: '', table: '', figure: '', url: '', doi: '', reviewer: '', rationale: '' }); setShowManualForm(false); await refreshEvidence(result.documentHashSha256); }
    catch (e) { setManualError(e.message || 'Kunne ikke lagre manuell evidens.'); }
    finally { setSavingManual(false); }
  }
  function updateDraft(id, field, value) { setVerificationDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } })); }
  async function saveVerification(item) {
    const draft = verificationDrafts[item.id] ?? {};
    if (!draft.reviewer?.trim()) { setManualError('Reviewer må oppgis ved verifisering.'); return; }
    setVerifyingId(item.id); setManualError('');
    try { await verifyEvidence(item.id, draft.status ?? item.status, draft.reviewer, draft.note ?? ''); await refreshEvidence(result.documentHashSha256); }
    catch (e) { setManualError(e.message || 'Kunne ikke oppdatere evidensstatus.'); }
    finally { setVerifyingId(null); }
  }

  return <section className="research-hub" aria-labelledby="evidence-heading">
    <p className="eyebrow">Sporbarhet</p>
    <h2 id="evidence-heading">Evidence &amp; traceability</h2>
    <p>Last opp et forskningsdokument. Programmet ekstraherer tekst, klassifiserer dokumenttypen heuristisk og lokaliserer kandidatpassasjer. Endelig evidensstatus avgjøres av forskeren.</p>

    <section className="assessment-card evidence-analyser">
      <div className="document-import-header">
        <div>
          <p className="eyebrow">Start her</p>
          <h3>Importer forskningsartikkelen</h3>
          <p className="muted">Start med å legge inn artikkelen. Deretter velger du vurderingsinstrument og starter analysen.</p>
        </div>
        <span className="document-import-step">STEG 1 · ARTIKKEL</span>
      </div>

      <div
        className={isDragging ? 'document-upload-box document-upload-box-primary is-dragging' : file ? 'document-upload-box document-upload-box-primary has-file' : 'document-upload-box document-upload-box-primary'}
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input id="evidence-document" aria-label="Velg dokument" className="document-file-input" type="file" accept={acceptedFormats} onChange={handleFileInput} disabled={busy} />
        {!file ? (
          <div className="upload-prompt">
            <div className="upload-icon" aria-hidden="true">＋</div>
            <strong>Legg inn forskningsartikkelen</strong>
            <span>Dra og slipp filen her, eller</span>
            <label htmlFor="evidence-document" className="upload-button upload-button-primary">Velg fil fra PC-en</label>
            <p className="upload-help">PDF · DOCX · TXT · HTML/HTM · XML/JATS · maks. 25 MB</p>
          </div>
        ) : (
          <div className="file-selected-info">
            <span className="file-selected-status">✓ ARTIKKEL VALGT</span>
            <strong className="file-name">{file.name}</strong>
            <span className="upload-help">{Math.max(1, Math.round(file.size / 1024))} KB · klar for analyse</span>
            <div className="selected-file-actions">
              <label htmlFor="evidence-document" className="secondary-upload-btn">Bytt artikkel</label>
              <button type="button" className="ghost-upload-btn" onClick={() => handleFile(null)}>Fjern</button>
            </div>
          </div>
        )}
      </div>

      <div className="upload-next-step">
        <span className="upload-next-step-active">1 · Legg inn artikkel</span>
        <span>2 · Velg instrument</span>
        <span>3 · Start analyse</span>
      </div>

      {file && <EvidenceDocumentViewer file={file} />}
      <fieldset><legend>Vurderingsinstrumenter</legend><p className="muted">Instrumentegnethet kontrolleres etter analysen. Forskeren må bekrefte dokumenttype og instrument.</p><div className="research-grid">{instruments.map(([id, label]) => <label key={id} className="checkbox-card"><input type="checkbox" checked={selected.includes(id)} onChange={() => toggleInstrument(id)} /><span>{label}</span></label>)}</div></fieldset>
      <label className="checkbox-card"><input type="checkbox" checked={includePageText} onChange={(event) => setIncludePageText(event.target.checked)} /><span>Ta med ekstraherte tekster i resultatet</span></label>
      <button type="button" className="primary-action" disabled={!file || selected.length === 0 || busy} onClick={analyse}>{busy ? 'Analyserer dokument …' : 'Analyser dokument'}</button>
    </section>

    {error && <section className="notice notice-error" role="alert"><h3>Analyse kunne ikke gjennomføres</h3><p>{error}</p></section>}

    {result && <section className="assessment-card" aria-live="polite">
      <p className="eyebrow">Dokumentanalyse</p><h3>{result.fileName}</h3>
      <div className="analysis-summary-grid" aria-label="Analyseresultat">
        <div className="analysis-summary-card"><span className="muted">Dokumenttype</span><strong data-testid="document-type">{result.classification?.documentType ?? result.documentType ?? 'Ikke oppgitt'}</strong></div>
        <div className="analysis-summary-card"><span className="muted">Klassifiseringsgrad</span><strong>{result.classification?.confidence ?? 'Ikke oppgitt'}</strong></div>
        <div className="analysis-summary-card"><span className="muted">Kildenheter</span><strong>{result.sourceUnitCount ?? result.pageCount ?? 'Ikke oppgitt'}</strong></div>
        <div className="analysis-summary-card"><span className="muted">Ekstraksjon</span><strong>{result.extractionStatus ?? 'Ikke oppgitt'}</strong></div>
      </div>
      <p className="muted">SHA-256: <code data-testid="document-hash">{result.documentHashSha256}</code></p>
      <div className="notice notice-warning"><strong>Forskerkontroll kreves.</strong> {result.methodologicalNotice}</div>
      {result.classification?.signals?.length > 0 && <div><h4>Klassifiseringssignaler</h4><ul>{result.classification.signals.map((signal) => <li key={signal}>{signal}</li>)}</ul></div>}
      {result.instrumentSuitability?.length > 0 && <section><h4>Instrumentegnethet</h4><div className="evidence-table-wrap"><table><thead><tr><th>Instrument</th><th>Status</th><th>Begrunnelse</th></tr></thead><tbody>{result.instrumentSuitability.map((item) => <tr key={item.instrument}><td>{item.instrument}</td><td><strong className={statusClass(item.status)}>{item.status}</strong></td><td>{item.reason}</td></tr>)}</tbody></table></div></section>}
      {result.warnings?.length > 0 && <div><h4>Varsler</h4><ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
      <h4>Evidence map – kandidatfunn</h4>
      {result.findings?.length === 0 ? <p>Ingen kandidatpassasjer ble identifisert. Dette betyr ikke at informasjonen mangler. Kontroller originaldokumentet og supplement manuelt.</p> : <div className="evidence-table-wrap"><table><thead><tr><th>Instrument</th><th>Område</th><th>Side</th><th>Treff</th><th>Passasje</th><th>Status</th></tr></thead><tbody>{result.findings.map((finding, index) => <tr key={`${finding.instrument}-${finding.topic}-${finding.page}-${index}`}><td>{finding.instrument.toUpperCase()}</td><td>{finding.topic}</td><td>{finding.page}</td><td><code>{finding.matchedTerm}</code></td><td>{finding.excerpt}</td><td><strong>{finding.status}</strong><br /><small>{finding.confidence}</small></td></tr>)}</tbody></table></div>}

      <section className="assessment-card"><h4>Forskerverifisering</h4><p className="muted">Kandidatfunn må kontrolleres mot originalkilden. «Ikke funnet» er ikke det samme som «Nei», og automatisk teksttreff er ikke en metodisk vurdering.</p>
        {summary && <div className="notice"><strong>Evidence map:</strong> {summary.total} lagrede evidensposter · {Object.entries(summary.byStatus ?? {}).map(([status, count]) => `${status}: ${count}`).join(' · ') || 'ingen statuser ennå'}</div>}
        {manualError && <p className="notice notice-error" role="alert">{manualError}</p>}
        {manualEvidence.length === 0 ? <p>Ingen lagrede manuelle evidensposter for dette dokumentet.</p> : <div className="evidence-table-wrap"><table><thead><tr><th>Item/domain</th><th>Evidens</th><th>Status</th><th>Reviewer</th><th>Verifikasjonsnotat</th><th>Handling</th></tr></thead><tbody>{manualEvidence.map((item) => { const draft = verificationDrafts[item.id] ?? {}; return <tr key={item.id}><td>{item.itemOrDomain}</td><td>{item.evidenceText}</td><td><select value={draft.status ?? item.status} onChange={(e) => updateDraft(item.id, 'status', e.target.value)}>{verificationStatuses.map((status) => <option key={status}>{status}</option>)}</select></td><td><input value={draft.reviewer ?? item.verifiedBy ?? item.reviewer} onChange={(e) => updateDraft(item.id, 'reviewer', e.target.value)} /></td><td><textarea value={draft.note ?? item.verificationNote ?? ''} onChange={(e) => updateDraft(item.id, 'note', e.target.value)} placeholder="Hvorfor er funnet verifisert/avvist/usikkert?" /></td><td><button type="button" className="secondary-action" disabled={verifyingId === item.id} onClick={() => saveVerification(item)}>{verifyingId === item.id ? 'Lagrer …' : 'Lagre status'}</button></td></tr>; })}</tbody></table></div>}
      </section>

      <section className="assessment-card"><h4>Manuell evidens</h4><p className="muted">Legg inn evidens som forskeren selv har lokalisert i artikkelen, supplementet, protokollen eller registeret.</p><button type="button" className="secondary-action" onClick={() => setShowManualForm((value) => !value)}>{showManualForm ? 'Avbryt' : '+ Legg til evidens manuelt'}</button>
        {showManualForm && <form className="manual-evidence-form" onSubmit={saveManualEvidence}>
          <label>Instrument<input value={selected[0] ?? 'manual'} readOnly /></label><label>Item / domain<input required value={manual.itemOrDomain} onChange={(e) => setManual({ ...manual, itemOrDomain: e.target.value })} /></label><label>Evidenstekst<textarea required value={manual.evidenceText} onChange={(e) => setManual({ ...manual, evidenceText: e.target.value })} /></label>
          <label>Kildetype<select value={manual.sourceType} onChange={(e) => setManual({ ...manual, sourceType: e.target.value })}>{sourceTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <div className="research-grid"><label>Side<input value={manual.page} onChange={(e) => setManual({ ...manual, page: e.target.value })} /></label><label>Seksjon<input value={manual.section} onChange={(e) => setManual({ ...manual, section: e.target.value })} /></label><label>Tabell<input value={manual.table} onChange={(e) => setManual({ ...manual, table: e.target.value })} /></label><label>Figur<input value={manual.figure} onChange={(e) => setManual({ ...manual, figure: e.target.value })} /></label></div>
          <label>DOI<input value={manual.doi} onChange={(e) => setManual({ ...manual, doi: e.target.value })} /></label><label>URL<input type="url" value={manual.url} onChange={(e) => setManual({ ...manual, url: e.target.value })} /></label><label>Reviewer<input required value={manual.reviewer} onChange={(e) => setManual({ ...manual, reviewer: e.target.value })} /></label><label>Begrunnelse<textarea required value={manual.rationale} onChange={(e) => setManual({ ...manual, rationale: e.target.value })} /></label>
          <button type="submit" className="primary-action" disabled={savingManual}>{savingManual ? 'Lagrer …' : 'Lagre manuell evidens'}</button>
        </form>}
      </section>
      {result.sourceUnits?.length > 0 && <details><summary>Ekstraheret dokumenttekst</summary>{result.sourceUnits.map((unit) => <article key={unit.page}><h5>Kildenhet {unit.page}</h5><pre>{unit.text}</pre></article>)}</details>}
    </section>}

    <div className="research-grid"><article className="assessment-card"><h3>Kildereferanse</h3><p>Behold DOI, full referanse eller offisiell URL sammen med vurderingen.</p></article><article className="assessment-card"><h3>Evidenslokasjon</h3><p>Bruk side, tabell, figur, avsnitt eller vedlegg. Lokasjonen må verifiseres.</p></article><article className="assessment-card"><h3>Forskerens begrunnelse</h3><p>Den endelige begrunnelsen skal komme fra forskeren.</p></article><article className="assessment-card"><h3>Sporbarhet</h3><p>Dokumenthash, lokasjon, reviewer og verifikasjonsstatus beholdes sammen.</p></article></div>
    <section className="notice notice-warning"><h3>Metodisk grense</h3><p>Verktøyet finner og strukturerer mulig relevant dokumentasjon. Det avgjør ikke AMSTAR 2-, CASP-, AGREE II- eller GRADE-vurderingen. Originaldokumentet, autoriserte instrumenter og forskerens faglige skjønn er grunnlaget for endelig vurdering.</p></section>
  </section>;
}