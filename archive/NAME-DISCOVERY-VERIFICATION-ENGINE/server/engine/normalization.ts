/**
 * Normalization Engine
 * Standardizes names, handles case, punctuation, plural/singular variations,
 * common transliterations (Nordic / European), and produces canonical keys and variants.
 */

export interface NormalizedResult {
  canonical: string;       // Lowercase, stripped punctuation, single spaces
  compact: string;         // Lowercase alphanumeric only
  tokens: string[];        // Array of distinct token words
  singular: string;        // Singularized canonical form
  transliterated: string;  // Special characters folded to ASCII
  variants: string[];      // Array of obvious variants to query
}

// Nordic & European transliteration mapping
const TRANSLITERATION_MAP: Record<string, string> = {
  'æ': 'ae',
  'ø': 'oe',
  'å': 'aa',
  'ä': 'ae',
  'ö': 'oe',
  'ü': 'ue',
  'ß': 'ss',
  'é': 'e',
  'è': 'e',
  'ê': 'e',
  'ë': 'e',
  'á': 'a',
  'à': 'a',
  'â': 'a',
  'ã': 'a',
  'í': 'i',
  'ì': 'i',
  'î': 'i',
  'ï': 'i',
  'ó': 'o',
  'ò': 'o',
  'ô': 'o',
  'õ': 'o',
  'ú': 'u',
  'ù': 'u',
  'û': 'u',
  'ñ': 'n',
  'ç': 'c',
  'ð': 'd',
  'þ': 'th',
};

// Obvious common phonetic & tech spelling swaps
const PHONETIC_VARIANTS: [RegExp, string][] = [
  [/ph/g, 'f'],
  [/ck/g, 'k'],
  [/qu/g, 'kw'],
  [/x/g, 'ks'],
  [/y$/g, 'i'],
];

export function transliterate(input: string): string {
  let result = input.toLowerCase();
  for (const [char, replacement] of Object.entries(TRANSLITERATION_MAP)) {
    result = result.replaceAll(char, replacement);
  }
  return result;
}

export function toSingular(word: string): string {
  const lower = word.toLowerCase();
  if (lower.endsWith('ies') && lower.length > 4) {
    return lower.slice(0, -3) + 'y';
  }
  if (lower.endsWith('ves') && lower.length > 4) {
    return lower.slice(0, -3) + 'f';
  }
  if ((lower.endsWith('ses') || lower.endsWith('shes') || lower.endsWith('ches') || lower.endsWith('xes')) && lower.length > 4) {
    return lower.slice(0, -2);
  }
  if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 3) {
    return lower.slice(0, -1);
  }
  return lower;
}

export function toPlural(word: string): string {
  const lower = word.toLowerCase();
  if (lower.endsWith('y') && !/[aeiou]y$/.test(lower)) {
    return lower.slice(0, -1) + 'ies';
  }
  if (lower.endsWith('s') || lower.endsWith('sh') || lower.endsWith('ch') || lower.endsWith('x') || lower.endsWith('z')) {
    return lower + 'es';
  }
  return lower + 's';
}

export function normalizeName(input: string): NormalizedResult {
  if (!input || typeof input !== 'string') {
    return {
      canonical: '',
      compact: '',
      tokens: [],
      singular: '',
      transliterated: '',
      variants: [],
    };
  }

  // 1. Trim & fold case
  let cleaned = input.trim().toLowerCase();

  // 2. Transliterate diacritics
  const transliterated = transliterate(cleaned);

  // 3. Normalize punctuation & delimiters (hyphens, underscores, dots, slashes) into single spaces
  cleaned = cleaned.replace(/[-_./\\+]/g, ' ');
  // Remove non-word and non-space characters
  cleaned = cleaned.replace(/[^\p{L}\p{N}\s]/gu, '');
  // Collapse multiple spaces
  const canonical = cleaned.replace(/\s+/g, ' ').trim();

  // 4. Compact alphanumeric form
  const compact = canonical.replace(/[^a-z0-9]/gi, '');

  // 5. Tokens
  const tokens = canonical.split(' ').filter(Boolean);

  // 6. Singular form
  const singular = tokens.map(toSingular).join(' ');

  // 7. Collect obvious variants
  const variantSet = new Set<string>();
  variantSet.add(canonical);
  variantSet.add(compact);
  if (transliterated !== canonical) {
    variantSet.add(transliterated);
    variantSet.add(transliterated.replace(/\s+/g, ''));
  }
  if (singular !== canonical) {
    variantSet.add(singular);
  }
  const plural = tokens.map(toPlural).join(' ');
  if (plural !== canonical) {
    variantSet.add(plural);
  }

  // Hyphenated variant if multiple tokens
  if (tokens.length > 1) {
    variantSet.add(tokens.join('-'));
  }

  // Common phonetic variant
  let phoneticCandidate = canonical;
  for (const [regex, rep] of PHONETIC_VARIANTS) {
    phoneticCandidate = phoneticCandidate.replace(regex, rep);
  }
  if (phoneticCandidate !== canonical) {
    variantSet.add(phoneticCandidate);
  }

  return {
    canonical,
    compact,
    tokens,
    singular,
    transliterated,
    variants: Array.from(variantSet).filter(v => v.length > 0),
  };
}

/**
 * Check if two names are equivalent or obvious variants
 */
export function areObviousVariants(nameA: string, nameB: string): boolean {
  const normA = normalizeName(nameA);
  const normB = normalizeName(nameB);

  if (normA.compact === normB.compact) return true;
  if (normA.canonical === normB.canonical) return true;
  if (normA.singular === normB.singular) return true;
  if (normA.transliterated === normB.transliterated) return true;
  if (normA.variants.includes(normB.canonical) || normB.variants.includes(normA.canonical)) return true;

  return false;
}

export function generateVariants(name: string): string[] {
  return normalizeName(name).variants;
}
