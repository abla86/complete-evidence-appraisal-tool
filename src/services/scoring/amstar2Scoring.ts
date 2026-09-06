export type Amstar2Confidence = 'HIGH' | 'MODERATE' | 'LOW' | 'CRITICALLY_LOW';

const CRITICAL_ITEMS = ['q2', 'q4', 'q7', 'q9', 'q11', 'q13', 'q15'] as const;
const NON_CRITICAL_ITEMS = ['q1', 'q3', 'q5', 'q6', 'q8', 'q10', 'q12', 'q14', 'q16'] as const;

export function calculateAmstar2Confidence(
  answers: Record<string, string>,
): Amstar2Confidence {
  const criticalFlaws = CRITICAL_ITEMS.filter(id => answers[id] === 'NO').length;
  const nonCriticalFlaws = NON_CRITICAL_ITEMS.filter(id => answers[id] === 'NO').length;

  // AMSTAR 2 does not use a summed quality score. Overall confidence is
  // determined by weaknesses in the seven critical domains and non-critical
  // weaknesses, following Shea et al. (2017).
  if (criticalFlaws === 0 && nonCriticalFlaws <= 1) return 'HIGH';
  if (criticalFlaws === 0) return 'MODERATE';
  if (criticalFlaws === 1) return 'LOW';
  return 'CRITICALLY_LOW';
}
