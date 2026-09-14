import React from 'react';
import {
  calculateConsensus,
  type ConsensusItem,
} from '../services/consensusProtocolService';

type Props = {
  items: ConsensusItem[];
};

export default function ConsensusDashboardView({ items }: Props) {
  const result = calculateConsensus(items);

  if (items.length === 0) {
    return (
      <section aria-labelledby="consensus-title">
        <h2 id="consensus-title">Peer Review &amp; Consensus</h2>
        <p>Ingen vurderinger er registrert ennå.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="consensus-title">
      <h2 id="consensus-title">Peer Review &amp; Consensus</h2>
      <dl>
        <div>
          <dt>Enighet</dt>
          <dd>{result.agreement.toFixed(1)}%</dd>
        </div>
        <div>
          <dt>Cohen's κ</dt>
          <dd>{result.kappa.toFixed(3)}</dd>
        </div>
        <div>
          <dt>Konflikter</dt>
          <dd>{result.conflicts.length}</dd>
        </div>
      </dl>
    </section>
  );
}
