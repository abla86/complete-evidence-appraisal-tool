import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Hash, 
  Search,
  Filter
} from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditTrailCardProps {
  logs: AuditLogEntry[];
  sessionId: string;
}

export const AuditTrailCard: React.FC<AuditTrailCardProps> = ({ logs, sessionId }) => {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.hash.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAgent = agentFilter === 'ALL' || log.agentName === agentFilter;
    return matchesSearch && matchesAgent;
  });

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `EvidenceOps-AuditLog-${sessionId}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const uniqueAgents = Array.from(new Set(logs.map(l => l.agentName)));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-slate-100">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 rounded uppercase font-mono">
              Audit Engine &bull; SHA-256
            </span>
            <span className="text-xs text-slate-400">Total hendelser: {logs.length}</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            Uforanderlig Revisjonsspor (Audit Trail)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Fullstendig sporbarhet for alle agenthandlinger, eksterne verktøykall, verifikasjoner og menneskelige godkjenninger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyJson}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Kopiert JSON' : 'Kopier JSON'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Eksporter logg</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="my-4 flex flex-col sm:flex-row items-center gap-3 text-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Søk i handlinger, agenter, hashes eller detaljer..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">Alle agenter ({logs.length})</option>
            {uniqueAgents.map(agent => (
              <option key={agent} value={agent}>{agent}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="space-y-2 font-mono text-xs">
        {filteredLogs.map((log) => {
          let statusBadge = 'bg-slate-800 text-slate-300 border-slate-700';
          if (log.status === 'SUCCESS') statusBadge = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
          if (log.status === 'AWAITING_APPROVAL') statusBadge = 'bg-amber-950/80 text-amber-300 border-amber-700 animate-pulse';
          if (log.status === 'APPROVED') statusBadge = 'bg-emerald-900 text-emerald-200 border-emerald-600 font-bold';
          if (log.status === 'WARNING') statusBadge = 'bg-rose-950/80 text-rose-300 border-rose-800';

          return (
            <div
              key={log.id}
              className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] border font-sans font-semibold ${statusBadge}`}>
                    {log.status}
                  </span>

                  <span className="font-bold text-slate-200 font-sans">
                    {log.agentName}
                  </span>

                  <span className="text-emerald-400 font-semibold">
                    {log.action}
                  </span>

                  <span className="text-[11px] text-slate-500">
                    Trinn {log.stepNumber}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {log.executionTimeMs}ms
                  </span>

                  <span className="text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString('no-NO')}
                  </span>

                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-0.5">
                    <Hash className="w-2.5 h-2.5 text-slate-500" />
                    {log.hash}
                  </span>
                </div>
              </div>

              <p className="text-slate-300 font-sans text-xs leading-relaxed pl-1">
                {log.details}
              </p>

              {log.payloadSummary && (
                <div className="mt-2 text-[10px] text-slate-500 bg-slate-900/80 p-1.5 rounded border border-slate-850 overflow-x-auto">
                  <span className="text-slate-400">Payload: </span>
                  {log.payloadSummary}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
