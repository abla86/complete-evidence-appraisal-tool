import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Clock, 
  RotateCcw, 
  Download, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Plus, 
  HardDrive, 
  Trash2,
  FileCheck,
  X
} from 'lucide-react';
import { AutosaveService, SnapshotEntry, AutosaveStatus } from '../services/autosaveService';
import { ArticleAppraisal } from '../types';
import { useToast } from './Toast';

interface AutosaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: ArticleAppraisal[];
  onRestoreArticles: (articles: ArticleAppraisal[]) => void;
}

export const AutosaveModal: React.FC<AutosaveModalProps> = ({
  isOpen,
  onClose,
  articles,
  onRestoreArticles
}) => {
  const { showToast } = useToast();
  const [snapshots, setSnapshots] = useState<SnapshotEntry[]>([]);
  const [newSnapshotLabel, setNewSnapshotLabel] = useState<string>('');
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>({
    state: 'idle',
    lastSavedAt: null
  });

  useEffect(() => {
    if (isOpen) {
      setSnapshots(AutosaveService.getSnapshots());
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = AutosaveService.subscribe(status => {
      setAutosaveStatus(status);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleCreateManualSnapshot = () => {
    const label = newSnapshotLabel.trim() || `Forsker-snapshot (${articles.length} artikler)`;
    const created = AutosaveService.createSnapshot(articles, label, true);
    setSnapshots(prev => [created, ...prev]);
    setNewSnapshotLabel('');
    showToast(`Snapshot opprettet: "${label}"`, 'success');
  };

  const handleRestore = (snap: SnapshotEntry) => {
    const restored = AutosaveService.restoreSnapshot(snap.id);
    if (restored) {
      onRestoreArticles(restored);
      showToast(`Gjenopprettet ${restored.length} artikler fra ${snap.formattedTime}!`, 'success');
      onClose();
    } else {
      showToast('Kunne ikke gjenopprette snapshot', 'error');
    }
  };

  const handleExportBackup = () => {
    const json = AutosaveService.exportVaultJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forskningshvelv_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Komplett hvelv-backup lastet ned!', 'success');
  };

  const handleClearVault = () => { AutosaveService.clearArticleVault(); onRestoreArticles([]); setSnapshots([]); showToast('Lokal artikkelbuffer er tømt. Nye metadata kan nå overskrive gammel cache.', 'success'); };

  const handleSaveNow = () => {
    AutosaveService.saveArticles(articles, true);
    showToast('Alle artikler og vurderinger er lagret til hvelvet!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-800 flex items-center justify-center text-teal-100">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif">Autolagring & Gjenopprettingspunkter</h3>
              <p className="text-xs text-slate-300">
                Sikker lokal lagring, kontinuerlig versjonering og krasj-gjenoppretting
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
          {/* Status Box */}
          <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <strong className="text-teal-950 text-sm font-semibold">Autolagring er Aktiv</strong>
              </div>
              <p className="text-slate-600">
                Alle endringer i skjemaer, søk, vurderinger og synteser lagres kontinuerlig i nettleserens sikre datavault.
              </p>
              {autosaveStatus.lastSavedAt && (
                <p className="text-[11px] text-teal-800 font-mono">
                  Sist lagret: {autosaveStatus.lastSavedAt.toLocaleString('no-NO')}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleSaveNow}
              className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>Lagre nå</span>
            </button>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3"><div><strong className="text-amber-950">Stale eller feilaktige metadata?</strong><p className="text-amber-900 mt-1">Tøm lokal buffer før ny import dersom gammel cache hindrer overskriving.</p></div><button type="button" onClick={handleClearVault} className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-bold shrink-0 flex items-center gap-1.5"><Trash2 className="w-4 h-4" />Nullstill / Tøm lokal buffer</button></div>

          {/* Create Manual Snapshot */
          <div className="space-y-2">
            <label className="font-bold text-slate-900 block text-xs">
              Opprett nytt manuelt gjenopprettingspunkt (Snapshot):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSnapshotLabel}
                onChange={(e) => setNewSnapshotLabel(e.target.value)}
                placeholder="F.eks. 'Før ferdigstilling av JBI-artikkel 2'..."
                className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-teal-600"
              />
              <button
                type="button"
                onClick={handleCreateManualSnapshot}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Lagre Snapshot</span>
              </button>
            </div>
          </div>

          {/* Snapshots List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                Tilgjengelige versjoner og gjenopprettingspunkter ({snapshots.length})
              </h4>
              <button
                type="button"
                onClick={handleExportBackup}
                className="text-teal-800 hover:underline font-bold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Last ned JSON-backup</span>
              </button>
            </div>

            {snapshots.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500">
                Ingen historiske snapshots opprettet ennå. Systemet genererer automatiske backups ved endring.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {snapshots.map(snap => (
                  <div
                    key={snap.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-semibold">{snap.label}</strong>
                        {snap.isManual ? (
                          <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-bold">
                            Manuell
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                            Auto
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {snap.formattedTime} • {snap.articleCount} artikler
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRestore(snap)}
                      className="px-3 py-1.5 bg-white hover:bg-teal-50 hover:text-teal-900 border border-slate-300 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 transition-all shadow-2xs shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Gjenopprett</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};
