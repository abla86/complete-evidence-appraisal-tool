import { mkdir, readFile, rename, writeFile, chmod } from 'node:fs/promises';
import path from 'node:path';
import type { Assessment, AuditEvent } from './evidenceCore';

interface StoreDocument {
  version: 1;
  assessments: Assessment[];
  audit: Record<string, AuditEvent[]>;
}

export class EvidenceStore {
  private readonly filePath: string;
  private writeQueue: Promise<void> = Promise.resolve();
  private state: StoreDocument = { version: 1, assessments: [], audit: {} };
  private loaded = false;

  constructor(dataDir = process.env.EVIDENCE_DATA_DIR || path.resolve(process.cwd(), 'data')) {
    this.filePath = path.join(dataDir, 'evidence-store.json');
  }

  async init(): Promise<void> {
    if (this.loaded) return;
    await mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as StoreDocument;
      if (parsed?.version !== 1 || !Array.isArray(parsed.assessments) || typeof parsed.audit !== 'object') throw new Error('Ugyldig evidence store-format.');
      this.state = parsed;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error;
      await this.persist();
    }
    this.loaded = true;
  }

  async getAssessment(id: string): Promise<Assessment | undefined> {
    await this.init();
    return this.state.assessments.find((a) => a.id === id);
  }

  async saveAssessment(assessment: Assessment): Promise<void> {
    await this.init();
    const index = this.state.assessments.findIndex((a) => a.id === assessment.id);
    if (index >= 0) this.state.assessments[index] = assessment;
    else this.state.assessments.push(assessment);
    await this.persist();
  }

  async getAudit(id: string): Promise<AuditEvent[] | undefined> {
    await this.init();
    const events = this.state.audit[id];
    return events ? [...events] : undefined;
  }

  async appendAudit(id: string, event: AuditEvent): Promise<void> {
    await this.init();
    if (!this.state.audit[id]) this.state.audit[id] = [];
    this.state.audit[id].push(event);
    await this.persist();
  }

  async countAssessments(): Promise<number> {
    await this.init();
    return this.state.assessments.length;
  }

  async countAuditChains(): Promise<number> {
    await this.init();
    return Object.keys(this.state.audit).length;
  }

  private async persist(): Promise<void> {
    const snapshot = JSON.stringify(this.state, null, 2) + '\n';
    const target = this.filePath;
    const temp = `${target}.tmp`;
    this.writeQueue = this.writeQueue.then(async () => {
      await writeFile(temp, snapshot, { encoding: 'utf8', mode: 0o600 });
      await chmod(temp, 0o600);
      await rename(temp, target);
      await chmod(target, 0o600);
    });
    await this.writeQueue;
  }
}
