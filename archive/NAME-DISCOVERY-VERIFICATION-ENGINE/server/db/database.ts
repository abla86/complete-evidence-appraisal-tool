/**
 * Database Persistence Module
 * Authoritative storage using SQLite for projects, candidates, search runs,
 * external matches, similarity records, risk evaluations, and audit logs.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'node:module';

// In CJS bundle, require is already available globally; in ESM, createRequire using fallback url
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safeRequire: any = typeof require === 'function' 
  ? require 
  : createRequire(typeof import.meta !== 'undefined' && import.meta.url ? import.meta.url : `file://${process.cwd()}/index.js`);
import {
  CandidateName,
  CompanyMatch,
  DomainResult,
  NamingBrief,
  RiskLevel,
  RiskScore,
  SearchResult,
  SimilarityMatch,
  SoftwareMatch,
  TrademarkMatch,
  VerificationReport,
  AuditLogEntry,
  SearchRun,
} from '../../src/types/index.js';

export interface SqliteDbInterface {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...params: unknown[]): { lastInsertRowid: number | bigint; changes: number };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

let dbInstance: SqliteDbInterface | null = null;

export function getDatabase(): SqliteDbInterface {
  if (dbInstance) return dbInstance;

  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'namedb.sqlite');

  // Load node:sqlite DatabaseSync
  const sqliteModule = safeRequire('node:sqlite');
  const db = new sqliteModule.DatabaseSync(dbPath) as SqliteDbInterface;

  // Initialize schema & pragmas
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      description TEXT,
      industry TEXT,
      target_audience TEXT,
      market TEXT NOT NULL DEFAULT 'Global',
      languages_json TEXT,
      desired_tone TEXT,
      desired_length TEXT,
      pronunciation_preference TEXT,
      word_type TEXT,
      words_include_json TEXT,
      words_avoid_json TEXT,
      letters_avoid_json TEXT,
      concepts_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS candidate_names (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      pronunciation TEXT,
      concept TEXT,
      naming_strategy TEXT,
      why_fits TEXT,
      risk_level TEXT NOT NULL DEFAULT 'YELLOW',
      risk_score REAL NOT NULL DEFAULT 50.0,
      risk_summary TEXT,
      is_watched INTEGER NOT NULL DEFAULT 0,
      search_status TEXT NOT NULL DEFAULT 'pending',
      verification_timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_candidates_proj ON candidate_names(project_id);
    CREATE INDEX IF NOT EXISTS idx_candidates_risk ON candidate_names(risk_level);
    CREATE INDEX IF NOT EXISTS idx_candidates_watched ON candidate_names(is_watched);

    CREATE TABLE IF NOT EXISTS search_runs (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      run_type TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY(candidate_id) REFERENCES candidate_names(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS search_results (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      source_name TEXT NOT NULL,
      source_category TEXT NOT NULL,
      query TEXT NOT NULL,
      url TEXT,
      result_title TEXT,
      result_snippet TEXT,
      match_type TEXT NOT NULL,
      country TEXT,
      industry TEXT,
      tier INTEGER NOT NULL,
      raw_data_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(candidate_id) REFERENCES candidate_names(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_search_results_cand ON search_results(candidate_id);

    CREATE TABLE IF NOT EXISTS company_matches (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      company_name TEXT NOT NULL,
      org_number TEXT,
      country TEXT NOT NULL,
      status TEXT NOT NULL,
      industry TEXT,
      source TEXT NOT NULL,
      url TEXT,
      similarity_score REAL NOT NULL,
      risk_level TEXT NOT NULL,
      FOREIGN KEY(candidate_id) REFERENCES candidate_names(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_company_cand ON company_matches(candidate_id);

    CREATE TABLE IF NOT EXISTS trademark_matches (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      mark_name TEXT NOT NULL,
      jurisdiction TEXT NOT NULL,
      owner TEXT,
      status TEXT NOT NULL,
      classes_json TEXT,
      source TEXT NOT NULL,
      url TEXT,
      similarity_score REAL NOT NULL,
      risk_level TEXT NOT NULL,
      FOREIGN KEY(candidate_id) REFERENCES candidate_names(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_trademark_cand ON trademark_matches(candidate_id);

    CREATE TABLE IF NOT EXISTS domain_results (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      domain TEXT NOT NULL,
      tld TEXT NOT NULL,
      status TEXT NOT NULL,
      nameservers_json TEXT,
      registrar TEXT,
      query_time TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY(candidate_id) REFERENCES candidate_names(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_domain_cand ON domain_results(candidate_id);

    CREATE TABLE IF NOT EXISTS software_matches (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      version TEXT,
      developer TEXT,
      url TEXT,
      match_type TEXT NOT NULL,
      category TEXT,
      FOREIGN KEY(candidate_id) REFERENCES candidate_names(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_software_cand ON software_matches(candidate_id);

    CREATE TABLE IF NOT EXISTS similarity_matches (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      compared_name TEXT NOT NULL,
      algorithm TEXT NOT NULL,
      score REAL NOT NULL,
      match_nature TEXT,
      FOREIGN KEY(candidate_id) REFERENCES candidate_names(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS risk_scores (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL UNIQUE,
      overall_level TEXT NOT NULL,
      score REAL NOT NULL,
      factors_json TEXT NOT NULL,
      recommendation TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(candidate_id) REFERENCES candidate_names(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verification_reports (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL UNIQUE,
      report_markdown TEXT NOT NULL,
      summary_json TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      FOREIGN KEY(candidate_id) REFERENCES candidate_names(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      actor TEXT NOT NULL,
      details_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at);
  `);

  dbInstance = db;
  return dbInstance;
}

// Helper query wrappers
export function createProject(brief: NamingBrief): NamingBrief {
  const db = getDatabase();
  const id = brief.id || `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO projects (
      id, title, entity_type, description, industry, target_audience,
      market, languages_json, desired_tone, desired_length,
      pronunciation_preference, word_type, words_include_json,
      words_avoid_json, letters_avoid_json, concepts_json,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    brief.title,
    brief.entityType,
    brief.description || '',
    brief.industry || '',
    brief.targetAudience || '',
    brief.market || 'Global',
    JSON.stringify(brief.languages || ['en']),
    brief.desiredTone || 'minimal',
    brief.desiredLength || 'any',
    brief.pronunciationPreference || 'open',
    brief.wordType || 'any',
    JSON.stringify(brief.wordsToInclude || []),
    JSON.stringify(brief.wordsToAvoid || []),
    JSON.stringify(brief.lettersToAvoid || []),
    JSON.stringify(brief.conceptsToCommunicate || []),
    now,
    now
  );

  return { ...brief, id, createdAt: now, updatedAt: now };
}

export function getProject(id: string): NamingBrief | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  if (!row) return null;

  return {
    id: String(row.id),
    title: String(row.title),
    entityType: row.entity_type as NamingBrief['entityType'],
    description: String(row.description || ''),
    industry: String(row.industry || ''),
    targetAudience: String(row.target_audience || ''),
    market: row.market as NamingBrief['market'],
    languages: JSON.parse(String(row.languages_json || '[]')),
    desiredTone: row.desired_tone as NamingBrief['desiredTone'],
    desiredLength: row.desired_length as NamingBrief['desiredLength'],
    pronunciationPreference: String(row.pronunciation_preference || ''),
    wordType: row.word_type as NamingBrief['wordType'],
    wordsToInclude: JSON.parse(String(row.words_include_json || '[]')),
    wordsToAvoid: JSON.parse(String(row.words_avoid_json || '[]')),
    lettersToAvoid: JSON.parse(String(row.letters_avoid_json || '[]')),
    conceptsToCommunicate: JSON.parse(String(row.concepts_json || '[]')),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function listProjects(): NamingBrief[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
  const rows = stmt.all() as Record<string, unknown>[];

  return rows.map(row => ({
    id: String(row.id),
    title: String(row.title),
    entityType: row.entity_type as NamingBrief['entityType'],
    description: String(row.description || ''),
    industry: String(row.industry || ''),
    targetAudience: String(row.target_audience || ''),
    market: row.market as NamingBrief['market'],
    languages: JSON.parse(String(row.languages_json || '[]')),
    desiredTone: row.desired_tone as NamingBrief['desiredTone'],
    desiredLength: row.desired_length as NamingBrief['desiredLength'],
    pronunciationPreference: String(row.pronunciation_preference || ''),
    wordType: row.word_type as NamingBrief['wordType'],
    wordsToInclude: JSON.parse(String(row.words_include_json || '[]')),
    wordsToAvoid: JSON.parse(String(row.words_avoid_json || '[]')),
    lettersToAvoid: JSON.parse(String(row.letters_avoid_json || '[]')),
    conceptsToCommunicate: JSON.parse(String(row.concepts_json || '[]')),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }));
}

export function deleteProject(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  const res = stmt.run(id);
  return res.changes > 0;
}

export function insertCandidate(cand: CandidateName): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO candidate_names (
      id, project_id, name, normalized_name, pronunciation, concept,
      naming_strategy, why_fits, risk_level, risk_score, risk_summary,
      is_watched, search_status, verification_timestamp, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    cand.id,
    cand.projectId,
    cand.name,
    cand.normalizedName,
    cand.pronunciation || '',
    cand.concept || '',
    cand.namingStrategy || 'invented',
    cand.whyFits || '',
    cand.riskLevel || 'YELLOW',
    cand.riskScore || 50.0,
    cand.riskSummary || '',
    cand.isWatched ? 1 : 0,
    cand.searchStatus || 'pending',
    cand.verificationTimestamp || new Date().toISOString(),
    cand.createdAt || new Date().toISOString()
  );
}

export function updateCandidate(cand: CandidateName): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE candidate_names SET
      risk_level = ?,
      risk_score = ?,
      risk_summary = ?,
      is_watched = ?,
      search_status = ?,
      verification_timestamp = ?
    WHERE id = ?
  `);

  stmt.run(
    cand.riskLevel,
    cand.riskScore,
    cand.riskSummary,
    cand.isWatched ? 1 : 0,
    cand.searchStatus,
    cand.verificationTimestamp,
    cand.id
  );
}

export function updateCandidateRisk(
  id: string,
  riskLevel: RiskLevel,
  riskScore: number,
  riskSummary: string
): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE candidate_names SET
      risk_level = ?,
      risk_score = ?,
      risk_summary = ?,
      verification_timestamp = ?
    WHERE id = ?
  `);
  stmt.run(riskLevel, riskScore, riskSummary, new Date().toISOString(), id);
}


export function getCandidate(id: string): CandidateName | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM candidate_names WHERE id = ?');
  const row = stmt.get(id) as Record<string, unknown> | undefined;
  if (!row) return null;

  return mapCandidateRow(row);
}

export function listCandidatesByProject(projectId: string): CandidateName[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM company_matches cm WHERE cm.candidate_id = c.id) as company_count,
      (SELECT COUNT(*) FROM trademark_matches tm WHERE tm.candidate_id = c.id) as tm_count,
      (SELECT COUNT(*) FROM domain_results dm WHERE dm.candidate_id = c.id) as domain_count,
      (SELECT COUNT(*) FROM software_matches sm WHERE sm.candidate_id = c.id) as software_count,
      (SELECT COUNT(*) FROM similarity_matches sim WHERE sim.candidate_id = c.id) as sim_count,
      (SELECT COUNT(*) FROM search_results sr WHERE sr.candidate_id = c.id) as source_count
    FROM candidate_names c
    WHERE c.project_id = ?
    ORDER BY c.risk_score ASC, c.created_at DESC
  `);
  const rows = stmt.all(projectId) as Record<string, unknown>[];

  return rows.map(r => {
    const cand = mapCandidateRow(r);
    cand.companyMatchesCount = Number(r.company_count || 0);
    cand.trademarkMatchesCount = Number(r.tm_count || 0);
    cand.domainResultsCount = Number(r.domain_count || 0);
    cand.softwareMatchesCount = Number(r.software_count || 0);
    cand.similarNamesCount = Number(r.sim_count || 0);
    cand.searchedSourcesCount = Number(r.source_count || 0);
    return cand;
  });
}

export function toggleWatchCandidate(id: string): boolean {
  const db = getDatabase();
  const cand = getCandidate(id);
  if (!cand) return false;
  const newWatched = !cand.isWatched;
  db.prepare('UPDATE candidate_names SET is_watched = ? WHERE id = ?').run(newWatched ? 1 : 0, id);
  return newWatched;
}

export function getWatchlist(): CandidateName[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM candidate_names WHERE is_watched = 1 ORDER BY verification_timestamp DESC');
  const rows = stmt.all() as Record<string, unknown>[];
  return rows.map(mapCandidateRow);
}

function mapCandidateRow(row: Record<string, unknown>): CandidateName {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    name: String(row.name),
    normalizedName: String(row.normalized_name),
    pronunciation: String(row.pronunciation || ''),
    concept: String(row.concept || ''),
    namingStrategy: String(row.naming_strategy || ''),
    whyFits: String(row.why_fits || ''),
    riskLevel: row.risk_level as RiskLevel,
    riskScore: Number(row.risk_score || 0),
    riskSummary: String(row.risk_summary || ''),
    isWatched: Boolean(row.is_watched),
    searchStatus: row.search_status as CandidateName['searchStatus'],
    verificationTimestamp: String(row.verification_timestamp),
    createdAt: String(row.created_at),
  };
}

export function createSearchRun(candidateId: string, runType: SearchRun['runType']): SearchRun {
  const db = getDatabase();
  const id = `run_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const startedAt = new Date().toISOString();

  db.prepare('INSERT INTO search_runs (id, candidate_id, run_type, status, started_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, candidateId, runType, 'running', startedAt);

  return { id, candidateId, runType, status: 'running', startedAt };
}

export function completeSearchRun(id: string, status: 'completed' | 'failed'): void {
  const db = getDatabase();
  db.prepare('UPDATE search_runs SET status = ?, completed_at = ? WHERE id = ?')
    .run(status, new Date().toISOString(), id);
}

export function insertSearchResult(res: SearchResult): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO search_results (
      id, run_id, candidate_id, source_name, source_category, query,
      url, result_title, result_snippet, match_type, country, industry,
      tier, raw_data_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    res.id,
    res.runId,
    res.candidateId,
    res.sourceName,
    res.sourceCategory,
    res.query,
    res.url || '',
    res.resultTitle,
    res.resultSnippet,
    res.matchType,
    res.country || '',
    res.industry || '',
    res.tier,
    JSON.stringify(res.rawData || {}),
    res.createdAt || new Date().toISOString()
  );
}

export function getSearchResultsByCandidate(candidateId: string): SearchResult[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM search_results WHERE candidate_id = ? ORDER BY tier ASC, created_at DESC')
    .all(candidateId) as Record<string, unknown>[];

  return rows.map(r => ({
    id: String(r.id),
    runId: String(r.run_id),
    candidateId: String(r.candidate_id),
    sourceName: String(r.source_name),
    sourceCategory: r.source_category as SearchResult['sourceCategory'],
    query: String(r.query),
    url: String(r.url || ''),
    resultTitle: String(r.result_title),
    resultSnippet: String(r.result_snippet),
    matchType: r.match_type as SearchResult['matchType'],
    country: String(r.country || ''),
    industry: String(r.industry || ''),
    tier: Number(r.tier) as 1 | 2 | 3,
    rawData: JSON.parse(String(r.raw_data_json || '{}')),
    createdAt: String(r.created_at),
  }));
}

export function insertCompanyMatch(match: CompanyMatch): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO company_matches (
      id, candidate_id, company_name, org_number, country, status,
      industry, source, url, similarity_score, risk_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    match.id,
    match.candidateId,
    match.companyName,
    match.orgNumber || '',
    match.country,
    match.status,
    match.industry || '',
    match.source,
    match.url || '',
    match.similarityScore,
    match.riskLevel
  );
}

export function getCompanyMatches(candidateId: string): CompanyMatch[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM company_matches WHERE candidate_id = ? ORDER BY similarity_score DESC')
    .all(candidateId) as Record<string, unknown>[];

  return rows.map(r => ({
    id: String(r.id),
    candidateId: String(r.candidate_id),
    companyName: String(r.company_name),
    orgNumber: String(r.org_number || ''),
    country: String(r.country),
    status: String(r.status),
    industry: String(r.industry || ''),
    source: String(r.source),
    url: String(r.url || ''),
    similarityScore: Number(r.similarity_score),
    riskLevel: r.risk_level as RiskLevel,
  }));
}

export function insertTrademarkMatch(match: TrademarkMatch): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO trademark_matches (
      id, candidate_id, mark_name, jurisdiction, owner, status,
      classes_json, source, url, similarity_score, risk_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    match.id,
    match.candidateId,
    match.markName,
    match.jurisdiction,
    match.owner || '',
    match.status,
    JSON.stringify(match.classes || []),
    match.source,
    match.url || '',
    match.similarityScore,
    match.riskLevel
  );
}

export function getTrademarkMatches(candidateId: string): TrademarkMatch[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM trademark_matches WHERE candidate_id = ? ORDER BY similarity_score DESC')
    .all(candidateId) as Record<string, unknown>[];

  return rows.map(r => ({
    id: String(r.id),
    candidateId: String(r.candidate_id),
    markName: String(r.mark_name),
    jurisdiction: String(r.jurisdiction),
    owner: String(r.owner || ''),
    status: String(r.status),
    classes: JSON.parse(String(r.classes_json || '[]')),
    source: String(r.source),
    url: String(r.url || ''),
    similarityScore: Number(r.similarity_score),
    riskLevel: r.risk_level as RiskLevel,
  }));
}

export function insertDomainResult(res: DomainResult): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO domain_results (
      id, candidate_id, domain, tld, status, nameservers_json,
      registrar, query_time, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    res.id,
    res.candidateId,
    res.domain,
    res.tld,
    res.status,
    JSON.stringify(res.nameservers || []),
    res.registrar || '',
    res.queryTime,
    res.notes || ''
  );
}

export function getDomainResults(candidateId: string): DomainResult[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM domain_results WHERE candidate_id = ?').all(candidateId) as Record<string, unknown>[];

  return rows.map(r => ({
    id: String(r.id),
    candidateId: String(r.candidate_id),
    domain: String(r.domain),
    tld: String(r.tld),
    status: r.status as DomainResult['status'],
    nameservers: JSON.parse(String(r.nameservers_json || '[]')),
    registrar: String(r.registrar || ''),
    queryTime: String(r.query_time),
    notes: String(r.notes || ''),
  }));
}

export function insertSoftwareMatch(match: SoftwareMatch): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO software_matches (
      id, candidate_id, name, platform, version, developer,
      url, match_type, category
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    match.id,
    match.candidateId,
    match.name,
    match.platform,
    match.version || '',
    match.developer || '',
    match.url || '',
    match.matchType,
    match.category || ''
  );
}

export function getSoftwareMatches(candidateId: string): SoftwareMatch[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM software_matches WHERE candidate_id = ?').all(candidateId) as Record<string, unknown>[];

  return rows.map(r => ({
    id: String(r.id),
    candidateId: String(r.candidate_id),
    name: String(r.name),
    platform: r.platform as SoftwareMatch['platform'],
    version: String(r.version || ''),
    developer: String(r.developer || ''),
    url: String(r.url || ''),
    matchType: r.match_type as SoftwareMatch['matchType'],
    category: String(r.category || ''),
  }));
}

export function insertSimilarityMatch(match: SimilarityMatch): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO similarity_matches (
      id, candidate_id, compared_name, algorithm, score, match_nature
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    match.id,
    match.candidateId,
    match.comparedName,
    match.algorithm,
    match.score,
    match.matchNature || ''
  );
}

export function getSimilarityMatches(candidateId: string): SimilarityMatch[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM similarity_matches WHERE candidate_id = ? ORDER BY score DESC').all(candidateId) as Record<string, unknown>[];

  return rows.map(r => ({
    id: String(r.id),
    candidateId: String(r.candidate_id),
    comparedName: String(r.compared_name),
    algorithm: r.algorithm as SimilarityMatch['algorithm'],
    score: Number(r.score),
    matchNature: String(r.match_nature || ''),
  }));
}

export function saveRiskScore(candidateId: string, risk: { overallLevel: RiskLevel; score: number; factors: unknown[]; recommendation: string }): void {
  const db = getDatabase();
  const id = `risk_${candidateId}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO risk_scores (id, candidate_id, overall_level, score, factors_json, recommendation, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(candidate_id) DO UPDATE SET
      overall_level = excluded.overall_level,
      score = excluded.score,
      factors_json = excluded.factors_json,
      recommendation = excluded.recommendation,
      updated_at = excluded.updated_at
  `).run(
    id,
    candidateId,
    risk.overallLevel,
    risk.score,
    JSON.stringify(risk.factors),
    risk.recommendation,
    now
  );
}

export function getRiskScore(candidateId: string): { overallLevel: RiskLevel; score: number; factors: unknown[]; recommendation: string } | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM risk_scores WHERE candidate_id = ?').get(candidateId) as Record<string, unknown> | undefined;
  if (!row) return null;

  return {
    overallLevel: row.overall_level as RiskLevel,
    score: Number(row.score),
    factors: JSON.parse(String(row.factors_json || '[]')),
    recommendation: String(row.recommendation || ''),
  };
}

export function saveVerificationReport(candidateId: string, markdown: string, summary: Record<string, unknown>): void {
  const db = getDatabase();
  const id = `rep_${candidateId}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO verification_reports (id, candidate_id, report_markdown, summary_json, generated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(candidate_id) DO UPDATE SET
      report_markdown = excluded.report_markdown,
      summary_json = excluded.summary_json,
      generated_at = excluded.generated_at
  `).run(id, candidateId, markdown, JSON.stringify(summary), now);
}

export function getVerificationReport(candidateId: string): string | null {
  const db = getDatabase();
  const row = db.prepare('SELECT report_markdown FROM verification_reports WHERE candidate_id = ?').get(candidateId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return String(row.report_markdown);
}

export function logAuditEvent(eventType: string, actor: string, details: Record<string, unknown>): void {
  try {
    const db = getDatabase();
    const id = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    db.prepare('INSERT INTO audit_logs (id, event_type, actor, details_json, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, eventType, actor, JSON.stringify(details), new Date().toISOString());
  } catch (err) {
    console.error('Audit log failure:', err);
  }
}

export function getAuditLogs(limit = 100): AuditLogEntry[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit) as Record<string, unknown>[];

  return rows.map(r => ({
    id: String(r.id),
    action: String(r.event_type),
    eventType: String(r.event_type),
    actor: String(r.actor),
    details: JSON.parse(String(r.details_json || '{}')),
    createdAt: String(r.created_at),
  }));
}
