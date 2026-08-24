import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5237');
const emptyStudy = () => ({ id: crypto.randomUUID(), title: '', year: '', doi: '', authors: [''] });
const emptyExtraction = () => ({ id: crypto.randomUUID(), studyId: '', field: '', value: '', unit: '', sourceLocation: '', reviewer: '' });
const initialPico = { framework: 'PICO', population: '', interventionOrExposure: '', comparison: '', outcome: '', timeframe: '', studyDesign: '', researchQuestion: '' };

async function post(path, body) {
  const response = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export default function ResearchWorkflowPanel() {
  const [studies, setStudies] = useState(() => JSON.parse(localStorage.getItem('eat-studies') || '[]'));
  const [screening, setScreening] = useState(() => JSON.parse(localStorage.getItem('eat-screening') || '[]'));
  const [extractions, setExtractions] = useState(() => JSON.parse(localStorage.getItem('eat-extractions') || '[]'));
  const [pico, setPico] = useState(() => JSON.parse(localStorage.getItem('eat-pico') || JSON.stringify(initialPico)));
  const [reviewer1, setReviewer1] = useState('');
  const [reviewer2, setReviewer2] = useState('');
  const [dedup, setDedup] = useState(null);
  const [conflicts, setConflicts] = useState(null);
  const [finalPackage, setFinalPackage] = useState(null);
  const [projectId, setProjectId] = useState(() => localStorage.getItem('eat-project-id') || crypto.randomUUID());
  const [error, setError] = useState('');

  useEffect(() => { localStorage.setItem('eat-studies', JSON.stringify(studies)); }, [studies]);
  useEffect(() => { localStorage.setItem('eat-screening', JSON.stringify(screening)); }, [screening]);
  useEffect(() => { localStorage.setItem('eat-extractions', JSON.stringify(extractions)); }, [extractions]);
  useEffect(() => { localStorage.setItem('eat-pico', JSON.stringify(pico)); }, [pico]);
  useEffect(() => { localStorage.setItem('eat-project-id', projectId); }, [projectId]);

  const screeningCounts = useMemo(() => ({
    total: studies.length,
    included: screening.filter(x => x.decision === 'Include').length,
    excluded: screening.filter(x => x.decision === 'Exclude').length,
    uncertain: screening.filter(x => x.decision === 'Maybe').length,
  }), [studies, screening]);

  const updateScreening = (studyId, patch) => setScreening(current => {
    const existing = current.find(x => x.studyId === studyId);
    const title = studies.find(x => x.id === studyId)?.title || '';
    if (!existing) return [...current, { studyId, title, decision: 'Maybe', reviewer: '', exclusionReason: '', notes: '', ...patch }];
    return current.map(x => x.studyId === studyId ? { ...x, ...patch } : x);
  });

  const addStudy = () => setStudies(current => [...current, emptyStudy()]);
  const addExtraction = () => setExtractions(current => [...current, emptyExtraction()]);
  const updateStudy = (id, key, value) => setStudies(current => current.map(s => s.id === id ? { ...s, [key]: value } : s));
  const updateExtraction = (id, key, value) => setExtractions(current => current.map(x => x.id === id ? { ...x, [key]: value } : x));

  async function findDuplicates() {
    try { setError(''); setDedup(await post('/api/research/deduplicate', studies.filter(x => x.title.trim()))); }
    catch (e) { setError(e.message); }
  }

  async function compareReviewers() {
    try {
      setError('');
      const a = reviewer1.split('\n').map(x => x.trim()).filter(Boolean);
      const b = reviewer2.split('\n').map(x => x.trim()).filter(Boolean);
      const comparisons = a.map((value, index) => ({ questionId: String(index + 1), reviewer1: 'Reviewer 1', reviewer2: 'Reviewer 2', reviewer1Value: value, reviewer2Value: b[index] ?? '', isConflict: value.toLowerCase() !== (b[index] ?? '').toLowerCase(), finalDecision: null, consensusNote: null }));
      setConflicts(await post('/api/research/conflicts', comparisons));
    } catch (e) { setError(e.message); }
  }

  async function finalize() {
    try {
      setError('');
      const payload = { projectId, pico, studies, screening, extractions, reviewerComparison: { reviewer1, reviewer2 }, dedup, conflicts };
      setFinalPackage(await post('/api/research/finalize', payload));
    } catch (e) { setError(e.message); }
  }

  return <section className="method-card research-workflow-panel">
    <div className="method-card-heading"><div><p className="eyebrow">Full research workflow</p><h3>Screening → extraction → consensus → finalisering</h3></div><span className="pill">Sporbar arbeidsflate</span></div>
    <p>Arbeidsdata lagres lokalt som utkast i nettleseren. Endelig finalisering lager en SHA-256-integritetsmarkør for datasettet. Dette er ikke en metodisk godkjenning.</p>
    {error && <div className="notice notice-error" role="alert">{error}</div>}

    <div className="workflow-section">
      <h4>1. PICO / PECO</h4>
      <div className="research-grid">
        <label>Rammeverk<select value={pico.framework} onChange={e => setPico({ ...pico, framework: e.target.value })}><option>PICO</option><option>PECO</option></select></label>
        {Object.entries({ population: 'Population', interventionOrExposure: 'Intervention / Exposure', comparison: 'Comparison', outcome: 'Outcome', timeframe: 'Timeframe', studyDesign: 'Study design', researchQuestion: 'Research question' }).map(([key, label]) => <label key={key}>{label}<input value={pico[key]} onChange={e => setPico({ ...pico, [key]: e.target.value })} /></label>)}
      </div>
    </div>

    <div className="workflow-section">
      <div className="method-card-heading"><h4>2. Referanser og deduplisering</h4><button type="button" className="secondary-action" onClick={addStudy}>+ Studie</button></div>
      {studies.length === 0 && <p className="muted">Ingen lokale studier ennå. RIS-import kan brukes først, eller legg inn en studie her for screening.</p>}
      {studies.map(study => <div className="workflow-row" key={study.id}><input placeholder="Tittel" value={study.title} onChange={e => updateStudy(study.id, 'title', e.target.value)} /><input placeholder="År" value={study.year} onChange={e => updateStudy(study.id, 'year', e.target.value)} /><input placeholder="DOI" value={study.doi} onChange={e => updateStudy(study.id, 'doi', e.target.value)} /><input placeholder="Førsteforfatter" value={study.authors[0]} onChange={e => updateStudy(study.id, 'authors', [e.target.value])} /></div>)}
      <button type="button" className="primary-button" onClick={findDuplicates} disabled={!studies.length}>Finn duplikater</button>
      {dedup && <div className="result-box"><strong>{dedup.candidates.length} duplikatkandidater</strong>{dedup.candidates.map(x => <p key={`${x.firstStudyId}-${x.secondStudyId}`}>{x.reason} · {Math.round(x.similarity * 100)}%</p>)}</div>}
    </div>

    <div className="workflow-section">
      <div className="method-card-heading"><h4>3. Screening</h4><span className="pill">{screeningCounts.included} inkludert · {screeningCounts.excluded} ekskludert · {screeningCounts.uncertain} kanskje</span></div>
      {studies.map(study => { const current = screening.find(x => x.studyId === study.id) || { decision: 'Maybe', reviewer: '', exclusionReason: '', notes: '' }; return <div className="screen-row" key={study.id}><strong>{study.title || 'Uten tittel'}</strong><select value={current.decision} onChange={e => updateScreening(study.id, { decision: e.target.value })}><option>Maybe</option><option>Include</option><option>Exclude</option></select>{current.decision === 'Exclude' && <input placeholder="Eksklusjonsgrunn" value={current.exclusionReason || ''} onChange={e => updateScreening(study.id, { exclusionReason: e.target.value })} />}<input placeholder="Reviewer" value={current.reviewer || ''} onChange={e => updateScreening(study.id, { reviewer: e.target.value })} /></div>; })}
      <div className="notice notice-warning">Eksklusjonsgrunn skal registreres ved fulltekstvurdering. Systemet tolker ikke manglende informasjon som eksklusjon.</div>
    </div>

    <div className="workflow-section">
      <div className="method-card-heading"><h4>4. Data extraction</h4><button type="button" className="secondary-action" onClick={addExtraction}>+ Felt</button></div>
      {extractions.map(item => <div className="workflow-row" key={item.id}><select value={item.studyId} onChange={e => updateExtraction(item.id, 'studyId', e.target.value)}><option value="">Velg studie</option>{studies.map(s => <option key={s.id} value={s.id}>{s.title || s.id}</option>)}</select><input placeholder="Felt" value={item.field} onChange={e => updateExtraction(item.id, 'field', e.target.value)} /><input placeholder="Verdi" value={item.value} onChange={e => updateExtraction(item.id, 'value', e.target.value)} /><input placeholder="Enhet" value={item.unit} onChange={e => updateExtraction(item.id, 'unit', e.target.value)} /><input placeholder="Side/tabell/figur" value={item.sourceLocation} onChange={e => updateExtraction(item.id, 'sourceLocation', e.target.value)} /><input placeholder="Reviewer" value={item.reviewer} onChange={e => updateExtraction(item.id, 'reviewer', e.target.value)} /></div>)}
      <div className="notice">Extraction-data kan eksporteres videre til R/Stata/SPSS. Verdier må kontrolleres mot originalkilden.</div>
    </div>

    <div className="workflow-section">
      <h4>5. Blind/individuell reviewer-sammenligning</h4>
      <div className="reviewer-grid"><label>Reviewer 1<textarea value={reviewer1} onChange={e => setReviewer1(e.target.value)} placeholder="Ett svar per linje" /></label><label>Reviewer 2<textarea value={reviewer2} onChange={e => setReviewer2(e.target.value)} placeholder="Ett svar per linje" /></label></div>
      <button type="button" className="primary-button" onClick={compareReviewers}>Finn konflikter</button>
      {conflicts && <div className="result-box"><strong>{conflicts.total} sammenligninger · {conflicts.conflicts.length} konflikter</strong>{conflicts.conflicts.map(x => <p key={x.questionId}>Spørsmål {x.questionId}: {x.reviewer1Value} vs. {x.reviewer2Value}</p>)}</div>}
    </div>

    <div className="workflow-section finalize-panel">
      <h4>6. Finaliser datasettet</h4>
      <label>Prosjekt-ID<input value={projectId} onChange={e => setProjectId(e.target.value)} /></label>
      <button type="button" className="primary-button" onClick={finalize}>Finaliser og lag integritetsmarkør</button>
      {finalPackage && <div className="result-box success"><strong>Finalisert</strong><p>{finalPackage.finalizedAtUtc}</p><code>{finalPackage.sha256}</code><p>{finalPackage.methodologicalNotice}</p></div>}
    </div>
  </section>;
}
