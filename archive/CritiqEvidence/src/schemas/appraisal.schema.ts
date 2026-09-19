import { z } from 'zod';

export const EvidenceAnchorSchema = z.object({
  section: z.enum(['ABSTRACT', 'INTRODUCTION', 'METHODS', 'RESULTS', 'DISCUSSION', 'OTHER']),
  quote: z.string().min(1, 'Sitat kan ikke være tomt'),
  pageNumber: z.number().int().positive().optional(),
  charOffsetStart: z.number().int().nonnegative().optional(),
  charOffsetEnd: z.number().int().nonnegative().optional(),
});

export const CriterionEvaluationSchema = z.object({
  criterionId: z.string().min(1),
  response: z.enum(['YES', 'NO', 'UNCLEAR', 'NOT_APPLICABLE']),
  rationale: z.string().min(5, 'Begrunnelse krever minst 5 tegn'),
  evidenceAnchors: z.array(EvidenceAnchorSchema),
});

export const FullAppraisalRecordSchema = z.object({
  id: z.string().uuid(),
  studyId: z.string().uuid(),
  framework: z.enum(['CASP_QUALITATIVE', 'AMSTAR_2', 'AGREE_II', 'COCHRANE_ROB_2']),
  evaluatorName: z.string().min(2),
  completed: z.boolean(),
  evaluations: z.array(CriterionEvaluationSchema),
  overallRiskOrQuality: z.enum(['HIGH', 'MODERATE', 'LOW', 'CRITICALLY_LOW']),
  summaryNotes: z.string().optional(),
  updatedAt: z.string().datetime(),
});

export type FullAppraisalRecord = z.infer<typeof FullAppraisalRecordSchema>;
