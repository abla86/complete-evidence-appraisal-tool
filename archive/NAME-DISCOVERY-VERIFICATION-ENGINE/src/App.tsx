import { useState, useEffect, useCallback } from 'react';
import {
  CandidateName,
  MarketJurisdiction,
  NamingBrief,
  RiskLevel,
  VerificationDossier,
} from './types/index.js';
import { Header } from './components/Header.js';
import { InstantCheck } from './components/InstantCheck.js';
import { BriefSummary } from './components/BriefSummary.js';
import { PipelineProgress } from './components/PipelineProgress.js';
import { CandidateCard } from './components/CandidateCard.js';
import { EvidenceDossierModal } from './components/EvidenceDossierModal.js';
import { NewBriefModal } from './components/NewBriefModal.js';
import { WatchlistModal } from './components/WatchlistModal.js';
import { AuditLogModal } from './components/AuditLogModal.js';
import { ReportModal } from './components/ReportModal.js';
import {
  Filter,
  ArrowUpDown,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  // Projects State
  const [projects, setProjects] = useState<NamingBrief[]>([]);
  const [activeProject, setActiveProject] = useState<NamingBrief | null>(null);
  const [candidates, setCandidates] = useState<CandidateName[]>([]);

  // Watchlist State
  const [watchlist, setWatchlist] = useState<CandidateName[]>([]);

  // UI Processing States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInstantVerifying, setIsInstantVerifying] = useState(false);
  const [processingCandidateId, setProcessingCandidateId] = useState<string | null>(null);

  // Modals State
  const [isNewBriefOpen, setIsNewBriefOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Dossier View State
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateName | null>(null);
  const [currentDossier, setCurrentDossier] = useState<VerificationDossier | null>(null);
  const [reportMarkdown, setReportMarkdown] = useState<string>('');

  // Filtering & Sorting
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskLevel | 'WATCHED'>('ALL');
  const [sortBy, setSortBy] = useState<'risk' | 'length' | 'date'>('risk');

  // Load Projects on Initial Mount
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = (await res.json()) as NamingBrief[];
        setProjects(data);
        if (data.length > 0 && !activeProject) {
          setActiveProject(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, [activeProject]);

  // Load Candidates for Active Project
  const fetchCandidates = useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/candidates`);
      if (res.ok) {
        const data = (await res.json()) as CandidateName[];
        setCandidates(data);
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
    }
  }, []);

  // Load Watchlist
  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch('/api/watchlist');
      if (res.ok) {
        const data = (await res.json()) as CandidateName[];
        setWatchlist(data);
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchWatchlist();
  }, [fetchProjects, fetchWatchlist]);

  useEffect(() => {
    if (activeProject?.id) {
      fetchCandidates(activeProject.id);
    }
  }, [activeProject, fetchCandidates]);

  // Handle Project Creation
  const handleCreateProject = async (brief: NamingBrief) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
      });

      if (res.ok) {
        const created = (await res.json()) as NamingBrief;
        setProjects((prev) => [created, ...prev]);
        setActiveProject(created);

        // Run initial generation pipeline automatically
        const genRes = await fetch(`/api/projects/${created.id}/generate`, { method: 'POST' });
        if (genRes.ok) {
          const shortlist = (await genRes.json()) as CandidateName[];
          setCandidates(shortlist);
        }
      }
    } catch (err) {
      console.error('Error creating project:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Run Generation Pipeline for Active Project
  const handleRunPipeline = async () => {
    if (!activeProject?.id || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/projects/${activeProject.id}/generate`, { method: 'POST' });
      if (res.ok) {
        const shortlist = (await res.json()) as CandidateName[];
        setCandidates(shortlist);
      }
    } catch (err) {
      console.error('Generation pipeline failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Ad-Hoc Instant Verification
  const handleInstantVerify = async (name: string, market: MarketJurisdiction) => {
    setIsInstantVerifying(true);
    try {
      const res = await fetch('/api/instant-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          market,
          industry: activeProject?.industry || 'Technology',
        }),
      });

      if (res.ok) {
        const dossier = (await res.json()) as VerificationDossier;
        setSelectedCandidate(dossier.candidate);
        setCurrentDossier(dossier);
        // Refresh project list if new candidates added
        if (activeProject?.id) fetchCandidates(activeProject.id);
      }
    } catch (err) {
      console.error('Instant verification failed:', err);
    } finally {
      setIsInstantVerifying(false);
    }
  };

  // Inspect Candidate Dossier
  const handleInspectDossier = async (candidate: CandidateName) => {
    setSelectedCandidate(candidate);
    try {
      const res = await fetch(`/api/candidates/${candidate.id}/dossier`);
      if (res.ok) {
        const dossier = (await res.json()) as VerificationDossier;
        setCurrentDossier(dossier);
      }
    } catch (err) {
      console.error('Failed to load candidate dossier:', err);
    }
  };

  // Deep Verify Candidate
  const handleDeepVerify = async (candidate: CandidateName) => {
    setProcessingCandidateId(candidate.id);
    try {
      const res = await fetch(`/api/candidates/${candidate.id}/deep-verify`, { method: 'POST' });
      if (res.ok) {
        const dossier = (await res.json()) as VerificationDossier;
        setCurrentDossier(dossier);
        setSelectedCandidate(dossier.candidate);
        // Update in candidate list
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidate.id ? dossier.candidate : c))
        );
        fetchWatchlist();
      }
    } catch (err) {
      console.error('Deep verify failed:', err);
    } finally {
      setProcessingCandidateId(null);
    }
  };

  // Fresh Recheck Candidate
  const handleRecheck = async (candidate: CandidateName) => {
    setProcessingCandidateId(candidate.id);
    try {
      const res = await fetch(`/api/candidates/${candidate.id}/recheck`, { method: 'POST' });
      if (res.ok) {
        const dossier = (await res.json()) as VerificationDossier;
        setCurrentDossier(dossier);
        setSelectedCandidate(dossier.candidate);
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidate.id ? dossier.candidate : c))
        );
        fetchWatchlist();
      }
    } catch (err) {
      console.error('Recheck failed:', err);
    } finally {
      setProcessingCandidateId(null);
    }
  };

  // Toggle Watch Candidate
  const handleToggleWatch = async (candidate: CandidateName) => {
    try {
      const res = await fetch(`/api/candidates/${candidate.id}/watch`, { method: 'POST' });
      if (res.ok) {
        const data = (await res.json()) as { isWatched: boolean };
        const updated = { ...candidate, isWatched: data.isWatched };
        setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? updated : c)));
        if (selectedCandidate?.id === candidate.id) {
          setSelectedCandidate(updated);
        }
        fetchWatchlist();
      }
    } catch (err) {
      console.error('Failed to toggle watch status:', err);
    }
  };

  // Export Full Markdown Report
  const handleExportReport = async (candidate: CandidateName) => {
    try {
      const res = await fetch(`/api/candidates/${candidate.id}/report`);
      if (res.ok) {
        const data = (await res.json()) as { reportMarkdown: string };
        setReportMarkdown(data.reportMarkdown);
        setIsReportOpen(true);
      }
    } catch (err) {
      console.error('Failed to load markdown report:', err);
    }
  };

  // Filter & Sort Candidates
  const filteredCandidates = candidates.filter((c) => {
    if (riskFilter === 'WATCHED') return c.isWatched;
    if (riskFilter !== 'ALL') return c.riskLevel === riskFilter;
    return true;
  });

  filteredCandidates.sort((a, b) => {
    if (sortBy === 'risk') return a.riskScore - b.riskScore;
    if (sortBy === 'length') return a.name.length - b.name.length;
    return new Date(b.verificationTimestamp).getTime() - new Date(a.verificationTimestamp).getTime();
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Header
        projects={projects}
        activeProject={activeProject}
        onSelectProject={(proj) => setActiveProject(proj)}
        onOpenNewBrief={() => setIsNewBriefOpen(true)}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
        watchlistCount={watchlist.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Instant Verification Bar */}
        <InstantCheck
          onVerify={handleInstantVerify}
          isVerifying={isInstantVerifying}
        />

        {/* Active Project Brief Summary */}
        {activeProject && (
          <BriefSummary
            brief={activeProject}
            onGenerate={handleRunPipeline}
            isGenerating={isGenerating}
            onEditBrief={() => setIsNewBriefOpen(true)}
          />
        )}

        {/* Live Multi-Stage Verification Pipeline Progress */}
        <PipelineProgress isRunning={isGenerating} />

        {/* Shortlist Section Header & Filter Controls */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Verified Candidate Shortlist
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold">
              {filteredCandidates.length} Candidates
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label="Filter by Risk Classification"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
                className="bg-transparent focus:outline-none text-slate-200"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="GREEN">Preliminary Low-Conflict (GREEN)</option>
                <option value="YELLOW">Potential Conflict (YELLOW)</option>
                <option value="ORANGE">Significant Conflict (ORANGE)</option>
                <option value="RED">Strong Conflict (RED)</option>
                <option value="BLACK">Reject (BLACK)</option>
                <option value="WATCHED">Watched Only</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label="Sort Candidates by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent focus:outline-none text-slate-200"
              >
                <option value="risk">Lowest Risk Score</option>
                <option value="length">Brevity (Shortest)</option>
                <option value="date">Most Recent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Candidate Cards Grid */}
        {filteredCandidates.length === 0 && !isGenerating ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">
              No Candidates Screened Yet
            </h3>
            <p className="text-sm max-w-md mx-auto mb-5 leading-relaxed">
              Click "Run Discovery Pipeline" to generate a rich candidate pool, query corporate registries, trademarks, domains, and software stores.
            </p>
            <button
              onClick={handleRunPipeline}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition shadow-sm"
            >
              <span>Launch Discovery Engine</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCandidates.map((cand, idx) => (
              <CandidateCard
                key={cand.id}
                candidate={cand}
                rank={idx + 1}
                onInspectDossier={handleInspectDossier}
                onDeepVerify={handleDeepVerify}
                onRecheck={handleRecheck}
                onToggleWatch={handleToggleWatch}
                isProcessing={processingCandidateId === cand.id}
              />
            ))}
          </div>
        )}

        {/* Global Legal Banner */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300 block mb-0.5">
              Authoritative Verification Standards
            </span>
            Screening is conducted directly against Brønnøysundregistrene, EUIPO, WIPO, USPTO, DNS/RDAP records, Apple App Store, npm, PyPI, and GitHub. "Preliminary low-conflict candidate" indicates no direct collision in screened databases, but does not guarantee legal trademark availability or registrability.
          </div>
        </div>
      </main>

      {/* MODALS */}
      {/* 1. Evidence Dossier Modal */}
      <EvidenceDossierModal
        candidate={selectedCandidate}
        dossier={currentDossier}
        isOpen={!!selectedCandidate && !!currentDossier}
        onClose={() => {
          setSelectedCandidate(null);
          setCurrentDossier(null);
        }}
        onDeepVerify={handleDeepVerify}
        onRecheck={handleRecheck}
        onExportReport={handleExportReport}
        isProcessing={!!processingCandidateId}
      />

      {/* 2. New Brief Modal */}
      <NewBriefModal
        isOpen={isNewBriefOpen}
        onClose={() => setIsNewBriefOpen(false)}
        onCreate={handleCreateProject}
        isCreating={isGenerating}
      />

      {/* 3. Watchlist Modal */}
      <WatchlistModal
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlist={watchlist}
        onInspect={handleInspectDossier}
        onRecheck={handleRecheck}
        onToggleWatch={handleToggleWatch}
      />

      {/* 4. Security Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
      />

      {/* 5. Markdown Report Modal */}
      <ReportModal
        candidate={selectedCandidate}
        reportMarkdown={reportMarkdown}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}
