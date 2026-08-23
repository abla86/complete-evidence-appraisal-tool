import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EvidenceLibrary from './EvidenceLibrary';
import { analyzeEvidenceDocument } from '../api/evidenceApi';

vi.mock('../api/evidenceApi', () => ({
  analyzeEvidenceDocument: vi.fn(),
}));

describe('EvidenceLibrary research-document analysis', () => {
  it('shows the upload control and sends a supported research document with selected instruments', async () => {
    analyzeEvidenceDocument.mockResolvedValue({
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

    const input = screen.getByLabelText(/velg dokument/i);
    expect(input).toHaveAttribute('accept', '.pdf,.docx,.txt,.html,.htm,.xml');
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /analyser dokument/i }));

    expect(await screen.findByText('review.pdf')).toBeInTheDocument();
    expect(screen.getByText('Search strategy')).toBeInTheDocument();
    expect(analyzeEvidenceDocument).toHaveBeenCalledWith(file, ['amstar2'], false);
  });
});
