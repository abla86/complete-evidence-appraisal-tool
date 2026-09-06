import { ResearchAnalysis, StudyDesign, EthicsAssessmentStatus } from '../types/research';
import { generateId } from '../utils/id';

export class MetaResearchService {
  private readonly MIN_THRESHOLD = 3;

  public async analyzeDocument(text: string): Promise<ResearchAnalysis> {
    const cleanText = text.toLowerCase();
    const scores = {
      'RCT': this.countMatches(cleanText, ['randomized', 'trial', 'placebo', 'blinded']),
      'SYSTEMATIC_REVIEW': this.countMatches(cleanText, ['systematic review', 'meta-analysis', 'prisma']),
      'QUALITATIVE': this.countMatches(cleanText, ['qualitative', 'phenomenology', 'interview']),
      'OBSERVATIONAL': this.countMatches(cleanText, ['cohort', 'case-control', 'cross-sectional'])
    };
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] < this.MIN_THRESHOLD || (sorted[0][1] - sorted[1][1] < 2)) {
      return this.createUndetermined();
    }
    return {
      id: generateId(),
      timestamp: new Date().toISOString(),
      studyDesign: sorted[0][0] as StudyDesign,
      confidenceScore: Math.round(Math.min(95, (sorted[0][1] / (sorted[0][1] + 2)) * 100)),
      hasMethodology: sorted[0][1] >= 4,
      ethicsStatus: /rek|nsd|sikt/i.test(cleanText) ? 'REFERENCED' : 'NOT_FOUND' as EthicsAssessmentStatus,
      heuristicScreeningScore: Math.min(100, sorted[0][1] * 10),
      recommendedInstrumentId: this.mapToInstrument(sorted[0][0] as StudyDesign)
    } as ResearchAnalysis;
  }

  private countMatches(t: string, k: string[]): number {
    return k.reduce((a, w) => a + (t.includes(w) ? 2 : 0), 0);
  }

  private createUndetermined(): ResearchAnalysis {
    return { id: generateId(), timestamp: new Date().toISOString(), studyDesign: 'UNDETERMINED', confidenceScore: 0, ethicsStatus: 'NOT_FOUND', heuristicScreeningScore: 0, recommendedInstrumentId: null } as any;
  }

  private mapToInstrument(d: StudyDesign): string | null {
    const m: any = { 'RCT': 'casp-rct', 'SYSTEMATIC_REVIEW': 'casp-systematic-review', 'QUALITATIVE': 'casp-qualitative', 'OBSERVATIONAL': 'casp-cohort' };
    return m[d] || null;
  }
}
