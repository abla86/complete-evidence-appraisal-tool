import { useState, useEffect } from 'react';
import { X, ShieldAlert, History, RefreshCw } from 'lucide-react';
import { AuditLogEntry } from '../types/index.js';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogModal({ isOpen, onClose }: AuditLogModalProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl my-auto shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Security & Verification Audit Log
              </h3>
              <p className="text-xs text-slate-400">
                Authoritative chronological record of security-sensitive operations and provider inquiries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              title="Refresh log"
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto space-y-2 flex-1 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-sans text-sm">
              No audit records logged yet.
            </div>
          ) : (
            logs.map((entry) => (
              <div
                key={entry.id}
                className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold uppercase text-[10px]">
                      {entry.action}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      actor: {entry.actor}
                    </span>
                  </div>
                  <pre className="text-slate-300 font-sans text-xs whitespace-pre-wrap">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                </div>
                <span className="text-slate-500 text-[10px] whitespace-nowrap">
                  {new Date(entry.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
