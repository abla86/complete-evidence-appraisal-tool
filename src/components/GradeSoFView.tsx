import React from 'react';import {gradeEvidence,type GradeJudgement} from '../services/gradeMatrixService';export default function GradeSoFView({judgement}:{judgement:GradeJudgement}){const r=gradeEvidence('High',judgement);return <section><h2>GRADE Summary of Findings</h2><strong>{r.level}</strong>{r.recommendations.map(x=><p key={x}>{x}</p>)}</section>}

