import { CandidateEvidence, DocumentAnalysisResult } from '../types';
import { JBI_QUESTIONS } from '../data/jbiData';
import { IMRaDAnalysisService } from './imradAnalysisService';

export class DocumentAnalysisService {
  /**
   * Analyzes research text and extracts candidate evidence passages.
   * Automated extraction is never treated as a methodological judgement.
   * "Ikke funnet â‰  No" remains a hard rule.
   */
  public static analyzeText(
    text: string,
    fileName: string = 'research-article.pdf',
  ): DocumentAnalysisResult {
    if (!text?.trim()) {
      return {
        fileName,
        analyzedAt: new Date().toISOString(),
        totalPassagesFound: 0,
        disclaimer:
          'Ingen kandidat-evidens ble generert fordi dokumentteksten er tom.',
        goldenRule:
          'Metodisk prinsipp: Ikke funnet i tekstsÃ¸k betyr IKKE automatisk Â«NeiÂ». All vurdering krever menneskelig faglig skjÃ¸nn.',
        candidateEvidence: [],
        imradAnalysis: IMRaDAnalysisService.analyze('', fileName),
      };
    }

    const candidates: CandidateEvidence[] = [];

    const paragraphs = text
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map((value, index) => ({
        value: value.trim(),
        index,
      }))
      .filter(item => item.value.length > 30);

    const searchMap: Record<
      number,
      {
        keywords: string[];
        sectionKeywords: string[];
        hint: string;
      }
    > = {
      1: {
        keywords: [
          'philosoph',
          'ontolog',
          'epistemolog',
          'paradigm',
          'hermeneutic',
          'phenomenolog',
          'constructiv',
          'realis',
          'critical realist',
          'post-positiv',
          'grounded theory perspective',
        ],
        sectionKeywords: [
          'method',
          'design',
          'theoretical framework',
          'philosophy',
        ],
        hint:
          'Sjekk om forfatterne eksplisitt gjÃ¸r rede for filosofisk/epistemologisk stÃ¥sted eller kun metodologi.',
      },
      2: {
        keywords: [
          'aim',
          'objective',
          'research question',
          'purpose',
          'formÃ¥l',
          'problemstilling',
          'explore',
          'investigate',
          'understand experiences',
        ],
        sectionKeywords: [
          'introduction',
          'background',
          'aim',
          'purpose',
        ],
        hint:
          'Sjekk om kvalitativ metodologi passer problemstillingen.',
      },
      3: {
        keywords: [
          'data collection',
          'interview',
          'semi-structured',
          'focus group',
          'observation',
          'fieldwork',
          'audio-recorded',
          'topic guide',
          'interview guide',
        ],
        sectionKeywords: [
          'data collection',
          'methods',
          'participants',
        ],
        hint:
          'Sjekk om intervju/observasjonsform harmonerer med den metodologiske tradisjonen.',
      },
      4: {
        keywords: [
          'thematic analysis',
          'constant comparative',
          'coding',
          'framework analysis',
          'grounded theory coding',
          'axial coding',
          'braun and clarke',
          'transcrib',
          'nvivo',
          'categor',
        ],
        sectionKeywords: [
          'data analysis',
          'analysis',
          'methods',
        ],
        hint:
          'Sjekk om analyseprosedyren fÃ¸lger anerkjente trinn i metoden.',
      },
      5: {
        keywords: [
          'theme',
          'category',
          'conceptual model',
          'findings',
          'results',
          'framework',
          'typology',
          'interpretation',
          'sub-theme',
        ],
        sectionKeywords: [
          'results',
          'findings',
          'discussion',
        ],
        hint:
          'Sjekk om tolkningene bygger konsistent pÃ¥ den analytiske tilnÃ¦rmingen.',
      },
      6: {
        keywords: [
          'reflexivity',
          'positionality',
          'background of the researcher',
          'research team',
          'author background',
          'insider',
          'outsider',
          'pre-understanding',
          'forforstÃ¥else',
        ],
        sectionKeywords: [
          'methods',
          'reflexivity',
          'authors',
          'research team',
        ],
        hint:
          'Sjekk om forfatterne gjÃ¸r rede for egen kulturell eller teoretisk posisjonering.',
      },
      7: {
        keywords: [
          'influence of the researcher',
          'power dynamic',
          'rapport',
          'co-construction',
          'field notes',
          'peer debriefing',
          'bracketing',
          'reflexive diary',
        ],
        sectionKeywords: [
          'reflexivity',
          'strengths and limitations',
          'methods',
        ],
        hint:
          'Sjekk om forskerens pÃ¥virkning pÃ¥ studien og deltakerne er drÃ¸ftet.',
      },
      8: {
        keywords: [
          'quote',
          'participant',
          'informant',
          'voices',
          'extract',
          'verbatim',
          'representative quotation',
          'narrative',
        ],
        sectionKeywords: [
          'results',
          'findings',
        ],
        hint:
          'Sjekk om deltakernes egne stemmer og sitater er tilstrekkelig representert.',
      },
      9: {
        keywords: [
          'ethics',
          'ethical approval',
          'irb',
          'rek',
          'nsd',
          'sikt',
          'informed consent',
          'confidentiality',
          'anonymity',
          'consent was obtained',
        ],
        sectionKeywords: [
          'ethics',
          'declarations',
          'methods',
          'ethical considerations',
        ],
        hint:
          'Sjekk om etisk godkjenningsorgan og samtykkeprosedyre er dokumentert.',
      },
      10: {
        keywords: [
          'conclusion',
          'implication',
          'limitation',
          'grounded in the data',
          'summary',
          'our findings demonstrate',
          'drÃ¸fting',
          'konklusjon',
        ],
        sectionKeywords: [
          'conclusion',
          'discussion',
          'summary',
        ],
        hint:
          'Sjekk om konklusjonene holder seg innenfor det kvalitative datagrunnlaget uten ubelagte kausalslutninger.',
      },
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

        for (const keyword of config.keywords) {
          if (pLower.includes(keyword)) score += 2;
        }

        for (const sectionKeyword of config.sectionKeywords) {
          if (pLower.includes(sectionKeyword)) score += 1;
        }

        if (score > bestScore) {
          bestScore = score;
          bestParagraphIndex = paragraph.index;

          for (const sectionKeyword of config.sectionKeywords) {
            if (pLower.includes(sectionKeyword)) {
              bestSection =
                sectionKeyword.charAt(0).toUpperCase() +
                sectionKeyword.slice(1);
              break;
            }
          }
        }
      }

      if (bestScore >= 2 && bestParagraphIndex >= 0) {
        const paragraph = paragraphs.find(
          item => item.index === bestParagraphIndex,
        );

        if (!paragraph) continue;

        const bestSnippet =
          paragraph.value.length > 400
            ? `${paragraph.value.substring(0, 400)}...`
            : paragraph.value;

        candidates.push({
          questionId: q.id,
          relevanceScore: Math.min(100, bestScore * 15),
          suggestedLocation: {
            page: undefined,
            section: bestSection,
          },
          extractedSnippet: bestSnippet,
          confidenceReason:
            `Automatisk kandidat fra ${bestSection}. ` +
            'Sideangivelse er ikke kjent fra ren tekstanalyse og mÃ¥ kontrolleres mot originaldokumentet. ' +
            config.hint,
          verifiedByResearcher: false,
        });
      }
    }

    return {
      fileName,
      analyzedAt: new Date().toISOString(),
      totalPassagesFound: candidates.length,
      imradAnalysis: IMRaDAnalysisService.analyze(text, fileName),
      disclaimer:
        'Candidate evidence â€“ requires researcher verification. Dette er automatisk identifiserte tekstutdrag som mÃ¥ evalueres og verifiseres av forsker/vurderer. Lokasjon fra ren tekstanalyse skal ikke behandles som verifisert sidehenvisning.',
      goldenRule:
        'Metodisk prinsipp: Ikke funnet i tekstsÃ¸k betyr IKKE automatisk Â«NeiÂ». All vurdering krever menneskelig faglig skjÃ¸nn.',
      candidateEvidence: candidates,
    };
  }
}


