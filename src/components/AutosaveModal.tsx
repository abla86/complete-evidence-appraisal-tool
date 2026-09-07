import React, { useEffect, useState } from 'react';
import { Clock, Download, HardDrive, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { AutosaveService, SnapshotEntry, AutosaveStatus } from '../services/autosaveService';
import { ArticleAppraisal } from '../types';
import { useToast } from './Toast';

interface AutosaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: ArticleAppraisal[];
  onRestoreArticles: (articles: ArticleAppraisal[]) => void;
}

export const AutosaveModal: React.FC<AutosaveModalProps> = ({ isOpen, onClose, articles, onRestoreArticles }) => {
  const { showToast } = useToast();
  const [snapshots, setSnapshots] = useState<SnapshotEntry[]>([]);
  const [newSnapshotLabel, setNewSnapshotLabel] = useState('');
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>({ state: 'idle', lastSavedAt: null });

  useEffect(() => {
    if (isOpen) setSnapshots(AutosaveService.getSnapshots());
  }, [isOpen]);

  useEffect(() => { const unsubscribe = AutosaveService.subscribe(setAutosaveStatus); return () => { unsubscribe(); }; }, []);

  if (!isOpen) return null;

  const handleCreateManualSnapshot = () => {
    const label = newSnapshotLabel.trim() || `Forsker-snapshot (${articles.length} artikler)`;
    const created = AutosaveService.createSnapshot(articles, label, true);
    setSnapshots(prev => [created, ...prev]);
    setNewSnapshotLabel('');
    showToast(`Snapshot opprettet: "${label}"`, 'success');
  };

  const handleRestore = (snapshot: SnapshotEntry) => {
    const restored = AutosaveService.restoreSnapshot(snapshot.id);
    if (!restored) return showToast('Kunne ikke gjenopprette snapshot', 'error');
    onRestoreArticles(restored);
    showToast(`Gjenopprettet ${restored.length} artikler.`, 'success');
    onClose();
  };

  const handleExportBackup = () => {
    const blob = new Blob([AutosaveService.exportVaultJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `forskningshvelv_backup_${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleClearVault = () => {
    AutosaveService.clearArticleVault();
    setSnapshots([]);
    onRestoreArticles([]);
    showToast('Lokal buffer tømt.', 'success');
  };

  const handleSaveNow = () => {
    AutosaveService.saveArticles(articles, true);
    showToast('Lokal lagring behandlet.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        <header className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HardDrive className="w-5 h-5" />
            <div><h3 className="text-lg font-bold">Autolagring & gjenopprettingspunkter</h3><p className="text-xs text-slate-300">Lokal persistens er kontrollert av personverninnstilling.</p></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Lukk"><X className="w-5 h-5" /></button>
        </header>
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div><strong className="text-sm">Status: {autosaveStatus.state}</strong>{autosaveStatus.lastSavedAt && <p>Sist lagret: {autosaveStatus.lastSavedAt.toLocaleString('no-NO')}</p>}</div>
            <button type="button" onClick={handleSaveNow} className="px-3 py-2 bg-slate-800 text-white rounded-xl flex items-center gap-2"><Save className="w-4 h-4" />Lagre</button>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
            <p className="text-amber-900">Tøm eventuell lokal buffer før ny import.</p>
            <button type="button" onClick={handleClearVault} className="px-3 py-2 bg-amber-700 text-white rounded-xl flex items-center gap-2"><Trash2 className="w-4 h-4" />Tøm</button>
          </div>
          <section className="space-y-2">
            <label className="font-bold block">Nytt snapshot</label>
            <div className="flex gap-2">
              <input value={newSnapshotLabel} onChange={e => setNewSnapshotLabel(e.target.value)} className="flex-1 p-2 border rounded-xl" placeholder="Beskrivelse" />
              <button type="button" onClick={handleCreateManualSnapshot} className="px-4 py-2 bg-slate-800 text-white rounded-xl flex items-center gap-2"><Plus className="w-4 h-4" />Lagre</button>
            </div>
          </section>
          <section className="space-y-3">
            <div className="flex items-center justify-between"><h4 className="font-bold flex items-center gap-2"><Clock className="w-4 h-4" />Snapshots ({snapshots.length})</h4><button type="button" onClick={handleExportBackup} className="flex items-center gap-1 text-teal-800"><Download className="w-4 h-4" />JSON-backup</button></div>
            {snapshots.length === 0 ? <div className="p-6 bg-slate-50 border rounded-xl text-center">Ingen snapshots.</div> : snapshots.map(snapshot => (
              <div key={snapshot.id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
                <div><strong>{snapshot.label}</strong><p>{snapshot.formattedTime} · {snapshot.articleCount} artikler</p></div>
                <button type="button" onClick={() => handleRestore(snapshot)} className="px-3 py-1.5 border rounded-lg flex items-center gap-1"><RotateCcw className="w-4 h-4" />Gjenopprett</button>
              </div>
            ))}
          </section>
        </div>
        <footer className="p-4 bg-slate-50 border-t flex justify-end"><button type="button" onClick={onClose} className="px-5 py-2 bg-slate-200 rounded-xl">Lukk</button></footer>
      </div>
    </div>
  );
};
