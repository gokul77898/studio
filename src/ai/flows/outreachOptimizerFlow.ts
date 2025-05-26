
'use server';
/**
 * @fileOverview AI-powered outreach message optimizer.
 *
 * - optimizeOutreachMessage - A function that analyzes and suggests improvements for outreach messages.
 * - OutreachOptimizerInput - The input type for the function.
 * - OutreachOptimizerOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import {
  OutreachOptimizerInputSchema,
  OutreachOptimizerOutputSchema,
  type OutreachOptimizerInput,
  type OutreachOptimizerOutput,
} from '../schemas/outreachOptimizerSchema';

const outreachOptimizerPrompt = ai.definePrompt({
  name: 'outreachOptimizerPrompt',
  input: { schema: OutreachOptimizerInputSchema },
  output: { schema: OutreachOptimizerOutputSchema },
  prompt: `You are an expert communication coach and career advisor AI. Your task is to analyze a user's outreach message (email, LinkedIn message, etc.) and provide constructive feedback and suggestions to improve its effectiveness.

User's Message Type: {{{messageType}}}

{{#if subjectLine}}
User's Subject Line:
"{{{subjectLine}}}"
{{/if}}

User's Message Body:
"{{{messageText}}}"

{{#if jobDescriptionText}}
Context: Job Description User is Targeting:
"{{{jobDescriptionText}}}"
(Analyze how well the message aligns with this job, if provided.)
{{/if}}

{{#if userResumeSummary}}
Context: User's Background Summary:
"{{{userResumeSummary}}}"
(Consider this to ensure the message reflects the user's profile appropriately.)
{{/if}}

Instructions for Analysis and Suggestions:
1.  **Overall Assessment:** Provide a brief, qualitative assessment of the message's likely effectiveness *in eliciting a response*. What's your general impression of its potential? (e.g., "This message is clear and professional, giving it a good potential for a response.", "The message has good intent, but its current structure might lead to a low response rate; the call to action could be much stronger."). Do NOT provide a numerical "response likelihood score."
2.  **Strengths (Optional):** Identify 1-2 positive aspects of the current message if any stand out.
3.  **Areas for Improvement:** Identify 2-4 specific areas where the message (and subject line, if applicable) could be improved. Be specific. Examples:
    *   "The subject line could be more specific to grab attention."
    *   "The opening could be more personalized."
    *   "The value proposition for the recipient isn't clear enough."
    *   "The call to action is vague. Suggest a specific next step."
    *   "The tone might be slightly too informal/formal for this message type."
    *   "Consider shortening the message for better readability."
4.  **Suggested Subject Line (If applicable):** If a subject line was provided and can be improved, or if one is highly recommended for the message type (e.g., cold email), suggest an improved subject line. If the original is good, say so.
5.  **Suggested Message Body:** Provide a revised version of the message body that incorporates your suggestions. This could be a fully rewritten version or specific phrasings for key parts. Focus on clarity, conciseness, professionalism, a clear call to action, and alignment with the user's goals and the job (if provided).
6.  **Key Recommendations:** Summarize your advice into 2-4 bullet points of the most important actionable recommendations for the user.

Tone: Be encouraging, constructive, and professional.
Focus: Help the user make their outreach as impactful as possible.
Output: Strictly adhere to the JSON output schema.

Example for keyRecommendations:
- "Personalize the opening by mentioning a specific project or achievement of the recipient/company."
- "Clearly state your value proposition in the first two sentences."
- "End with a clear and easy-to-act-on call to action, like suggesting a brief 15-minute call."

Analyze the provided information thoroughly and generate practical, helpful advice.
`,
  config: {
    temperature: 0.7,
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
});

const outreachOptimizerFlow = ai.defineFlow(
  {
    name: 'outreachOptimizerFlow',
    inputSchema: OutreachOptimizerInputSchema,
    outputSchema: OutreachOptimizerOutputSchema,
  },
  async (input) => {
    const { output } = await outreachOptimizerPrompt(input);
    if (!output) {
      console.error(
        'Outreach optimizer flow received no output from the prompt.'
      );
      // Fallback to a generic message if AI fails to produce valid output
      return {
        overallAssessment:
          "The AI couldn't generate specific feedback at this moment. This could be due to the inputs or a temporary issue.",
        areasForImprovement: [
          'Ensure your message is clear, concise, and professional.',
          'State your purpose early in the message.',
          'Include a clear call to action.',
        ],
        suggestedMessageBody: input.messageText, // Return original text
        keyRecommendations: [
          'Review general best practices for professional communication.',
          'Try rephrasing your message and submitting again.',
        ],
      };
    }
    return output;
  }
);

export async function optimizeOutreachMessage(
  input: OutreachOptimizerInput
): Promise<OutreachOptimizerOutput> {
  return outreachOptimizerFlow(input);
}
