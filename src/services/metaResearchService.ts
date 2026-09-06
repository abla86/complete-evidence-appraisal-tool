import { ResearchAnalysis, StudyDesign, EthicsAssessmentStatus } from '../types/research';
import { generateId } from '../utils/id';

export class MetaResearchService {
  private readonly MIN_THRESHOLD = 3;
  public async analyzeDocument(text: string): Promise<ResearchAnalysis> {
    const cleanText = text.toLowerCase();
    const scores = {
      'RCT': this.countMatches(cleanText, ['randomized', 'randomisert', 'blinded', 'placebo', 'allocation']),
      'SYSTEMATIC_REVIEW': this.countMatches(cleanText, ['systematic review', 'meta-analysis', 'prisma', 'cochrane']),
      'QUALITATIVE': this.countMatches(cleanText, ['qualitative', 'phenomenology', 'interview', 'thematic analysis']),
      'OBSERVATIONAL': this.countMatches(cleanText, ['cohort', 'case-control', 'cross-sectional'])
    };
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topScore = sorted[0][1];
    const margin = topScore - sorted[1][1];
    if (topScore < this.MIN_THRESHOLD || margin < 2) return this.createUndetermined();
    const topDesign = sorted[0][0] as StudyDesign;
    return {
      id: generateId('meta'),
      timestamp: new Date().toISOString(),
      engineUsed: 'WEIGHTED_HEURISTIC_V3',
      studyDesign: topDesign,
      confidenceScore: Math.round(Math.min(95, (topScore / (topScore + 2)) * 100)),
      hasMethodology: topScore >= 4,
      ethicsStatus: /rek|nsd|sikt/i.test(cleanText) ? 'REFERENCED' : 'NOT_FOUND',
      heuristicScreeningScore: Math.min(100, topScore * 10),
      recommendedInstrumentId: this.mapToInstrument(topDesign)
    };
  }
  private countMatches(t: string, k: string[]): number { return k.reduce((a, w) => a + (t.includes(w) ? 2 : 0), 0); }
  private createUndetermined(): any {
    return { id: generateId('meta'), timestamp: new Date().toISOString(), studyDesign: 'UNDETERMINED', confidenceScore: 0, ethicsStatus: 'NOT_FOUND', heuristicScreeningScore: 0, recommendedInstrumentId: null };
  }
  private mapToInstrument(d: StudyDesign): string | null {
    const m: any = { 'RCT': 'casp-rct', 'SYSTEMATIC_REVIEW': 'casp-systematic-review', 'QUALITATIVE': 'casp-qualitative', 'OBSERVATIONAL': 'casp-cohort' };
    return m[d] || null;
  }
}