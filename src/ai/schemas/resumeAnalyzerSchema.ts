
/**
 * @fileOverview Zod schemas for Resume Analysis AI flow.
 */
import { z } from 'zod';

export const ResumeAnalysisInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The user's resume as a data URI (e.g., 'data:application/pdf;base64,...') that must include a MIME type and use Base64 encoding."
    ),
  jobDescription: z
    .string()
    .optional()
    .describe(
      'An optional job description to tailor the resume feedback against.'
    ),
});
export type ResumeAnalysisInput = z.infer<typeof ResumeAnalysisInputSchema>;

export const ResumeAnalysisOutputSchema = z.object({
  overallFeedback: z
    .string()
    .describe(
      'General constructive feedback on the resume (1-2 paragraphs).'
    ),
  strengths: z
    .array(z.string())
    .describe('A list of 3-5 key strengths identified in the resume.'),
  areasForImprovement: z
    .array(z.string())
    .describe(
      'A list of 3-5 areas for improvement with actionable advice.'
    ),
  keywordSuggestions: z
    .array(z.string())
    .optional()
    .describe(
      "Suggestions for relevant keywords to include, especially if no job description is provided. Example: \"Consider adding 'Agile', 'Scrum' if targeting project management roles.\""
    ),
  formattingClarityScore: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe(
      'A score from 1-10 on the resume\'s formatting, visual appeal, and readability. Briefly explain if not a perfect 10.'
    ),
  atsFriendlinessScore: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe(
      "A score from 1-10 on the resume's compatibility with Applicant Tracking Systems (ATS). Briefly explain if not a perfect 10."
    ),
  impactQuantificationScore: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe(
      'A score from 1-10 on how well achievements are quantified with numbers or specific results. Briefly explain if not a perfect 10.'
    ),
  tailoringTips: z
    .array(z.string())
    .optional()
    .describe(
      'If a job description was provided, specific tips on how to tailor this resume to that job.'
    ),
  suitabilityScore: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe(
      'If a job description was provided, an estimated suitability score (0-100) of the resume for that job.'
    ),
});
export type ResumeAnalysisOutput = z.infer<typeof ResumeAnalysisOutputSchema>;
