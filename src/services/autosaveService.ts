/**
 * Autosave and Local Vault Persistence Service
 * 
 * Provides robust auto-saving, crash recovery, versioned snapshotting,
 * and state synchronization for researchers working with meta-research,
 * systematic reviews, and critical appraisals.
 */

import { ArticleAppraisal } from '../types';

export interface SnapshotEntry {
  id: string;
  timestamp: string;
  formattedTime: string;
  articleCount: number;
  label: string;
  isManual?: boolean;
  data: ArticleAppraisal[];
}

export interface AutosaveStatus {
  state: 'idle' | 'saving' | 'saved' | 'error' | 'restored';
  lastSavedAt: Date | null;
  message?: string;
}

const STORAGE_KEY_ARTICLES = 'evidence_appraisal_articles_vault_v2';
const STORAGE_KEY_SNAPSHOTS = 'evidence_appraisal_snapshots_vault_v2';
const STORAGE_KEY_DRAFT_PREFIX = 'evidence_appraisal_draft_';
const MAX_AUTO_SNAPSHOTS = 25;

type StatusListener = (status: AutosaveStatus) => void;

class AutosaveManager {
  private listeners: Set<StatusListener> = new Set();
  private debounceTimer: any = null;
  private currentStatus: AutosaveStatus = {
    state: 'idle',
    lastSavedAt: null,
    message: 'Klar'
  };

  constructor() {
    // Check if there is an existing saved timestamp
    const lastSaved = localStorage.getItem(`${STORAGE_KEY_ARTICLES}_last_saved`);
    if (lastSaved) {
      this.currentStatus.lastSavedAt = new Date(lastSaved);
      this.currentStatus.state = 'saved';
    }
  }

  public subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(status: Partial<AutosaveStatus>) {
    this.currentStatus = { ...this.currentStatus, ...status };
    this.listeners.forEach(l => l(this.currentStatus));
  }

  /**
   * Load all saved articles from local storage vault
   */
  public loadArticles(fallback: ArticleAppraisal[] = []): ArticleAppraisal[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ARTICLES);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // If the vault only contains the previous pre-seeded sample articles, clear them so user starts with clean workspace
        const isOnlyLegacySamples = parsed.length > 0 && parsed.every(a => 
          a.id === 'sample-gt-primary-care-2024' || a.id === 'sample-fa-global-health-2024'
        );
        if (isOnlyLegacySamples) {
          localStorage.removeItem(STORAGE_KEY_ARTICLES);
          return fallback;
        }
        return parsed;
      }
      return fallback;
    } catch (err) {
      console.error('Failed to load articles from storage vault:', err);
      return fallback;
    }
  }

  /**
   * Save articles immediately or with debounce
   */
  public saveArticles(articles: ArticleAppraisal[], immediate = false) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.notify({ state: 'saving', message: 'Autolagrer endringer...' });

    const performSave = () => {
      try {
        const payload = JSON.stringify(articles);
        localStorage.setItem(STORAGE_KEY_ARTICLES, payload);
        const now = new Date();
        localStorage.setItem(`${STORAGE_KEY_ARTICLES}_last_saved`, now.toISOString());

        // Also create a rolling auto-snapshot periodically
        this.createAutoSnapshot(articles);

        this.notify({
          state: 'saved',
          lastSavedAt: now,
          message: `Sist lagret ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
        });
      } catch (err: any) {
        console.error('Autosave error:', err);
        this.notify({
          state: 'error',
          message: `Lagringsfeil: ${err.message || 'Ukjent feil'}`
        });
      }
    };

    if (immediate) {
      performSave();
    } else {
      this.debounceTimer = setTimeout(performSave, 400);
    }
  }

  /**
   * Create an automated or manual snapshot
   */
  public createSnapshot(articles: ArticleAppraisal[], label: string, isManual = true): SnapshotEntry {
    const now = new Date();
    const entry: SnapshotEntry = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      formattedTime: now.toLocaleString('no-NO', {
        dateStyle: 'short',
        timeStyle: 'medium'
      }),
      articleCount: articles.length,
      label,
      isManual,
      data: JSON.parse(JSON.stringify(articles))
    };

    try {
      const existing = this.getSnapshots();
      const updated = [entry, ...existing.slice(0, MAX_AUTO_SNAPSHOTS - 1)];
      localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save snapshot:', e);
    }

    return entry;
  }

  private createAutoSnapshot(articles: ArticleAppraisal[]) {
    try {
      const existing = this.getSnapshots();
      const lastSnap = existing[0];
      const now = Date.now();

      // Only create automated snapshot if at least 2 minutes have passed or no snapshot exists
      if (!lastSnap || (now - new Date(lastSnap.timestamp).getTime()) > 120000) {
        this.createSnapshot(articles, `Automatisk backup (${articles.length} artikler)`, false);
      }
    } catch (e) {
      // Ignore background snapshot failure
    }
  }

  /**
   * Retrieve all saved snapshots
   */
  public getSnapshots(): SnapshotEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Restore articles from a specific snapshot
   */
  public restoreSnapshot(snapshotId: string): ArticleAppraisal[] | null {
    const snapshots = this.getSnapshots();
    const match = snapshots.find(s => s.id === snapshotId);
    if (!match || !Array.isArray(match.data)) return null;

    this.saveArticles(match.data, true);
    this.notify({
      state: 'restored',
      lastSavedAt: new Date(),
      message: `Gjenopprettet versjon fra ${match.formattedTime}`
    });
    return match.data;
  }

  /**
   * Save form unsubmitted active draft
   */
  public saveFormDraft(formId: string, data: any) {
    try {
      localStorage.setItem(`${STORAGE_KEY_DRAFT_PREFIX}${formId}`, JSON.stringify({
        timestamp: new Date().toISOString(),
        data
      }));
    } catch (e) {}
  }

  /**
   * Load form unsubmitted draft
   */
  public loadFormDraft<T>(formId: string): T | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_DRAFT_PREFIX}${formId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.data || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Clear active form draft
   */
  public clearFormDraft(formId: string) {
    try {
      localStorage.removeItem(`${STORAGE_KEY_DRAFT_PREFIX}${formId}`);
    } catch (e) {}
  }

  /**
   * Export all data as standalone JSON backup package
   */
  public exportVaultJson(): string {
    const articles = this.loadArticles([]);
    const snapshots = this.getSnapshots();
    const payload = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      vaultTitle: 'Evidence Appraisal & Meta-Research Vault Backup',
      articlesCount: articles.length,
      articles,
      snapshots
    };
    return JSON.stringify(payload, null, 2);
  }
}

export const AutosaveService = new AutosaveManager();
