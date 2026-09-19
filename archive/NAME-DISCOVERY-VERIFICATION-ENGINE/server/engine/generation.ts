import { GoogleGenAI } from '@google/genai';
import { CandidateName, NamingBrief } from '../../src/types/index.js';
import { normalizeName } from './normalization.js';

interface RawCandidateSuggestion {
  name: string;
  pronunciation: string;
  concept: string;
  namingStrategy: string;
  whyFits: string;
}

// Banned generic tech suffixes as mandated in prompt Section D:
// "Do not blindly append: AI, Labs, Tech, Cloud, Hub, Forge, Flow to random words."
const BANNED_GENERIC_SUFFIXES = ['ai', 'labs', 'tech', 'cloud', 'hub', 'forge', 'flow'];

// Morpheme and syllable building blocks for distinctive algorithmic generation
const NORDIC_ROOTS = ['fjord', 'nord', 'sval', 'sol', 'vinter', 'berg', 'lys', 'vind', 'hav', 'vard', 'klint', 'foss', 'glimt', 'tind'];
const METAPHORIC_ROOTS = ['lumen', 'apex', 'solis', 'strata', 'echo', 'prism', 'zenith', 'coda', 'axon', 'vector', 'helio', 'aura'];
const LATINATE_ROOTS = ['nov', 'val', 'ver', 'clar', 'vig', 'aud', 'omni', 'prim', 'vol', 'kyn', 'ten', 'alt'];
const SUFFIX_PATTERNS = ['a', 'is', 'ix', 'os', 'um', 'or', 'ex', 'ra', 'va', 'en', 'ia', 'on', 'ar', 'eo'];

/**
 * Deterministic multi-strategy algorithmic name generator
 * Produces candidates across all 9 required strategies
 */
