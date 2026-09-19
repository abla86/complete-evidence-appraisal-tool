import {
  CandidateName,
  CompanyMatch,
  DomainResult,
  NamingBrief,
  SearchResult,
  SimilarityMatch,
  SoftwareMatch,
  TrademarkMatch,
  VerificationDossier,
} from '../../src/types/index.js';
import * as db from '../db/database.js';
import { generateFullCandidatePool } from './generation.js';
import { compareNames } from './similarity.js';
import { evaluateRisk } from './risk.js';
import { BronnoysundProvider, GlobalCompanyAdapter } from '../providers/companyProvider.js';
import { AuthoritativeTrademarkProvider } from '../providers/trademarkProvider.js';
import { LiveDomainProvider } from '../providers/domainProvider.js';
import { SoftwareRegistryProvider } from '../providers/softwareProvider.js';
import { WebSearchProvider } from '../providers/webSearchProvider.js';

// Provider instances
const bronnoysundProvider = new BronnoysundProvider();
const globalCompanyAdapter = new GlobalCompanyAdapter();
const trademarkProvider = new AuthoritativeTrademarkProvider();
const domainProvider = new LiveDomainProvider();
const softwareProvider = new SoftwareRegistryProvider();
const webSearchProvider = new WebSearchProvider();

/**
 * Execute conflict screening search across all providers for a single candidate
 */
