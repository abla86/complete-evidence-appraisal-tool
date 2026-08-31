import { useEffect, useState } from 'react';
import { getAmstar2Metadata, getHealth } from './api/amstarApi';
import AssessmentForm from './components/AssessmentForm';
import EvidenceAuditHistory from './components/EvidenceAuditHistory';
import EvidenceLibrary from './components/EvidenceLibrary';
import ImplementationModule from './components/ImplementationModule';
import PreAppraisalSetup from './components/PreAppraisalSetup';
import PrismaExportPanel from './components/PrismaExportPanel';
import ProjectOverview from './components/ProjectOverview';
import ResearchCollaborationPanel from './components/ResearchCollaborationPanel';
import ResearchDashboard from './components/ResearchDashboard';
import ResearchModuleHub from './components/ResearchModuleHub';
import ResearchMethods from './components/ResearchMethods';
import ResearchCompleteness from './components/ResearchCompleteness';
import BibliographyUploader from './components/BibliographyUploader';
import FinalizationPanel from './components/FinalizationPanel';
import Rob2Assessment from './components/Rob2Assessment';
import './App.css';
import './workspace.css';
import './components/EvidenceLibrary.css';
import './components/ResearchCompleteness.css';
import './components/JbiQualitativeAssessment.css';

const navItems = [
  ['dashboard', 'Dashboard', 'Oversikt og arbeidsstatus'],
  ['references', 'Referanser', 'Importer RIS, BibTeX, PubMed, XML og EndNote'],
  ['research-workspace', 'Forskningsflyt', 'Screening, dataekstraksjon, syntese og EtD'],
  ['prisma-export', 'PRISMA-eksport', 'Validerte flyttall til SVG og JSON'],
  ['methods', 'Metoder & syntese', 'PRISMA, inter-rater og GRADE'],
  ['appraisal', 'Kritisk vurdering', 'AMSTAR 2, CASP, AGREE II og GRADE'],
  ['rob2', 'RoB 2', 'Risk of Bias 2 for randomiserte studier'],
  ['implementation', 'Implementering', 'CFIR 2.0 + KTA'],
  ['projects', 'Prosjekter', 'Reviewere, konsensus og audit trail'],
  ['collaboration', 'Samarbeid', 'Aktive reviewere og feltlåser'],
  ['audit', 'Evidenshistorikk', 'Versjonert verifikasjon og endringsspor'],
  ['finalize', 'Finalisering', 'Lås prosjektet med integritetskontroll'],
  ['evidence', 'Analyser dokument', 'Last opp og spor forskningsmateriale'],
];

const PROJECT_ID_KEY = 'eat-project-id';
const DEFAULT_PROJECT_ID = 'default-research-project';

const DEFAULT_WORKFLOW_RULES = {
  instruments: [],
  requireHumanVerification: true,
  dualReview: false,
  prismaTracking: true,
  auditTrail: true,
  doiLookup: true,
  picoAssist: false,
  pdfEvidenceMapping: true,
  offlineMode: false,
  includePageText: false,
};

function getProjectId() {
  return localStorage.getItem(PROJECT_ID_KEY) || DEFAULT_PROJECT_ID;
}

function normalizeWorkflowRules(rules) {
  return {
    ...DEFAULT_WORKFLOW_RULES,
    ...(rules ?? {}),
    instruments: Array.isArray(rules?.instruments) ? rules.instruments : DEFAULT_WORKFLOW_RULES.instruments,
  };
}

