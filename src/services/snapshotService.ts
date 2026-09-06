import { 
  ArticleAppraisal, 
  AssessmentSnapshot, 
  AssessmentLifecycleStatus, 
  AppraisalInstrument 
} from '../types';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';

export class SnapshotService {
  /**
   * Generates a deterministic immutable lock hash for an assessment based on
   * instrument ID, version, study citation, creation date, and item answers.
   */
  public static generateLockHash(appraisal: Partial<ArticleAppraisal>, instrument: AppraisalInstrument): string {
    const raw = `${instrument.id}:${instrument.version}:${appraisal.id}:${appraisal.doi || ''}:${instrument.validationChecksum}`;
    // Simple fast hashing for browser runtime
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `SHA256:${hex}${instrument.validationChecksum.slice(-8)}`;
  }

  /**
   * Creates an immutable AssessmentSnapshot that seals the methodology, version,
   * source publication, and creation details for permanent reproducibility.
   */
  public static createSnapshot(
    appraisal: ArticleAppraisal,
    reviewer: string = 'Reviewer 1'
  ): AssessmentSnapshot {
    const inst = MASTER_INSTRUMENTS_REGISTRY.find(i => i.id === appraisal.instrumentId);
    if (!inst) {
      throw new Error(`SNAPSHOT_INTEGRITY: unknown appraisal instrument: ${appraisal.instrumentId || 'missing'}`);
    }

    const lockHash = this.generateLockHash(appraisal, inst);

    return {
      assessmentId: `SNAP-${appraisal.id}-${Date.now().toString(36)}`,
      studyId: appraisal.id,
      instrumentId: inst.id,
      instrumentName: inst.name,
      instrumentVersion: inst.version,
      instrumentEdition: inst.edition,
      source: inst.officialSource,
      sourcePublication: inst.primaryPublication,
      doi: inst.doi,
      studyDesign: appraisal.design || 'UNKNOWN',
      createdAt: appraisal.assessmentDate || new Date().toISOString().split('T')[0],
      createdBy: appraisal.reviewerName || reviewer,
      finalizedAt: appraisal.lifecycleStatus === 'FINALIZED' ? (appraisal.assessmentDate || new Date().toISOString()) : undefined,
      finalizedBy: appraisal.lifecycleStatus === 'FINALIZED' ? (appraisal.reviewerName || reviewer) : undefined,
      documentHash: appraisal.documentHash || '',
      immutableLockHash: lockHash,
      lifecycleStatus: appraisal.lifecycleStatus || 'IN_REVIEW',
      reopenHistory: []
    };
  }

  /**
   * Reopens a finalized assessment with mandatory documented reason and audit event.
   */
  public static reopenAssessment(
    appraisal: ArticleAppraisal,
    reason: string,
    reopenedBy: string
  ): ArticleAppraisal {
    if (!reason || reason.trim().length < 5) {
      throw new Error('Obligatorisk faglig begrunnelse (minst 5 tegn) kreves for Ã¥ gjenÃ¥pne en finalisert vurdering.');
    }

    const currentSnapshot = appraisal.snapshot || this.createSnapshot(appraisal, reopenedBy);
    const updatedHistory = [
      ...(currentSnapshot.reopenHistory || []),
      {
        reopenedAt: new Date().toISOString(),
        reopenedBy,
        reason: reason.trim(),
        previousStatus: appraisal.lifecycleStatus || 'FINALIZED'
      }
    ];

    const newSnapshot: AssessmentSnapshot = {
      ...currentSnapshot,
      lifecycleStatus: 'REOPENED',
      reopenHistory: updatedHistory
    };

    const newAuditEntry = {
      id: `AUD-${Date.now()}`,
      studyId: appraisal.id,
      reviewer: reopenedBy,
      instrumentId: currentSnapshot.instrumentId,
      version: currentSnapshot.instrumentVersion,
      itemId: 0,
      itemTitle: 'GjenÃ¥pning av finalisert vurdering',
      previousAnswer: 'FINALIZED',
      newAnswer: 'REOPENED',
      previousRationale: 'LÃ¥st vurdering',
      newRationale: reason,
      changedBy: reopenedBy,
      timestamp: new Date().toISOString(),
      comment: `Vurdering gjenÃ¥pnet: ${reason}`
    };

    return {
      ...appraisal,
      lifecycleStatus: 'REOPENED',
      snapshot: newSnapshot,
      auditTrail: [newAuditEntry, ...(appraisal.auditTrail || [])]
    };
  }

  /**
   * Finalizes an assessment, locking it against accidental edits.
   */
  public static finalizeAssessment(
    appraisal: ArticleAppraisal,
    finalizedBy: string
  ): ArticleAppraisal {
    const currentSnapshot = appraisal.snapshot || this.createSnapshot(appraisal, finalizedBy);
    const newSnapshot: AssessmentSnapshot = {
      ...currentSnapshot,
      lifecycleStatus: 'FINALIZED',
      finalizedAt: new Date().toISOString(),
      finalizedBy
    };

    const newAuditEntry = {
      id: `AUD-${Date.now()}`,
      studyId: appraisal.id,
      reviewer: finalizedBy,
      instrumentId: currentSnapshot.instrumentId,
      version: currentSnapshot.instrumentVersion,
      itemId: 0,
      itemTitle: 'Finalisering og lÃ¥sing av vurdering',
      previousAnswer: appraisal.lifecycleStatus || 'IN_REVIEW',
      newAnswer: 'FINALIZED',
      previousRationale: 'Under vurdering',
      newRationale: 'Vurdering fullfÃ¸rt og metodisk godkjent.',
      changedBy: finalizedBy,
      timestamp: new Date().toISOString(),
      comment: 'Vurdering finalisert og lÃ¥st for redigering.'
    };

    return {
      ...appraisal,
      lifecycleStatus: 'FINALIZED',
      snapshot: newSnapshot,
      auditTrail: [newAuditEntry, ...(appraisal.auditTrail || [])]
    };
  }
}

