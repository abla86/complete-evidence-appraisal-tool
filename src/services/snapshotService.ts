import { 
  ArticleAppraisal, 
  AssessmentSnapshot, 
  AssessmentLifecycleStatus, 
  AppraisalInstrument 
} from '../types';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';

export class SnapshotService {
  /**
   * Generates a real SHA-256 fingerprint of the assessment content and instrument
   * metadata. This detects accidental changes; it is not a server-signed or
   * tamper-proof audit record because browser-local storage can be edited.
   */
  public static async generateLockHash(appraisal: Partial<ArticleAppraisal>, instrument: AppraisalInstrument): Promise<string> {
    const stableStringify = (value: unknown): string => {
      if (value === null || typeof value !== 'object') return JSON.stringify(value);
      if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
      const record = value as Record<string, unknown>;
      return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
    };
    const raw = stableStringify({
      instrument: {
        id: instrument.id,
        version: instrument.version,
        edition: instrument.edition,
        validationChecksum: instrument.validationChecksum,
      },
      appraisal: {
        id: appraisal.id,
        doi: appraisal.doi || '',
        title: appraisal.title || '',
        design: appraisal.design || '',
        documentHash: appraisal.documentHash || '',
        items: appraisal.items || [],
      },
    });
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) throw new Error('SNAPSHOT_INTEGRITY: Web Crypto SHA-256 is unavailable in this environment.');
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(raw));
    const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    return `SHA256:${hex}`;
  }

  /**
   * Creates a snapshot containing the methodology version and a SHA-256 content
   * fingerprint. The snapshot remains editable data, not immutable storage.
   */
  public static async createSnapshot(
    appraisal: ArticleAppraisal,
    reviewer: string = 'Reviewer 1'
  ): Promise<AssessmentSnapshot> {
    const inst = MASTER_INSTRUMENTS_REGISTRY.find(i => i.id === appraisal.instrumentId);
    if (!inst) {
      throw new Error(`SNAPSHOT_INTEGRITY: unknown appraisal instrument: ${appraisal.instrumentId || 'missing'}`);
    }

    const lockHash = await this.generateLockHash(appraisal, inst);

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
  public static async reopenAssessment(
    appraisal: ArticleAppraisal,
    reason: string,
    reopenedBy: string
  ): Promise<ArticleAppraisal> {
    if (!reason || reason.trim().length < 5) {
      throw new Error('Obligatorisk faglig begrunnelse (minst 5 tegn) kreves for å gjenåpne en finalisert vurdering.');
    }

    const currentSnapshot = appraisal.snapshot || await this.createSnapshot(appraisal, reopenedBy);
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
      itemTitle: 'Gjenåpning av finalisert vurdering',
      previousAnswer: 'FINALIZED',
      newAnswer: 'REOPENED',
      previousRationale: 'Låst vurdering',
      newRationale: reason,
      changedBy: reopenedBy,
      timestamp: new Date().toISOString(),
      comment: `Vurdering gjenåpnet: ${reason}`
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
  public static async finalizeAssessment(
    appraisal: ArticleAppraisal,
    finalizedBy: string
  ): Promise<ArticleAppraisal> {
    const currentSnapshot = appraisal.snapshot || await this.createSnapshot(appraisal, finalizedBy);
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
      itemTitle: 'Finalisering og låsing av vurdering',
      previousAnswer: appraisal.lifecycleStatus || 'IN_REVIEW',
      newAnswer: 'FINALIZED',
      previousRationale: 'Under vurdering',
      newRationale: 'Vurdering fullført og metodisk godkjent.',
      changedBy: finalizedBy,
      timestamp: new Date().toISOString(),
      comment: 'Vurdering finalisert og låst for redigering.'
    };

    return {
      ...appraisal,
      lifecycleStatus: 'FINALIZED',
      snapshot: newSnapshot,
      auditTrail: [newAuditEntry, ...(appraisal.auditTrail || [])]
    };
  }
}


