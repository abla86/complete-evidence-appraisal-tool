import React, { useState } from 'react';
import { 
  FileCheck, 
  ShieldCheck, 
  Download, 
  Activity, 
  History, 
  Upload, 
  FileText, 
  Lock, 
  ChevronDown, 
  Sparkles,
  Layers,
  Database,
  FolderKanban,
  FileSpreadsheet,
  AlertTriangle,
  Users2,
  Quote,
  Sliders,
  Check,
  BookOpen,
  HelpCircle,
  Scale,
  FlaskConical,
  Copy,
  Bookmark,
  Search,
  GitBranch,
  TrendingUp
} from 'lucide-react';
import { ActiveTab, ResearchProject, ReviewerProfile, StudyRecord } from '../types';

interface HeaderProps {
  project: ResearchProject;
  studies: StudyRecord[];
  activeStudyId: string;
  activeTab?: ActiveTab;
  onSelectTab?: (tab: ActiveTab) => void;
  onSelectStudy: (id: string) => void;
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onOpenAudit: () => void;
  onOpenHealth: () => void;
  onOpenTestRunner?: () => void;
  onOpenProjectProtocol: () => void;
  onOpenGovernanceGate: () => void;
  onOpenDataExtraction: () => void;
  onOpenSensitivityAnalysis?: () => void;
  onOpenReliabilityReport?: () => void;
  onOpenDuplicateDetector?: () => void;
  onOpenFreezeModal: () => void;
  onLoadBenchmarkData: () => void;
  onOpenCitationModal?: () => void;
  onOpenKnowledgeBase?: () => void;
  onOpenDoiVerifier?: () => void;
  onOpenPrivateShare?: () => void;
  onOpenResearchSearch?: () => void;
  onOpenThesisDraft?: () => void;
  onOpenMetaResearch?: () => void;
  onOpenDesignAdvisory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  studies,
  activeStudyId,
  activeTab = 'appraisal',
  onSelectTab,
  onSelectStudy,
  onOpenUpload,
  onOpenExport,
  onOpenAudit,
  onOpenHealth,
  onOpenTestRunner,
  onOpenProjectProtocol,
  onOpenGovernanceGate,
  onOpenDataExtraction,
  onOpenSensitivityAnalysis,
  onOpenReliabilityReport,
  onOpenDuplicateDetector,
  onOpenFreezeModal,
  onLoadBenchmarkData,
  onOpenCitationModal,
  onOpenKnowledgeBase,
  onOpenDoiVerifier,
  onOpenPrivateShare,
  onOpenResearchSearch,
  onOpenThesisDraft,
  onOpenMetaResearch,
  onOpenDesignAdvisory
}) => {
  const activeStudy = studies.find(s => s.id === activeStudyId);
  const isGatePassed = project.governanceGate?.isGatePassed;
  const [showReviewersDropdown, setShowReviewersDropdown] = useState(false);

  const activeReviewer: ReviewerProfile = project.reviewers[0] || {
    id: 'rev-sarah',
    name: 'Dr. Sarah Lindqvist',
    role: 'Lead Reviewer',
    email: 'sarah.lindqvist@evidence-research.org',
    affiliation: 'Dept. of Clinical Epidemiology',
    isBlinded: false,
    avatarColor: 'bg-blue-600'
  };

  const reviewerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-700">
      <div className="w-full px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Left: Brand & Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-xs flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-1.5">
                <h1 className="text-sm sm:text-base font-bold leading-none tracking-tight text-white">
                  Complete Evidence Appraisal Tool
                </h1>
                <span className="text-blue-400 text-[10px] font-mono uppercase tracking-widest bg-blue-950/90 px-1.5 py-0.5 rounded border border-blue-800/80 font-bold">
                  v{project.activeVersion || '2.0'} Multi-Rater
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter hidden md:block">
                WHO Governance • 6–8 Rater Panel • Fargekodet Evidens
              </p>
            </div>
          </div>

          {/* Center: Protocol, Kunnskapsbase, Verifikasjon & Study Selector */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Project Settings & Protocol button */}
            <button
              id="header-project-protocol-btn"
              onClick={onOpenProjectProtocol}
              title={`Prosjekt: ${project.title}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-md text-slate-200 text-xs font-semibold transition-colors"
            >
              <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline font-mono text-[11px] uppercase">
                {project.shortCode || 'PROJ'}
              </span>
            </button>

            {/* Knowledge Base & Guide Button */}
            {onOpenKnowledgeBase && (
              <button
                id="header-knowledge-base-btn"
                onClick={onOpenKnowledgeBase}
                title="Åpne Metodeguide, Hjelpesenter & Kunnskapsbase (WHO / Cochrane / AGREE)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-md text-amber-300 hover:text-white text-xs font-semibold transition-colors shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline text-[11px]">Metodeguide</span>
              </button>
            )}

            {/* Academic DOI Verification Button */}
            {onOpenDoiVerifier && (
              <button
                id="header-doi-verifier-btn"
                onClick={onOpenDoiVerifier}
                title="Akademisk DOI & Sikkerhetsverifikasjon (CrossRef, PubMed, Retraction Watch)"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-md text-emerald-300 hover:text-white text-xs font-semibold transition-colors shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px]">Verifiser DOI</span>
              </button>
            )}

            {/* Governance Gate Status Badge */}
            <button
              id="header-governance-gate-btn"
              onClick={onOpenGovernanceGate}
              title="Research Data Governance Gate (GDPR Art. 6/9 & Helseforskningsloven)"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                isGatePassed
                  ? 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                  : 'bg-amber-950/90 hover:bg-amber-900 text-amber-300 border-amber-800'
              }`}
            >
              {isGatePassed ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden xl:inline text-[11px]">
                {isGatePassed ? 'Gate: Pass' : 'Gate: Påkrevd'}
              </span>
            </button>

            {/* Data Extraction Button */}
            <button
              id="header-data-extraction-btn"
              onClick={onOpenDataExtraction}
              title="PICO Ekstraksjon & Linjedata"
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-md text-slate-200 text-xs font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px]">Ekstraksjon</span>
            </button>

            {/* Sensitivity Analysis & Bias Button */}
            {onOpenSensitivityAnalysis && (
              <button
                id="header-sensitivity-analysis-btn"
                onClick={onOpenSensitivityAnalysis}
                title="Sensitivitetsanalyse, Bias-stratifisering & Forest Plot"
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-900/60 hover:bg-blue-800 border border-blue-600/70 rounded-md text-blue-100 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-300" />
                <span className="text-[11px]">Sensitivitet &amp; Bias</span>
              </button>
            )}

            {/* Duplicate Candidate Detection & Screening Button */}
            {onOpenDuplicateDetector && (
              <button
                id="header-duplicate-detector-btn"
                onClick={onOpenDuplicateDetector}
                title="Duplikatdeteksjon & Skjermingsanalyse (DOI & Tittellikhet uten sletting)"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/70 rounded-md text-amber-200 hover:text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Duplikatsjekk</span>
              </button>
            )}

            {/* Inter-Rater Reliability & Cohen's Kappa Report Button */}
            {onOpenReliabilityReport && (
              <button
                id="header-reliability-report-btn"
                onClick={onOpenReliabilityReport}
                title="Inter-Rater Reliabilitetsrapport & Cohen's Kappa analyse for sensorer"
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/70 rounded-md text-indigo-200 hover:text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px]">Reliabilitet &amp; &kappa;</span>
              </button>
            )}

            {/* Scientific Validation Testlab Button */}
            {onOpenTestRunner && (
              <button
                id="header-testlab-btn"
                onClick={onOpenTestRunner}
                title="Vitenskapelig Testlab: Verifiser matematiske formler og gullstandard benchmarks"
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/70 rounded-md text-emerald-200 hover:text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px]">Testlab &amp; Benchmark</span>
              </button>
            )}

            {/* Active Study Selector */}
            <div className="relative w-36 sm:w-44 md:w-52 hidden sm:block">
              <select
                id="header-study-selector"
                value={activeStudyId}
                onChange={(e) => onSelectStudy(e.target.value)}
                className="w-full pl-2.5 pr-7 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-md text-slate-200 appearance-none focus:outline-hidden focus:ring-1 focus:ring-blue-500 truncate transition-colors cursor-pointer"
              >
                {studies.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.isLocked ? '🔒 ' : '📄 '} {s.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Academic Quick Citation Button */}
            {activeStudy && onOpenCitationModal && (
              <button
                id="header-citation-btn"
                onClick={onOpenCitationModal}
                title="Sitér artikkel (APA 7, Vancouver, BibTeX)"
                className="hidden 2xl:flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-md text-slate-300 text-xs transition-colors"
              >
                <Quote className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Sitér</span>
              </button>
            )}

          </div>

          {/* Right Action Tools: Import & Export */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* System Health / Diagnostic */}
            <button
              id="header-health-button"
              onClick={onOpenHealth}
              title="System Health Monitor"
              className="p-1.5 text-emerald-400 hover:bg-slate-800 rounded-md border border-slate-700 transition-colors hidden sm:block"
            >
              <Activity className="w-4 h-4" />
            </button>

            {/* Audit Trail */}
            <button
              id="header-audit-button"
              onClick={onOpenAudit}
              title="Cryptographic Audit Ledger & Merkle Chain"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md border border-slate-700 transition-colors hidden sm:block"
            >
              <History className="w-4 h-4" />
            </button>

            {/* PROMINENT PRIVATE SHARE & GITHUB BUTTON */}
            {onOpenPrivateShare && (
              <button
                id="header-private-share-btn"
                onClick={onOpenPrivateShare}
                title="Privat Deling & GitHub: Del sikkert med kollegaer uten å gjøre noe offentlig"
                className="bg-slate-800 hover:bg-slate-750 text-emerald-300 hover:text-emerald-200 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-bold border border-emerald-700/80 shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                <span className="font-semibold">Privat Deling</span>
                <span className="hidden xl:inline font-mono text-[10px] text-emerald-400">&amp; GitHub</span>
              </button>
            )}

            {/* PROMINENT IMPORT BUTTON */}
            <button
              id="header-import-button"
              onClick={onOpenUpload}
              title="Importer forskningsartikkel / datasett (PDF, XML, RIS, BibTeX, DOCX)"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 sm:px-3.5 py-1.5 rounded-md text-xs sm:text-xs font-bold border border-emerald-500 shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="font-semibold">Importer</span>
              <span className="hidden md:inline font-normal text-emerald-100 text-[11px]">artikkel</span>
            </button>

            {/* PROMINENT EXPORT BUTTON */}
            <button
              id="header-export-button"
              onClick={onOpenExport}
              title="Eksporter evidenspakke, PRISMA, AMSTAR 2 og revisjonslogg"
              className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 sm:px-3.5 py-1.5 rounded-md text-xs sm:text-xs font-bold border border-blue-500 shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="font-semibold">Eksporter</span>
              <span className="hidden md:inline font-normal text-blue-100 text-[11px]">pakke</span>
            </button>

            {/* Reviewer Panel Avatar & Dropdown */}
            <div className="relative">
              <button
                id="header-reviewer-avatar-btn"
                onClick={() => setShowReviewersDropdown(!showReviewersDropdown)}
                title={`Vurdererpanel (${project.reviewers.length} medlemmer)`}
                className="flex items-center gap-1.5 p-1 rounded-full bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors"
              >
                <div 
                  className={`w-7 h-7 rounded-full ${activeReviewer.avatarColor || 'bg-blue-600'} flex items-center justify-center font-bold text-white text-[11px] shadow-xs`}
                >
                  {reviewerInitials(activeReviewer.name)}
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 pr-0.5" />
              </button>

              {/* Reviewers List Dropdown */}
              {showReviewersDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 p-2 text-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 px-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <Users2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Forskerpanel ({project.reviewers.length})</span>
                    </span>
                    <span className="text-[10px] text-blue-400 font-mono">Opptil 8</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {project.reviewers.map((rev) => (
                      <div 
                        key={rev.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-800 transition-colors"
                      >
                        <div className={`w-6 h-6 rounded-full ${rev.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>
                          {reviewerInitials(rev.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-200 truncate">{rev.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{rev.role} • {rev.affiliation}</div>
                        </div>
                        {rev.isBlinded && (
                          <span className="text-[9px] px-1 py-0.2 bg-amber-950 text-amber-300 border border-amber-800 rounded font-semibold">
                            Blindet
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Primary Module & Workflow Navigation Tabs */}
      {onSelectTab && (
        <div className="bg-slate-950/90 border-t border-slate-800/90 px-3 sm:px-5 lg:px-6 flex items-center justify-between overflow-x-auto py-1">
          <nav className="flex items-center gap-1 sm:gap-1.5" aria-label="Hovedfaner">
            <button
              id="tab-btn-appraisal"
              onClick={() => onSelectTab('appraisal')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'appraisal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>JBI Kvalitativ &amp; Vurdering</span>
            </button>

            <button
              id="tab-btn-source-workflow"
              onClick={() => onSelectTab('source_workflow')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'source_workflow'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>SourceRecord Arbeidsflyt</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                PRISMA
              </span>
            </button>

            <button
              id="tab-btn-reference-hub"
              onClick={() => onSelectTab('reference_hub')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'reference_hub'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Reference Hub</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                EndNote/Zotero/Citavi
              </span>
            </button>

            <button
              id="tab-btn-library"
              onClick={() => onSelectTab('library')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'library'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Artikkelbibliotek ({studies.length})</span>
            </button>

            <button
              id="tab-btn-synthesis"
              onClick={() => onSelectTab('synthesis')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'synthesis'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
              <span>Syntese &amp; PICO</span>
            </button>

            <button
              id="tab-btn-governance-audit"
              onClick={() => onSelectTab('governance_audit')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'governance_audit'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Governance &amp; Audit</span>
            </button>

            <button
              id="tab-btn-validation-lab"
              onClick={() => onSelectTab('validation_lab')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'validation_lab'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
              <span>Testlab &amp; Benchmark</span>
            </button>

            <button
              id="tab-btn-research-search"
              onClick={() => onSelectTab('research_search')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'research_search'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span>Forskningssøk &amp; PICO</span>
            </button>

            <button
              id="tab-btn-thesis-output"
              onClick={() => onSelectTab('thesis_output')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'thesis_output'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Oppgaveskriving &amp; Utkast</span>
            </button>

            <button
              id="tab-btn-meta-research"
              onClick={() => onSelectTab('meta_research')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'meta_research'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              <span>Meta-Research &amp; Integritet</span>
            </button>
          </nav>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 flex-shrink-0">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Zero-Telemetry &bull; GDPR Sikret</span>
          </div>
        </div>
      )}
    </header>
  );
};
