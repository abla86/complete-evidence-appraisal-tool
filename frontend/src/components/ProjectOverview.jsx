import { useEffect, useState } from 'react';
import { getProjectAudit, getProjectOverview } from '../api/researchApi';
import ResearchCollaborationPanel from './ResearchCollaborationPanel';

export default function ProjectOverview() {
  const [projects, setProjects] = useState([]);
  const [audit, setAudit] = useState({});
  const [error, setError] = useState('');
  const [collaborationProject, setCollaborationProject] = useState(() => localStorage.getItem('eat-project-id') || 'research-workspace');

  useEffect(() => {
    let cancelled = false;
    getProjectOverview()
      .then((data) => { if (!cancelled) setProjects(data); })
      .catch((requestError) => { if (!cancelled) setError(requestError.message); });
    return () => { cancelled = true; };
  }, []);

  async function showAudit(id) {
    try {
      const data = await getProjectAudit(id);
      setAudit((current) => ({ ...current, [id]: data }));
    } catch (e) { setError(e.message); }
  }

  return <section className="research-hub" aria-labelledby="projects-heading">
    <p className="eyebrow">Prosjektstyring</p>
    <h2 id="projects-heading">Prosjektoversikt</h2>
    <p>Samler CFIR-funn, KTA-tiltak, reviewerroller, konsensusstatus og audit trail. Audit trail viser hva som er registrert, av hvem og når.</p>
    {error && <div className="message message-error" role="alert">{error}</div>}

    <section className="assessment-card">
      <h3>Reviewer-samarbeid</h3>
      <label>Prosjekt-ID for samarbeidsrom<input value={collaborationProject} onChange={(e) => setCollaborationProject(e.target.value)} /></label>
      <ResearchCollaborationPanel projectId={collaborationProject || 'research-workspace'} />
    </section>

    {projects.length === 0 && <div className="message"><p>Ingen lagrede prosjekter.</p></div>}
    {projects.map((project) => <article className="assessment-card" key={project.assessmentId}>
      <div className="project-header"><div><p className="eyebrow">{project.cfirStatus}</p><h3>{project.title || 'Uten prosjektnavn'}</h3></div><time dateTime={project.lastChangedUtc}>Sist endret {new Date(project.lastChangedUtc).toLocaleString('nb-NO')}</time></div>
      <div className="capability-grid project-metrics">
        <div><strong>{project.totalCFIRConstructs}</strong><span>CFIR-funn</span></div><div><strong>{project.barriers}</strong><span>Barrierer</span></div><div><strong>{project.facilitators}</strong><span>Fasilitatorer</span></div><div><strong>{project.disagreements}</strong><span>Uenigheter</span></div><div><strong>{project.ktaActions}</strong><span>KTA-tiltak</span></div><div><strong>{project.completedKtaActions}</strong><span>Fullført</span></div>
      </div>
      <p><strong>Reviewer A:</strong> {project.reviewerA || '—'} &nbsp; <strong>Reviewer B:</strong> {project.reviewerB || '—'} &nbsp; <strong>Konsensus:</strong> {project.consensusStatus || 'Ikke dokumentert'}</p>
      <button type="button" onClick={() => showAudit(project.assessmentId)}>Vis audit trail</button>
      {audit[project.assessmentId] && <div className="audit-list"><h4>Audit trail</h4>{audit[project.assessmentId].length === 0 ? <p>Ingen registrerte endringer.</p> : audit[project.assessmentId].map((entry) => <div className="audit-entry" key={entry.id}><strong>{entry.field}</strong><span>{entry.oldValue || '∅'} → {entry.newValue || '∅'}</span><small>{entry.changedBy} · {new Date(entry.timestampUtc).toLocaleString('nb-NO')} · {entry.reason}</small></div>)}</div>}
    </article>)}
  </section>;
}
