import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as db from '../../server/db/database.js';
import { evaluateRisk } from '../../server/engine/risk.js';
import { assembleDossier } from '../../server/engine/workflow.js';
import { CandidateName } from '../../src/types/index.js';

describe('Pipeline Integration & Persistence Tests', () => {
  it('creates project, persists candidate, records matches, evaluates risk and assembles dossier', () => {
    const projId = `proj_test_${Date.now()}`;
    const project = db.createProject({
      id: projId,
      title: 'Nordic AI Analytics',
      entityType: 'platform',
      description: 'Automated workflow test',
      industry: 'Artificial Intelligence',
      targetAudience: 'Enterprise Data Engineers',
      market: 'Norway',
      languages: ['en', 'no'],
      desiredTone: 'nordic',
      desiredLength: 'short',
      pronunciationPreference: 'easy',
      wordType: 'compound',
      wordsToInclude: ['nord'],
      wordsToAvoid: ['cloud'],
      lettersToAvoid: ['z'],
      conceptsToCommunicate: ['clarity', 'speed'],
    });

    assert.equal(project.id, projId);
    assert.equal(project.title, 'Nordic AI Analytics');

    const candidateId = `cand_int_${Date.now()}`;
    const testCandidate: CandidateName = {
      id: candidateId,
      projectId: project.id,
      name: 'Nordfalk',
      normalizedName: 'nordfalk',
      pronunciation: 'nord-falk',
      concept: 'Northern falcon vision and precision',
      namingStrategy: 'nordic & evocative names',
      whyFits: 'Conveys precision, speed, and northern sovereignty',
      riskLevel: 'GREEN',
      riskScore: 12,
      riskSummary: 'Preliminary low-conflict candidate',
      isWatched: false,
      searchStatus: 'screened',
      verificationTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    db.insertCandidate(testCandidate);
    const retrieved = db.getCandidate(candidateId);
    assert.ok(retrieved);
    assert.equal(retrieved.name, 'Nordfalk');

    // Insert domain result
    db.insertDomainResult({
      id: `dom_${Date.now()}`,
      candidateId,
      domain: 'nordfalk.com',
      tld: '.com',
      status: 'unregistered_likely',
      queryTime: new Date().toISOString(),
      notes: 'DNS NXDOMAIN verified',
    });

    // Insert company match
    db.insertCompanyMatch({
      id: `co_${Date.now()}`,
      candidateId,
      companyName: 'NORDFALK AS',
      country: 'Norway',
      status: 'Active',
      similarityScore: 0.95,
      riskLevel: 'RED',
      source: 'Brønnøysundregistrene',
    });

    // Run risk evaluation with recorded evidence
    const companies = db.getCompanyMatches(candidateId);
    const domains = db.getDomainResults(candidateId);
    const risk = evaluateRisk({
      candidateName: 'Nordfalk',
      companyMatches: companies,
      trademarkMatches: [],
      domainResults: domains,
      softwareMatches: [],
    });

    assert.ok(risk.overallScore > 30);
    assert.ok(risk.factors.length > 0);
    assert.ok(risk.legalDisclaimer.includes('DOES NOT constitute legal advice'));

    // Update candidate risk in DB
    db.updateCandidateRisk(candidateId, risk.overallLevel, risk.overallScore, risk.recommendation);

    // Assemble complete evidence dossier
    const dossier = assembleDossier(candidateId);
    assert.equal(dossier.candidate.id, candidateId);
    assert.equal(dossier.companyMatches.length, 1);
    assert.equal(dossier.domainResults.length, 1);
    assert.equal(dossier.risk.overallLevel, risk.overallLevel);

    // Test watchlist toggle
    const toggled = db.toggleWatchCandidate(candidateId);
    assert.equal(toggled, true);
    const watchedList = db.getWatchlist();
    assert.ok(watchedList.some(c => c.id === candidateId));

    // Test audit log
    db.logAuditEvent('VERIFICATION_COMPLETE', 'test_user', { candidateId, level: risk.overallLevel });
    const auditLogs = db.getAuditLogs(10);
    assert.ok(auditLogs.some(l => l.action === 'VERIFICATION_COMPLETE'));
  });
});
