import type { ResearchAnalysis, StudyDesign, EthicsAssessmentStatus } from '../types/research';
import { generateId } from '../utils/id';

export class MetaResearchService {
  private readonly MIN_THRESHOLD = 3;
  public async analyzeDocument(text: string): Promise<ResearchAnalysis> {
    const cleanText = text.toLowerCase();
    const scores: Record<Exclude<StudyDesign, 'UNDETERMINED'>, number> = {
      RCT: this.countMatches(cleanText, ['randomized','randomised','randomisert','placebo','blinded','allocation','controlled trial']),
      SYSTEMATIC_REVIEW: this.countMatches(cleanText, ['systematic review','meta-analysis','prisma','cochrane','systematisk oversikt']),
      QUALITATIVE: this.countMatches(cleanText, ['qualitative','phenomenology','grounded theory','interview','thematic analysis','kvalitativ']),
      OBSERVATIONAL: this.countMatches(cleanText, ['cohort','case-control','cross-sectional','longitudinal','observational','tverrsnitt'])
    };
    const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]);
    const [topDesign, topScore] = sorted[0];
    const secondScore = sorted[1]?.[1] ?? 0;
    if (topScore < this.MIN_THRESHOLD || topScore - secondScore < 2) return this.createUndeterminedResult();
    const design = topDesign as Exclude<StudyDesign,'UNDETERMINED'>;
    return {
      id: generateId('meta'), timestamp: new Date().toISOString(), engineUsed: 'WEIGHTED_HEURISTIC_V3', studyDesign: design,
      confidenceScore: Math.round(Math.min(95, (topScore/(topScore+2))*100)), hasMethodology: topScore >= 4,
      ethicsStatus: this.detectEthics(cleanText), heuristicScreeningScore: Math.min(100, topScore*10), recommendedInstrumentId: this.mapToInstrument(design)
    };
  }
  private countMatches(text: string, keywords: string[]): number { return keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 2 : 0), 0); }
  private detectEthics(text: string): EthicsAssessmentStatus { return /rek|nsd|sikt|ethical approval|ethics committee|informed consent|informert samtykke/.test(text) ? 'REFERENCED' : 'NOT_FOUND'; }
  private createUndeterminedResult(): ResearchAnalysis { return { id: generateId('meta'), timestamp: new Date().toISOString(), studyDesign:'UNDETERMINED', confidenceScore:0, ethicsStatus:'NOT_FOUND', heuristicScreeningScore:0, recommendedInstrumentId:null, hasMethodology:false, engineUsed:'WEIGHTED_HEURISTIC_V3' }; }
  private mapToInstrument(design: Exclude<StudyDesign,'UNDETERMINED'>): string | null { const mapping: Record<Exclude<StudyDesign,'UNDETERMINED'>,string> = { RCT:'casp-rct', SYSTEMATIC_REVIEW:'casp-systematic-review', QUALITATIVE:'casp-qualitative', OBSERVATIONAL:'casp-cohort' }; return mapping[design] ?? null; }
}