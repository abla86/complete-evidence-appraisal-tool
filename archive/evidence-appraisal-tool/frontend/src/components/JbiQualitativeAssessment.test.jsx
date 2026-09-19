import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import JbiQualitativeAssessment from './JbiQualitativeAssessment';

describe('JbiQualitativeAssessment', () => {
  it('sends all ten criteria to the version-specific validation endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ isValid: false, completedItems: 0, expectedItems: 10, errors: ['Item 1: response is required.'] }) });
    vi.stubGlobal('fetch', fetchMock);
    render(<JbiQualitativeAssessment />);
    fireEvent.change(screen.getByLabelText('Studietittel'), { target: { value: 'Example study' } });
    fireEvent.change(screen.getByLabelText('Reviewer-kode'), { target: { value: 'R1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Valider vurdering' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.instrumentId).toBe('jbi-qualitative-2017');
    expect(payload.instrumentVersion).toBe('2017');
    expect(payload.items).toHaveLength(10);
  });

  it('shows validation state without inventing a numerical quality score', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ isValid: true, completedItems: 10, expectedItems: 10, errors: [] }) }));
    render(<JbiQualitativeAssessment />);
    fireEvent.change(screen.getByLabelText('Studietittel'), { target: { value: 'Example study' } });
    fireEvent.change(screen.getByLabelText('Reviewer-kode'), { target: { value: 'R1' } });
    const selects = screen.getAllByLabelText('Svar');
    const locations = screen.getAllByLabelText('Evidenslokasjon');
    const rationales = screen.getAllByLabelText('Begrunnelse');
    selects.forEach(select => fireEvent.change(select, { target: { value: 'Yes' } }));
    locations.forEach(input => fireEvent.change(input, { target: { value: 'p. 1' } }));
    rationales.forEach(input => fireEvent.change(input, { target: { value: 'Documented rationale' } }));
    fireEvent.change(screen.getByLabelText('Samlet forskervurdering'), { target: { value: 'Include' } });
    fireEvent.change(screen.getByLabelText('Begrunnelse for samlet vurdering'), { target: { value: 'Overall rationale' } });
    fireEvent.click(screen.getByRole('button', { name: 'Valider vurdering' }));
    await waitFor(() => expect(screen.getByText('Strukturelt gyldig vurdering')).toBeInTheDocument());
    expect(screen.queryByText(/score/i)).not.toBeInTheDocument();
  });
});
