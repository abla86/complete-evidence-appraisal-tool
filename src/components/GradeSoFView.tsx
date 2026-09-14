import React from 'react';
import {
  gradeEvidence,
  type GradeJudgement,
  type GradeLevel,
} from '../services/gradeMatrixService';

type Props = {
  judgement: GradeJudgement;
  initialLevel?: Extract<GradeLevel, 'High' | 'Low'>;
};

export default function GradeSoFView({ judgement, initialLevel = 'High' }: Props) {
  const result = gradeEvidence(initialLevel, judgement);

  return (
    <section aria-labelledby="grade-title">
      <h2 id="grade-title">GRADE Summary of Findings</h2>
      <p>
        Evidensnivå: <strong>{result.level}</strong>
      </p>
      <p>Antall nedgraderinger: {result.totalDowngrades}</p>
      {result.recommendations.length > 0 ? (
        <ul>
          {result.recommendations.map((recommendation) => (
            <li key={recommendation}>{recommendation}</li>
          ))}
        </ul>
      ) : (
        <p>Ingen nedgraderingsdomener er registrert.</p>
      )}
    </section>
  );
}
