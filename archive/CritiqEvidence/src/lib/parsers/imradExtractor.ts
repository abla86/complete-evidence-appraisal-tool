import { ImradSectionType } from '@/types/frameworks';

export interface ExtractedSection {
  type: ImradSectionType;
  heading: string;
  content: string;
  startIdx: number;
}

const SECTION_REGEX_MAP: Record<ImradSectionType, RegExp[]> = {
  ABSTRACT: [/^(abstract|sammendrag)/i],
  INTRODUCTION: [/^(introduction|background|innledning|bakgrunn)/i],
  METHODS: [/^(methods|methodology|materials and methods|metode|data and methods|data and methodology)/i],
  RESULTS: [/^(results|findings|resultater|funn)/i],
  DISCUSSION: [/^(discussion|conclusion|drøfting|diskusjon|konklusjon|limitations)/i],
  OTHER: [],
};

export function classifyHeading(headingText: string): ImradSectionType {
  const normalized = headingText.trim().replace(/^#+\s*/, '').toLowerCase();
  for (const [sectionType, regexes] of Object.entries(SECTION_REGEX_MAP) as [ImradSectionType, RegExp[]][]) {
    if (regexes.some((re) => re.test(normalized))) {
      return sectionType;
    }
  }
  return 'OTHER';
}

/**
 * Automatically scan text for academic headings (Markdown headers like # or ##, or standalone lines matching IMRaD patterns)
 */
export function detectHeadingsFromRawText(rawText: string): { title: string; index: number }[] {
  const lines = rawText.split(/\r?\n/);
  const headings: { title: string; index: number }[] = [];
  let currentPos = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    // Check markdown header like "## Methods" or "# Introduction"
    const mdMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
    if (mdMatch) {
      headings.push({
        title: line,
        index: currentPos,
      });
    } else if (trimmed.length > 0 && trimmed.length < 60) {
      // Check if standalone line matches common academic section
      const potential = trimmed.toLowerCase();
      const isHeadingPattern = /^(abstract|sammendrag|introduction|background|innledning|bakgrunn|methods|materials and methods|metode|results|findings|resultater|funn|discussion|diskusjon|drøfting|conclusion|konklusjon|references|referanser)\b/i.test(potential);
      if (isHeadingPattern) {
        headings.push({
          title: line,
          index: currentPos,
        });
      }
    }
    currentPos += line.length + 1;
  }

  return headings;
}

export function parseStructuredDocument(rawText: string, detectedHeadings: { title: string; index: number }[]): ExtractedSection[] {
  if (!detectedHeadings.length) {
    return [{
      type: 'OTHER',
      heading: 'Full Document',
      content: rawText,
      startIdx: 0,
    }];
  }

  const sections: ExtractedSection[] = [];
  const sorted = [...detectedHeadings].sort((a, b) => a.index - b.index);

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const nextIndex = i + 1 < sorted.length ? sorted[i + 1].index : rawText.length;
    const body = rawText.substring(current.index + current.title.length, nextIndex).trim();

    sections.push({
      type: classifyHeading(current.title),
      heading: current.title.replace(/^#+\s*/, '').trim(),
      content: body,
      startIdx: current.index,
    });
  }

  return sections;
}
