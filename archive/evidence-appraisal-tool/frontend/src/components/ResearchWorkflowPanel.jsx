import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5237');
const emptyStudy = () => ({ id: crypto.randomUUID(), title: '', year: '', doi: '', authors: [''] });
const emptyExtraction = () => ({ id: crypto.randomUUID(), studyId: '', field: '', value: '', unit: '', sourceLocation: '', reviewer: '' });
const initialPico = { framework: 'PICO', population: '', interventionOrExposure: '', comparison: '', outcome: '', timeframe: '', studyDesign: '', researchQuestion: '' };
const initialPrisma = { recordsIdentified: 0, recordsRemovedBeforeScreening: 0, recordsScreened: 0, recordsExcluded: 0, reportsSought: 0, reportsNotRetrieved: 0, reportsAssessed: 0, reportsExcludedWithReasons: 0, studiesIncluded: 0, reportsIncluded: 0 };

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
  const [prisma, setPrisma] = useState(() => JSON.parse(localStorage.getItem('eat-prisma') || JSON.stringify(initialPrisma)));
  const [reviewer1, setReviewer1] = useState('');
  const [reviewer2, setReviewer2] = useState('');
  const [dedup, setDedup] = useState(null);
  const [conflicts, setConflicts] = useState(null);
  const [kappa, setKappa] = useState(null);
  const [prismaResult, setPrismaResult] = useState(null);
  const [finalPackage, setFinalPackage] = useState(null);
  const [projectId, setProjectId] = useState(() => localStorage.getItem('eat-project-id') || crypto.randomUUID());
  const [error, setError] = useState('');

  useEffect(() => { localStorage.setItem('eat-studies', JSON.stringify(studies)); }, [studies]);
  useEffect(() => { localStorage.setItem('eat-screening', JSON.stringify(screening)); }, [screening]);
  useEffect(() => { localStorage.setItem('eat-extractions', JSON.stringify(extractions)); }, [extractions]);
  useEffect(() => { localStorage.setItem('eat-pico', JSON.stringify(pico)); }, [pico]);
  useEffect(() => { localStorage.setItem('eat-prisma', JSON.stringify(prisma)); }, [prisma]);
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
  const updatePrisma = (key, value) => setPrisma(current => ({ ...current, [key]: Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0 }));

  async function findDuplicates() {
    try { setError(''); setDedup(await post('/api/research/deduplicate', studies.filter(x => x.title.trim()))); }
    catch (e) { setError(e.message); }
  }

  async function validatePrisma() {
    try { setError(''); setPrismaResult(await post('/api/research/prisma/validate', prisma)); }
    catch (e) { setError(e.message); }
  }

  function buildPairedRatings() {
    const a = reviewer1.split('\n').map(x => x.trim()).filter(Boolean);
    const b = reviewer2.split('\n').map(x => x.trim()).filter(Boolean);
    return { a, b };
  }

  async function compareReviewers() {
    try {
      setError('');
      const { a, b } = buildPairedRatings();
      const comparisons = a.map((value, index) => ({ questionId: String(index + 1), reviewer1: 'Reviewer 1', reviewer2: 'Reviewer 2', reviewer1Value: value, reviewer2Value: b[index] ?? '', isConflict: value.toLowerCase() !== (b[index] ?? '').toLowerCase(), finalDecision: null, consensusNote: null }));
      setConflicts(await post('/api/research/conflicts', comparisons));
      setKappa(null);
    } catch (e) { setError(e.message); }
  }

  async function calculateKappa() {
    try {
      setError('');
      const { a, b } = buildPairedRatings();
      if (a.length !== b.length) throw new Error('Reviewer 1 og Reviewer 2 må ha like mange parvise svar.');
      setKappa(await post('/api/research/kappa', { reviewer1: a, reviewer2: b }));
    } catch (e) { setError(e.message); }
  }

  async function finalize() {
    try {
      setError('');
      const payload = { projectId, pico, prisma, studies, screening, extractions, reviewerComparison: { reviewer1, reviewer2 }, dedup, conflicts, kappa };
      setFinalPackage(await post('/api/research/finalize', payload));
    } catch (e) { setError(e.message); }
  }

  return <section className="method-card research-workflow-panel">
    <div className="method-card-heading"><div><p className="eyebrow">Full research workflow</p><h3>Plan → screening → extraction → reviewerkontroll → finalisering</h3></div><span className="pill">Sporbar arbeidsflate</span></div>
    <p>Utkast lagres lokalt i nettleseren. Endelig finalisering lager en SHA-256-integritetsmarkør for datasettet. Integritetsmarkøren er ikke en metodisk godkjenning.</p>
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
      <button type="button" className="primary-button" onClick={findDuplicates} disabled={!studies.length}>Finn duplikatkandidater</button>
      {dedup && <div className="result-box"><strong>{dedup.candidates.length} duplikatkandidater</strong>{dedup.candidates.map(x => <p key={`${x.firstStudyId}-${x.secondStudyId}`}>{x.reason} · {Math.round(x.similarity * 100)}%</p>)}<p className="muted">Kandidater må kontrolleres av forsker; systemet sletter ikke automatisk poster.</p></div>}
    </div>

    <div className="workflow-section">
      <div className="method-card-heading"><h4>3. Screening</h4><span className="pill">{screeningCounts.included} inkludert · {screeningCounts.excluded} ekskludert · {screeningCounts.uncertain} kanskje</span></div>
      {studies.map(study => { const current = screening.find(x => x.studyId === study.id) || { decision: 'Maybe', reviewer: '', exclusionReason: '', notes: '' }; return <div className="screen-row" key={study.id}><strong>{study.title || 'Uten tittel'}</strong><select value={current.decision} onChange={e => updateScreening(study.id, { decision: e.target.value })}><option>Maybe</option><option>Include</option><option>Exclude</option></select>{current.decision === 'Exclude' && <input placeholder="Eksklusjonsgrunn" value={current.exclusionReason || ''} onChange={e => updateScreening(study.id, { exclusionReason: e.target.value })} />}<input placeholder="Reviewer" value={current.reviewer || ''} onChange={e => updateScreening(study.id, { reviewer: e.target.value })} /></div>; })}
      <div className="notice notice-warning">Ved fulltekstvurdering skal eksklusjonsgrunn dokumenteres. Manglende informasjon behandles ikke automatisk som «Nei» eller eksklusjon.</div>
    </div>

    <div className="workflow-section">
      <div className="method-card-heading"><h4>4. Data extraction</h4><button type="button" className="secondary-action" onClick={addExtraction}>+ Felt</button></div>
      {extractions.map(item => <div className="workflow-row" key={item.id}><select value={item.studyId} onChange={e => updateExtraction(item.id, 'studyId', e.target.value)}><option value="">Velg studie</option>{studies.map(s => <option key={s.id} value={s.id}>{s.title || s.id}</option>)}</select><input placeholder="Felt" value={item.field} onChange={e => updateExtraction(item.id, 'field', e.target.value)} /><input placeholder="Verdi" value={item.value} onChange={e => updateExtraction(item.id, 'value', e.target.value)} /><input placeholder="Enhet" value={item.unit} onChange={e => updateExtraction(item.id, 'unit', e.target.value)} /><input placeholder="Side / tabell / figur" value={item.sourceLocation} onChange={e => updateExtraction(item.id, 'sourceLocation', e.target.value)} /><input placeholder="Reviewer" value={item.reviewer} onChange={e => updateExtraction(item.id, 'reviewer', e.target.value)} /></div>)}
      <div className="notice">Extraction-verdier skal kontrolleres mot originalkilden. Source location beholdes som sporbar referanse til side, tabell eller figur.</div>
    </div>

    <div className="workflow-section">
      <div className="method-card-heading"><h4>5. PRISMA-flyt og intern konsistenskontroll</h4><button type="button" className="secondary-action" onClick={validatePrisma}>Valider PRISMA-tall</button></div>
      <div className="research-grid prisma-grid">{Object.entries({ recordsIdentified: 'Identifisert', recordsRemovedBeforeScreening: 'Fjernet før screening', recordsScreened: 'Screenet', recordsExcluded: 'Ekskludert', reportsSought: 'Rapporter søkt', reportsNotRetrieved: 'Ikke hentet', reportsAssessed: 'Vurdert for inklusjon', reportsExcludedWithReasons: 'Ekskludert med grunn', studiesIncluded: 'Inkluderte studier', reportsIncluded: 'Inkluderte rapporter' }).map(([key, label]) => <label key={key}>{label}<input type="number" min="0" value={prisma[key]} onChange={e => updatePrisma(key, e.target.value)} /></label>)}</div>
      {prismaResult && <div className={`result-box ${prismaResult.isValid ? 'success' : ''}`}><strong>{prismaResult.isValid ? 'PRISMA-tallene er konsistente' : 'PRISMA-kontroll fant avvik'}</strong>{prismaResult.warnings?.map(w => <p key={w}>{w}</p>)}</div>}
    </div>

    <div className="workflow-section">
      <h4>6. Uavhengig reviewer-sammenligning</h4>
      <p className="muted">Denne arbeidsflaten sammenligner to vurderingssett. Den er ikke i seg selv en sikker blindet review-prosess; blindhet krever tilgangskontroll og separat lagring av reviewerdata.</p>
      <div className="reviewer-grid"><label>Reviewer 1<textarea value={reviewer1} onChange={e => setReviewer1(e.target.value)} placeholder="Ett svar per linje" /></label><label>Reviewer 2<textarea value={reviewer2} onChange={e => setReviewer2(e.target.value)} placeholder="Ett svar per linje" /></label></div>
      <div className="action-row"><button type="button" className="primary-button" onClick={compareReviewers}>Finn konflikter</button><button type="button" className="secondary-action" onClick={calculateKappa}>Beregn Cohen's κ</button></div>
      {conflicts && <div className="result-box"><strong>{conflicts.total} sammenligninger · {conflicts.conflicts.length} konflikter</strong>{conflicts.conflicts.map(x => <p key={x.questionId}>Spørsmål {x.questionId}: {x.reviewer1Value} vs. {x.reviewer2Value}</p>)}</div>}
      {kappa && <div className="result-box"><strong>Cohen's κ = {Number(kappa.kappa).toFixed(3)}</strong><p>Observert enighet: {Number(kappa.observedAgreement).toFixed(3)} · forventet enighet: {Number(kappa.expectedAgreement).toFixed(3)}</p><p>{kappa.interpretation}</p><p className="muted">κ bør rapporteres sammen med datagrunnlag, kategorier og metodevalg; dette er ikke en kvalitetsvurdering av forskningen.</p></div>}
    </div>

    <div className="workflow-section">
      <h4>7. Konsensus</h4>
      <p>Konflikter skal løses av forsker(e). Lagre endelig beslutning og begrunnelse som en separat konsensusbeslutning; ikke overskriv de individuelle vurderingene.</p>
      {conflicts?.conflicts?.length > 0 && <div className="result-box">{conflicts.conflicts.map(x => <div key={x.questionId}><strong>Spørsmål {x.questionId}</strong><p>{x.reviewer1Value} ↔ {x.reviewer2Value}</p><input placeholder="Endelig konsensusbeslutning" /><textarea placeholder="Konsensusnotat / begrunnelse" /></div>)}</div>}
    </div>

    <div className="workflow-section finalize-panel">
      <h4>8. Finaliser datasettet</h4>
      <label>Prosjekt-ID<input value={projectId} onChange={e => setProjectId(e.target.value)} /></label>
      <button type="button" className="primary-button" onClick={finalize}>Finaliser og lag integritetsmarkør</button>
      {finalPackage && <div className="result-box success"><strong>Datasett finalisert</strong><p>{finalPackage.finalizedAtUtc}</p><code>{finalPackage.sha256}</code><p>{finalPackage.methodologicalNotice}</p></div>}
    </div>
  </section>;
}
