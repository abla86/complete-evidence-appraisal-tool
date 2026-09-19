import { ArticleAnalysis } from '../types';

export class AppraisalResultService {
  public static calculateOverallScore(analysis: ArticleAnalysis): {
    score: number; // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    confidence: 'Høy' | 'Moderat' | 'Lav';
  } {
    const checklists = analysis.checklists;
    if (!checklists || checklists.length === 0) return { score: 0, grade: 'F', confidence: 'Lav' };

    let points = 0;
    let maxPoints = checklists.length * 2;

    checklists.forEach(item => {
      if (item.answer === 'Ja') points += 2;
      else if (item.answer === 'Delvis') points += 1;
      else if (item.answer === 'Ikke relevant') {
        maxPoints -= 2; // Exclude from max
      }
    });

    const score = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;

    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 75) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 45) grade = 'D';

    return {
      score,
      grade,
      confidence: score >= 75 ? 'Høy' : score >= 50 ? 'Moderat' : 'Lav'
    };
  }
}
