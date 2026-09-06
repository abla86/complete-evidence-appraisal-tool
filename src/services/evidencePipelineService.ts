import { AuditTrailService } from './auditTrailService';
import { RbacService, type UserRole, type PermissionDefinition } from './rbacService';

export type EvidencePipelineStage =
  | 'identification'
  | 'screening'
  | 'fulltext'
  | 'appraisal'
  | 'dual_review'
  | 'consensus'
  | 'extraction'
  | 'synthesis'
  | 'certainty'
  | 'reporting'
  | 'export';

export interface PipelineCheckpoint {
  stage: EvidencePipelineStage;
  status: 'pending' | 'in_progress' | 'blocked' | 'completed';
  updatedAt: string;
  actorId: string;
  note?: string;
}

export interface EvidencePipelineState {
  projectId: string;
  version: number;
  currentStage: EvidencePipelineStage;
  checkpoints: PipelineCheckpoint[];
}

const STAGES: EvidencePipelineStage[] = [
  'identification',
  'screening',
  'fulltext',
  'appraisal',
  'dual_review',
  'consensus',
  'extraction',
  'synthesis',
  'certainty',
  'reporting',
  'export',
];

const REQUIRED_PERMISSIONS: Partial<Record<EvidencePipelineStage, keyof PermissionDefinition>> = {
  screening: 'canClassifyStudy',
  fulltext: 'canImportDocuments',
  appraisal: 'canConductAppraisal',
  dual_review: 'canConductDualReview',
  consensus: 'canSignOffConsensus',
  export: 'canExportData',
};

function auditRole(role: UserRole): 'reviewer' | 'admin' | 'system' {
  if (role === 'admin') return 'admin';
  if (role === 'reviewer' || role === 'lead_reviewer' || role === 'adjudicator') return 'reviewer';
  return 'system';
}

export class EvidencePipelineService {
  constructor(
    private readonly auditTrail: AuditTrailService = new AuditTrailService(),
  ) {}

  create(projectId: string): EvidencePipelineState {
    return {
      projectId,
      version: 1,
      currentStage: 'identification',
      checkpoints: [
        {
          stage: 'identification',
          status: 'in_progress',
          updatedAt: new Date().toISOString(),
          actorId: 'system',
        },
      ],
    };
  }

  async transition(
    state: EvidencePipelineState,
    stage: EvidencePipelineStage,
    actor: { id: string; role: UserRole },
    note?: string,
  ): Promise<EvidencePipelineState> {
    const currentIndex = STAGES.indexOf(state.currentStage);
    const nextIndex = STAGES.indexOf(stage);

    if (currentIndex < 0 || nextIndex < 0) {
      throw new Error('Ugyldig pipeline-steg.');
    }
    if (nextIndex !== currentIndex + 1) {
      throw new Error(`Pipeline kan bare gÃ¥ til neste steg. Gjeldende: ${state.currentStage}, valgt: ${stage}.`);
    }

    const currentCheckpoint = [...state.checkpoints]
      .reverse()
      .find(checkpoint => checkpoint.stage === state.currentStage);

    if (!currentCheckpoint || currentCheckpoint.status !== 'completed') {
      throw new Error(`Steget ${state.currentStage} mÃ¥ fullfÃ¸res fÃ¸r pipeline kan gÃ¥ videre.`);
    }

    const permission = REQUIRED_PERMISSIONS[stage];
    if (permission && !RbacService.checkPermission(actor.role, permission)) {
      throw new Error(`Rollen ${actor.role} har ikke tilgang til pipeline-steget ${stage}.`);
    }

    const now = new Date().toISOString();
    const checkpoints = [...state.checkpoints, {
      stage,
      status: 'in_progress' as const,
      updatedAt: now,
      actorId: actor.id,
      note,
    }];

    await this.auditTrail.append({
      actor: { id: actor.id, role: auditRole(actor.role) },
      action: 'PIPELINE_STAGE_TRANSITION',
      subject: { entityType: 'project', id: state.projectId },
      detail: {
        fromStage: state.currentStage,
        toStage: stage,
        note: note ?? null,
      },
    });

    return {
      ...state,
      version: state.version + 1,
      currentStage: stage,
      checkpoints,
    };
  }

  async complete(
    state: EvidencePipelineState,
    actor: { id: string; role: UserRole },
    note?: string,
  ): Promise<EvidencePipelineState> {
    const current = [...state.checkpoints].reverse().find(checkpoint => checkpoint.stage === state.currentStage);
    if (!current || current.status !== 'in_progress') {
      throw new Error(`Pipeline-steget ${state.currentStage} er ikke aktivt og kan derfor ikke fullfÃ¸res.`);
    }

    const now = new Date().toISOString();
    const checkpoints = state.checkpoints.map((checkpoint, index, all) => {
      const isCurrent = index === all.map(item => item.stage).lastIndexOf(state.currentStage);
      return isCurrent
        ? { ...checkpoint, status: 'completed' as const, updatedAt: now, actorId: actor.id, note }
        : checkpoint;
    });

    await this.auditTrail.append({
      actor: { id: actor.id, role: auditRole(actor.role) },
      action: 'PIPELINE_STAGE_COMPLETED',
      subject: { entityType: 'project', id: state.projectId },
      detail: { stage: state.currentStage, note: note ?? null },
    });

    return {
      ...state,
      version: state.version + 1,
      checkpoints,
    };
  }

  getAuditTrail() {
    return this.auditTrail.list();
  }
}


