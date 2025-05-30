
/**
 * @fileOverview Zod schemas for AI Career Path Prediction flow.
 */
import { z } from 'zod';

export const EmploymentPreferenceSchema = z.enum(['Fresher', 'Internship', 'Full-time', 'Part-time', 'Contract']);
export type EmploymentPreference = z.infer<typeof EmploymentPreferenceSchema>;

export const CareerPathInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The user's resume as a data URI (e.g., 'data:application/pdf;base64,...') that must include a MIME type and use Base64 encoding."
    ),
  userGoals: z
    .string()
    .optional()
    .describe(
      'A textual description of the user\'s career goals, interests, or aspirations. (Optional)'
    ),
  employmentPreference: EmploymentPreferenceSchema.optional().describe(
    "The user's current career stage or desired employment type. (Optional)"
  ),
});
export type CareerPathInput = z.infer<typeof CareerPathInputSchema>;

export const CareerPathSuggestionSchema = z.object({
  pathTitle: z.string().describe('The title of the suggested career path (e.g., "AI Ethics Specialist", "Cloud Solutions Architect").'),
  description: z.string().describe('A summary of why this path might be a good fit.'),
  roadmap: z.array(z.string()).describe('A high-level textual roadmap: key skills to develop, potential certifications/learning, and general outlook.'),
  conceptualSkills: z.array(z.string()).optional().describe('Key skills or knowledge areas central to this path.'),
  conceptualCertifications: z.array(z.string()).optional().describe('Types of certifications or further learning that could be beneficial.'),
  salaryOutlookGeneral: z.string().optional().describe('A general, conceptual statement about salary potential (e.g., "Competitive", "High growth potential"). Not a precise prediction.'),
  timeEstimateGeneral: z.string().optional().describe('A general, conceptual statement about the time it might take to transition or establish in this path (e.g., "1-3 years with focused effort"). Not a precise timeline.'),
  transferableSkillsFromResume: z.array(z.string()).optional().describe("Skills identified from the user's resume that are directly transferable to this career path."),
  learningResourceSuggestions: z.array(z.string()).optional().describe("Conceptual suggestions for learning resources (e.g., 'Explore courses on cloud platforms like AWS/Azure', 'Contribute to open-source Python projects')."),
  industryOutlook: z.string().optional().describe("A brief, general outlook for the industry or role (e.g., 'Strong growth projected due to increasing data adoption', 'Highly competitive field requiring continuous skill updates')."),
  potentialChallenges: z.array(z.string()).optional().describe("Common challenges or important considerations for this career path (e.g., 'Keeping up with rapid technological advancements', 'May require strong problem-solving under pressure')."),
});
export type CareerPathSuggestion = z.infer<typeof CareerPathSuggestionSchema>;

export const CareerPathOutputSchema = z.object({
  suggestedPaths: z
    .array(CareerPathSuggestionSchema)
    .min(1, { message: "AI should suggest at least one career path."})
    .max(5, { message: "AI should suggest at most 5 career paths."})
    .describe(
      'A list of 3-5 viable future career paths suggested by the AI.'
    ),
  strongestFitAnalysis: z.object({
    recommendedPathTitle: z.string().optional().describe("The title of the path the AI considers a particularly strong fit, if any stands out."),
    reasoning: z.string().optional().describe("The AI's reasoning for why this path is a strong fit, based on the resume and goals."),
  }).optional().describe("The AI's analysis of which suggested path might be the strongest fit, with reasoning. This is a qualitative assessment."),
});
export type CareerPathOutput = z.infer<typeof CareerPathOutputSchema>;