function App() {
  const [metadata, setMetadata] = useState(null);
  const [apiStatus, setApiStatus] = useState('Checking');
  const [error, setError] = useState('');
  const [assessmentSetup, setAssessmentSetup] = useState(null);
  const [workflowRules, setWorkflowRules] = useState(DEFAULT_WORKFLOW_RULES);
  const [projectId] = useState(getProjectId());
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    let active = true;
    Promise.all([getHealth(), getAmstar2Metadata()]).then(([health, instrumentMetadata]) => {
      if (!active) return;
      setApiStatus(health.status);
      setMetadata(instrumentMetadata);
    }).catch((e) => {
      if (!active) return;
      setApiStatus('Unavailable');
      setError(e.message || 'Kunne ikke koble til API-et.');
    });
    return () => { active = false; };
  }, []);

  async function persistProjectSetup(setup) {
    const normalized = normalizeWorkflowRules(setup.workflowRules);
    setWorkflowRules(normalized);
    setAssessmentSetup(setup);

    try {
      const response = await fetch(`/api/research/operations/projects/${projectId}/configuration`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: setup.reviewTitle,
          reviewer: setup.reviewer,
          workflowRules: normalized,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Kunne ikke lagre prosjektoppsettet.');
      }
    } catch (e) {
      setError(e.message || 'Kunne ikke lagre prosjektoppsettet.');
    }
  }

  function renderPage() {
    if (!metadata && activePage !== 'rob2' && activePage !== 'references' && activePage !== 'prisma-export' && activePage !== 'finalize') return <section className="message" aria-live="polite"><p>Laster metodeinformasjon …</p></section>;
    if (activePage === 'dashboard') return <ResearchDashboard onNavigate={setActivePage} />;
    if (activePage === 'references') return workflowRules.doiLookup ? <BibliographyUploader /> : <section className="notice notice-warning"><h2>DOI-/bibliografiintegrasjon er slått av</h2><p>Dette prosjektet bruker ikke automatisk DOI-oppslag.</p></section>;
    if (activePage === 'research-workspace') return <ResearchCompleteness />;
    if (activePage === 'prisma-export') return workflowRules.prismaTracking ? <PrismaExportPanel /> : <section className="notice notice-warning"><h2>PRISMA-sporing er slått av</h2><p>PRISMA-modulen er deaktivert i prosjektoppsettet.</p></section>;
    if (activePage === 'methods') return <ResearchMethods />;
    if (activePage === 'projects') return <ProjectOverview />;
    if (activePage === 'collaboration') return workflowRules.dualReview ? <ResearchCollaborationPanel projectId={projectId} /> : <section className="notice notice-warning"><h2>Dual review er slått av</h2><p>Aktiver dual review i prosjektoppsettet dersom to uavhengige reviewere skal brukes.</p></section>;
    if (activePage === 'audit') return workflowRules.auditTrail ? <EvidenceAuditHistory /> : <section className="notice notice-warning"><h2>Audit trail er slått av</h2><p>Endringshistorikk utover nødvendig systemlogging er ikke aktivert for prosjektet.</p></section>;
    if (activePage === 'finalize') return <FinalizationPanel projectId={projectId} />;
    if (activePage === 'evidence') return <EvidenceLibrary />;
    if (activePage === 'implementation') return <ImplementationModule />;
    if (activePage === 'rob2') return workflowRules.instruments.includes('rob2') ? <Rob2Assessment /> : <section className="notice notice-warning"><h2>RoB 2 er slått av</h2><p>Velg RoB 2 i prosjektoppsettet for å bruke denne modulen.</p></section>;

    return <>
      <section className="instrument-card"><div><p className="eyebrow">Systematiske oversikter</p><h2>{metadata.instrumentName} <span>({metadata.instrumentVersion})</span></h2><p>Instrumentet inneholder <strong>{metadata.totalItems} punkter</strong>.</p></div><div className="critical-domains"><h3>Foreslåtte kritiske standarddomener</h3><ul>{metadata.proposedDefaultCriticalDomains.map((item) => <li key={item}>Punkt {item}</li>)}</ul></div></section>
      <section className="notice notice-warning"><h2>Metodisk avgrensning</h2><p>{metadata.criticalDomainNotice}</p><p><strong>Viktig:</strong> {metadata.scoringNotice}</p></section>
      <PreAppraisalSetup defaultCriticalDomains={metadata.proposedDefaultCriticalDomains} initialWorkflowRules={workflowRules} onConfirmed={persistProjectSetup} />
      {assessmentSetup && <AssessmentForm setup={assessmentSetup} />}
      <ResearchModuleHub workflowRules={workflowRules} />
    </>;
  }

  return <div className="app-shell">
    <header className="hero"><div><p className="eyebrow">Forskningsverktøy</p><h1>Evidence Appraisal Tool</h1><p className="hero-text">Transparent og etterprøvbar støtte for kritisk vurdering, implementeringsarbeid og forskningsmessig sporbarhet.</p></div><div className={`status status-${apiStatus.toLowerCase()}`} role="status" aria-live="polite"><span aria-hidden="true" /> API: {apiStatus}</div></header>
    <div className="workspace-layout">
      <aside className="research-sidebar" aria-label="Forskningsnavigasjon"><div className="sidebar-title">Research workspace</div><nav>{navItems.map(([id, label, description]) => <button key={id} type="button" className={activePage === id ? 'nav-item active' : 'nav-item'} onClick={() => setActivePage(id)}><strong>{label}</strong><span>{description}</span></button>)}</nav><div className="sidebar-notice"><strong>Aktivt prosjektoppsett</strong><p>{workflowRules.instruments.length} instrument(er) · {workflowRules.dualReview ? 'dual review på' : 'single review'} · {workflowRules.prismaTracking ? 'PRISMA på' : 'PRISMA av'} · {workflowRules.auditTrail ? 'audit på' : 'audit av'}</p></div></aside>
      <main className="main-content">{error && <section className="message message-error" role="alert"><h2>Kunne ikke koble til API-et</h2><p>{error}</p></section>}{renderPage()}</main>
    </div>
  </div>;
}

export default App;
