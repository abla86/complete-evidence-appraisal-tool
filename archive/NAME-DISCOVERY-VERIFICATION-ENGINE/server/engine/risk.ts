import {
  CompanyMatch,
  DomainResult,
  RiskEvaluation,
  RiskFactor,
  RiskLevel,
  SoftwareMatch,
  TrademarkMatch,
} from '../../src/types/index.js';

export interface EvidencePayload {
  candidateName: string;
  companyMatches: CompanyMatch[];
  trademarkMatches: TrademarkMatch[];
  domainResults: DomainResult[];
  softwareMatches: SoftwareMatch[];
  targetMarket?: string;
  targetIndustry?: string;
}

const LEGAL_DISCLAIMER =
  'IMPORTANT LEGAL NOTICE: This evaluation is an algorithmic conflict screening tool and DOES NOT constitute legal advice or formal clearance. A "Preliminary low-conflict candidate" status is not a guarantee of legal availability or trademark registrability. Formal trademark clearance through a licensed IP attorney is strictly recommended.';

export function evaluateRisk(evidence: EvidencePayload): RiskEvaluation {
  const factors: RiskFactor[] = [];
  let score = 0; // 0 = lowest risk, 100 = extreme conflict

  // 1. Trademark Conflicts (Highest Weight)
  const exactTrademark = evidence.trademarkMatches.find(
    tm => tm.similarityScore >= 0.92 || tm.riskLevel === 'RED' || tm.riskLevel === 'BLACK'
  );
  if (exactTrademark) {
    if (exactTrademark.riskLevel === 'BLACK') {
      score += 90;
      factors.push({
        factor: 'Famous Brand / Direct Trademark Conflict',
        weight: 90,
        impact: 'critical',
        detail: `Exact or near-identical collision with high-profile mark "${exactTrademark.markName}" (${exactTrademark.jurisdiction}).`,
        sourceRef: exactTrademark.url,
      });
    } else {
      score += 65;
      factors.push({
        factor: 'Direct Registered Trademark Collision',
        weight: 65,
        impact: 'critical',
        detail: `Registered mark "${exactTrademark.markName}" in ${exactTrademark.jurisdiction} (Owner: ${exactTrademark.owner || 'Undisclosed'}).`,
        sourceRef: exactTrademark.url,
      });
    }
  } else {
    const similarTrademark = evidence.trademarkMatches.find(tm => tm.similarityScore >= 0.70);
    if (similarTrademark) {
      score += 35;
      factors.push({
        factor: 'Phonetically or Visually Similar Trademark',
        weight: 35,
        impact: 'high',
        detail: `Existing registration for "${similarTrademark.markName}" (${(similarTrademark.similarityScore * 100).toFixed(0)}% similarity).`,
        sourceRef: similarTrademark.url,
      });
    }
  }

  // 2. Company Register Matches (Brønnøysund & International)
  const activeCompany = evidence.companyMatches.find(
    c => c.status === 'Active' && c.similarityScore >= 0.85
  );
  if (activeCompany) {
    const isExact = activeCompany.similarityScore >= 0.95;
    const addedScore = isExact ? 55 : 35;
    score += addedScore;
    factors.push({
      factor: isExact ? 'Active Company Exact Name Collision' : 'Active Company High Similarity',
      weight: addedScore,
      impact: isExact ? 'high' : 'moderate',
      detail: `Found active registered corporate entity "${activeCompany.companyName}" in ${activeCompany.country} (Org: ${activeCompany.orgNumber || 'N/A'}). Industry: ${activeCompany.industry || 'General'}.`,
      sourceRef: activeCompany.url,
    });
  } else {
    const moderateCompany = evidence.companyMatches.find(c => c.status === 'Active' && c.similarityScore >= 0.65);
    if (moderateCompany) {
      score += 15;
      factors.push({
        factor: 'Active Company Moderate Similarity',
        weight: 15,
        impact: 'low',
        detail: `Similar business name registered in ${moderateCompany.country}: "${moderateCompany.companyName}".`,
        sourceRef: moderateCompany.url,
      });
    }
  }

  // 3. Domain Conflicts (.com and primary TLDs)
  const comDomain = evidence.domainResults.find(d => d.tld === '.com');
  if (comDomain && comDomain.status === 'registered') {
    score += 20;
    factors.push({
      factor: '.com Domain Occupied',
      weight: 20,
      impact: 'moderate',
      detail: `${comDomain.domain} is currently registered with active DNS nameservers or RDAP records.`,
      sourceRef: `https://${comDomain.domain}`,
    });
  }

  // Target market country domain (e.g. .no for Norway)
  if (evidence.targetMarket === 'Norway' || evidence.targetMarket === 'Nordic') {
    const noDomain = evidence.domainResults.find(d => d.tld === '.no');
    if (noDomain && noDomain.status === 'registered') {
      score += 20;
      factors.push({
        factor: '.no Country TLD Occupied',
        weight: 20,
        impact: 'moderate',
        detail: `${noDomain.domain} is actively registered in the Norwegian national top-level domain registry.`,
      });
    }
  }

  // 4. Software & App Store Clashes
  const exactSoftware = evidence.softwareMatches.find(s => s.matchType === 'exact');
  if (exactSoftware) {
    score += 30;
    factors.push({
      factor: 'Existing Software Registry Product',
      weight: 30,
      impact: 'high',
      detail: `Exact product name match on ${exactSoftware.platform.replace('_', ' ').toUpperCase()}: "${exactSoftware.name}" (${exactSoftware.category || 'Software'}).`,
      sourceRef: exactSoftware.url,
    });
  } else {
    const similarSoftware = evidence.softwareMatches.find(s => s.matchType === 'similar');
    if (similarSoftware) {
      score += 12;
      factors.push({
        factor: 'Similar Software Package on Registry',
        weight: 12,
        impact: 'low',
        detail: `Similar software item on ${similarSoftware.platform}: "${similarSoftware.name}".`,
        sourceRef: similarSoftware.url,
      });
    }
  }

  // Determine overall risk level
  let overallLevel: RiskLevel;
  let recommendation: string;

  if (score >= 85) {
    overallLevel = 'BLACK';
    recommendation = 'Reject: Severe brand conflict with established global or registered mark. Not viable for adoption.';
  } else if (score >= 60) {
    overallLevel = 'RED';
    recommendation = 'Strong conflict: Direct active company or registered trademark collision in same territory.';
  } else if (score >= 35) {
    overallLevel = 'ORANGE';
    recommendation = 'Significant conflict: Similar existing marks, occupied core domains, or category overlap.';
  } else if (score >= 18) {
    overallLevel = 'YELLOW';
    recommendation = 'Potential conflict / incomplete evidence: Secondary software or domain overlap. Proceed with targeted review.';
  } else {
    overallLevel = 'GREEN';
    recommendation = 'Preliminary low-conflict candidate: No direct trademark or company collision identified in screened sources.';
  }

  if (factors.length === 0) {
    factors.push({
      factor: 'Clean Registry Screening',
      weight: 0,
      impact: 'low',
      detail: 'No direct trademark, corporate entity, or primary software conflicts detected in searched databases.',
    });
  }

  return {
    overallLevel,
    overallScore: Math.min(100, score),
    recommendation,
    factors,
    legalDisclaimer: LEGAL_DISCLAIMER,
  };
}
