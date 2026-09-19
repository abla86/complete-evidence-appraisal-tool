export type RiskLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' | 'BLACK';

export type EntityType =
  | 'company'
  | 'product'
  | 'platform'
  | 'application'
  | 'service'
  | 'brand';

export type MarketJurisdiction =
  | 'Norway'
  | 'Nordic'
  | 'Europe'
  | 'USA'
  | 'Global';

export type DesiredLength = 'short' | 'medium' | 'any';

export type WordTypePreference =
  | 'invented'
  | 'real'
  | 'compound'
  | 'abstract'
  | 'semantic_blend'
  | 'any';

export type ToneStyle =
  | 'technical'
  | 'creative'
  | 'premium'
  | 'minimal'
  | 'futuristic'
  | 'nordic'
  | 'trustworthy'
  | 'approachable';

export interface NamingBrief {
  id?: string;
  title: string;
  entityType: EntityType;
  description: string;
  industry: string;
  targetAudience: string;
  market: MarketJurisdiction;
  languages: string[];
  desiredTone: ToneStyle;
  desiredLength: DesiredLength;
  pronunciationPreference: string;
  wordType: WordTypePreference;
  wordsToInclude: string[];
  wordsToAvoid: string[];
  lettersToAvoid: string[];
  conceptsToCommunicate: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CandidateName {
  id: string;
  projectId: string;
  name: string;
  normalizedName: string;
  pronunciation: string;
  concept: string;
  namingStrategy: string;
  whyFits: string;
  riskLevel: RiskLevel;
  riskScore: number;
  riskSummary: string;
  isWatched: boolean;
  searchStatus: 'pending' | 'screened' | 'deep_verified' | 'failed';
  verificationTimestamp: string;
  createdAt: string;
  // Aggregate stats
  companyMatchesCount?: number;
  trademarkMatchesCount?: number;
  domainResultsCount?: number;
  softwareMatchesCount?: number;
  similarNamesCount?: number;
  searchedSourcesCount?: number;
}

export interface SearchRun {
  id: string;
  candidateId: string;
  runType: 'screening' | 'deep_verify' | 'recheck';
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
}

export interface SearchResult {
  id: string;
  runId: string;
  candidateId: string;
  sourceName: string;
  sourceCategory: 'company' | 'trademark' | 'domain' | 'software' | 'web' | 'social';
  query: string;
  url?: string;
  resultTitle: string;
  resultSnippet: string;
  matchType: 'exact' | 'similar' | 'phonetic' | 'partial' | 'none';
  country?: string;
  industry?: string;
  tier: 1 | 2 | 3;
  rawData?: Record<string, unknown>;
  createdAt: string;
}

export interface CompanyMatch {
  id: string;
  candidateId: string;
  companyName: string;
  orgNumber?: string;
  country: string;
  status: string; // e.g., 'Active', 'Dissolved', 'Bankrupt'
  industry?: string;
  source: string;
  url?: string;
  similarityScore: number;
  riskLevel: RiskLevel;
}

export interface TrademarkMatch {
  id: string;
  candidateId: string;
  markName: string;
  jurisdiction: string; // EUIPO, WIPO, USPTO, Norway
  owner?: string;
  status: string; // Registered, Pending, Expired
  classes: string[];
  source: string;
  url?: string;
  similarityScore: number;
  riskLevel: RiskLevel;
}

export interface DomainResult {
  id: string;
  candidateId: string;
  domain: string;
  tld: string;
  status: 'registered' | 'unregistered_likely' | 'unverifiable';
  nameservers?: string[];
  registrar?: string;
  queryTime: string;
  notes: string;
}

export interface SoftwareMatch {
  id: string;
  candidateId: string;
  name: string;
  platform: 'app_store' | 'google_play' | 'github' | 'npm' | 'pypi';
  version?: string;
  developer?: string;
  url?: string;
  matchType: 'exact' | 'similar' | 'partial';
  category?: string;
}

export interface SimilarityMatch {
  id: string;
  candidateId: string;
  comparedName: string;
  algorithm: 'levenshtein' | 'jaro_winkler' | 'ngram' | 'soundex' | 'metaphone';
  score: number; // 0 to 1
  matchNature: string;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  impact: 'low' | 'moderate' | 'high' | 'critical';
  detail: string;
  sourceRef?: string;
}

export interface RiskEvaluation {
  overallLevel: RiskLevel;
  overallScore: number; // 0 to 100
  recommendation: string;
  factors: RiskFactor[];
  legalDisclaimer: string;
}

export type RiskScore = RiskEvaluation;

export interface VerificationReport {
  candidateId: string;
  reportMarkdown: string;
  summary: Record<string, unknown>;
  generatedAt: string;
}

export interface VerificationDossier {
  candidate: CandidateName;
  risk: RiskEvaluation;
  companyMatches: CompanyMatch[];
  trademarkMatches: TrademarkMatch[];
  domainResults: DomainResult[];
  softwareMatches: SoftwareMatch[];
  similarityMatches: SimilarityMatch[];
  searchResults: SearchResult[];
  searchRuns: SearchRun[];
  lastChecked: string;
}

export interface AuditLogEntry {
  id: string;
  eventType: string;
  action?: string;
  actor: string;
  details: Record<string, unknown>;
  createdAt: string;
}
