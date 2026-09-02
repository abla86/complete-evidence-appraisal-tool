import type { ReferenceRecord } from './referenceHubService.ts';

export type AcademicLevel = 'MASTER' | 'PHD' | 'ARTICLE' | 'REVIEW' | 'PROTOCOL' | 'REPORT';
export type WritingMode =
  | 'WRITE_FROM_SOURCES'
  | 'SYNTHESIZE_SOURCES'
  | 'WRITE_FROM_PROJECT_DATA'
  | 'EDIT_ONLY'
  | 'ARGUMENT_AUDIT'
  | 'CITATION_AUDIT'
  | 'SUPERVISOR_REVIEW'
  | 'EXAMINER_REVIEW';

export type ClaimType = 'SOURCE_FACT' | 'RESEARCHER_INTERPRETATION' | 'SYNTHESIS' | 'HYPOTHESIS' | 'AI_SUGGESTION';
export type ClaimSupportState = 'SOURCE_VERIFIED' | 'SOURCE_DETECTED' | 'EVIDENCE_LINKED' | 'RESEARCHER_INPUT' | 'UNSUPPORTED';

export interface EvidenceLocation {
  sourceRecordId: string;
  page?: string;
  section?: string;
  quote?: string;
  locator?: string;
}

export interface ClaimLedgerEntry {
  id: string;
  text: string;
  type: ClaimType;
  sourceRecordIds: string[];
  evidenceLocations: EvidenceLocation[];
  supportState: ClaimSupportState;
  uncertaintyNote?: string;
  researcherApproved: boolean;
}

export interface AcademicDraftSection {
  id: string;
  title: string;
  purpose: string;
  text: string;
  claimIds: string[];
}

export interface AcademicWritingProject {
  id: string;
  title: string;
  academicLevel: AcademicLevel;
  writingMode: WritingMode;
  researchQuestion?: string;
  sections: AcademicDraftSection[];
  claims: ClaimLedgerEntry[];
  referenceIds: string[];
  aiAssistanceLog: string[];
  updatedAt: string;
}

export interface WritingAuditResult {
  unsupportedClaims: ClaimLedgerEntry[];
  unverifiedSourceClaims: ClaimLedgerEntry[];
  missingEvidenceLocations: ClaimLedgerEntry[];
  citedButUnlinkedReferenceIds: string[];
  readyForExport: boolean;
}

export function createAcademicWritingProject(input: Pick<AcademicWritingProject, 'id' | 'title' | 'academicLevel' | 'writingMode'> & Partial<AcademicWritingProject>): AcademicWritingProject {
  return {
    id: input.id,
    title: input.title,
    academicLevel: input.academicLevel,
    writingMode: input.writingMode,
    researchQuestion: input.researchQuestion,
    sections: input.sections ?? [],
    claims: input.claims ?? [],
    referenceIds: input.referenceIds ?? [],
    aiAssistanceLog: input.aiAssistanceLog ?? [],
    updatedAt: new Date().toISOString(),
  };
}

export function canDraftAsFact(claim: ClaimLedgerEntry): boolean {
  return claim.supportState === 'SOURCE_VERIFIED'
    || claim.supportState === 'EVIDENCE_LINKED'
    || claim.supportState === 'RESEARCHER_INPUT';
}

export function buildGroundedParagraph(claims: ClaimLedgerEntry[], references: ReferenceRecord[]): string {
  const known = new Set(references.map(reference => reference.id));
  return claims.map(claim => {
    if (!canDraftAsFact(claim)) {
      return `[IKKE UNDERBYGGET – ${claim.id}] ${claim.text}`;
    }
    const linked = claim.sourceRecordIds.filter(id => known.has(id));
    return linked.length > 0 ? `${claim.text} [KILDE:${linked.join(',')}]` : `[MANGLER KILDE – ${claim.id}] ${claim.text}`;
  }).join('\n\n');
}

export function auditAcademicProject(project: AcademicWritingProject, references: ReferenceRecord[]): WritingAuditResult {
  const referenced = new Set(project.referenceIds);
  const unsupportedClaims = project.claims.filter(claim => claim.supportState === 'UNSUPPORTED');
  const unverifiedSourceClaims = project.claims.filter(claim => claim.supportState === 'SOURCE_DETECTED');
  const missingEvidenceLocations = project.claims.filter(claim =>
    (claim.supportState === 'SOURCE_VERIFIED' || claim.supportState === 'EVIDENCE_LINKED')
    && claim.evidenceLocations.length === 0
  );
  const citedButUnlinkedReferenceIds = [...referenced].filter(id => !references.some(reference => reference.id === id));

  return {
    unsupportedClaims,
    unverifiedSourceClaims,
    missingEvidenceLocations,
    citedButUnlinkedReferenceIds,
    readyForExport:
      unsupportedClaims.length === 0
      && unverifiedSourceClaims.length === 0
      && missingEvidenceLocations.length === 0
      && citedButUnlinkedReferenceIds.length === 0,
  };
}

export const MASTER_SECTIONS = [
  'Innledning', 'Bakgrunn og kunnskapshull', 'Problemstilling og mål', 'Teoretisk rammeverk',
  'Metode', 'Søkestrategi', 'Inklusjon og eksklusjon', 'Kritisk vurdering', 'Resultater',
  'Analyse og syntese', 'Diskusjon', 'Styrker og begrensninger', 'Etikk', 'Implikasjoner', 'Konklusjon', 'Abstract'
] as const;

export const PHD_SECTIONS = [
  ...MASTER_SECTIONS,
  'Originalt bidrag og nyhet', 'Teoretisk bidrag', 'Konseptuell modell', 'Avhandlingsarkitektur',
  'Studieintegrasjon', 'Reproduserbarhet og forskningsdata', 'Bidrag til forskningsfeltet',
  'Grensebetingelser', 'Kapittel-/artikkelkonsistens'
] as const;
