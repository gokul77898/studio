
'use server';
/**
 * @fileOverview AI-powered Salary Negotiation Coach flow.
 *
 * - coachSalaryNegotiation - A function that provides salary negotiation advice.
 * - SalaryNegotiationInput - Input type.
 * - SalaryNegotiationOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  SalaryNegotiationInputSchema,
  SalaryNegotiationOutputSchema,
  type SalaryNegotiationInput,
  type SalaryNegotiationOutput,
} from '../schemas/salaryNegotiationCoachSchema';

// Re-using the performWebSearch tool definition logic from careerAdvisorFlow
// In a larger app, this might be in a shared tools file.
const performWebSearch = ai.defineTool(
  {
    name: 'performWebSearchForSalary', // Giving a slightly different name to distinguish if needed, though functionality is same
    description: 'Performs a targeted web search to find publicly available salary data for a specific job title, location, and experience level. Use this to gather context from sites like Levels.fyi, Glassdoor, etc.',
    inputSchema: z.object({
      jobTitle: z.string().describe('The job title to search for.'),
      location: z.string().describe('The location (e.g., city, country) for the salary search.'),
      yearsOfExperience: z.number().optional().describe('Years of experience, if relevant for refining search.'),
    }),
    outputSchema: z.object({
      results: z.array(
        z.object({
          title: z.string().describe('The title of the search result or data point.'),
          snippet: z.string().describe('A brief snippet or summary of the salary information found.'),
          url: z.string().url().optional().describe('The source URL, if available.'),
        })
      ).min(0).max(3).describe('A list of 0 to 3 relevant salary data points found.'),
      summary: z.string().optional().describe('A brief overall summary of the web search findings related to salary. It should include caveats about the data being indicative.')
    }),
  },
  async (input) => {
    const searchQuery = `${input.jobTitle} salary ${input.location}${input.yearsOfExperience ? ` ${input.yearsOfExperience} years experience` : ''} site:levels.fyi OR site:glassdoor.com OR site:payscale.com`;
    console.log(`[performWebSearchForSalary] Simulating web search for: "${searchQuery}"`);
    // Mock results for demonstration. In a real Genkit setup with a search plugin, this would be a live search.
    const mockResults = [
      { title: `Mock Data: ${input.jobTitle} in ${input.location}`, snippet: `General online sources suggest a range of X to Y for this role and location. Specifics vary.`, url: `https://example.com/mock-salary-search?q=${encodeURIComponent(searchQuery)}` },
    ];
     let mockSummary = `Simulated web search for ${input.jobTitle} in ${input.location} suggests a general salary range. This data is indicative and should be verified.`;
      if (input.jobTitle.toLowerCase().includes("software engineer") && input.location.toLowerCase().includes("san francisco")) {
        mockResults.push({ title: `Levels.fyi (Mock) - SE in SF`, snippet: `Entry-level: $120k-$150k, Mid-level: $150k-$200k, Senior: $200k+ (Base, excluding bonus/stock).`, url: "https://levels.fyi" });
        mockSummary = `Web search found mock data for Software Engineers in San Francisco on sites like Levels.fyi, indicating ranges from $120k for entry-level up to $200k+ for senior roles (base). This is illustrative.`;
    }

    return {
      results: mockResults.slice(0,2),
      summary: mockSummary,
    };
  }
);


const salaryNegotiationPrompt = ai.definePrompt({
  name: 'salaryNegotiationPrompt',
  input: { schema: SalaryNegotiationInputSchema },
  output: { schema: SalaryNegotiationOutputSchema },
  tools: [performWebSearch], // Added web search tool
  prompt: `You are an expert, empathetic, and highly strategic Salary Negotiation Coach AI.
Your task is to analyze the user's job offer details and provide a comprehensive, actionable, and advanced negotiation strategy.
You do not have access to live, real-time, hyper-specific salary databases like Levels.fyi or Glassdoor by default. Your assessment will be based on the information provided by the user and your general knowledge of salary trends, negotiation tactics, and professional communication.

User's Offer Details:
- Job Title: {{{jobTitle}}}
- Company Name: {{{companyName}}}
- Location: {{{locationCity}}}, {{{locationCountry}}}
- Years of Relevant Experience: {{{yearsOfExperience}}}
- Offered Base Salary: {{{offeredSalaryAmount}}} {{{offeredSalaryCurrency}}}
{{#if otherOfferComponents}}
- User-described Other Offer Components: {{{otherOfferComponents}}}
{{else}}
- Other Offer Components: Not specified by user.
{{/if}}
{{#if userMarketResearch}}
- User's Market Research Notes:
"{{{userMarketResearch}}}"
(Analyze this user-provided research CRITICALLY. If it seems reasonable, integrate it into your assessment and counter-offer rationale. If it seems significantly off from general market understanding for the role/location/experience, you may gently note this in your assessment but still base your primary advice on a more common understanding, while acknowledging the user's input.)
{{/if}}

{{#if performSalaryWebSearch}}
Web Search for Salary Context:
The user has requested a web search for comparable salary data.
You SHOULD use the 'performWebSearchForSalary' tool to search for publicly available salary information for '{{{jobTitle}}}' in '{{{locationCity}}}, {{{locationCountry}}}' with about {{{yearsOfExperience}}} years of experience.
Integrate the findings (especially the 'summary' from the tool's output) into your 'overallAssessment' and potentially into the 'reasoning' for the 'suggestedCounterOffer'.
Clearly state that this information is from a web search and should be considered indicative. Populate the 'webSearchSummary' field in the output with the tool's summary.
If the tool returns no specific data, acknowledge that the search did not yield useful results.
{{/if}}

Instructions for Your Advanced Coaching:

1.  **Overall Assessment ('overallAssessment'):**
    *   Provide a nuanced, qualitative assessment of the entire offer.
    *   Consider if the base salary seems reasonable for the role, experience, and location, based on general knowledge, userMarketResearch (if provided), AND web search results (if performSalaryWebSearch was true and results were found). Discuss how user research and web search findings align or diverge from general expectations.
    *   If otherOfferComponents are detailed by the user, comment on their typical value or commonality for such roles.
    *   Example: "Based on your {{{yearsOfExperience}}} years of experience for a {{{jobTitle}}} in {{{locationCity}}}, and considering your research notes which suggest [mention user's research point], the offered base of {{{offeredSalaryAmount}}} {{{offeredSalaryCurrency}}} appears to be [e.g., competitive, slightly below typical market range, a strong starting point]. The mentioned [specific other component] is a valuable part of the package. Let's explore a strategy to potentially enhance the base or other aspects."
    *   If web search was performed, weave its summary here: "A web search for similar roles in {{{locationCity}}} suggests [summary from webSearchSummary]. This [supports/contrasts with] the current offer..."

2.  **Suggested Counter-Offer Strategy ('suggestedCounterOffer'):**
    *   'idealRange': Suggest a reasonable *ideal salary range* for a counter-offer (e.g., "115,000 - 125,000 {{{offeredSalaryCurrency}}}"). If you cannot confidently suggest a specific numerical range due to lack of precise data, explain this and focus on building value justification instead.
    *   'specificPoints': List 2-4 specific aspects the user could focus on (e.g., "Prioritize increasing the base salary.", "Negotiate for a higher signing bonus if base is inflexible.", "Request an additional week of PTO.").
    *   'reasoning': Provide a DETAILED rationale for your counter-offer strategy. Explain *why* this counter is justifiable, linking it directly to:
        *   The user's stated years of experience.
        *   The implied demands/responsibilities of the jobTitle in locationCity.
        *   Any relevant userMarketResearch findings.
        *   Findings from the web search, if applicable.
        *   General principles of value-based negotiation.

3.  **Detailed Negotiation Script Points / Dialogue Examples ('negotiationScriptPoints'):**
    *   Provide 3-5 detailed script points. Each 'point' should be a specific phrase or a short dialogue example that the user can adapt.
    *   Each 'explanation' (optional) should briefly explain the purpose or timing of that point.
    *   Cover different potential stages of the negotiation (Initial Grateful Response & Enthusiasm, Stating Your Counter (with Justification), Handling Potential Initial Pushback).
    *   Focus on Politeness, Professionalism, and being Value-Driven.

4.  **Advanced Advice on Other Offer Components & Additional Considerations ('additionalConsiderations'):**
    *   If the user detailed otherOfferComponents: For each significant component (e.g., bonus, stock, PTO, professional development), provide 1-2 specific (but general) questions the user could ask or points they could clarify/negotiate.
    *   If otherOfferComponents were not detailed by the user, list 2-4 general non-salary items they might consider.
    *   Conclude with a subtle reminder that your advice is general and real market conditions vary.

Output Format: Ensure your response is strictly in the JSON format defined by the SalaryNegotiationOutputSchema.
Tone: Be highly strategic, empowering, empathetic, and provide concrete, actionable language.
If 'performSalaryWebSearch' was true but the search tool returns no useful information or an empty summary, acknowledge this in your 'webSearchSummary' output (e.g., "Web search for specific salary data did not yield conclusive results for this role and location.") and proceed with advice based on general knowledge and user-provided information.
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
    // The prompt itself handles the conditional logic for using the web search tool.
    // The 'performWebSearchForSalary' tool will only be called by the LLM if input.performSalaryWebSearch is true.
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
            {point: "Start by expressing gratitude and enthusiasm for the offer. Reiterate your interest in the role and company."},
            {point: "Clearly state your value proposition and how your skills and experience align with the job requirements. If you have market research, mention it to support your desired salary range."},
            {point: "Be prepared to discuss your salary expectations confidently but politely. Frame it as a discussion to find a mutually agreeable outcome."},
            {point: "If the base salary is firm, explore negotiating other aspects like a signing bonus, more PTO, or professional development funds."}
        ],
        additionalConsiderations: [
            "Always review the full benefits package details (health insurance, retirement plan, etc.).",
            "Understand the performance review cycle and criteria for future raises and promotions.",
            "Clarify expectations around work hours, remote work policies, and any on-call responsibilities.",
            "Remember that negotiation is a dialogue; be prepared to listen and be flexible where appropriate."
        ],
        webSearchSummary: input.performSalaryWebSearch ? "Web search was attempted but did not yield specific results in this instance." : undefined,
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
