import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRisk } from '../../server/engine/risk.js';

describe('Risk Engine Tests', () => {
  it('classifies clean candidates as GREEN with preliminary low-conflict status', () => {
    const risk = evaluateRisk({
      candidateName: 'Novariss',
      companyMatches: [],
      trademarkMatches: [],
      domainResults: [{ id: '1', candidateId: 'c1', domain: 'novariss.com', tld: '.com', status: 'unregistered_likely', queryTime: '', notes: '' }],
      softwareMatches: [],
    });

    assert.equal(risk.overallLevel, 'GREEN');
    assert.ok(risk.overallScore < 20);
    assert.ok(risk.recommendation.includes('Preliminary low-conflict candidate'));
    assert.ok(risk.legalDisclaimer.includes('DOES NOT constitute legal advice'));
  });

  it('classifies exact active trademark collisions as RED or BLACK', () => {
    const risk = evaluateRisk({
      candidateName: 'Spotify',
      companyMatches: [],
      trademarkMatches: [
        {
          id: 'tm1',
          candidateId: 'c1',
          markName: 'SPOTIFY',
          jurisdiction: 'Global',
          status: 'Registered / Active',
          classes: ['09', '38', '42'],
          source: 'WIPO',
          similarityScore: 1.0,
          riskLevel: 'BLACK',
        },
      ],
      domainResults: [],
      softwareMatches: [],
    });

    assert.equal(risk.overallLevel, 'BLACK');
    assert.ok(risk.overallScore >= 85);
    assert.ok(risk.recommendation.includes('Reject'));
  });

  it('classifies active corporate collisions as high risk', () => {
    const risk = evaluateRisk({
      candidateName: 'Equinor',
      companyMatches: [
        {
          id: 'cm1',
          candidateId: 'c1',
          companyName: 'EQUINOR ASA',
          country: 'Norway',
          status: 'Active',
          similarityScore: 0.96,
          riskLevel: 'RED',
          source: 'Brønnøysundregistrene',
        },
      ],
      trademarkMatches: [],
      domainResults: [],
      softwareMatches: [],
    });

    assert.ok(risk.overallLevel === 'RED' || risk.overallLevel === 'ORANGE');
    assert.ok(risk.overallScore >= 50);
  });
});
