import { generateId } from '../utils/id';
import { ArticleAppraisal } from '../types';

export interface SnapshotEntry { id: string; timestamp: string; formattedTime: string; articleCount: number; label: string; isManual?: boolean; data: ArticleAppraisal[]; }
export interface AutosaveStatus { state: 'idle' | 'saving' | 'saved' | 'error' | 'restored'; lastSavedAt: Date | null; message?: string; }

const ENABLED = typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_LOCAL_RESEARCH_PERSISTENCE === 'true';
const STORAGE_KEY_ARTICLES = 'evidence_appraisal_articles_vault_v2';
const STORAGE_KEY_SNAPSHOTS = 'evidence_appraisal_snapshots_vault_v2';
const STORAGE_KEY_DRAFT_PREFIX = 'evidence_appraisal_draft_';
const MAX_SNAPSHOTS = 25;
type StatusListener = (status: AutosaveStatus) => void;

class AutosaveManager {
  private listeners = new Set<StatusListener>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentStatus: AutosaveStatus = { state: 'idle', lastSavedAt: null, message: 'Klar' };

  constructor() {
    if (!ENABLED || typeof localStorage === 'undefined') return;
    const lastSaved = localStorage.getItem(`${STORAGE_KEY_ARTICLES}_last_saved`);
    if (lastSaved) this.currentStatus = { state: 'saved', lastSavedAt: new Date(lastSaved), message: 'Tidligere lagring funnet' };
  }

  subscribe(listener: StatusListener) { this.listeners.add(listener); listener(this.currentStatus); return () => this.listeners.delete(listener); }
  private notify(status: Partial<AutosaveStatus>) { this.currentStatus = { ...this.currentStatus, ...status }; this.listeners.forEach(listener => listener(this.currentStatus)); }

  loadArticles(fallback: ArticleAppraisal[] = []) {
    if (!ENABLED || typeof localStorage === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ARTICLES);
      if (!raw) return fallback;
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed as ArticleAppraisal[] : fallback;
    } catch { return fallback; }
  }

  clearArticleVault() {
    if (!ENABLED || typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY_ARTICLES);
      localStorage.removeItem(`${STORAGE_KEY_ARTICLES}_last_saved`);
      this.notify({ state: 'idle', lastSavedAt: null, message: 'Lokal buffer tømt' });
    } catch { /* best effort */ }
  }

  saveArticles(articles: ArticleAppraisal[], immediate = false) {
    if (!ENABLED || typeof localStorage === 'undefined') {
      this.notify({ state: 'idle', message: 'Lokal persistens er deaktivert.' });
      return;
    }
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    const performSave = () => {
      try {
        localStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(articles));
        const now = new Date();
        localStorage.setItem(`${STORAGE_KEY_ARTICLES}_last_saved`, now.toISOString());
        this.createAutoSnapshot(articles);
        this.notify({ state: 'saved', lastSavedAt: now, message: `Sist lagret ${now.toLocaleTimeString('no-NO')}` });
      } catch (error) {
        this.notify({ state: 'error', message: error instanceof Error ? error.message : 'Lagringsfeil' });
      }
    };
    if (immediate) performSave(); else this.debounceTimer = setTimeout(performSave, 400);
  }

  createSnapshot(articles: ArticleAppraisal[], label: string, isManual = true): SnapshotEntry {
    const entry: SnapshotEntry = { id: `snap-${generateId()}`, timestamp: new Date().toISOString(), formattedTime: new Date().toLocaleString('no-NO'), articleCount: articles.length, label: label.trim() || 'Snapshot', isManual, data: structuredClone(articles) };
    if (ENABLED && typeof localStorage !== 'undefined') {
      try {
        const existing = this.getSnapshots();
        localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify([entry, ...existing].slice(0, MAX_SNAPSHOTS)));
      } catch { /* best effort */ }
    }
    return entry;
  }

  private createAutoSnapshot(articles: ArticleAppraisal[]) {
    if (!ENABLED) return;
    const last = this.getSnapshots()[0];
    if (!last || Date.now() - new Date(last.timestamp).getTime() > 120000) this.createSnapshot(articles, `Automatisk backup (${articles.length} artikler)`, false);
  }

  getSnapshots(): SnapshotEntry[] {
    if (!ENABLED || typeof localStorage === 'undefined') return [];
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY_SNAPSHOTS) || '[]');
      return Array.isArray(parsed) ? parsed as SnapshotEntry[] : [];
    } catch { return []; }
  }

  restoreSnapshot(snapshotId: string) {
    const match = this.getSnapshots().find(snapshot => snapshot.id === snapshotId);
    if (!match || !Array.isArray(match.data)) return null;
    this.saveArticles(match.data, true);
    this.notify({ state: 'restored', lastSavedAt: new Date(), message: `Gjenopprettet ${match.formattedTime}` });
    return match.data;
  }

  saveFormDraft(formId: string, data: unknown) {
    if (!ENABLED || typeof localStorage === 'undefined') return;
    try { localStorage.setItem(`${STORAGE_KEY_DRAFT_PREFIX}${formId}`, JSON.stringify({ timestamp: new Date().toISOString(), data })); } catch { /* best effort */ }
  }

  loadFormDraft<T>(formId: string): T | null {
    if (!ENABLED || typeof localStorage === 'undefined') return null;
    try { const parsed: unknown = JSON.parse(localStorage.getItem(`${STORAGE_KEY_DRAFT_PREFIX}${formId}`) || 'null'); return (parsed && typeof parsed === 'object' && 'data' in parsed) ? (parsed as {data: T}).data : null; } catch { return null; }
  }

  clearFormDraft(formId: string) {
    if (!ENABLED || typeof localStorage === 'undefined') return;
    try { localStorage.removeItem(`${STORAGE_KEY_DRAFT_PREFIX}${formId}`); } catch { /* best effort */ }
  }

  exportVaultJson() {
    return JSON.stringify({ version: '2.0', exportedAt: new Date().toISOString(), vaultTitle: 'Evidence Appraisal & Meta-Research Vault Backup', articles: this.loadArticles([]), snapshots: this.getSnapshots() }, null, 2);
  }
}
export const AutosaveService = new AutosaveManager();
