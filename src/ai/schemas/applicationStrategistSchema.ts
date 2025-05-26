
/**
 * @fileOverview Zod schemas for AI Application Strategist flow.
 */
import { z } from 'zod';

export const ApplicationStrategistInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The user's resume as a data URI (e.g., 'data:application/pdf;base64,...') that must include a MIME type and use Base64 encoding."
    ),
  jobDescriptionText: z
    .string()
    .min(50, { message: 'Job description must be at least 50 characters.' })
    .describe('The full text of the specific job description the user is targeting.'),
});
export type ApplicationStrategistInput = z.infer<typeof ApplicationStrategistInputSchema>;

const TargetedResumeEnhancementSchema = z.object({
  areaToImprove: z.string().describe("The section or aspect of the resume that could be enhanced (e.g., 'Experience section for Project X', 'Skills summary')."),
  suggestion: z.string().describe("The specific suggestion for improvement or rephrasing."),
});

const PotentialInterviewQuestionSchema = z.object({
  question: z.string().describe("A potential interview question the user might face."),
  reasoning: z.string().describe("A brief explanation of why this question might be asked based on the JD/resume."),
});

export const ApplicationStrategistOutputSchema = z.object({
  resumeJdMatchAnalysis: z.object({
        strongMatches: z.array(z.string()).describe("Key skills/experiences from the resume that strongly match the job description."),
        potentialGaps: z.array(z.string()).describe("Key requirements from the job description that seem less emphasized or missing in the resume."),
        matchSummary: z.string().describe("A brief summary of the overall resume-to-JD alignment."),
    }).describe("Analysis of how the resume matches the job description."),
  targetedResumeEnhancements: z
    .array(TargetedResumeEnhancementSchema)
    .describe(
      'Specific, actionable suggestions on how to tweak the resume for this particular job.'
    ),
  coverLetterTalkingPoints: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe(
      '2-5 key talking points or themes to emphasize in the cover letter for this job.'
    ),
  potentialInterviewQuestions: z
    .array(PotentialInterviewQuestionSchema)
    .min(2)
    .max(4)
    .describe(
      '2-4 potential interview questions the user might prepare for, with reasoning.'
    ),
  overallStrategySnippet: z
    .string()
    .describe(
      'A brief summary (1-2 paragraphs) of overall strengths and key focus areas for this application.'
    ),
});
export type ApplicationStrategistOutput = z.infer<typeof ApplicationStrategistOutputSchema>;
