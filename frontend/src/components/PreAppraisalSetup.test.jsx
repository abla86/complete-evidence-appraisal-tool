import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import PreAppraisalSetup from './PreAppraisalSetup';

const defaults = [2, 4, 7, 9, 11, 13, 15];

describe('PreAppraisalSetup', () => {
  it('requires identifying information and rationales', () => {
    render(
      <PreAppraisalSetup
        defaultCriticalDomains={defaults}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /lagre prosjektoppsettet/i,
      }),
    );

    expect(
      screen.getByText(
        /tittel på den systematiske oversikten er obligatorisk/i,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /navn eller identifikator for vurderer er obligatorisk/i,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /begrunnelse for punkt 2 er obligatorisk/i,
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(/prosjektoppsettet er kontrollert/i),
    ).not.toBeInTheDocument();
  });

  it('confirms a completely documented setup including configurable rules', () => {
    const onConfirmed = vi.fn();

    render(
      <PreAppraisalSetup
        defaultCriticalDomains={[2]}
        onConfirmed={onConfirmed}
      />,
    );

    fireEvent.change(
      screen.getByLabelText(
        /tittel på systematisk oversikt/i,
      ),
      {
        target: {
          value: 'Eksempeloversikt',
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText(/^vurderer/i),
      {
        target: {
          value: 'Forsker 01',
        },
      },
    );

    fireEvent.change(
      screen.getByLabelText(
        /forhåndsbegrunnelse for punkt 2/i,
      ),
      {
        target: {
          value:
            'Domenet er forhåndsdefinert i protokollen.',
        },
      },
    );

    fireEvent.click(
      screen.getByLabelText(/dual review/i),
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /lagre prosjektoppsettet/i,
      }),
    );

    expect(
      screen.getByText(/prosjektoppsettet er kontrollert/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/arbeidsflytregler er aktive/i),
    ).toBeInTheDocument();

    expect(onConfirmed).toHaveBeenCalledWith(
      expect.objectContaining({
        reviewTitle: 'Eksempeloversikt',
        reviewer: 'Forsker 01',
        criticalDomains: [
          {
            itemNumber: 2,
            rationale:
              'Domenet er forhåndsdefinert i protokollen.',
          },
        ],
        workflowRules: expect.objectContaining({
          humanVerificationRequired: true,
          dualReview: true,
          prismaTracking: true,
          auditTrail: true,
          doiLookup: true,
          picoAssistance: false,
          pdfEvidenceMapping: true,
          offlineMode: false,
          includePageText: false,
        }),
      }),
    );
  });
});