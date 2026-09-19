import { useMemo, useState } from 'react';

const METHODS = [
  { id: 'systematic-review', name: 'Systematisk oversikt', tool: 'PRISMA + AMSTAR 2 / RoB', desc: 'Arbeidsflyt for søk, screening, appraisal, extraction og syntese.' },
  { id: 'rct', name: 'Randomisert studie', tool: 'RoB 2', desc: 'Risiko for bias i randomiserte studier.' },
  { id: 'observational', name: 'Observasjonsstudie', tool: 'CASP / ROBINS-I', desc: 'Vurdering av observasjonelle studiedesign.' },
  { id: 'qualitative', name: 'Kvalitativ forskning', tool: 'CASP / JBI', desc: 'Kritisk vurdering og tematisk koding.' },
  { id: 'guideline', name: 'Retningslinje', tool: 'AGREE II + GRADE', desc: 'Retningslinjevurdering og evidenssikkerhet.' },
];

const PARAMETERS = ['N', 'Mean', 'SD', 'Effect', 'Lower 95% CI', 'Upper 95% CI'];

function download(name, content, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

function csv(rows) {
  return rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
}

export default function ResearchCompleteness() {
  const [method, setMethod] = useState(METHODS[0].id);
  const [coi, setCoi] = useState(false);
  const [searchStrategy, setSearchStrategy] = useState('');
  const [prospero, setProspero] = useState('');
  const [plainSummary, setPlainSummary] = useState('');
  const [customQuestions, setCustomQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [studies, setStudies] = useState([
    { id: 1, title: 'Eksempelstudie A', selected: false, status: 'Pending' },
    { id: 2, title: 'Eksempelstudie B', selected: false, status: 'Pending' },
    { id: 3, title: 'Eksempelstudie C', selected: false, status: 'Pending' },
  ]);
  const [extractionA, setExtractionA] = useState({ N: '100', Mean: '', SD: '', Effect: '', 'Lower 95% CI': '', 'Upper 95% CI': '' });
  const [extractionB, setExtractionB] = useState({ N: '100', Mean: '', SD: '', Effect: '', 'Lower 95% CI': '', 'Upper 95% CI': '' });
  const [forestRows] = useState([
    { study: 'Eksempelstudie A', effect: 0.8, lower: 0.6, upper: 1.0 },
    { study: 'Eksempelstudie B', effect: 0.7, lower: 0.5, upper: 0.95 },
  ]);
  const [selectedStudy, setSelectedStudy] = useState('Eksempelstudie A');
  const [etd, setEtd] = useState({ Effect: 'Uklart', Safety: 'Uklart', Costs: 'Uklart', Acceptability: 'Uklart', Feasibility: 'Uklart' });

  const extractionConflicts = useMemo(() => PARAMETERS.filter(key => extractionA[key] !== extractionB[key]), [extractionA, extractionB]);
  const selectedMethod = METHODS.find(item => item.id === method);
  const included = studies.filter(s => s.status === 'Included').length;
  const excluded = studies.filter(s => s.status === 'Excluded').length;

  const setStudyStatus = (status) => setStudies(current => current.map(s => s.selected ? { ...s, status, selected: false } : s));
  const undo = () => setStudies(current => current.map(s => s.status !== 'Pending' ? { ...s, status: 'Pending' } : s));

  const exportTidy = () => {
    const rows = [['study_id', 'parameter', 'reviewer_a', 'reviewer_b', 'conflict']];
    PARAMETERS.forEach(parameter => rows.push([selectedStudy, parameter, extractionA[parameter], extractionB[parameter], extractionA[parameter] !== extractionB[parameter] ? 'TRUE' : 'FALSE']));
    download('evidence-appraisal-tidy-extraction.csv', csv(rows), 'text/csv;charset=utf-8');
  };

  const exportProject = () => download('evidence-appraisal-project.json', JSON.stringify({
    methodology: selectedMethod, prospero, searchStrategy, coiSigned: coi, plainLanguageSummary: plainSummary,
    customQuestions, studies, dualExtraction: { reviewerA: extractionA, reviewerB: extractionB }, forestRows, etd
  }, null, 2), 'application/json');

  return <div className="research-completeness">
    <section className="method-card">
      <p className="eyebrow">Methodology selector</p>
      <h2>Velg riktig forskningsarbeidsflyt</h2>
      <div className="research-grid">{METHODS.map(item => <button key={item.id} type="button" className={method === item.id ? 'method-option active' : 'method-option'} onClick={() => setMethod(item.id)}><strong>{item.name}</strong><span>{item.tool}</span><small>{item.desc}</small></button>)}</div>
      <div className="notice"><strong>Valgt:</strong> {selectedMethod.name} — {selectedMethod.tool}</div>
    </section>

    <section className="method-card">
      <p className="eyebrow">Reproduserbarhet</p><h3>Protokoll, søk og habilitet</h3>
      <div className="research-grid">
        <label>PROSPERO / registrerings-ID<input value={prospero} onChange={e => setProspero(e.target.value)} placeholder="f.eks. CRD420..." /></label>
        <label>Databaser og full søkestrategi<textarea value={searchStrategy} onChange={e => setSearchStrategy(e.target.value)} placeholder="Lim inn komplett søkestreng og databaser." /></label>
      </div>
      <label className="check-row"><input type="checkbox" checked={coi} onChange={e => setCoi(e.target.checked)} /> Jeg har dokumentert habilitet / interessekonflikt for denne arbeidsflyten.</label>
    </section>

    <section className="method-card">
      <p className="eyebrow">Screening</p><h3>Bulk handling + angre</h3>
      <div className="button-row"><button type="button" onClick={() => setStudies(current => current.map(s => ({ ...s, selected: true })))}>Velg alle</button><button type="button" onClick={() => setStudyStatus('Included')}>Inkluder valgte</button><button type="button" onClick={() => setStudyStatus('Excluded')}>Ekskluder valgte</button><button type="button" onClick={undo}>Angre</button></div>
      <p><strong>{included}</strong> inkludert · <strong>{excluded}</strong> ekskludert · {studies.length - included - excluded} avventer</p>
      <div className="screening-list">{studies.map(study => <label key={study.id} className="screening-row"><input type="checkbox" checked={study.selected} onChange={() => setStudies(current => current.map(s => s.id === study.id ? { ...s, selected: !s.selected } : s))} /><span>{study.title}</span><strong>{study.status}</strong></label>)}</div>
    </section>

    <section className="method-card">
      <p className="eyebrow">Dual data extraction</p><h3>Uavhengig uttrekk og konfliktkontroll</h3>
      <div className="sof-table-wrap"><table><thead><tr><th>Parameter</th><th>Forsker A</th><th>Forsker B</th><th>Status</th></tr></thead><tbody>{PARAMETERS.map(parameter => <tr key={parameter} className={extractionA[parameter] !== extractionB[parameter] ? 'conflict-row' : ''}><td>{parameter}</td><td><input value={extractionA[parameter]} onChange={e => setExtractionA(v => ({ ...v, [parameter]: e.target.value }))} /></td><td><input value={extractionB[parameter]} onChange={e => setExtractionB(v => ({ ...v, [parameter]: e.target.value }))} /></td><td>{extractionA[parameter] === extractionB[parameter] ? 'OK' : 'KONFLIKT'}</td></tr>)}</tbody></table></div>
      <div className={extractionConflicts.length ? 'notice notice-warning' : 'notice'}>{extractionConflicts.length ? `Uavklarte avvik: ${extractionConflicts.join(', ')}` : 'Ingen avvik i registrerte uttrekksfelt.'}</div>
      <button type="button" onClick={exportTidy}>Eksporter Tidy-CSV</button>
    </section>

    <section className="method-card">
      <p className="eyebrow">Synthesis</p><h3>Forest Plot</h3>
      <div className="forest-plot" aria-label="Forest plot">
        <svg viewBox="0 0 760 260" role="img"><line x1="390" y1="20" x2="390" y2="225" stroke="currentColor" strokeDasharray="4 4" />{forestRows.map((row, index) => { const y = 50 + index * 70; const x = v => 150 + ((v - 0.4) / 0.8) * 480; return <g key={row.study}><text x="5" y={y + 5}>{row.study}</text><line x1={x(row.lower)} y1={y} x2={x(row.upper)} y2={y} stroke="currentColor" strokeWidth="2" /><rect x={x(row.effect) - 5} y={y - 5} width="10" height="10" fill="currentColor" /><text x="650" y={y + 5}>{row.effect} [{row.lower}–{row.upper}]</text></g>; })}</svg>
      </div>
      <p className="muted">Forest plot visualiserer registrerte effektmål. Den beregner ikke automatisk en statistisk pooled estimate.</p>
    </section>

    <section className="method-card">
      <p className="eyebrow">Evidence to Decision</p><h3>EtD-grid</h3>
      <div className="sof-table-wrap"><table><thead><tr><th>Kriterium</th><th>Vurdering</th></tr></thead><tbody>{Object.keys(etd).map(key => <tr key={key}><td>{key}</td><td><select value={etd[key]} onChange={e => setEtd(v => ({ ...v, [key]: e.target.value }))}><option>Fordelaktig</option><option>Uklart</option><option>Ufordelaktig</option></select></td></tr>)}</tbody></table></div>
    </section>

    <section className="method-card">
      <p className="eyebrow">Kvalitativ syntese</p><h3>Tematisk koding</h3>
      <label>Studie<input value={selectedStudy} onChange={e => setSelectedStudy(e.target.value)} /></label>
      <label>Sitat / meningsbærende enhet<textarea placeholder="Lim inn kildetekst. Lagre deretter kode manuelt i prosjektets audit trail." /></label>
      <label>Kode / tema<input placeholder="f.eks. trygghet, belastning, sosial støtte" /></label>
    </section>

    <section className="method-card">
      <p className="eyebrow">Prosjektspesifikasjon</p><h3>Egne spørsmål</h3>
      <div className="button-row"><input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="Skriv eget prosjektspørsmål" /><button type="button" disabled={!newQuestion.trim()} onClick={() => { setCustomQuestions(q => [...q, newQuestion.trim()]); setNewQuestion(''); }}>Legg til</button></div>
      <ul>{customQuestions.map((question, index) => <li key={index}>{question}</li>)}</ul>
    </section>

    <section className="method-card">
      <p className="eyebrow">Formidling</p><h3>Plain Language Summary</h3>
      <textarea value={plainSummary} onChange={e => setPlainSummary(e.target.value)} placeholder="Skriv eller rediger et sammendrag som kan forstås av pasienter og offentlighet. AI-generert tekst skal alltid gjennomgås av forsker." />
      <button type="button" onClick={exportProject}>Eksporter komplett arbeidskopi (JSON)</button>
    </section>
  </div>;
}
