import { useEffect, useState } from 'react';
import { getAmstar2Metadata, getHealth } from './api/amstarApi';
import AssessmentForm from './components/AssessmentForm';
import EvidenceLibrary from './components/EvidenceLibrary';
import ImplementationModule from './components/ImplementationModule';
import PreAppraisalSetup from './components/PreAppraisalSetup';
import ProjectOverview from './components/ProjectOverview';
import ResearchDashboard from './components/ResearchDashboard';
import ResearchModuleHub from './components/ResearchModuleHub';
import ResearchMethods from './components/ResearchMethods';
import RisUploader from './components/RisUploader';
import './App.css';
import './workspace.css';
import './components/EvidenceLibrary.css';

const navItems = [
  ['dashboard', 'Dashboard', 'Oversikt og arbeidsstatus'],
  ['references', 'Referanser', 'Importer RIS fra EndNote/Zotero'],
  ['methods', 'Metoder & syntese', 'PRISMA, inter-rater og GRADE SoF'],
  ['appraisal', 'Kritisk vurdering', 'AMSTAR 2, CASP, AGREE II og GRADE'],
  ['implementation', 'Implementering', 'CFIR 2.0 + KTA'],
  ['projects', 'Prosjekter', 'Reviewere, konsensus og audit trail'],
  ['evidence', '📄 Analyser dokument', 'Last opp og spor forskningsmateriale'],
];

function App() {
  const [metadata, setMetadata] = useState(null);
  const [apiStatus, setApiStatus] = useState('Checking');
  const [error, setError] = useState('');
  const [assessmentSetup, setAssessmentSetup] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    let active = true;
    Promise.all([getHealth(), getAmstar2Metadata()]).then(([health, instrumentMetadata]) => {
      if (!active) return;
      setApiStatus(health.status); setMetadata(instrumentMetadata);
    }).catch((e) => {
      if (!active) return;
      setApiStatus('Unavailable'); setError(e.message || 'Kunne ikke koble til API-et.');
    });
    return () => { active = false; };
  }, []);

  function renderPage() {
    if (!metadata) return <section className="message" aria-live="polite"><p>Laster metodeinformasjon …</p></section>;
    if (activePage === 'dashboard') return <ResearchDashboard onNavigate={setActivePage} />;
    if (activePage === 'references') return <RisUploader />;
    if (activePage === 'methods') return <ResearchMethods />;
    if (activePage === 'projects') return <ProjectOverview />;
    if (activePage === 'evidence') return <EvidenceLibrary />;
    if (activePage === 'implementation') return <ImplementationModule />;

    return <>
      <section className="instrument-card"><div><p className="eyebrow">Systematiske oversikter</p><h2>{metadata.instrumentName} <span>({metadata.instrumentVersion})</span></h2><p>Instrumentet inneholder <strong>{metadata.totalItems} punkter</strong>.</p></div><div className="critical-domains"><h3>Foreslåtte kritiske standarddomener</h3><ul>{metadata.proposedDefaultCriticalDomains.map((item) => <li key={item}>Punkt {item}</li>)}</ul></div></section>
      <section className="notice notice-warning"><h2>Metodisk avgrensning</h2><p>{metadata.criticalDomainNotice}</p><p><strong>Viktig:</strong> {metadata.scoringNotice}</p></section>
      <PreAppraisalSetup defaultCriticalDomains={metadata.proposedDefaultCriticalDomains} onConfirmed={setAssessmentSetup} />
      {assessmentSetup && <AssessmentForm setup={assessmentSetup} />}
      <ResearchModuleHub />
    </>;
  }

  return <div className="app-shell">
    <header className="hero"><div><p className="eyebrow">Forskningsverktøy</p><h1>Evidence Appraisal Tool</h1><p className="hero-text">Transparent og etterprøvbar støtte for kritisk vurdering, implementeringsarbeid og forskningsmessig sporbarhet.</p></div><div className={`status status-${apiStatus.toLowerCase()}`} role="status" aria-live="polite"><span aria-hidden="true" /> API: {apiStatus}</div></header>
    <div className="workspace-layout">
      <aside className="research-sidebar" aria-label="Forskningsnavigasjon"><div className="sidebar-title">Research workspace</div><nav>{navItems.map(([id, label, description]) => <button key={id} type="button" className={activePage === id ? 'nav-item active' : 'nav-item'} onClick={() => setActivePage(id)}><strong>{label}</strong><span>{description}</span></button>)}</nav><div className="sidebar-notice"><strong>Metodisk prinsipp</strong><p>Programmet strukturerer og validerer registrerte data. Det avgjør ikke forskningskvalitet eller implementeringseffekt automatisk.</p></div></aside>
      <main className="main-content">{error && <section className="message message-error" role="alert"><h2>Kunne ikke koble til API-et</h2><p>{error}</p></section>}{renderPage()}</main>
    </div>
  </div>;
}

export default App;