export function generateAlgorithmicCandidates(brief: NamingBrief, count = 25): RawCandidateSuggestion[] {
  const results: RawCandidateSuggestion[] = [];
  const conceptWords = (brief.conceptsToCommunicate || [])
    .concat(brief.description.split(/\s+/).filter(w => w.length > 3))
    .map(w => w.toLowerCase().replace(/[^a-z]/g, ''))
    .filter(Boolean);

  const lettersAvoid = new Set((brief.lettersToAvoid || []).map(l => l.toLowerCase()));
  const wordsAvoid = new Set((brief.wordsToAvoid || []).map(w => w.toLowerCase()));

  function isAllowed(name: string): boolean {
    const lower = name.toLowerCase();
    for (const char of lower) {
      if (lettersAvoid.has(char)) return false;
    }
    for (const avoid of wordsAvoid) {
      if (lower.includes(avoid)) return false;
    }
    // Check against banned tech suffixes
    for (const suffix of BANNED_GENERIC_SUFFIXES) {
      if (lower.endsWith(suffix) && lower.length > suffix.length + 2) return false;
    }
    return true;
  }

  // Strategy 1: Invented Words (Phonotactically balanced CV/CVC syllables)
  const inventedSyllables = ['vel', 'zan', 'mox', 'kyn', 'rav', 'sol', 'tiv', 'dra', 'pel', 'von', 'lyr', 'quor', 'zel'];
  const endings = ['ix', 'or', 'a', 'um', 'is', 'en', 'va', 'ra', 'el'];
  for (const s of inventedSyllables) {
    for (const e of endings) {
      const cand = capitalize(s + e);
      if (isAllowed(cand) && cand.length >= 4 && cand.length <= 8) {
        results.push({
          name: cand,
          pronunciation: cand.toLowerCase().split('').join('-'),
          concept: `Invented distinctive coined root evoking sound dynamics`,
          namingStrategy: 'invented words',
          whyFits: `Clean, memorable phonetic coined name with distinctive identity.`,
        });
      }
    }
  }

  // Strategy 2: International / Nordic Names (Especially for Norway/Nordic/Europe markets)
  for (const root of NORDIC_ROOTS) {
    for (const suff of ['a', 'en', 'is', 'a', 'or', 'o', 'ix']) {
      const cand = capitalize(root + suff);
      if (isAllowed(cand)) {
        results.push({
          name: cand,
          pronunciation: cand.toLowerCase(),
          concept: `Scandinavian landscape and organic precision`,
          namingStrategy: 'international / nordic names',
          whyFits: `Resonates with minimalist Nordic design values and clear articulation.`,
        });
      }
    }
  }

  // Strategy 3: Semantic Combinations (Derived from user concepts)
  if (conceptWords.length >= 1) {
    for (const c of conceptWords.slice(0, 4)) {
      const prefix = c.slice(0, Math.min(4, c.length));
      for (const suff of SUFFIX_PATTERNS) {
        const cand = capitalize(prefix + suff);
        if (isAllowed(cand)) {
          results.push({
            name: cand,
            pronunciation: cand.toLowerCase(),
            concept: `Semantic derivation from "${c}"`,
            namingStrategy: 'semantic combinations',
            whyFits: `Subtly signals core function of ${c} without literal cliches.`,
          });
        }
      }
    }
  }

  // Strategy 4: Metaphorical Names
  for (const meta of METAPHORIC_ROOTS) {
    for (const suff of ['a', 'is', 'on', 'a']) {
      const cand = capitalize(meta.slice(0, 4) + suff);
      if (isAllowed(cand)) {
        results.push({
          name: cand,
          pronunciation: cand.toLowerCase(),
          concept: `Natural phenomenon metaphor (${meta})`,
          namingStrategy: 'metaphorical names',
          whyFits: `Symbolizes elevation, clarity, and structural focus.`,
        });
      }
    }
  }

  // Strategy 5: Abstract Names (Latinate roots with modern endings)
  for (const lat of LATINATE_ROOTS) {
    for (const suff of ['aris', 'ora', 'exis', 'alis', 'ento']) {
      const cand = capitalize(lat + suff);
      if (isAllowed(cand)) {
        results.push({
          name: cand,
          pronunciation: cand.toLowerCase(),
          concept: `Abstract coined name with timeless classical cadence`,
          namingStrategy: 'abstract names',
          whyFits: `High brandability with neutral semantic territory to grow into.`,
        });
      }
    }
  }

  // Strategy 6: Short Names (4 to 5 letters, punchy)
  const shortStems = ['kova', 'nexa', 'elva', 'tova', 'siri', 'klir', 'vard', 'lyra', 'orix', 'sola', 'mira', 'zeva'];
  for (const s of shortStems) {
    const cand = capitalize(s);
    if (isAllowed(cand)) {
      results.push({
        name: cand,
        pronunciation: cand.toLowerCase(),
        concept: `Compact 4-letter high-recall moniker`,
        namingStrategy: 'short names',
        whyFits: `Ultra-compact, effortless mobile app and domain fit.`,
      });
    }
  }

  // Strategy 7: Compound Names (Crisp paired concepts)
  const partA = ['Iron', 'Deep', 'Quiet', 'True', 'Open', 'Clear', 'Nord'];
  const partB = ['peak', 'stone', 'mark', 'path', 'helm', 'fold', 'wave'];
  for (const a of partA) {
    for (const b of partB) {
      const cand = a + capitalize(b);
      if (isAllowed(cand)) {
        results.push({
          name: cand,
          pronunciation: `${a.toLowerCase()}-${b.toLowerCase()}`,
          concept: `Grounded compound of ${a} + ${b}`,
          namingStrategy: 'compound names',
          whyFits: `Evokes steadfast reliability without generic tech words.`,
        });
      }
    }
  }

  // Deduplicate and return requested count
  const seen = new Set<string>();
  const filtered: RawCandidateSuggestion[] = [];

  for (const r of results) {
    const norm = normalizeName(r.name).canonical;
    if (!seen.has(norm)) {
      seen.add(norm);
      filtered.push(r);
    }
    if (filtered.length >= count) break;
  }

  return filtered;
}

/**
 * AI-augmented generation using server-side Gemini API
 */
