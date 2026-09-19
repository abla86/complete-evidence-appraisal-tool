import { useEffect, useState } from 'react';
import ResearchWorkflowPanel from './ResearchWorkflowPanel';
import './ResearchMethods.css';

const API = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:5237');
const initialRow = { outcome: '', relativeEffect: '', absoluteEffect: '', participantsAndStudies: '', certainty: 'Undetermined', justification: '' };

export default function ResearchMethods() {
  const [methods, setMethods] = useState([]);
  const [method, setMethod] = useState('SystematicReview');
  const [rows, setRows] = useState([{ ...initialRow }]);

  useEffect(() => {
    fetch(`${API}/api/research/methodologies`).then(r => r.json()).then(setMethods).catch(() => setMethods([]));
  }, []);

  const selected = methods.find(x => x.id === method);
  const setRow = (index, key, value) => setRows(current => current.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const exportSoF = () => {
    const blob = new Blob([JSON.stringify({ title: 'GRADE Summary of Findings', rows }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'grade-summary-of-findings.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <div className="research-methods">
    <section className="methods-hero"><p className="eyebrow">Research methodology</p><h2>Forskningsflyt og syntese</h2><p>Strukturer arbeidsprosessen uten å automatisere forskerens metodiske skjønn.</p></section>
    <section className="method-selector"><label htmlFor="research-method"><strong>Analyseform</strong></label><select id="research-method" value={method} onChange={e => setMethod(e.target.value)}>{methods.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>{selected && <p><strong>Anbefalte moduler:</strong> {selected.recommendedModules.join(' · ')}</p>}</section>

    <ResearchWorkflowPanel />

    <section className="method-card"><div className="method-card-heading"><div><p className="eyebrow">Synthesis</p><h3>GRADE Summary of Findings</h3></div><span className="pill">Manuell forskervurdering</span></div>
      <p>Strukturer sluttresultatet. Systemet skal ikke automatisk utlede certainty fra én enkelt risiko-for-bias-vurdering.</p>
      <div className="sof-table-wrap"><table><thead><tr><th>Utfall</th><th>Relativ effekt</th><th>Absolutt effekt</th><th>Deltakere/studier</th><th>Tillit</th><th>Begrunnelse</th></tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{['outcome', 'relativeEffect', 'absoluteEffect', 'participantsAndStudies'].map(key => <td key={key}><input value={row[key]} onChange={e => setRow(i, key, e.target.value)} /></td>)}<td><select value={row.certainty} onChange={e => setRow(i, 'certainty', e.target.value)}><option>High</option><option>Moderate</option><option>Low</option><option>Very Low</option><option>Undetermined</option></select></td><td><input value={row.justification} onChange={e => setRow(i, 'justification', e.target.value)} /></td></tr>)}</tbody></table></div>
      <div className="button-row"><button type="button" onClick={() => setRows(current => [...current, { ...initialRow }])}>+ Legg til utfall</button><button type="button" onClick={exportSoF}>Eksporter SoF-data</button></div>
      <div className="notice notice-warning"><strong>Kontroller alltid mot kildene:</strong> GRADE certainty er en faglig vurdering av evidensgrunnlaget, ikke en automatisk kvalitetsscore.</div>
    </section>

    <section className="method-card roadmap"><h3>Metodiske utvidelser</h3><p>Validerte instrumenttekster må håndteres etter gjeldende rettighets- og lisensvilkår. Programmet skal ikke late som en sjekkliste er tilgjengelig dersom den ikke er implementert eller lisensiert.</p><div className="roadmap-grid"><span>Risk of Bias</span><span>Extraction</span><span>Qualitative synthesis</span><span>Meta-analysis</span><span>Conflict resolution</span><span>Research report</span></div></section>
  </div>;
}
