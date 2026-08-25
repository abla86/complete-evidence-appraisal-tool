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
  it('hÃ¥ndterer analyse-workflow og viser resultater korrekt', async () => {
    analyzeEvidenceDocument.mockResolvedValue({
      fileName: 'review.pdf',
      documentType: 'Systematic review / meta-analysis',
      classification: {
        documentType: 'Systematic review / meta-analysis',
        confidence: 'High',
        signals: ['systematic-review/meta-analysis terminology detected'],
      },
      extractionStatus: 'Text extracted',
      documentHashSha256: 'abc123456',
      sourceUnitCount: 2,
      instrumentSuitability: [
        { instrument: 'AMSTAR 2', status: 'Suitable', reason: 'Systematic review detected.' },
      ],
      findings: [
        {
          instrument: 'amstar2',
          topic: 'Search strategy',
          page: 1,
          matchedTerm: 'PROSPERO',
          excerpt: 'PROSPERO registration',
        },
      ],
      warnings: [],
      sourceUnits: [],
      methodologicalNotice: 'Researcher verification required.',
    });

    render(<EvidenceLibrary />);

    const file = new File(['%PDF-1.7'], 'review.pdf', {
      type: 'application/pdf',
    });
    const input = screen.getByLabelText(/velg dokument/i);

    fireEvent.change(input, { target: { files: [file] } });

    const analyzeButton = await screen.findByRole('button', {
      name: /analyser dokument/i,
    });

    await waitFor(() => {
      expect(analyzeButton).not.toBeDisabled();
    });

    fireEvent.click(analyzeButton);

    expect(
      await screen.findByText('Systematic review / meta-analysis')
    ).toBeInTheDocument();

    expect(screen.getByTestId('document-viewer')).toHaveTextContent(
      'review.pdf'
    );
    expect(screen.getByText('Dokumenttype:').parentElement).toHaveTextContent(
      'Systematic review / meta-analysis'
    );
    expect(screen.getByText('Suitable')).toBeInTheDocument();
    expect(screen.getByText('Search strategy')).toBeInTheDocument();
    expect(screen.getByText('PROSPERO')).toBeInTheDocument();
    expect(screen.getByText('abc123456')).toBeInTheDocument();
    expect(analyzeEvidenceDocument).toHaveBeenCalledWith(
      file,
      ['amstar2'],
      false
    );
  });

  it('accepts a dropped research document', async () => {
    const file = new File(['%PDF-1.7'], 'dropped.pdf', {
      type: 'application/pdf',
    });
    render(<EvidenceLibrary />);

    const zone = screen
      .getByText('Legg inn forskningsartikkelen')
      .closest('.document-upload-box');

    expect(zone).toBeInTheDocument();

    fireEvent.drop(zone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText(/ARTIKKEL VALGT/i)).toBeInTheDocument();
    });

    expect(document.querySelector('.file-name')).toHaveTextContent(
      'dropped.pdf'
    );
  });
});

