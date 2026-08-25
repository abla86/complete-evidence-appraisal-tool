import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EvidenceDocumentViewer from './EvidenceDocumentViewer';

describe('EvidenceDocumentViewer', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'https://example.test/mock-document');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('viser tom-tilstand når ingen fil er valgt', () => {
    render(<EvidenceDocumentViewer file={null} />);
    expect(screen.getByText(/Last opp et forskningsdokument/i)).toBeInTheDocument();
  });

  it('viser PDF i iframe og oppretter object URL', async () => {
    const file = new File(['dummy'], 'review.pdf', { type: 'application/pdf' });
    render(<EvidenceDocumentViewer file={file} />);

    const iframe = await screen.findByTitle('Forskningsdokument: review.pdf');
    expect(iframe).toHaveAttribute('src', 'https://example.test/mock-document');
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(screen.getByRole('link', { name: 'Åpne/last ned' })).toHaveAttribute(
      'href',
      'https://example.test/mock-document'
    );
  });

  it.each(['txt', 'html', 'htm', 'xml', 'jats'])('leser %s som tekst', async (extension) => {
    const content = `<article>Forskningsdata ${extension}</article>`;
    const file = new File([content], `study.${extension}`, {
      type: extension === 'txt' ? 'text/plain' : 'text/xml',
    });
    vi.spyOn(file, 'text').mockResolvedValue(content);

    render(<EvidenceDocumentViewer file={file} />);
    await waitFor(() => expect(screen.getByText(content)).toBeInTheDocument());
    expect(file.text).toHaveBeenCalledTimes(1);
  });

  it('viser DOCX som opplastet dokument uten å late som nettleseren kan forhåndsvise det', async () => {
    const file = new File(['dummy'], 'study.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    render(<EvidenceDocumentViewer file={file} />);

    expect(screen.getByText(/Nettleseren kan ikke vise DOCX direkte/i)).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Åpne/last ned dokumentet' })).toBeInTheDocument();
  });

  it('viser feil når tekstfilen ikke kan leses', async () => {
    const file = new File([''], 'corrupt.txt', { type: 'text/plain' });
    vi.spyOn(file, 'text').mockRejectedValue(new Error('Read error'));

    render(<EvidenceDocumentViewer file={file} />);
    await waitFor(() => {
      expect(screen.getByText(/Filen kunne ikke forhåndsvises som tekst/i)).toBeInTheDocument();
    });
  });

  it('frigjør object URL ved unmount', () => {
    const file = new File(['dummy'], 'review.pdf', { type: 'application/pdf' });
    const { unmount } = render(<EvidenceDocumentViewer file={file} />);
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('https://example.test/mock-document');
  });
});


