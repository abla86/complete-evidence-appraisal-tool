import { z } from 'zod';

export const StudySectionSchema = z.object({
  type: z.enum(['ABSTRACT', 'INTRODUCTION', 'METHODS', 'RESULTS', 'DISCUSSION', 'OTHER']),
  heading: z.string(),
  content: z.string(),
  startIdx: z.number().int().nonnegative(),
});

export const StudySchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Tittel kan ikke være tom'),
  authors: z.string().default('Ukjente forfattere'),
  year: z.number().int().optional(),
  journal: z.string().optional(),
  doi: z.string().optional(),
  abstract: z.string().optional(),
  fullText: z.string().min(1, 'Artikkeltekst kan ikke være tom'),
  sections: z.array(StudySectionSchema).default([]),
  importedAt: z.string().datetime().optional(),
});

export type Study = z.infer<typeof StudySchema>;
export type StudySection = z.infer<typeof StudySectionSchema>;
