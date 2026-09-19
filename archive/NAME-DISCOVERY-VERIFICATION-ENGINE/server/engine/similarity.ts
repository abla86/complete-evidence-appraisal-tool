/**
 * Deterministic Similarity Engine
 * Implements Levenshtein, Jaro-Winkler, N-gram, Soundex/Phonetic, and Token similarity.
 * IMPORTANT: Mathematical similarity scores are evidence indicators, never legal clearance conclusions.
 */

// 1. Levenshtein Distance & Ratio
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  let prevRow = new Array(n + 1);
  let currRow = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,       // deletion
        currRow[j - 1] + 1,   // insertion
        prevRow[j - 1] + cost // substitution
      );
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[n];
}

export function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return Number((1 - dist / maxLen).toFixed(3));
}

// 2. Jaro-Winkler Similarity
export function jaroSimilarity(s1: string, s2: string): number {
  const a = s1.toLowerCase();
  const b = s2.toLowerCase();
  if (a === b) return 1.0;
  if (!a.length || !b.length) return 0.0;

  const matchDistance = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, b.length);

    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  const m = matches;
  return (m / a.length + m / b.length + (m - transpositions / 2) / m) / 3;
}

export function jaroWinklerSimilarity(s1: string, s2: string, prefixScale = 0.1): number {
  const jaro = jaroSimilarity(s1, s2);
  const a = s1.toLowerCase();
  const b = s2.toLowerCase();

  // Find prefix length (up to 4 chars)
  let prefix = 0;
  for (let i = 0; i < Math.min(a.length, b.length, 4); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }

  const score = jaro + prefix * prefixScale * (1 - jaro);
  return Number(Math.min(1.0, score).toFixed(3));
}

// 3. N-Gram (Bi-gram & Tri-gram) Similarity (Sørensen-Dice Coefficient)
export function getNGrams(str: string, n = 2): Set<string> {
  const s = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const ngrams = new Set<string>();
  if (s.length < n) {
    if (s.length > 0) ngrams.add(s);
    return ngrams;
  }
  for (let i = 0; i <= s.length - n; i++) {
    ngrams.add(s.slice(i, i + n));
  }
  return ngrams;
}

export function ngramSimilarity(a: string, b: string, n = 2): number {
  const gramsA = getNGrams(a, n);
  const gramsB = getNGrams(b, n);

  if (gramsA.size === 0 && gramsB.size === 0) return 1.0;
  if (gramsA.size === 0 || gramsB.size === 0) return 0.0;

  let intersection = 0;
  for (const gram of gramsA) {
    if (gramsB.has(gram)) intersection++;
  }

  // Sørensen-Dice coefficient
  return Number(((2 * intersection) / (gramsA.size + gramsB.size)).toFixed(3));
}

// 4. Soundex / Phonetic Hash
export function soundex(str: string): string {
  const s = str.toUpperCase().replace(/[^A-Z]/g, '');
  if (!s) return '0000';

  const firstChar = s[0];
  const mapping: Record<string, string> = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6',
  };

  let code = firstChar;
  let prevCode = mapping[firstChar] || '0';

  for (let i = 1; i < s.length && code.length < 4; i++) {
    const char = s[i];
    const currCode = mapping[char] || '0';

    if (currCode !== '0' && currCode !== prevCode) {
      code += currCode;
    }
    prevCode = currCode;
  }

  return (code + '0000').slice(0, 4);
}

export function phoneticSimilarity(a: string, b: string): number {
  const codeA = soundex(a);
  const codeB = soundex(b);

  if (codeA === codeB) return 1.0;
  // Match prefix
  let match = 0;
  for (let i = 0; i < 4; i++) {
    if (codeA[i] === codeB[i]) match++;
  }
  return Number((match / 4).toFixed(3));
}

// 5. Token Similarity (Handles word order differences like "Peak Point" vs "Point Peak")
export function tokenSimilarity(a: string, b: string): number {
  const tokensA = a.toLowerCase().split(/\s+/).filter(Boolean);
  const tokensB = b.toLowerCase().split(/\s+/).filter(Boolean);

  if (!tokensA.length || !tokensB.length) return 0.0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let common = 0;
  for (const t of setA) {
    if (setB.has(t)) common++;
  }

  // Jaccard similarity of token sets
  const union = new Set([...tokensA, ...tokensB]).size;
  return Number((common / union).toFixed(3));
}

export interface DetailedSimilarityComparison {
  targetName: string;
  comparedName: string;
  compositeScore: number; // 0 to 1
  levenshtein: number;
  jaroWinkler: number;
  ngram: number;
  phonetic: number;
  tokenOverlap: number;
  isHighRisk: boolean;
  explanation: string;
}

/**
 * Calculates multi-dimensional similarity and human-readable explanation
 */
export function compareNames(target: string, candidate: string): DetailedSimilarityComparison {
  const lev = levenshteinSimilarity(target, candidate);
  const jw = jaroWinklerSimilarity(target, candidate);
  const ng = ngramSimilarity(target, candidate, 2);
  const phon = phoneticSimilarity(target, candidate);
  const tok = tokenSimilarity(target, candidate);

  // Composite weighted score:
  // Jaro-Winkler (0.35) + Levenshtein (0.25) + N-gram (0.20) + Phonetic (0.20)
  const composite = Number(
    (jw * 0.35 + lev * 0.25 + ng * 0.20 + phon * 0.20).toFixed(3)
  );

  const explanations: string[] = [];
  if (lev >= 0.85) explanations.push('Very close spelling edit distance');
  if (jw >= 0.90) explanations.push('Near-identical prefix and character distribution (Jaro-Winkler)');
  if (phon === 1.0) explanations.push('Identical phonetic soundex code');
  if (tok >= 0.80) explanations.push('Overlapping word tokens / word-order variant');

  const isHighRisk = composite >= 0.78 || lev >= 0.85 || (phon === 1.0 && lev >= 0.70);

  return {
    targetName: target,
    comparedName: candidate,
    compositeScore: composite,
    levenshtein: lev,
    jaroWinkler: jw,
    ngram: ng,
    phonetic: phon,
    tokenOverlap: tok,
    isHighRisk,
    explanation: explanations.length ? explanations.join('; ') : 'Distinctive or low similarity',
  };
}
