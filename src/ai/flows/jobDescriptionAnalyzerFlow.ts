
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
  prompt: `You are an expert Career Counselor and Organizational Psychologist AI. Your task is to perform a deep and nuanced analysis of the provided job description text to infer potential indicators of job satisfaction, company culture, and work environment.
You do NOT have access to external APIs for company reputation or live employee reviews. Your analysis MUST be based SOLELY on the text of the job description provided.

Job Description to Analyze:
{{{jobDescriptionText}}}

{{#if companyName}}
Company Name (for general context if widely known, but do not assume external knowledge): {{{companyName}}}
{{/if}}

Instructions for In-Depth Analysis:

1.  **Overall Tone ('overallTone'):**
    *   Describe the overall tone and sentiment conveyed by the language used in the job description (e.g., "Enthusiastic and growth-oriented," "Formal and demanding," "Neutral and factual," "Vague and uninspiring," "Collaborative and supportive"). Provide specific examples from the text to support your assessment.

2.  **Positive Cues ('positiveCues'):**
    *   Identify specific phrases or keywords (max 3-5) from the job description that strongly suggest a positive work environment, good culture, appealing aspects of the role, or employee well-being.
    *   For each 'cue', provide a detailed 'explanation' of why it's a positive indicator, linking it to potential job satisfaction factors.
    *   Example: cue: "Emphasis on learning and development programs", explanation: "This indicates the company likely invests in employee growth and skill enhancement, which can lead to higher job satisfaction and career progression."

3.  **Potential Concerns & Red Flags ('potentialConcerns'):**
    *   Identify specific phrases or keywords (max 3-5) from the job description that might indicate potential red flags, high pressure, poor work-life balance, ambiguity, or other less desirable aspects.
    *   Explicitly flag if language suggests: "High Burnout Risk", "Low Autonomy", "Likely Micromanagement", "Vague Role Expectations", "Unrealistic Demands", or "Poor Cultural Fit for X type of individual".
    *   For each 'cue' or flag, provide a detailed 'explanation' of why it might be a concern, and what it could imply for a candidate.
    *   Example: cue: "Must be comfortable in a fast-paced, 24/7 environment and willing to go the extra mile", explanation: "This language may imply very long hours and a high-pressure culture, potentially leading to 'High Burnout Risk'. Candidates should clarify expectations around working hours and on-call responsibilities."

4.  **Work-Life Balance Indicator ('workLifeBalanceIndicator'):**
    *   Based *only* on the text, provide a detailed qualitative assessment of what the job description implies about work-life balance. Discuss specific phrases and their potential impact. (e.g., "The mention of 'flexible hours' alongside 'meeting tight deadlines' presents a mixed signal. While flexibility is positive, the emphasis on deadlines might still point to a demanding schedule. This needs clarification.").

5.  **Autonomy vs. Collaboration Indicator ('autonomyCollaborationIndicator'):**
    *   Based *only* on the text, provide a detailed qualitative assessment of what the job description implies about the balance between independent work and teamwork. Note any language that points towards the level of empowerment or directive style.

6.  **Growth Opportunity Indicator ('growthOpportunityIndicator'):**
    *   Based *only* on the text, provide a detailed qualitative assessment of what the job description implies about learning and growth opportunities. Are paths for advancement clear, or is the focus primarily on immediate tasks?

7.  **Management Style Cues ('managementStyleCues'):**
    *   Identify specific phrases or keywords (max 2-3) that might *hint* at the potential management style. These are interpretations.
    *   For each 'cue', provide a detailed 'explanation' of its possible implication, such as whether it hints at a supportive, empowering, directive, or hands-off style.
    *   Example: cue: "Reports directly to senior leadership for all tasks and must provide daily updates", explanation: "Could imply close supervision and potentially 'Likely Micromanagement', or alternatively, high visibility for one's work. The need for daily updates might reduce autonomy."

8.  **Summary and Advice ('summaryAndAdvice'):**
    *   Provide a concluding summary (2-4 sentences) of your in-depth analysis, synthesizing the key positive and negative indicators.
    *   Offer highly specific advice for a candidate considering this role, focusing on 2-3 crucial questions they should ask during the interview process to clarify ambiguities or confirm positive/negative inferences you've made from the text.
    *   Crucially, reiterate that this analysis is an *interpretation of the job description's text* and not a definitive prediction of actual job satisfaction or company culture. Advise the candidate to use this as a guide for their own research and interview questions.

Output Format: Ensure your response is strictly in the JSON format defined by the JobDescriptionAnalyzerOutputSchema. Be objective, analytical, and base your findings on the provided text. If the job description is too vague to make a reasonable assessment for a particular field, state that clearly (e.g., "Not enough information in the text to assess X in detail").
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
      // Fallback to a structured "analysis unavailable" message
      return {
        overallTone: "AI analysis unavailable at this time. The AI could not process the job description.",
        positiveCues: [{ cue: "N/A", explanation: "Positive cues analysis unavailable."}],
        potentialConcerns: [{ cue: "N/A", explanation: "Potential concerns analysis unavailable."}],
        workLifeBalanceIndicator: "Work-life balance assessment unavailable from the text.",
        autonomyCollaborationIndicator: "Autonomy/collaboration assessment unavailable from the text.",
        growthOpportunityIndicator: "Growth opportunity assessment unavailable from the text.",
        managementStyleCues: [{ cue: "N/A", explanation: "Management style cues analysis unavailable."}],
        summaryAndAdvice: "The AI was unable to process the job description for a detailed analysis. Please ensure it's a valid job description and try again. Remember, textual analysis is only one part of evaluating a role; further research and interview questions are crucial."
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
