import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EvidenceLibrary from './EvidenceLibrary';
import { analyzePdfEvidence } from '../api/evidenceApi';

vi.mock('../api/evidenceApi', () => ({
  analyzePdfEvidence: vi.fn(),
}));

describe('EvidenceLibrary PDF analysis', () => {
  it('requires a selected instrument and sends the PDF to the analysis endpoint', async () => {
    analyzePdfEvidence.mockResolvedValue({
      fileName: 'review.pdf',
      pageCount: 2,
      extractionStatus: 'Text extracted',
      documentHashSha256: 'abc123',
      findings: [{ instrument: 'amstar2', topic: 'Search strategy', page: 1, matchedTerm: 'PROSPERO', excerpt: 'PROSPERO registration' }],
      warnings: ['Findings are text-location candidates.'],
      pages: [],
      methodologicalNotice: 'Researcher verification required.',
    });

    const file = new File(['%PDF-1.7'], 'review.pdf', { type: 'application/pdf' });
    render(<EvidenceLibrary />);

    fireEvent.change(screen.getByLabelText(/forskningsartikkel/i), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /analyser dokument/i }));

    expect(await screen.findByText('review.pdf')).toBeInTheDocument();
    expect(screen.getByText('Search strategy')).toBeInTheDocument();
    expect(analyzePdfEvidence).toHaveBeenCalledWith(file, ['amstar2'], false);
  });
});
