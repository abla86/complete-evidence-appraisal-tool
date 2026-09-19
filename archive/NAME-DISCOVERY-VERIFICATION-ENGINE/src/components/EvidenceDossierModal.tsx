import { useState } from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  Bookmark,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  Layers,
  Code2,
  Globe,
  FileSpreadsheet,
} from 'lucide-react';
import { CandidateName, VerificationDossier } from '../types/index.js';

interface EvidenceDossierModalProps {
  candidate: CandidateName | null;
  dossier: VerificationDossier | null;
  isOpen: boolean;
  onClose: () => void;
  onDeepVerify: (cand: CandidateName) => void;
  onRecheck: (cand: CandidateName) => void;
  onExportReport: (cand: CandidateName) => void;
  isProcessing: boolean;
}

export function EvidenceDossierModal({
  candidate,
  dossier,
  isOpen,
  onClose,
  onDeepVerify,
  onRecheck,
  onExportReport,
  isProcessing,
}: EvidenceDossierModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'trademarks' | 'domains' | 'software' | 'similarity' | 'sources'>('overview');

  if (!isOpen || !candidate) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl my-auto shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Candidate Dossier
              </span>
              <span className="text-xs text-slate-400">
                Strategy: {candidate.namingStrategy}
              </span>
              <span className="text-xs text-slate-400">
                Verified: {new Date(candidate.verificationTimestamp).toLocaleString()}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              {candidate.name}
              <span className="text-sm font-normal text-slate-400 font-mono">
                /{candidate.pronunciation}/
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {candidate.whyFits}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExportReport(candidate)}
              title="Download full forensic Markdown report"
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Report</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-5 gap-4 overflow-x-auto bg-slate-900/50 scrollbar-none text-xs sm:text-sm">
          {[
            { id: 'overview', label: 'Risk & Executive Summary' },
            { id: 'companies', label: `Companies (${dossier?.companyMatches?.length || 0})` },
            { id: 'trademarks', label: `Trademarks (${dossier?.trademarkMatches?.length || 0})` },
            { id: 'domains', label: `Domains (${dossier?.domainResults?.length || 0})` },
            { id: 'software', label: `Software (${dossier?.softwareMatches?.length || 0})` },
            { id: 'similarity', label: `Similarity Matrix (${dossier?.similarityMatches?.length || 0})` },
            { id: 'sources', label: `Searched Queries (${dossier?.searchResults?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3 font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Risk Banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase text-slate-400 font-semibold">
                      Conflict Classification:
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                      {candidate.riskLevel} ({candidate.riskScore}/100 Risk Score)
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-200 mt-1">
                    {candidate.riskSummary}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRecheck(candidate)}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Recheck Now</span>
                  </button>

                  <button
                    onClick={() => onDeepVerify(candidate)}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1.5 rounded-lg transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Deep Verify</span>
                  </button>
                </div>
              </div>

              {/* Contributing Risk Factors */}
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Explainable Risk Factor Evaluation
                </h4>
                <div className="space-y-2">
                  {dossier?.risk?.factors?.map((factor, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono uppercase text-[10px] font-bold ${
                              factor.impact === 'critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : factor.impact === 'high'
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                : factor.impact === 'moderate'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {factor.impact}
                          </span>
                          <span className="font-semibold text-slate-200">
                            {factor.factor}
                          </span>
                        </div>
                        <p className="text-slate-400 mt-1 leading-relaxed">
                          {factor.detail}
                        </p>
                      </div>

                      {factor.sourceRef && (
                        <a
                          href={factor.sourceRef}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 p-1 hover:bg-slate-800 rounded transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal Notice */}
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-300/90 leading-relaxed flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-1">
                    Mandatory Legal Transparency Notice:
                  </strong>
                  Never treat preliminary low-conflict status as a legal guarantee of availability. This tool provides deterministic multi-source discovery and conflict screening. Official registration and trademark availability must be verified by licensed IP counsel.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPANIES */}
          {activeTab === 'companies' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Investigated against Brønnøysundregistrene (Norway) and Global Corporate Indexes</span>
                <span>Tier 1 Evidence</span>
              </div>

              {(!dossier?.companyMatches || dossier.companyMatches.length === 0) ? (
                <div className="text-center py-10 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  No direct matching company entities found in screened registry databases.
                </div>
              ) : (
                dossier.companyMatches.map((company, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">
                          {company.companyName}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {company.country}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                            company.status === 'Active'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {company.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Org.nr: {company.orgNumber || 'N/A'} • Industry: {company.industry || 'Commercial Enterprise'} • Similarity: {(company.similarityScore * 100).toFixed(0)}%
                      </p>
                    </div>

                    {company.url && (
                      <a
                        href={company.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                      >
                        <span>Official Record</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: TRADEMARKS */}
          {activeTab === 'trademarks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Official Trademark Portals: EUIPO (EU), WIPO (International), USPTO (USA), Patentstyret (Norway)</span>
                <span>Tier 1 Evidence</span>
              </div>

              {(!dossier?.trademarkMatches || dossier.trademarkMatches.length === 0) ? (
                <div className="text-center py-10 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  No direct trademark collisions detected in screened priority classes (Nice Classes 09, 35, 42).
                  <p className="text-xs text-slate-500 mt-1">
                    *Absence of automated match does not constitute legal clearance.
                  </p>
                </div>
              ) : (
                dossier.trademarkMatches.map((tm, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">
                          "{tm.markName}"
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {tm.jurisdiction}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {tm.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Owner: {tm.owner || 'Undisclosed'} • Classes: {tm.classes.join(', ')} • Similarity: {(tm.similarityScore * 100).toFixed(0)}%
                      </p>
                    </div>

                    {tm.url && (
                      <a
                        href={tm.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                      >
                        <span>Registry Search</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: DOMAINS */}
          {activeTab === 'domains' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Verified live via Cloudflare DNS over HTTPS & Verisign RDAP Protocol</span>
                <span>Tier 1 Evidence</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dossier?.domainResults?.map((dom, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-white text-sm">
                        {dom.domain}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                          dom.status === 'registered'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : dom.status === 'unregistered_likely'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {dom.status === 'registered'
                          ? 'OCCUPIED'
                          : dom.status === 'unregistered_likely'
                          ? 'PRELIMINARY UNREGISTERED'
                          : 'UNVERIFIABLE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {dom.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SOFTWARE & APPS */}
          {activeTab === 'software' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Registries: Apple App Store (iOS/macOS), npm Registry, PyPI, GitHub Repos</span>
                <span>Tier 1 & 2 Evidence</span>
              </div>

              {(!dossier?.softwareMatches || dossier.softwareMatches.length === 0) ? (
                <div className="text-center py-10 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  No published apps or packages matching this name on major software ecosystems.
                </div>
              ) : (
                dossier.softwareMatches.map((soft, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {soft.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase font-mono">
                          {soft.platform.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          v{soft.version || '1.0.0'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Developer: {soft.developer || 'N/A'} • Category: {soft.category || 'Software'} • Match: {soft.matchType}
                      </p>
                    </div>

                    {soft.url && (
                      <a
                        href={soft.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                      >
                        <span>View Product</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 6: SIMILARITY MATRIX */}
          {activeTab === 'similarity' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Deterministic algorithmic similarity comparisons (Levenshtein distance, Jaro-Winkler prefix weighting, 2-gram Dice coefficient, Soundex phonetic hashes).
              </p>

              {(!dossier?.similarityMatches || dossier.similarityMatches.length === 0) ? (
                <div className="text-center py-10 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  No high-similarity collisions against common industry brand marks.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dossier.similarityMatches.map((sim, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {sim.comparedName}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {sim.algorithm}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {sim.matchNature}
                        </p>
                      </div>
                      <span className="text-sm font-mono font-bold text-indigo-400">
                        {(sim.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SOURCES AUDIT */}
          {activeTab === 'sources' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Complete log of search queries, provider tiers, and endpoints executed during verification.
              </p>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {dossier?.searchResults?.map((sr, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                          Tier {sr.tier}
                        </span>
                        <span className="font-semibold text-slate-200">
                          {sr.sourceName}
                        </span>
                        <span className="text-slate-500 font-mono">
                          [{sr.matchType}]
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1 font-medium">
                        {sr.resultTitle}
                      </p>
                      <p className="text-slate-400 mt-0.5">
                        {sr.resultSnippet}
                      </p>
                    </div>

                    {sr.url && (
                      <a
                        href={sr.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-indigo-400 p-1 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
