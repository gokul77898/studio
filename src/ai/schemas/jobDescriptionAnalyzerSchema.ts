
/**
 * @fileOverview Zod schemas for AI Job Description Analyzer flow.
 */
import { z } from 'zod';

export const JobDescriptionAnalyzerInputSchema = z.object({
  jobDescriptionText: z
    .string()
    .min(100, { message: 'Job description must be at least 100 characters.' })
    .describe('The full text of the job description to be analyzed.'),
  companyName: z
    .string()
    .optional()
    .describe(
      'The name of the company. (Optional, for AI general knowledge context if the company is widely known)'
    ),
});
export type JobDescriptionAnalyzerInput = z.infer<typeof JobDescriptionAnalyzerInputSchema>;

const TextualCueSchema = z.object({
    cue: z.string().describe("The specific phrase or keyword from the job description."),
    explanation: z.string().describe("A brief explanation of why this cue is relevant to the category (positive, concern, etc.).")
});

export const JobDescriptionAnalyzerOutputSchema = z.object({
  overallTone: z
    .string()
    .describe(
      'A qualitative description of the overall tone and sentiment of the job description (e.g., "Enthusiastic and growth-oriented", "Formal and demanding", "Neutral and factual").'
    ),
  positiveCues: z
    .array(TextualCueSchema)
    .describe(
      'Specific phrases or keywords from the job description that suggest a positive work environment, good culture, or appealing aspects of the role.'
    ),
  potentialConcerns: z
    .array(TextualCueSchema)
    .describe(
      'Specific phrases or keywords from the job description that might indicate potential red flags, high pressure, poor work-life balance, or other less desirable aspects.'
    ),
  workLifeBalanceIndicator: z
    .string()
    .describe(
      'A qualitative assessment of what the job description implies about work-life balance (e.g., "Appears to value work-life balance", "Suggests demanding hours may be common", "Not explicitly mentioned, requires further inquiry").'
    ),
  autonomyCollaborationIndicator: z
    .string()
    .describe(
      'A qualitative assessment of what the job description implies about autonomy vs. collaboration (e.g., "Emphasizes teamwork and collaborative projects", "Suggests a high degree of independent work and autonomy", "Mix of both indicated").'
    ),
  growthOpportunityIndicator: z
    .string()
    .describe(
      'A qualitative assessment of what the job description implies about learning and growth opportunities (e.g., "Highlights opportunities for skill development and career progression", "Focuses on current responsibilities with less emphasis on growth", "Unclear from description").'
    ),
  managementStyleCues: z
    .array(TextualCueSchema)
    .describe(
      'Phrases or keywords that might hint at the management style (e.g., "closely supervised" implying micromanagement, "empowers teams" suggesting supportive leadership). These are interpretations.'
    ),
    summaryAndAdvice: z
    .string()
    .describe(
      'A concluding summary of the analysis and brief advice for a candidate considering this role based on the textual cues, focusing on potential satisfaction factors. It should remind the user that this is an interpretation of the text.'
    ),
});
export type JobDescriptionAnalyzerOutput = z.infer<
  typeof JobDescriptionAnalyzerOutputSchema
>;
