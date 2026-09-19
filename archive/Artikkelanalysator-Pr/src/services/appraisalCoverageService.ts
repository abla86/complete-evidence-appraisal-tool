import { ChecklistItem } from '../types';

export class AppraisalCoverageService {
  public static calculateCoverage(checklists: ChecklistItem[]): {
    completionRate: number; // percentage 0-100
    answeredCount: number;
    totalCount: number;
    categoryBreakdown: Record<string, { answered: number; total: number }>;
  } {
    const totalCount = checklists.length;
    if (totalCount === 0) return { completionRate: 0, answeredCount: 0, totalCount: 0, categoryBreakdown: {} };

    let answeredCount = 0;
    const categoryBreakdown: Record<string, { answered: number; total: number }> = {};

    checklists.forEach(item => {
      const isAnswered = item.answer && item.answer !== 'Ikke relevant' && item.justification && item.justification.length > 5;
      if (isAnswered) answeredCount++;

      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = { answered: 0, total: 0 };
      }
      categoryBreakdown[item.category].total++;
      if (isAnswered) {
        categoryBreakdown[item.category].answered++;
      }
    });

    const completionRate = Math.round((answeredCount / totalCount) * 100);

    return {
      completionRate,
      answeredCount,
      totalCount,
      categoryBreakdown
    };
  }
}