export async function screenCandidate(
  candidate: CandidateName,
  options: { market?: string; industry?: string; deep?: boolean } = {}
): Promise<CandidateName> {
  const run = db.createSearchRun(candidate.id, options.deep ? 'deep_verify' : 'screening');

  try {
    // 1. Run providers in parallel with timeout safeguards
    const [companyRes, globalCompRes, tmRes, domainRes, softRes, webRes] = await Promise.all([
      bronnoysundProvider.execute(candidate.name),
      globalCompanyAdapter.execute(candidate.name),
      trademarkProvider.execute(candidate.name, { country: options.market, industry: options.industry }),
      domainProvider.execute(candidate.name),
      softwareProvider.execute(candidate.name),
      webSearchProvider.execute(candidate.name, { deep: options.deep }),
    ]);

    // 2. Persist search results to authoritative database
    const allSearchResults = [
      ...companyRes.searchResults,
      ...globalCompRes.searchResults,
      ...tmRes.searchResults,
      ...domainRes.searchResults,
      ...softRes.searchResults,
      ...webRes.searchResults,
    ];

    for (const sr of allSearchResults) {
      db.insertSearchResult({
        id: `sr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        runId: run.id,
        candidateId: candidate.id,
        sourceName: sr.sourceName,
        sourceCategory: sr.sourceCategory,
        query: sr.query,
        url: sr.url,
        resultTitle: sr.resultTitle,
        resultSnippet: sr.resultSnippet,
        matchType: sr.matchType,
        country: sr.country,
        industry: sr.industry,
        tier: sr.tier,
        rawData: sr.rawData,
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Persist company matches
    const companyMatches: CompanyMatch[] = [];
    for (const cm of companyRes.companyMatches || []) {
      const matchObj: CompanyMatch = {
        id: `cm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        candidateId: candidate.id,
        companyName: cm.companyName,
        orgNumber: cm.orgNumber,
        country: cm.country,
        status: cm.status,
        industry: cm.industry,
        source: cm.source,
        url: cm.url,
        similarityScore: cm.similarityScore,
        riskLevel: cm.riskLevel,
      };
      db.insertCompanyMatch(matchObj);
      companyMatches.push(matchObj);
    }

    // 4. Persist trademark matches
    const trademarkMatches: TrademarkMatch[] = [];
    for (const tm of tmRes.trademarkMatches || []) {
      const tmObj: TrademarkMatch = {
        id: `tm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        candidateId: candidate.id,
        markName: tm.markName,
        jurisdiction: tm.jurisdiction,
        owner: tm.owner,
        status: tm.status,
        classes: tm.classes,
        source: tm.source,
        url: tm.url,
        similarityScore: tm.similarityScore,
        riskLevel: tm.riskLevel,
      };
      db.insertTrademarkMatch(tmObj);
      trademarkMatches.push(tmObj);
    }

    // 5. Persist domain results
    const domainResults: DomainResult[] = [];
    for (const dr of domainRes.domainResults || []) {
      const domObj: DomainResult = {
        id: `dom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        candidateId: candidate.id,
        domain: dr.domain,
        tld: dr.tld,
        status: dr.status,
        nameservers: dr.nameservers,
        registrar: dr.registrar,
        queryTime: dr.queryTime,
        notes: dr.notes,
      };
      db.insertDomainResult(domObj);
      domainResults.push(domObj);
    }

    // 6. Persist software matches
    const softwareMatches: SoftwareMatch[] = [];
    for (const sm of softRes.softwareMatches || []) {
      const softObj: SoftwareMatch = {
        id: `soft_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        candidateId: candidate.id,
        name: sm.name,
        platform: sm.platform,
        version: sm.version,
        developer: sm.developer,
        url: sm.url,
        matchType: sm.matchType,
        category: sm.category,
      };
      db.insertSoftwareMatch(softObj);
      softwareMatches.push(softObj);
    }

    // 7. Calculate Similarity against known industry marks & common vocabulary
    const KNOWN_INDUSTRY_MARKS = [
      'Stripe', 'Spotify', 'Vipps', 'Klarna', 'Slack', 'Linear', 'Notion', 'Figma',
      'Canva', 'Shopify', 'Brex', 'Ramp', 'Plaid', 'Adyen', 'Twilio', 'Vercel',
    ];
    const similarityMatches: SimilarityMatch[] = [];
    for (const known of KNOWN_INDUSTRY_MARKS) {
      const comparison = compareNames(candidate.name, known);
      if (comparison.compositeScore >= 0.60) {
        const simObj: SimilarityMatch = {
          id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          candidateId: candidate.id,
          comparedName: known,
          algorithm: 'jaro_winkler',
          score: comparison.compositeScore,
          matchNature: comparison.explanation,
        };
        db.insertSimilarityMatch(simObj);
        similarityMatches.push(simObj);
      }
    }

    // 8. Run Explainable Risk Assessment
    const riskEval = evaluateRisk({
      candidateName: candidate.name,
      companyMatches,
      trademarkMatches,
      domainResults,
      softwareMatches,
      targetMarket: options.market,
      targetIndustry: options.industry,
    });

    db.saveRiskScore(candidate.id, {
      overallLevel: riskEval.overallLevel,
      score: riskEval.overallScore,
      factors: riskEval.factors,
      recommendation: riskEval.recommendation,
    });

    // 9. Update Candidate Record
    candidate.riskLevel = riskEval.overallLevel;
    candidate.riskScore = riskEval.overallScore;
    candidate.riskSummary = riskEval.recommendation;
    candidate.searchStatus = options.deep ? 'deep_verified' : 'screened';
    candidate.verificationTimestamp = new Date().toISOString();

    db.updateCandidate(candidate);
    db.completeSearchRun(run.id, 'completed');

    // 10. Generate initial Markdown dossier report
    const dossierMarkdown = generateMarkdownReport(candidate, riskEval, companyMatches, trademarkMatches, domainResults, softwareMatches);
    db.saveVerificationReport(candidate.id, dossierMarkdown, {
      overallLevel: riskEval.overallLevel,
      score: riskEval.overallScore,
      sourcesCount: allSearchResults.length,
    });

    return candidate;
  } catch (err) {
    db.completeSearchRun(run.id, 'failed');
    candidate.searchStatus = 'failed';
    db.updateCandidate(candidate);
    throw err;
  }
}

/**
 * Executes full project workflow:
 * 1. Generates large candidate pool
 * 2. Runs screening search and risk classification
 * 3. Eliminates severe RED/BLACK conflicts
 * 4. Iteratively fills pool if needed
 * 5. Returns top 10 ranked candidates
 */
export async function executeProjectWorkflow(brief: NamingBrief, targetShortlistCount = 10): Promise<CandidateName[]> {
  db.logAuditEvent('WORKFLOW_STARTED', 'system', { projectId: brief.id, title: brief.title });

  // 1. Generate large initial pool (20-30 candidates)
  const candidatePool = await generateFullCandidatePool(brief, 25);

  // Persist all generated candidates initially
  for (const cand of candidatePool) {
    db.insertCandidate(cand);
  }

  // 2. Screen candidates in batches to prevent hammering
  const viableCandidates: CandidateName[] = [];
  const rejectedCandidates: CandidateName[] = [];

  for (const cand of candidatePool) {
    try {
      const screened = await screenCandidate(cand, { market: brief.market, industry: brief.industry });

      // Automatic elimination of severe conflicts
      if (screened.riskLevel === 'BLACK' || screened.riskLevel === 'RED') {
        rejectedCandidates.push(screened);
      } else {
        viableCandidates.push(screened);
      }

      // If we have achieved enough viable low-risk candidates, we can stop screening the pool
      if (viableCandidates.length >= targetShortlistCount + 4) {
        break;
      }
    } catch (err) {
      console.error(`Screening failed for ${cand.name}:`, err);
    }
  }

  // 3. If viable count is under targetShortlistCount, generate replacement candidates
  if (viableCandidates.length < targetShortlistCount) {
    const needed = targetShortlistCount - viableCandidates.length;
    const replacementPool = await generateFullCandidatePool({
      ...brief,
      wordsToAvoid: [
        ...(brief.wordsToAvoid || []),
        ...rejectedCandidates.map(c => c.name),
      ],
    }, needed + 5);

    for (const repl of replacementPool) {
      try {
        db.insertCandidate(repl);
        const screened = await screenCandidate(repl, { market: brief.market, industry: brief.industry });
        if (screened.riskLevel !== 'BLACK' && screened.riskLevel !== 'RED') {
          viableCandidates.push(screened);
        }
        if (viableCandidates.length >= targetShortlistCount) break;
      } catch (err) {
        console.error('Replacement screening error:', err);
      }
    }
  }

  // 4. Sort and Rank: Lowest risk score first, then preference for brevity and strategy
  viableCandidates.sort((a, b) => {
    if (a.riskScore !== b.riskScore) return a.riskScore - b.riskScore;
    return a.name.length - b.name.length;
  });

  const finalShortlist = viableCandidates.slice(0, targetShortlistCount);

  db.logAuditEvent('WORKFLOW_COMPLETED', 'system', {
    projectId: brief.id,
    shortlistCount: finalShortlist.length,
    rejectedCount: rejectedCandidates.length,
  });

  return finalShortlist;
}

/**
 * Deep Verify a candidate with comprehensive reporting
 */
export async function executeDeepVerification(candidateId: string): Promise<VerificationDossier> {
  const candidate = db.getCandidate(candidateId);
  if (!candidate) throw new Error(`Candidate with ID ${candidateId} not found`);

  const project = db.getProject(candidate.projectId);
  const updatedCandidate = await screenCandidate(candidate, {
    market: project?.market || 'Global',
    industry: project?.industry || 'Technology',
    deep: true,
  });

  db.logAuditEvent('DEEP_VERIFY_EXECUTED', 'user', { candidateId, name: candidate.name });

  return assembleDossier(updatedCandidate.id);
}

/**
 * Fresh Recheck of candidate bypassing cache
 */
export async function executeRecheck(candidateId: string): Promise<VerificationDossier> {
  const candidate = db.getCandidate(candidateId);
  if (!candidate) throw new Error(`Candidate with ID ${candidateId} not found`);

  const project = db.getProject(candidate.projectId);
  const updatedCandidate = await screenCandidate(candidate, {
    market: project?.market || 'Global',
    industry: project?.industry || 'Technology',
    deep: false,
  });

  db.logAuditEvent('RECHECK_EXECUTED', 'user', { candidateId, name: candidate.name });

  return assembleDossier(updatedCandidate.id);
}

/**
 * Assembles full forensic evidence dossier
 */
export function assembleDossier(candidateId: string): VerificationDossier {
  const candidate = db.getCandidate(candidateId);
  if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

  const risk = db.getRiskScore(candidateId) || {
    overallLevel: candidate.riskLevel,
    score: candidate.riskScore,
    factors: [],
    recommendation: candidate.riskSummary,
    legalDisclaimer: 'Preliminary conflict screening only.',
  };

  const companyMatches = db.getCompanyMatches(candidateId);
  const trademarkMatches = db.getTrademarkMatches(candidateId);
  const domainResults = db.getDomainResults(candidateId);
  const softwareMatches = db.getSoftwareMatches(candidateId);
  const similarityMatches = db.getSimilarityMatches(candidateId);
  const searchResults = db.getSearchResultsByCandidate(candidateId);

  return {
    candidate,
    risk: {
      overallLevel: risk.overallLevel,
      overallScore: risk.score,
      recommendation: risk.recommendation,
      factors: (risk.factors as unknown[]) as VerificationDossier['risk']['factors'],
      legalDisclaimer: 'Preliminary screening only. Not legal clearance.',
    },
    companyMatches,
    trademarkMatches,
    domainResults,
    softwareMatches,
    similarityMatches,
    searchResults,
    searchRuns: [],
    lastChecked: candidate.verificationTimestamp,
  };
}

/**
 * Generates an authoritative Markdown evidence report
 */
function generateMarkdownReport(
  candidate: CandidateName,
  risk: ReturnType<typeof evaluateRisk>,
  companies: CompanyMatch[],
  trademarks: TrademarkMatch[],
  domains: DomainResult[],
  software: SoftwareMatch[]
): string {
  const date = new Date().toISOString().split('T')[0];

  return `# VERIFICATION DOSSIER & EVIDENCE REPORT: "${candidate.name.toUpperCase()}"
**Date of Investigation:** ${date}
**Overall Conflict Classification:** ${risk.overallLevel} (${risk.overallScore}/100 Risk Score)
**Status Classification:** ${risk.overallLevel === 'GREEN' ? 'Preliminary Low-Conflict Candidate' : risk.recommendation}

---

## 1. Executive Summary & Assessment
- **Name:** ${candidate.name}
- **Pronunciation:** ${candidate.pronunciation}
- **Concept:** ${candidate.concept}
- **Naming Strategy:** ${candidate.namingStrategy}
- **Strategic Fit:** ${candidate.whyFits}
- **Recommendation:** ${risk.recommendation}

> **LEGAL NOTICE:** ${risk.legalDisclaimer}

---

## 2. Risk Factors Analysis
${risk.factors.map(f => `- **[${f.impact.toUpperCase()}] ${f.factor}** (Weight: ${f.weight}): ${f.detail}`).join('\n')}

---

## 3. Official Company Registry Records (Tier 1)
${companies.length === 0 ? '_No active entity collisions identified in Brønnøysundregistrene or corporate indexes._' : companies.map(c => `
- **Company:** ${c.companyName} (${c.country})
  - Status: ${c.status}
  - Org.nr: ${c.orgNumber || 'N/A'}
  - Industry: ${c.industry || 'General'}
  - Similarity: ${(c.similarityScore * 100).toFixed(0)}%
  - Reference: ${c.url ? `[Official Registry Record](${c.url})` : 'N/A'}
`).join('')}

---

## 4. Trademark Registries Investigation (Tier 1)
- Sources Checked: EUIPO (eSearch), WIPO Global Brand Database, USPTO TSDR, Patentstyret.
${trademarks.length === 0 ? '_No direct exact active trademark collision detected in screening queries._' : trademarks.map(t => `
- **Mark:** "${t.markName}" (${t.jurisdiction})
  - Owner: ${t.owner || 'Undisclosed'}
  - Status: ${t.status}
  - Classes: ${t.classes.join(', ')}
  - Similarity: ${(t.similarityScore * 100).toFixed(0)}%
  - Registry URL: ${t.url ? `[Trademark Portal](${t.url})` : 'N/A'}
`).join('')}

---

## 5. Domain Name Availability (RDAP & DNS)
${domains.map(d => `- **${d.domain}**: \`${d.status.toUpperCase()}\` — ${d.notes}`).join('\n')}

---

## 6. Software & Application Store Clashes (Tier 1 & 2)
- Registries Screened: Apple App Store, npm Registry, PyPI, GitHub.
${software.length === 0 ? '_No direct software package or published app store name collision found._' : software.map(s => `
- **${s.name}** on **${s.platform.toUpperCase()}**
  - Developer: ${s.developer || 'N/A'}
  - Match Type: ${s.matchType}
  - Category: ${s.category || 'Software'}
  - Link: ${s.url ? `[Inspect Product](${s.url})` : 'N/A'}
`).join('')}

---
*Report automatically compiled by Name Discovery & Verification Engine.*
`;
}
