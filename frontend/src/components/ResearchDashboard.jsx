import { useEffect, useMemo, useState } from 'react';
import { getInstruments, getProjectOverview } from '../api/researchApi';

const empty = { projects: [], instruments: [] };

export default function ResearchDashboard({ onNavigate }) {
  const [data, setData] = useState(empty);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getProjectOverview(), getInstruments()])
      .then(([projects, instruments]) => setData({ projects: projects ?? [], instruments: instruments ?? [] }))
      .catch((e) => setError(e.message));
  }, []);

  const summary = useMemo(() => ({
    projects: data.projects.length,
    constructs: data.projects.reduce((n, p) => n + p.totalCFIRConstructs, 0),
    barriers: data.projects.reduce((n, p) => n + p.barriers, 0),
    disagreements: data.projects.reduce((n, p) => n + p.disagreements, 0),
    actions: data.projects.reduce((n, p) => n + p.ktaActions, 0),
    completedActions: data.projects.reduce((n, p) => n + p.completedKtaActions, 0),
  }), [data.projects]);

  return <section className="research-hub" aria-labelledby="dashboard-heading">
    <p className="eyebrow">Research workspace</p>
    <h2 id="dashboard-heading">Forskningsdashboard</h2>
    <p>Start her for å se prosjektstatus, metodiske arbeidsflyter og forhold som krever oppfølging. Tallene er dokumentasjonsstatus, ikke kvalitets- eller effektskårer.</p>
    {error && <div className="message message-error" role="alert">Kunne ikke hente prosjektstatus: {error}</div>}

    <div className="capability-grid">
      {[
        ['Prosjekter', summary.projects],
        ['CFIR-funn', summary.constructs],
        ['Barrierer', summary.barriers],
        ['Reviewer-uenighet', summary.disagreements],
        ['KTA-tiltak', summary.actions],
        ['Fullførte tiltak', summary.completedActions],
      ].map(([label, value]) => <section className="capability-card" key={label}><p className="eyebrow">{label}</p><strong className="dashboard-number">{value}</strong></section>)}
    </div>

    <div className="dashboard-actions">
      <button className="primary-button" type="button" onClick={() => onNavigate('implementation')}>Åpne CFIR + KTA</button>
      <button type="button" onClick={() => onNavigate('projects')}>Prosjektoversikt og audit trail</button>
      <button type="button" onClick={() => onNavigate('appraisal')}>Kritisk vurdering</button>
    </div>

    <section className="dashboard-section">
      <h3>Aktive prosjekter</h3>
      {data.projects.length === 0 ? <p>Ingen lagrede implementeringsprosjekter ennå.</p> : <div className="project-table-wrap"><table><thead><tr><th>Prosjekt</th><th>CFIR</th><th>Barrierer</th><th>KTA-tiltak</th><th>Uenighet</th></tr></thead><tbody>{data.projects.slice(0, 8).map((p) => <tr key={p.assessmentId}><td>{p.title}</td><td>{p.totalCFIRConstructs}</td><td>{p.barriers}</td><td>{p.ktaActions}</td><td>{p.disagreements}</td></tr>)}</tbody></table></div>}
    </section>

    <section className="dashboard-section">
      <h3>Metoder</h3>
      <div className="research-grid">{data.instruments.map((item) => <article className="assessment-card" key={item.id}><h4>{item.name}</h4><p>{item.purpose}</p><small>{item.scoring}</small></article>)}</div>
    </section>
  </section>;
}
