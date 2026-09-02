import { CandidateEvidence, DocumentAnalysisResult, JBIQuestion } from '../types';
import { JBI_QUESTIONS } from '../data/jbiData';

export class DocumentAnalysisService {
  /**
   * Analyzes research text and extracts candidate evidence passages.
   * Automated extraction is never treated as a methodological judgement.
   * "Ikke funnet ≠ No" remains a hard rule.
   */
  public static analyzeText(text: string, fileName: string = 'research-article.pdf'): DocumentAnalysisResult {
    if (!text?.trim()) {
      return {
        fileName,
        analyzedAt: new Date().toISOString(),
        totalPassagesFound: 0,
        disclaimer: 'Ingen kandidat-evidens ble generert fordi dokumentteksten er tom.',
        goldenRule: 'Metodisk prinsipp: Ikke funnet i tekstsøk betyr IKKE automatisk «Nei». All vurdering krever menneskelig faglig skjønn.',
        candidateEvidence: [],
      };
    }

    const candidates: CandidateEvidence[] = [];
    const paragraphs = text
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map((value, index) => ({ value: value.trim(), index }))
      .filter(item => item.value.length > 30);

    const searchMap: Record<number, { keywords: string[]; sectionKeywords: string[]; hint: string }> = {
      1: {
        keywords: ['philosoph', 'ontolog', 'epistemolog', 'paradigm', 'hermeneutic', 'phenomenolog', 'constructiv', 'realis', 'critical realist', 'post-positiv', 'grounded theory perspective'],
        sectionKeywords: ['method', 'design', 'theoretical framework', 'philosophy'],
        hint: 'Sjekk om forfatterne eksplisitt gjør rede for filosofisk/epistemologisk ståsted eller kun metodologi.'
      },
      2: {
        keywords: ['aim', 'objective', 'research question', 'purpose', 'formål', 'problemstilling', 'explore', 'investigate', 'understand experiences'],
        sectionKeywords: ['introduction', 'background', 'aim', 'purpose'],
        hint: 'Sjekk om kvalitativ metodologi passer problemstillingen.'
      },
      3: {
        keywords: ['data collection', 'interview', 'semi-structured', 'focus group', 'observation', 'fieldwork', 'audio-recorded', 'topic guide', 'interview guide'],
        sectionKeywords: ['data collection', 'methods', 'participants'],
        hint: 'Sjekk om intervju/observasjonsform harmonerer med den metodologiske tradisjonen.'
      },
      4: {
        keywords: ['thematic analysis', 'constant comparative', 'coding', 'framework analysis', 'grounded theory coding', 'axial coding', 'braun and clarke', 'transcrib', 'nvivo', 'categor'],
        sectionKeywords: ['data analysis', 'analysis', 'methods'],
        hint: 'Sjekk om analyseprosedyren følger anerkjente trinn i metoden.'
      },
      5: {
        keywords: ['theme', 'category', 'conceptual model', 'findings', 'results', 'framework', 'typology', 'interpretation', 'sub-theme'],
        sectionKeywords: ['results', 'findings', 'discussion'],
        hint: 'Sjekk om tolkningene bygger konsistent på den analytiske tilnærmingen.'
      },
      6: {
        keywords: ['reflexivity', 'positionality', 'background of the researcher', 'research team', 'author background', 'insider', 'outsider', 'pre-understanding', 'forforståelse'],
        sectionKeywords: ['methods', 'reflexivity', 'authors', 'research team'],
        hint: 'Sjekk om forfatterne gjør rede for egen kulturell eller teoretisk posisjonering.'
      },
      7: {
        keywords: ['influence of the researcher', 'power dynamic', 'rapport', 'co-construction', 'field notes', 'peer debriefing', 'bracketing', 'reflexive diary'],
        sectionKeywords: ['reflexivity', 'strengths and limitations', 'methods'],
        hint: 'Sjekk om forskerens påvirkning på studien og deltakerne er drøftet.'
      },
      8: {
        keywords: ['quote', 'participant', 'informant', 'voices', 'extract', 'verbatim', 'representative quotation', 'narrative'],
        sectionKeywords: ['results', 'findings'],
        hint: 'Sjekk om deltakernes egne stemmer og sitater er tilstrekkelig representert.'
      },
      9: {
        keywords: ['ethics', 'ethical approval', 'irb', 'rek', 'nsd', 'sikt', 'informed consent', 'confidentiality', 'anonymity', 'consent was obtained'],
        sectionKeywords: ['ethics', 'declarations', 'methods', 'ethical considerations'],
        hint: 'Sjekk om etisk godkjenningsorgan og samtykkeprosedyre er dokumentert.'
      },
      10: {
        keywords: ['conclusion', 'implication', 'limitation', 'grounded in the data', 'summary', 'our findings demonstrate', 'drøfting', 'konklusjon'],
        sectionKeywords: ['conclusion', 'discussion', 'summary'],
        hint: 'Sjekk om konklusjonene holder seg innenfor det kvalitative datagrunnlaget uten ubelagte kausalslutninger.'
      }
    };

    for (const q of JBI_QUESTIONS) {
      const config = searchMap[q.id];
      if (!config) continue;

      let bestParagraphIndex = -1;
      let bestScore = 0;
      let bestSection = 'Methods / Text';

      for (const paragraph of paragraphs) {
        const pLower = paragraph.value.toLowerCase();
        let score = 0;
        for (const kw of config.keywords) if (pLower.includes(kw)) score += 2;
        for (const sec of config.sectionKeywords) if (pLower.includes(sec)) score += 1;

        if (score > bestScore) {
          bestScore = score;
          bestParagraphIndex = paragraph.index;
          for (const sec of config.sectionKeywords) {
            if (pLower.includes(sec)) {
              bestSection = sec.charAt(0).toUpperCase() + sec.slice(1);
              break;
            }
          }
        }
      }

      if (bestScore >= 2 && bestParagraphIndex >= 0) {
        const paragraph = paragraphs.find(item => item.index === bestParagraphIndex);
        if (!paragraph) continue;
        const bestSnippet = paragraph.value.length > 400 ? `${paragraph.value.substring(0, 400)}...` : paragraph.value;
        const estimatedPage = Math.max(1, Math.min(15, Math.ceil((bestParagraphIndex + 1) / 3))).toString();

        candidates.push({
          questionId: q.id,
          relevanceScore: Math.min(100, bestScore * 15),
          suggestedLocation: { page: estimatedPage, section: bestSection },
          extractedSnippet: bestSnippet,
          confidenceReason: `Automatisk kandidat fra ${bestSection}: ${config.hint}`,
          verifiedByResearcher: false,
        });
      }
    }

    return {
      fileName,
      analyzedAt: new Date().toISOString(),
      totalPassagesFound: candidates.length,
      disclaimer: 'Candidate evidence – requires researcher verification. Dette er automatisk identifiserte tekstutdrag som må evalueres og verifiseres av forsker/vurderer.',
      goldenRule: 'Metodisk prinsipp: Ikke funnet i tekstsøk betyr IKKE automatisk «Nei». All vurdering krever menneskelig faglig skjønn.',
      candidateEvidence: candidates,
    };
  }
}
