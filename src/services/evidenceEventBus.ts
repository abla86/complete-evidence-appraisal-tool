export type EvidenceEventMap = {
  'research.document.attached': {
    studyId: string;
    documentId: string;
  };
  'research.classification.verified': {
    studyId: string;
    reviewerId: string;
    approved: boolean;
  };
  'research.evidence.verified': {
    studyId: string;
    evidenceId: string;
    reviewerId: string;
    approved: boolean;
  };
  'appraisal.session.created': {
    studyId: string;
    sessionId: string;
    instrumentId: string;
    reviewerId: string;
  };
  'appraisal.session.finalized': {
    studyId: string;
    sessionId: string;
    instrumentId: string;
    reviewerId: string;
  };
  'review.consensus.required': {
    studyId: string;
    sessionId: string;
  };
};

type Listener<T> = (event: T) => void | Promise<void>;

export interface EvidenceEventBus {
  on<K extends keyof EvidenceEventMap>(event: K, listener: Listener<EvidenceEventMap[K]>): () => void;
  emit<K extends keyof EvidenceEventMap>(event: K, payload: EvidenceEventMap[K]): Promise<void>;
}

export class InMemoryEvidenceEventBus implements EvidenceEventBus {
  private readonly listeners = new Map<keyof EvidenceEventMap, Set<Listener<any>>>();

  public on<K extends keyof EvidenceEventMap>(event: K, listener: Listener<EvidenceEventMap[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return () => set?.delete(listener);
  }

  public async emit<K extends keyof EvidenceEventMap>(event: K, payload: EvidenceEventMap[K]): Promise<void> {
    const listeners = [...(this.listeners.get(event) ?? [])];
    await Promise.all(listeners.map(listener => listener(payload)));
  }
}

export const evidenceEventBus = new InMemoryEvidenceEventBus();
