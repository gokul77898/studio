
'use server';
/**
 * @fileOverview AI-powered Salary Negotiation Coach flow.
 *
 * - coachSalaryNegotiation - A function that provides salary negotiation advice.
 * - SalaryNegotiationInput - Input type.
 * - SalaryNegotiationOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import {
  SalaryNegotiationInputSchema,
  SalaryNegotiationOutputSchema,
  type SalaryNegotiationInput,
  type SalaryNegotiationOutput,
} from '../schemas/salaryNegotiationCoachSchema';

const salaryNegotiationPrompt = ai.definePrompt({
  name: 'salaryNegotiationPrompt',
  input: { schema: SalaryNegotiationInputSchema },
  output: { schema: SalaryNegotiationOutputSchema },
  prompt: `You are an expert and empathetic Salary Negotiation Coach AI.
Your task is to analyze the user's job offer details and provide a comprehensive negotiation strategy.
You do not have access to live, real-time, hyper-specific salary databases like Levels.fyi or Glassdoor. Your assessment will be based on the information provided by the user and your general knowledge of salary trends, negotiation tactics, and professional communication.

User's Offer Details:
- Job Title: {{{jobTitle}}}
- Company Name: {{{companyName}}}
- Location: {{{locationCity}}}, {{{locationCountry}}}
- Years of Relevant Experience: {{{yearsOfExperience}}}
- Offered Base Salary: {{{offeredSalaryAmount}}} {{{offeredSalaryCurrency}}}
{{#if otherOfferComponents}}
- Other Offer Components: {{{otherOfferComponents}}}
{{else}}
- Other Offer Components: Not specified.
{{/if}}
{{#if userMarketResearch}}
- User's Market Research Notes: {{{userMarketResearch}}}
(Take this user-provided research into account when forming your assessment.)
{{/if}}

Instructions for Your Coaching:

1.  **Overall Assessment ('overallAssessment'):**
    *   Provide a qualitative assessment of the entire offer.
    *   Consider if the base salary seems reasonable for the role, experience, and location, based on general knowledge. Factor in any user-provided market research.
    *   Acknowledge other components if mentioned (bonus, stock, etc.) and if they seem standard or noteworthy.
    *   Example: "This offer for a {{{jobTitle}}} in {{{locationCity}}} with {{{yearsOfExperience}}} years of experience seems to be in a reasonable general range. The bonus structure mentioned is a positive addition. However, let's explore if there's room to optimize the base salary based on your specific contributions and market value."

2.  **Suggested Counter-Offer ('suggestedCounterOffer'):**
    *   'idealRange': Suggest a reasonable *ideal salary range* for a counter-offer (e.g., "115,000 - 125,000 {{{offeredSalaryCurrency}}}"). If you cannot confidently suggest a range, explain why (e.g., "More specific market data for this niche role in {{{locationCity}}} would be needed to define a precise counter range, but let's focus on justifying your value.").
    *   'specificPoints': List 2-3 specific aspects the user could focus on in their counter-offer (e.g., "Focus on increasing the base salary.", "Request a signing bonus.", "Negotiate a higher equity grant.").
    *   'reasoning': Briefly explain the rationale behind your counter-offer suggestions, linking it to the user's experience, the role's demands, or general negotiation principles.

3.  **Negotiation Script Points ('negotiationScriptPoints'):**
    *   Provide 3-5 key talking points or phrases the user can adapt for their negotiation conversation or email.
    *   Each 'point' should be a specific phrase or statement.
    *   Each 'explanation' (optional) should briefly explain the purpose or timing of that point.
    *   Focus on being polite, professional, and value-driven.
    *   Example point: "Thank you so much for the offer! I'm very excited about the opportunity to join {{{companyName}}} as a {{{jobTitle}}}." Explanation: "Start with enthusiasm and gratitude."
    *   Example point: "Based on my [mention specific skills/achievements from resume, e.g., 'X years of experience in Y' or 'my track record of delivering Z results'] and my understanding of the market value for this role in {{{locationCity}}}, I was hoping for a base salary closer to [your suggested counter-offer ideal]." Explanation: "Clearly state your desired range, justifying it with your value and market understanding."

4.  **Additional Considerations ('additionalConsiderations'):**
    *   List 2-4 other non-salary items or factors the user might consider negotiating or clarifying if salary negotiation is difficult.
    *   Examples: "Professional development budget (e.g., courses, conferences).", "Performance review cycle and criteria for future raises.", "Flexibility in work hours or remote work options.", "Specifics of benefits package (e.g., healthcare coverage details, retirement plan matching).", "Vacation/Paid Time Off."

Output Format: Ensure your response is strictly in the JSON format defined by the SalaryNegotiationOutputSchema.
Tone: Be encouraging, strategic, practical, and empathetic. Your goal is to empower the user.
Disclaimer: Remind the user subtly (perhaps in the overall assessment or as a final note in additional considerations if appropriate) that your advice is based on general knowledge and the information they provided, and that actual market conditions can vary. Do not include a separate disclaimer field.
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

const salaryNegotiationCoachFlow = ai.defineFlow(
  {
    name: 'salaryNegotiationCoachFlow',
    inputSchema: SalaryNegotiationInputSchema,
    outputSchema: SalaryNegotiationOutputSchema,
  },
  async (input) => {
    const { output } = await salaryNegotiationPrompt(input);
    if (!output) {
      console.error(
        'Salary negotiation coach flow received no output from the prompt.'
      );
      // Fallback to a generic message if AI fails to produce valid output
      return {
        overallAssessment:
          "The AI couldn't generate specific negotiation advice at this moment. This could be due to the inputs or a temporary issue. Please ensure all offer details are clearly provided.",
        suggestedCounterOffer: {
            reasoning: "Unable to provide specific counter-offer suggestions without further AI analysis."
        },
        negotiationScriptPoints: [
            {point: "Start by expressing gratitude for the offer."},
            {point: "Clearly state your value and what you bring to the role."},
            {point: "Be prepared to discuss your salary expectations if asked."}
        ],
        additionalConsiderations: [
            "Always review the full benefits package.",
            "Consider non-salary perks like professional development or flexible work arrangements."
        ]
      };
    }
    return output;
  }
);

export async function coachSalaryNegotiation(
  input: SalaryNegotiationInput
): Promise<SalaryNegotiationOutput> {
  return salaryNegotiationCoachFlow(input);
}
