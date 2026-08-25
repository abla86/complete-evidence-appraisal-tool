import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EvidenceLibrary from './EvidenceLibrary';
import { analyzeEvidenceDocument } from '../api/evidenceApi';

vi.mock('./EvidenceDocumentViewer', () => ({
  default: ({ file }) => <div data-testid="document-viewer">{file?.name}</div>,
}));

vi.mock('../api/evidenceApi', () => ({
  analyzeEvidenceDocument: vi.fn(),
  addManualEvidence: vi.fn(),
  getEvidenceSummary: vi.fn().mockResolvedValue({ total: 0, byStatus: {} }),
  getManualEvidence: vi.fn().mockResolvedValue([]),
  verifyEvidence: vi.fn(),
}));

describe('EvidenceLibrary research-document analysis', () => {
  it('shows the upload zone and sends a supported research document with selected instruments', async () => {
    analyzeEvidenceDocument.mockResolvedValue({
      fileName: 'review.pdf',
      pageCount: 2,
      sourceUnitCount: 2,
      documentType: 'Systematic review / meta-analysis',
      classification: {
        documentType: 'Systematic review / meta-analysis',
        confidence: 'High',
        signals: ['systematic-review/meta-analysis terminology detected'],
      },
      extractionStatus: 'Text extracted',
      documentHashSha256: 'abc123',
      instrumentSuitability: [
        { instrument: 'AMSTAR 2', status: 'Suitable', reason: 'Systematic review detected.' },
        { instrument: 'AGREE II', status: 'Not suitable', reason: 'Guideline not detected.' },
      ],
      findings: [{ instrument: 'amstar2', topic: 'Search strategy', page: 1, matchedTerm: 'PROSPERO', excerpt: 'PROSPERO registration' }],
      warnings: ['Findings are text-location candidates.'],
      sourceUnits: [],
      methodologicalNotice: 'Researcher verification required.',
    });

    const file = new File(['%PDF-1.7'], 'review.pdf', { type: 'application/pdf' });
    render(<EvidenceLibrary />);

    const input = screen.getByLabelText(/velg dokument/i);
    expect(screen.getByText('Importer forskningsartikkelen')).toBeInTheDocument();
    expect(screen.getByText(/Start med/i)).toBeInTheDocument();
    expect(screen.getByText(/STEG 1/)).toBeInTheDocument();
    expect(input).toHaveAttribute('accept', '.pdf,.docx,.txt,.html,.htm,.xml,.jats');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /analyser dokument/i })).not.toBeDisabled();
    });

    expect(screen.getByText(/ARTIKKEL VALGT/i)).toBeInTheDocument();
    expect(document.querySelector('.file-name')).toHaveTextContent('review.pdf');
    expect(screen.getByText(/2.*Velg instrument/)).toBeInTheDocument();
    expect(screen.getByText(/3.*Start analyse/)).toBeInTheDocument();

    const analyzeButton = screen.getByRole('button', { name: /analyser dokument/i });
    await waitFor(() => expect(analyzeButton).not.toBeDisabled());
    fireEvent.click(analyzeButton);

    expect(screen.getByTestId('document-viewer')).toHaveTextContent('review.pdf');
    const documentTypeLabel = screen.getByText('Dokumenttype:');
    expect(documentTypeLabel.parentElement).toHaveTextContent('Systematic review / meta-analysis');
    expect(screen.getByText('Suitable')).toBeInTheDocument();
    expect(screen.getByText('Not suitable')).toBeInTheDocument();
    expect(screen.getByText('Search strategy')).toBeInTheDocument();
    expect(screen.getByText('PROSPERO')).toBeInTheDocument();
    expect(screen.getByText('abc123')).toBeInTheDocument();
    expect(analyzeEvidenceDocument).toHaveBeenCalledWith(file, ['amstar2'], false);
  });

  it('accepts a dropped research document', async () => {
    const file = new File(['%PDF-1.7'], 'dropped.pdf', { type: 'application/pdf' });
    render(<EvidenceLibrary />);

    const zone = screen.getByText('Legg inn forskningsartikkelen').closest('.document-upload-box');
    expect(zone).toBeInTheDocument();

    fireEvent.drop(zone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText(/ARTIKKEL VALGT/i)).toBeInTheDocument();
    });
    expect(document.querySelector('.file-name')).toHaveTextContent('dropped.pdf');
  });
});

