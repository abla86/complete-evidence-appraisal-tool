import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EvidenceLibrary from './EvidenceLibrary';

vi.mock('../api/evidenceApi', () => ({
  analyzeEvidenceDocument: vi.fn(),
  addManualEvidence: vi.fn(),
  getEvidenceSummary: vi.fn().mockResolvedValue({ total: 0, byStatus: {} }),
  getManualEvidence: vi.fn().mockResolvedValue([]),
  verifyEvidence: vi.fn(),
}));

vi.mock('./EvidenceDocumentViewer', () => ({
  default: () => <div data-testid="document-viewer" />,
}));

describe('EvidenceLibrary upload zone', () => {
  it('viser tydelig importområde og valgt artikkel', () => {
    render(<EvidenceLibrary />);

    expect(screen.getByRole('heading', { name: /Importer forskningsartikkelen/i })).toBeInTheDocument();
    expect(screen.getByText(/Legg inn forskningsartikkelen/i)).toBeInTheDocument();
    expect(screen.getByText(/Velg fil fra PC-en/i)).toBeInTheDocument();

    const file = new File(['%PDF-1.7'], 'review.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/velg dokument/i);

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('review.pdf')).toBeInTheDocument();
    expect(screen.getByText(/ARTIKKEL VALGT/i)).toBeInTheDocument();
    expect(screen.getByText(/Bytt artikkel/i)).toBeInTheDocument();
  });
});
