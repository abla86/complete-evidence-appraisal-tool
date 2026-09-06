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
  researcherApprovalMissing: ClaimLedgerEntry[];
  citedButUnlinkedReferenceIds: string[];
  invalidSourceReferenceIds: string[];
  aiSuggestionClaims: ClaimLedgerEntry[];
  readyForExport: boolean;
}

function usableReferenceIds(references: ReferenceRecord[]): Set<string> {
  return new Set(references.filter(reference => Boolean(reference.id)).map(reference => reference.id));
}

export function canDraftAsFact(claim: ClaimLedgerEntry): boolean {
  if (!claim.researcherApproved) return false;
  return claim.supportState === 'SOURCE_VERIFIED'
    || claim.supportState === 'EVIDENCE_LINKED'
    || claim.supportState === 'RESEARCHER_INPUT';
}

export function buildGroundedParagraph(claims: ClaimLedgerEntry[], references: ReferenceRecord[]): string {
  const known = usableReferenceIds(references);
  return claims.map(claim => {
    if (!canDraftAsFact(claim)) return `[IKKE GODKJENT FOR FAKTAPÃ…STAND â€“ ${claim.id}] ${claim.text}`;
    const linked = claim.sourceRecordIds.filter(id => known.has(id));
    if (linked.length === 0) return `[MANGLER VERIFISERT KILDE â€“ ${claim.id}] ${claim.text}`;
    if (claim.evidenceLocations.length === 0 && claim.supportState !== 'RESEARCHER_INPUT') {
      return `[MANGLER EVIDENSSPORING â€“ ${claim.id}] ${claim.text}`;
    }
    return `${claim.text} [KILDE:${linked.join(',')}]`;
  }).join('\n\n');
}

export function auditAcademicProject(project: AcademicWritingProject, references: ReferenceRecord[]): WritingAuditResult {
  const referenced = new Set(project.referenceIds);
  const knownReferences = usableReferenceIds(references);
  const unsupportedClaims = project.claims.filter(claim => claim.supportState === 'UNSUPPORTED');
  const unverifiedSourceClaims = project.claims.filter(claim => claim.supportState === 'SOURCE_DETECTED');
  const missingEvidenceLocations = project.claims.filter(claim =>
    (claim.supportState === 'SOURCE_VERIFIED' || claim.supportState === 'EVIDENCE_LINKED')
    && claim.evidenceLocations.length === 0,
  );
  const researcherApprovalMissing = project.claims.filter(claim =>
    !claim.researcherApproved
    && claim.type !== 'AI_SUGGESTION',
  );
  const citedButUnlinkedReferenceIds = [...referenced].filter(id => !knownReferences.has(id));
  const invalidSourceReferenceIds = project.claims.flatMap(claim => claim.sourceRecordIds).filter(id => !knownReferences.has(id));
  const aiSuggestionClaims = project.claims.filter(claim => claim.type === 'AI_SUGGESTION');

  return {
    unsupportedClaims,
    unverifiedSourceClaims,
    missingEvidenceLocations,
    researcherApprovalMissing,
    citedButUnlinkedReferenceIds,
    invalidSourceReferenceIds: [...new Set(invalidSourceReferenceIds)],
    aiSuggestionClaims,
    readyForExport:
      unsupportedClaims.length === 0
      && unverifiedSourceClaims.length === 0
      && missingEvidenceLocations.length === 0
      && researcherApprovalMissing.length === 0
      && citedButUnlinkedReferenceIds.length === 0
      && invalidSourceReferenceIds.length === 0
      && aiSuggestionClaims.length === 0,
  };
}

export function createAcademicWritingProject(
  input: Partial<AcademicWritingProject> & Pick<AcademicWritingProject, 'title'>,
): AcademicWritingProject {
  return {
    id: input.id ?? `writing-${Date.now()}`,
    title: input.title,
    academicLevel: input.academicLevel ?? 'MASTER',
    writingMode: input.writingMode ?? 'WRITE_FROM_SOURCES',
    researchQuestion: input.researchQuestion,
    sections: input.sections ?? [],
    claims: input.claims ?? [],
    referenceIds: input.referenceIds ?? [],
    aiAssistanceLog: input.aiAssistanceLog ?? [],
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

export const MASTER_SECTIONS = [
  'Innledning', 'Bakgrunn og kunnskapshull', 'Problemstilling og mÃ¥l', 'Teoretisk rammeverk',
  'Metode', 'SÃ¸kestrategi', 'Inklusjon og eksklusjon', 'Kritisk vurdering', 'Resultater',
  'Analyse og syntese', 'Diskusjon', 'Styrker og begrensninger', 'Etikk', 'Implikasjoner', 'Konklusjon', 'Abstract',
] as const;

export const PHD_SECTIONS = [
  ...MASTER_SECTIONS,
  'Originalt bidrag og nyhet', 'Teoretisk bidrag', 'Konseptuell modell', 'Avhandlingsarkitektur',
  'Studieintegrasjon', 'Reproduserbarhet og forskningsdata', 'Bidrag til forskningsfeltet',
  'Grensebetingelser', 'Kapittel-/artikkelkonsistens',
] as const;

