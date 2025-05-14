
/**
 * @fileOverview Zod schemas for AI Skill Gap Analysis flow.
 */
import { z } from 'zod';

export const SkillGapAnalysisInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The user's resume as a data URI (e.g., 'data:application/pdf;base64,...') that must include a MIME type and use Base64 encoding."
    ),
  jobDescription: z
    .string()
    .min(50, { message: "Job description must be at least 50 characters." })
    .describe(
      'The job description for the target role.'
    ),
});
export type SkillGapAnalysisInput = z.infer<typeof SkillGapAnalysisInputSchema>;

export const SkillGapAnalysisOutputSchema = z.object({
  identifiedUserSkills: z
    .array(z.string())
    .describe("A list of key skills, tools, and technologies identified from the user's resume."),
  identifiedJobRequirements: z
    .array(z.string())
    .describe("A list of key skills, tools, and technologies identified as requirements from the job description."),
  matchingSkills: z
    .array(z.string())
    .describe("Skills that are present in both the user's resume and the job description requirements."),
  missingSkills: z
    .array(z.string())
    .describe("Key skills required by the job description that appear to be missing or not emphasized in the user's resume."),
  skillGapSummary: z
    .string()
    .describe("A brief summary (2-3 sentences) of the overall skill alignment and any major gaps."),
  suggestionsForImprovement: z
    .array(z.string())
    .describe("Actionable suggestions or learning resources to help bridge the identified skill gaps. Could include types of projects, courses, or specific technologies to focus on."),
  overallFitScore: z
    .number()
    .min(0)
    .max(100)
    .describe("An estimated score (0-100) representing how well the user's skills match the job requirements."),
});
export type SkillGapAnalysisOutput = z.infer<typeof SkillGapAnalysisOutputSchema>;
