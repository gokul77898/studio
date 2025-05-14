
/**
 * @fileOverview Zod schemas for AI Cover Letter Generation flow.
 */
import { z } from 'zod';

export const GenerateCoverLetterInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The user's resume as a data URI (e.g., 'data:application/pdf;base64,...') that must include a MIME type and use Base64 encoding."
    ),
  jobDescription: z
    .string()
    .min(50, { message: "Job description must be at least 50 characters." })
    .describe(
      'The job description for the role the user is applying to.'
    ),
  userName: z.string().optional().describe("The user's full name, if available. Used for personalization."),
  companyName: z.string().optional().describe("The name of the company hiring for the role. Extracted from job description if possible."),
  jobTitle: z.string().optional().describe("The title of the job being applied for. Extracted from job description if possible."),
});
export type GenerateCoverLetterInput = z.infer<typeof GenerateCoverLetterInputSchema>;

export const GenerateCoverLetterOutputSchema = z.object({
  generatedCoverLetterText: z
    .string()
    .describe(
      'The newly generated cover letter content, typically in Markdown format.'
    ),
});
export type GenerateCoverLetterOutput = z.infer<typeof GenerateCoverLetterOutputSchema>;
