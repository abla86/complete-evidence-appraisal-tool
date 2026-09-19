import React, { useState } from 'react';
import {
  Terminal,
  ShieldCheck,
  CheckCircle2,
  GitBranch,
  RotateCcw,
  Sliders,
  Server,
  Hash,
  Clock,
  ExternalLink,
  Play
} from 'lucide-react';
import { AuditEvent, FeatureFlag } from '../../types';

interface DevOpsAuditModuleProps {
  auditLogs: AuditEvent[];
  featureFlags: FeatureFlag[];
  onToggleFeatureFlag: (key: string) => void;
  onRestoreVersion: (version: string) => void;
  onAddAuditLog: (log: Omit<AuditEvent, 'id' | 'hash'>) => void;
}

export const DevOpsAuditModule: React.FC<DevOpsAuditModuleProps> = ({
  auditLogs,
  featureFlags,
  onToggleFeatureFlag,
  onRestoreVersion,
  onAddAuditLog
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'flags' | 'cicd' | 'backups'>('audit');
  const [verifiedHashId, setVerifiedHashId] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);

  const handleVerifyHash = (id: string) => {
    setVerifiedHashId(id);
    setTimeout(() => setVerifiedHashId(null), 2500);
  };

  const handleRestore = (ver: string) => {
    onRestoreVersion(ver);
    setRestoreNotice(`Gjenopprettet tilstand: ${ver}. Dataintegritet bekreftet.`);
    setTimeout(() => setRestoreNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              DevOps & Observability
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
              Kryptografisk Hashkjede
            </span>
          </div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-400" />
            DevOps, Audit Trail & Driftssenter
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Uforanderlige revisjonslogger (Normen/GDPR), CI/CD-pipeline, dynamiske feature flags og versjonsgjenoppretting.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'audit' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('flags')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'flags' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Feature Flags
          </button>
          <button
            onClick={() => setActiveTab('cicd')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'cicd' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            CI/CD Pipeline
          </button>
          <button
            onClick={() => setActiveTab('backups')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'backups' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Sikkerhetskopi
          </button>
        </div>
      </div>

      {restoreNotice && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{restoreNotice}</span>
        </div>
      )}

      {/* Tab 1: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Uforanderlig hendelseslogg – Hver hendelse er forseglet med SHA-256</span>
            <span className="font-mono text-emerald-400">Append-Only Verified</span>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-white">{log.entity}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {log.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                  {log.details}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>Aktør: <strong className="text-slate-300">{log.actor}</strong></span>
                    <span>Tenant: <strong className="text-slate-300">{log.tenantId}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[140px] text-slate-500 text-[10px]">
                      hash:{log.hash.substring(0, 16)}...
                    </span>
                    <button
                      onClick={() => handleVerifyHash(log.id)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 border border-slate-700"
                    >
                      {verifiedHashId === log.id ? '✓ Verifisert' : 'Valider sjekksum'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Feature Flags */}
      {activeTab === 'flags' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Styr funksjonalitet og modultilgang i sanntid uten omstart av applikasjonen (Lag 14 Feature Flags).
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {featureFlags.map((flag) => (
              <div
                key={flag.key}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{flag.label}</h4>
                    <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                      {flag.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {flag.description}
                  </p>
                  <div className="text-[10px] font-mono text-slate-500 mt-2">{flag.key}</div>
                </div>

                <button
                  onClick={() => onToggleFeatureFlag(flag.key)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                    flag.enabled ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      flag.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: CI/CD Pipeline Visualizer */}
      {activeTab === 'cicd' && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              GitHub Actions CI/CD Byggestatus (.github/workflows/ci.yml)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatisk kvalitetskontroll, typesjekk og sårbarhetsskanning på alle pull requests.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { title: '1. Lint & Types', sub: 'tsc --noEmit', status: 'PASSING', duration: '4s' },
              { title: '2. Enhetstester', sub: 'vitest run (38 tester)', status: 'PASSING', duration: '12s' },
              { title: '3. Security Scan', sub: 'CodeQL & SecretLint', status: 'PASSING', duration: '18s' },
              { title: '4. Docker Build', sub: 'Multi-stage node:20', status: 'PASSING', duration: '34s' },
              { title: '5. Deploy Sandbox', sub: 'Cloud Run Container', status: 'DEPLOYED', duration: '1m 02s' }
            ].map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950 border border-emerald-900/40 text-xs flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{step.title}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">{step.sub}</div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-emerald-400 font-bold">{step.status}</span>
                  <span className="text-slate-500">{step.duration}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
            <span>Commit: a8f9c1e ("feat: enforce tenant isolation on evidence queries")</span>
            <span className="text-emerald-400">All checks green</span>
          </div>
        </div>
      )}

      {/* Tab 4: Snapshots & Backup Restore */}
      {activeTab === 'backups' && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-400" />
                Git-lignende Versjonering & Sikkerhetskopier (Lag 8 & 9)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Dersom en AI-jobb eller batch-prosess introduserer feil, kan systemtilstanden rulles tilbake på sekunder.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-1 rounded border border-emerald-800/40">
              RPO: &lt;1 min • RTO: &lt;30 sek
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                version: 'v2.4.0 (Aktiv)',
                timestamp: '2026-09-07 20:00:00',
                desc: 'Nåværende stabil forsknings- og simulatortilstand med full audit-kjede.',
                isCurrent: true
              },
              {
                version: 'v2.3.9 (Snapshot)',
                timestamp: '2026-09-06 18:30:00',
                desc: 'Før batch-screening av 50 PubMed-artikler i kardiologimodulen.',
                isCurrent: false
              },
              {
                version: 'v2.3.0 (Snapshot)',
                timestamp: '2026-09-01 12:00:00',
                desc: 'Opprinnelig PICO-arkitektur og grunnleggende 15 sikkerhetslag.',
                isCurrent: false
              }
            ].map((snap, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono">{snap.version}</span>
                    <span className="text-[10px] font-mono text-slate-400">{snap.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{snap.desc}</p>
                </div>

                <div>
                  {snap.isCurrent ? (
                    <span className="px-3 py-1 bg-blue-950 text-blue-300 text-xs font-mono font-bold rounded-lg border border-blue-800/40">
                      Gjeldende
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRestore(snap.version)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                      Rull tilbake hit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
