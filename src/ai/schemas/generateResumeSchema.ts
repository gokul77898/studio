
/**
 * @fileOverview Zod schemas for AI Resume Generation flow.
 */
import { z } from 'zod';
import { ResumeAnalysisOutputSchema } from './resumeAnalyzerSchema'; // Reusing for analysis input

export const GenerateResumeInputSchema = z.object({
  originalResumeDataUri: z
    .string()
    .describe(
      "The user's original resume as a data URI (e.g., 'data:application/pdf;base64,...') that must include a MIME type and use Base64 encoding."
    ),
  analysisFeedback: ResumeAnalysisOutputSchema.describe(
    'The feedback received from the initial resume analysis.'
  ),
  jobDescription: z
    .string()
    .optional()
    .describe(
      'An optional job description to tailor the generated resume against.'
    ),
});
export type GenerateResumeInput = z.infer<typeof GenerateResumeInputSchema>;

export const GenerateResumeOutputSchema = z.object({
  generatedResumeText: z
    .string()
    .describe(
      'The newly generated resume content, typically in Markdown format.'
    ),
});
export type GenerateResumeOutput = z.infer<typeof GenerateResumeOutputSchema>;
