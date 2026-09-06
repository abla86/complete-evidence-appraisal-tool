export interface CanonicalIdentifiers { doi?: string; pmid?: string; pmcid?: string; isbn?: string; }

export interface CanonicalSourceLink { referenceId: string; sourceRecordId: string; evidenceId?: string; identifiers: CanonicalIdentifiers; match: 'EXPLICIT_LINK' | 'STABLE_IDENTIFIER' | 'MANUAL_REQUIRED'; reason: string; }

const norm = (v?: string) => v?.trim().toLowerCase().replace(/^https?:\/\/doi.org\//, '') || undefined;
const same = (a?: string,b?: string) => Boolean(a && b && norm(a) === norm(b));

export function resolveCanonicalSourceLink(input: { referenceId: string; sourceRecordId: string; explicitSourceRecordId?: string; reference: CanonicalIdentifiers; sourceRecord: CanonicalIdentifiers }): CanonicalSourceLink {
  if (!input.referenceId.trim() || !input.sourceRecordId.trim()) throw new Error('referenceId og sourceRecordId er pÃ¥krevd.');
  if (input.explicitSourceRecordId?.trim() === input.sourceRecordId.trim()) return { referenceId: input.referenceId, sourceRecordId: input.sourceRecordId, identifiers: input.reference, match: 'EXPLICIT_LINK', reason: 'Eksplisitt canonical linkage.' };
  const pairs: Array<[keyof CanonicalIdentifiers,string]> = [['doi','DOI'],['pmid','PMID'],['pmcid','PMCID'],['isbn','ISBN']];
  for (const [key,label] of pairs) if (same(input.reference[key], input.sourceRecord[key])) return { referenceId: input.referenceId, sourceRecordId: input.sourceRecordId, identifiers: input.reference, match: 'STABLE_IDENTIFIER', reason: `Canonical kobling verifisert via ${label}.` };
  return { referenceId: input.referenceId, sourceRecordId: input.sourceRecordId, identifiers: input.reference, match: 'MANUAL_REQUIRED', reason: 'Ingen stabil identifikator samsvarer; manuell kobling kreves.' };
}

