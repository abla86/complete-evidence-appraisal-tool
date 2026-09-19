export const ROB2_DOMAINS = [
  {
    id: 'D1',
    label: 'Randomiseringsprosessen',
    fullText: 'Risk of bias arising from the randomization process',
  },
  {
    id: 'D2',
    label: 'Avvik fra tiltenkte intervensjoner',
    fullText: 'Risk of bias due to deviations from intended interventions',
  },
  {
    id: 'D3',
    label: 'Manglende utfallsdata',
    fullText: 'Risk of bias due to missing outcome data',
  },
  {
    id: 'D4',
    label: 'Måling av utfallet',
    fullText: 'Risk of bias in measurement of the outcome',
  },
  {
    id: 'D5',
    label: 'Utvalg av rapportert resultat',
    fullText: 'Risk of bias in selection of the reported result',
  },
];

export const ROB2_OPTIONS = [
  { value: 'Low', label: 'Lav risiko for bias' },
  { value: 'SomeConcerns', label: 'Noen betenkeligheter' },
  { value: 'High', label: 'Høy risiko for bias' },
];

export const ROB2_SOURCE = {
  citation:
    'Sterne JAC, Savović J, Page MJ, et al. (2019). RoB 2: a revised tool for assessing risk of bias in randomised trials. BMJ, 366, l4898.',
  doi: '10.1136/bmj.l4898',
};

export function createEmptyRob2Domains() {
  return ROB2_DOMAINS.map((domain) => ({
    domainId: domain.id,
    rating: null,
    rationale: '',
    evidenceLocation: '',
  }));
}

export function calculateRob2Overall(domains) {
  const ratings = domains.map((domain) => domain.rating);

  if (ratings.length !== 5 || ratings.some((rating) => !rating)) {
    return null;
  }

  if (ratings.includes('High')) {
    return 'High';
  }

  if (ratings.includes('SomeConcerns')) {
    return 'SomeConcerns';
  }

  return 'Low';
}

export function hasMultipleSomeConcerns(domains) {
  return domains.filter((domain) => domain.rating === 'SomeConcerns').length > 1;
}

export function validateRob2Drafts(domains) {
  const errors = {};

  domains.forEach((domain) => {
    const domainErrors = [];

    if (!domain.rating) {
      domainErrors.push('Risikovurdering mangler.');
    }

    if (!domain.rationale.trim()) {
      domainErrors.push('Begrunnelse mangler.');
    }

    if (!domain.evidenceLocation.trim()) {
      domainErrors.push(
        'Dokumentasjonssted eller eksplisitt opplysning om manglende rapportering mangler.',
      );
    }

    if (domainErrors.length > 0) {
      errors[domain.domainId] = domainErrors;
    }
  });

  return errors;
}

export function createRob2Assessment(setup, domains) {
  return {
    instrumentName: 'Cochrane Risk of Bias 2 (RoB 2)',
    instrumentVersion: '2019',
    reviewTitle: setup.reviewTitle,
    reviewer: setup.reviewer,
    assessmentDateUtc: new Date().toISOString(),
    domains: domains.map((domain) => ({
      domainId: domain.domainId,
      rating: domain.rating,
      rationale: domain.rationale.trim(),
      evidenceLocation: domain.evidenceLocation.trim(),
    })),
    overallRiskOfBias: calculateRob2Overall(domains),
    multipleSomeConcerns: hasMultipleSomeConcerns(domains),
    overallDecisionMode: 'Algorithmic summary for researcher review',
    source: ROB2_SOURCE,
  };
}
