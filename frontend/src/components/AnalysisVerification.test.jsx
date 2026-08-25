import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AnalysisVerification from './AnalysisVerification';

describe('AnalysisVerification', () => {
  it('shows candidate evidence and researcher decisions', () => {
    const onVerify = vi.fn();

    render(<AnalysisVerification finding={{
      instrument: 'amstar2',
      topic: 'Search strategy',
      page: 3,
      matchedTerm: 'PROSPERO',
      excerpt: 'PROSPERO registration was reported.',
    }} onVerify={onVerify} />);

    expect(screen.getByText('Search strategy')).toBeInTheDocument();
    expect(screen.getByText(/PROSPERO/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bekreft funn' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Avvis funn' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marker usikkert' })).toBeInTheDocument();
  });
});
