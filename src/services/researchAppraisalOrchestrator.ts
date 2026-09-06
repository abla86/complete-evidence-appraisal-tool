import { evidenceEventBus, type EvidenceEventMap } from './evidenceEventBus';

export interface ModuleHandlerMap {
  onResearchDocumentAttached?: (event: EvidenceEventMap['research.document.attached']) => void | Promise<void>;
  onClassificationVerified?: (event: EvidenceEventMap['research.classification.verified']) => void | Promise<void>;
  onEvidenceVerified?: (event: EvidenceEventMap['research.evidence.verified']) => void | Promise<void>;
  onAppraisalCreated?: (event: EvidenceEventMap['appraisal.session.created']) => void | Promise<void>;
  onAppraisalFinalized?: (event: EvidenceEventMap['appraisal.session.finalized']) => void | Promise<void>;
}

export class ResearchAppraisalOrchestrator {
  private readonly unsubscribers: Array<() => void> = [];

  public registerHandlers(handlers: ModuleHandlerMap): void {
    this.dispose();

    if (handlers.onResearchDocumentAttached) {
      this.unsubscribers.push(
        evidenceEventBus.on('research.document.attached', handlers.onResearchDocumentAttached),
      );
    }

    if (handlers.onClassificationVerified) {
      this.unsubscribers.push(
        evidenceEventBus.on('research.classification.verified', handlers.onClassificationVerified),
      );
    }

    if (handlers.onEvidenceVerified) {
      this.unsubscribers.push(
        evidenceEventBus.on('research.evidence.verified', handlers.onEvidenceVerified),
      );
    }

    if (handlers.onAppraisalCreated) {
      this.unsubscribers.push(
        evidenceEventBus.on('appraisal.session.created', handlers.onAppraisalCreated),
      );
    }

    if (handlers.onAppraisalFinalized) {
      this.unsubscribers.push(
        evidenceEventBus.on('appraisal.session.finalized', handlers.onAppraisalFinalized),
      );
    }
  }

  public dispose(): void {
    for (const unsubscribe of this.unsubscribers.splice(0)) unsubscribe();
  }
}

export const researchAppraisalOrchestrator = new ResearchAppraisalOrchestrator();