export async function generateGeminiCandidates(brief: NamingBrief, count = 20): Promise<RawCandidateSuggestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are an elite brand naming strategist and linguistic expert.
Generate ${count} distinctive, authentic, and evocative names for the following naming brief:

ENTITY TYPE: ${brief.entityType}
PROJECT: ${brief.title}
DESCRIPTION: ${brief.description}
INDUSTRY: ${brief.industry}
AUDIENCE: ${brief.targetAudience}
TARGET MARKET / JURISDICTION: ${brief.market} (Pay special linguistic attention to this region)
DESIRED TONE: ${brief.desiredTone}
DESIRED LENGTH: ${brief.desiredLength}
PRONUNCIATION: ${brief.pronunciationPreference}
WORDS TO INCLUDE (if any): ${brief.wordsToInclude.join(', ') || 'None'}
WORDS TO AVOID: ${brief.wordsToAvoid.join(', ') || 'None'}
LETTERS TO AVOID: ${brief.lettersToAvoid.join(', ') || 'None'}
CONCEPTS TO COMMUNICATE: ${brief.conceptsToCommunicate.join(', ') || 'None'}

CRITICAL NAMING RULES:
1. STRICTLY FORBIDDEN: Do NOT append generic cliches like "AI", "Labs", "Tech", "Cloud", "Hub", "Forge", "Flow".
2. Use multiple naming strategies:
   - invented words (phonotactically legal, pronounceable)
   - semantic combinations (clever root blending)
   - metaphorical names (poetic, architectural, natural)
   - abstract names (coined, high brand elasticity)
   - compound names (unexpected, crisp)
   - short names (4-6 letters)
   - international / Nordic names (authentic Scandi/European phonetics if relevant)
3. Return ONLY a valid JSON array of objects with the exact structure:
[
  {
    "name": "DistinctiveName",
    "pronunciation": "dis-TINK-tiv",
    "concept": "Core metaphor or linguistic root",
    "namingStrategy": "one of: invented words, semantic combinations, metaphorical names, abstract names, compound names, short names, international / nordic names",
    "whyFits": "Specific 1-sentence rationale tying to user brief"
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '[]';
    const parsed = JSON.parse(text) as RawCandidateSuggestion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Gemini candidate generation fallback triggered:', err);
    return [];
  }
}

/**
 * Combined Candidate Pool Generation
 * Merges AI suggestions (if configured) with algorithmic multi-strategy candidates,
 * strictly deduplicating and normalizing.
 */
export async function generateFullCandidatePool(brief: NamingBrief, targetCount = 30): Promise<CandidateName[]> {
  const now = new Date().toISOString();
  const projectId = brief.id || 'default_proj';

  // 1. Fetch AI candidates in parallel with algorithmic candidates
  const [aiCandidates, algoCandidates] = await Promise.all([
    generateGeminiCandidates(brief, 20),
    Promise.resolve(generateAlgorithmicCandidates(brief, 35)),
  ]);

  const rawPool = [...aiCandidates, ...algoCandidates];

  const seenCanonical = new Set<string>();
  const finalCandidates: CandidateName[] = [];

  for (const raw of rawPool) {
    if (!raw.name) continue;

    const norm = normalizeName(raw.name);
    if (!norm.canonical || seenCanonical.has(norm.canonical)) continue;
    seenCanonical.add(norm.canonical);

    const id = `cand_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    finalCandidates.push({
      id,
      projectId,
      name: capitalize(raw.name.trim()),
      normalizedName: norm.canonical,
      pronunciation: raw.pronunciation || norm.canonical,
      concept: raw.concept || 'Distinctive brand coinage',
      namingStrategy: raw.namingStrategy || 'invented words',
      whyFits: raw.whyFits || 'Fits target industry profile and market requirements.',
      riskLevel: 'YELLOW',
      riskScore: 50.0,
      riskSummary: 'Awaiting multi-source registry screening',
      isWatched: false,
      searchStatus: 'pending',
      verificationTimestamp: now,
      createdAt: now,
    });

    if (finalCandidates.length >= targetCount) break;
  }

  return finalCandidates;
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
