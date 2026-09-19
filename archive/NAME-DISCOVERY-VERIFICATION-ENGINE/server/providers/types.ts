import {
  CompanyMatch,
  DomainResult,
  SearchResult,
  SoftwareMatch,
  TrademarkMatch,
} from '../../src/types/index.js';

export type ProviderCategory =
  | 'company'
  | 'trademark'
  | 'domain'
  | 'software'
  | 'web'
  | 'social';

export type ProviderTier = 1 | 2 | 3;

export interface ProviderExecutionResult {
  providerName: string;
  category: ProviderCategory;
  tier: ProviderTier;
  success: boolean;
  error?: string;
  durationMs: number;
  searchResults: Omit<SearchResult, 'id' | 'runId' | 'candidateId' | 'createdAt'>[];
  companyMatches?: Omit<CompanyMatch, 'id' | 'candidateId'>[];
  trademarkMatches?: Omit<TrademarkMatch, 'id' | 'candidateId'>[];
  domainResults?: Omit<DomainResult, 'id' | 'candidateId'>[];
  softwareMatches?: Omit<SoftwareMatch, 'id' | 'candidateId'>[];
}

export interface SearchProvider {
  readonly name: string;
  readonly category: ProviderCategory;
  readonly tier: ProviderTier;
  execute(candidateName: string, options?: { country?: string; industry?: string; deep?: boolean }): Promise<ProviderExecutionResult>;
}
