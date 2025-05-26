
'use server';
/**
 * @fileOverview AI-powered Job Description Analyzer flow.
 * Analyzes job descriptions for tone, culture cues, and potential satisfaction factors.
 *
 * - analyzeJobDescriptionText - A function that performs the analysis.
 * - JobDescriptionAnalyzerInput - Input type.
 * - JobDescriptionAnalyzerOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import {
  JobDescriptionAnalyzerInputSchema,
  JobDescriptionAnalyzerOutputSchema,
  type JobDescriptionAnalyzerInput,
  type JobDescriptionAnalyzerOutput,
} from '../schemas/jobDescriptionAnalyzerSchema';

const jobDescriptionAnalyzerPrompt = ai.definePrompt({
  name: 'jobDescriptionAnalyzerPrompt',
  input: { schema: JobDescriptionAnalyzerInputSchema },
  output: { schema: JobDescriptionAnalyzerOutputSchema },
  prompt: `You are an expert Career Counselor and Organizational Psychologist AI. Your task is to analyze the provided job description text to infer potential indicators of job satisfaction, company culture, and work environment.
You do NOT have access to external APIs for company reputation or live employee reviews. Your analysis MUST be based SOLELY on the text of the job description provided.

Job Description to Analyze:
{{{jobDescriptionText}}}

{{#if companyName}}
Company Name (for general context if widely known, but do not assume external knowledge): {{{companyName}}}
{{/if}}

Instructions for Analysis:

1.  **Overall Tone ('overallTone'):**
    *   Describe the overall tone and sentiment conveyed by the language used in the job description (e.g., "Enthusiastic and growth-oriented," "Formal and demanding," "Neutral and factual," "Vague and uninspiring").

2.  **Positive Cues ('positiveCues'):**
    *   Identify specific phrases or keywords (max 3-5) from the job description that suggest a positive work environment, good culture, appealing aspects of the role, or employee well-being.
    *   For each 'cue', provide a brief 'explanation' of why it's a positive indicator.
    *   Example: cue: "Emphasis on learning and development programs", explanation: "Indicates company invests in employee growth."

3.  **Potential Concerns ('potentialConcerns'):**
    *   Identify specific phrases or keywords (max 3-5) from the job description that might indicate potential red flags, high pressure, poor work-life balance, ambiguity, or other less desirable aspects.
    *   For each 'cue', provide a brief 'explanation' of why it might be a concern.
    *   Example: cue: "Must be comfortable in a fast-paced, 24/7 environment", explanation: "May imply very long hours and high burnout risk."

4.  **Work-Life Balance Indicator ('workLifeBalanceIndicator'):**
    *   Based *only* on the text, provide a qualitative assessment of what the job description implies about work-life balance (e.g., "Appears to value work-life balance by mentioning flexible hours," "Suggests demanding hours may be common due to phrases like 'whatever it takes'," "Not explicitly mentioned, requires further inquiry during the interview process").

5.  **Autonomy vs. Collaboration Indicator ('autonomyCollaborationIndicator'):**
    *   Based *only* on the text, provide a qualitative assessment of what the job description implies about the balance between autonomy and collaboration (e.g., "Strong emphasis on teamwork and cross-functional projects," "Suggests a high degree of independent work and ownership," "Seems to offer a mix of both collaborative and autonomous tasks").

6.  **Growth Opportunity Indicator ('growthOpportunityIndicator'):**
    *   Based *only* on the text, provide a qualitative assessment of what the job description implies about learning and growth opportunities (e.g., "Highlights clear paths for advancement and skill development," "Focuses primarily on current responsibilities with less explicit mention of future growth," "Unclear from the description, good to ask about").

7.  **Management Style Cues ('managementStyleCues'):**
    *   Identify specific phrases or keywords (max 2-3) that might *hint* at the potential management style. These are interpretations.
    *   For each 'cue', provide a brief 'explanation' of its possible implication.
    *   Example: cue: "Reports directly to senior leadership for all tasks", explanation: "Could imply close supervision or, conversely, high visibility."
    *   Example: cue: "Expected to take initiative and drive projects independently", explanation: "Hints at a more empowering and autonomous management approach."

8.  **Summary and Advice ('summaryAndAdvice'):**
    *   Provide a concluding summary (2-3 sentences) of your analysis.
    *   Offer brief advice for a candidate considering this role, focusing on what aspects they might want to clarify or look out for during the interview process based on your textual analysis.
    *   Crucially, reiterate that this analysis is an *interpretation of the job description's text* and not a definitive prediction of actual job satisfaction or company culture, which can only be truly assessed through further research and direct interaction.

Output Format: Ensure your response is strictly in the JSON format defined by the JobDescriptionAnalyzerOutputSchema. Be objective and base your findings on the provided text.
If the job description is too vague to make a reasonable assessment for a particular field, state that clearly (e.g., "Not enough information in the text to assess X").
`,
  config: {
    temperature: 0.4, // Lower temperature for more grounded textual analysis
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
});

const jobDescriptionAnalyzerFlow = ai.defineFlow(
  {
    name: 'jobDescriptionAnalyzerFlow',
    inputSchema: JobDescriptionAnalyzerInputSchema,
    outputSchema: JobDescriptionAnalyzerOutputSchema,
  },
  async (input) => {
    const { output } = await jobDescriptionAnalyzerPrompt(input);
    if (!output) {
      console.error(
        'Job Description Analyzer flow received no output from the prompt.'
      );
      // Fallback to a generic message if AI fails
      return {
        overallTone: "Could not analyze tone due to an issue.",
        positiveCues: [],
        potentialConcerns: [],
        workLifeBalanceIndicator: "Analysis unavailable.",
        autonomyCollaborationIndicator: "Analysis unavailable.",
        growthOpportunityIndicator: "Analysis unavailable.",
        managementStyleCues: [],
        summaryAndAdvice: "The AI was unable to process the job description at this time. Please ensure it's a valid job description and try again."
      };
    }
    return output;
  }
);

export async function analyzeJobDescriptionText(
  input: JobDescriptionAnalyzerInput
): Promise<JobDescriptionAnalyzerOutput> {
  return jobDescriptionAnalyzerFlow(input);
}
