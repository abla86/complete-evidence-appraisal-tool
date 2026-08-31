import { sha256, stableJson } from './hash';
import type { ProvenanceNode } from './types';

export class ProvenanceGraph {
  private readonly nodes = new Map<string, ProvenanceNode>();

  add(input: Omit<ProvenanceNode, 'contentHash'> & { content: string }): ProvenanceNode {
    const node: ProvenanceNode = {
      ...input,
      contentHash: sha256(input.content)
    };
    this.nodes.set(node.id, node);
    return node;
  }

  get(id: string): ProvenanceNode | undefined {
    return this.nodes.get(id);
  }

  all(): ProvenanceNode[] {
    return [...this.nodes.values()];
  }

  hasUntrustedPath(ids: string[]): boolean {
    const visited = new Set<string>();
    const visit = (id: string): boolean => {
      if (visited.has(id)) return false;
      visited.add(id);
      const node = this.nodes.get(id);
      if (!node) return true;
      if (node.trust === 'UNTRUSTED') return true;
      return node.parentIds.some(visit);
    };
    return ids.some(visit);
  }

  digest(): string {
    return sha256(stableJson(this.all().sort((a, b) => a.id.localeCompare(b.id))));
  }
}
