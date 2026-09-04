import type { IMRaDAnalysisResult, IMRaDSectionAnalysis, IMRaDSectionKey } from '../types';

type SectionRule = {
  key: IMRaDSectionKey;
  label: string;
  headings: RegExp[];
  keywords: RegExp[];
  required: boolean;
};

const RULES: SectionRule[] = [
  {
    key: 'introduction',
    label: 'Introduction',
    headings: [/^\s*(?:1[.)\s-]*)?(?:introduction|background|bakgrunn|innledning)\s*$/i, /^\s*(?:aim|objectives|purpose|formål|hensikt)\s*$/i],
    keywords: [/\bintroduction\b/i, /\bbackground\b/i, /\baim\b/i, /\bobjectives?\b/i, /\bpurpose\b/i, /\bformål\b/i, /\bproblemstilling\b/i],
    required: true
  },
  {
    key: 'methods',
    label: 'Methods',
    headings: [/^\s*(?:2[.)\s-]*)?(?:methods?|methodology|materials and methods|metode|metodologi|materiale og metode)\s*$/i, /^\s*(?:study design|research design|studiedesign)\s*$/i],
    keywords: [/\bmethods?\b/i, /\bmethodology\b/i, /\bstudy design\b/i, /\bparticipants?\b/i, /\bsample\b/i, /\bdata collection\b/i, /\bdata analysis\b/i, /\bmetode\b/i],
    required: true
  },
  {
    key: 'results',
    label: 'Results',
    headings: [/^\s*(?:3[.)\s-]*)?(?:results?|findings?|resultater|funn)\s*$/i],
    keywords: [/\bresults?\b/i, /\bfindings?\b/i, /\bresultater\b/i, /\bfunn\b/i, /\bprimary outcome\b/i, /\bsecondary outcome\b/i],
    required: true
  },
  {
    key: 'discussion',
    label: 'Discussion',
    headings: [/^\s*(?:4[.)\s-]*)?(?:discussion|interpretation|drøfting|diskusjon)\s*$/i, /^\s*(?:strengths and limitations|limitations|styrker og begrensninger|begrensninger)\s*$/i],
    keywords: [/\bdiscussion\b/i, /\binterpretation\b/i, /\blimitations?\b/i, /\bstrengths?\b/i, /\bimplications?\b/i, /\bdiskusjon\b/i, /\bdrøfting\b/i],
    required: true
  }
];

function normalise(text: string): string {
  return text.replace(/\u00a0/g, ' ').replace(/\r\n/g, '\n').trim();
}

function headingLike(line: string): boolean {
  const value = line.trim();
  if (!value || value.length > 100) return false;
  return RULES.some(rule => rule.headings.some(pattern => pattern.test(value)));
}

function scoreSection(content: string, rule: SectionRule): number {
  const value = normalise(content);
  if (!value) return 0;
  const keywordHits = rule.keywords.reduce((sum, pattern) => sum + (pattern.test(value) ? 1 : 0), 0);
  const headingHits = rule.headings.reduce((sum, pattern) => sum + (pattern.test(value) ? 1 : 0), 0);
  const lengthSignal = Math.min(1, value.length / 1200);
  return Math.min(1, 0.45 * Math.min(1, keywordHits / 3) + 0.35 * Math.min(1, headingHits) + 0.20 * lengthSignal);
}

function extractByHeadings(text: string): Record<IMRaDSectionKey, string> {
  const lines = normalise(text).split('\n');
  const sections: Partial<Record<IMRaDSectionKey, string[]>> = {};
  let current: IMRaDSectionKey | undefined;
  for (const line of lines) {
    const match = RULES.find(rule => rule.headings.some(pattern => pattern.test(line.trim())));
    if (match) {
      current = match.key;
      sections[current] = sections[current] ?? [];
      continue;
    }
    if (current) sections[current]!.push(line);
  }
  return {
    introduction: sections.introduction?.join('\n').trim() ?? '',
    methods: sections.methods?.join('\n').trim() ?? '',
    results: sections.results?.join('\n').trim() ?? '',
    discussion: sections.discussion?.join('\n').trim() ?? ''
  };
}

export class IMRaDAnalysisService {
  public static analyze(text: string, fileName = 'research-document'): IMRaDAnalysisResult {
    const clean = normalise(text);
    const headingSections = extractByHeadings(clean);
    const headingHits = Object.values(headingSections).filter(Boolean).length;
    // IMRaD is a structural analysis. Never infer section boundaries from paragraph position.
    const sections = headingHits >= 1 ? headingSections : { introduction: '', methods: '', results: '', discussion: '' };

    const analyses: IMRaDSectionAnalysis[] = RULES.map(rule => {
      const content = sections[rule.key];
      const hasContent = content.length >= 80;
      const confidence = hasContent ? scoreSection(content, rule) : 0;
      const explicitHeading = clean.split('\n').some(line => rule.headings.some(pattern => pattern.test(line.trim())));
      return {
        key: rule.key,
        label: rule.label,
        detected: hasContent,
        explicitHeading,
        confidence: Number(confidence.toFixed(3)),
        characterCount: content.length,
        wordCount: content ? content.split(/\s+/).filter(Boolean).length : 0,
        evidencePreview: content.slice(0, 500),
        // A heading alone does not establish that a usable section was extracted.
        // "INFERRED" is intentionally unused because this service does not infer boundaries.
        status: hasContent && explicitHeading ? 'DETECTED' : 'MISSING'
      };
    });

    const detected = analyses.filter(item => item.detected).length;
    const explicit = analyses.filter(item => item.explicitHeading).length;
    const missing = analyses.filter(item => !item.detected).map(item => item.label);
    const complete = detected === 4;
    const explicitComplete = explicit === 4;
    const confidence = analyses.reduce((sum, item) => sum + item.confidence, 0) / analyses.length;

    return {
      fileName,
      standard: 'IMRaD',
      standardDescription: 'Introduction, Methods, Results and Discussion',
      analyzedAt: new Date().toISOString(),
      complete,
      explicitComplete,
      detectedSectionCount: detected,
      explicitHeadingCount: explicit,
      confidence: Number(confidence.toFixed(3)),
      sections: analyses,
      missingSections: missing,
      limitations: [
        'Automatisk seksjonsgjenkjenning er en strukturanalyse og er ikke en metodisk kvalitetsvurdering.',
        'En seksjon som ikke finnes i tekstuttrekket skal ikke tolkes som at artikkelen mangler seksjonen.',
        'IMRaD passer ikke nødvendigvis uendret for alle studiedesign; strukturkrav må vurderes mot artikkeltype og rapporteringsstandard.'
      ],
      methodologicalNotice: 'IMRaD-analysen skal brukes sammen med relevant rapporteringsstandard og kritisk appraisal-instrument. Den genererer ikke kvalitetspoeng eller et metodisk ja/nei-verdict.'
    };
  }
}
