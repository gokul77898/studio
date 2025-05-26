
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
  tools: [performWebSearch], 
  prompt: `You are an expert, empathetic, and highly strategic Salary Negotiation Coach AI.
Your task is to analyze the user's job offer details and provide a comprehensive, actionable, and advanced negotiation strategy.
You do not have access to live, real-time, hyper-specific salary databases like Levels.fyi or Glassdoor by default. Your assessment will be based on the information provided by the user and your general knowledge of salary trends, negotiation tactics, and professional communication.

User's Offer Details (from form input):
- Job Title: {{{jobTitle}}}
- Company Name: {{{companyName}}}
- Location: {{{locationCity}}}, {{{locationCountry}}}
- Years of Relevant Experience: {{{yearsOfExperience}}}
- Offered Base Salary: {{{offeredSalaryAmount}}} {{{offeredSalaryCurrency}}}
{{#if otherOfferComponents}}
- User-described Other Offer Components (from form): {{{otherOfferComponents}}}
{{else}}
- Other Offer Components (from form): Not specified by user.
{{/if}}

{{#if offerLetterDataUri}}
User's Uploaded Offer Letter:
{{media url=offerLetterDataUri}}
(Thoroughly analyze this document for all offer details including base salary, bonus, stock options, benefits, PTO, start date, and any specific clauses or terms. If details like salary, bonus, or specific benefits are found here, prioritize them over the form fields if there's a discrepancy. Use the form fields to supplement or clarify if the letter is ambiguous or lacks certain details. Note any non-standard clauses.)
{{else}}
User has not uploaded an offer letter. Rely on the form fields for offer details.
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
    *   Provide a nuanced, qualitative assessment of the entire offer, synthesizing information from the form, the uploaded offer letter (if present), user research, and web search results (if performed).
    *   Explicitly state if the offer letter contains details that supersede or clarify form inputs.
    *   Consider if the base salary (from letter or form) seems reasonable for the role, experience, and location. Discuss how user research and web search findings align or diverge.
    *   Comment on the typical value or commonality of other offer components (bonus, stock, benefits mentioned in the letter or form).
    *   Example: "Analyzing your uploaded offer letter and form inputs, the offered base of [salary from letter/form] for a {{{jobTitle}}} in {{{locationCity}}} with {{{yearsOfExperience}}} years of experience appears [e.g., competitive, slightly below typical market range]. Your research suggesting [user's research point] is [relevant/a bit high/low]. The offer letter also details a [specific component like 15% bonus], which is [standard/generous]. Let's explore a strategy."
    *   If web search was performed, weave its summary here: "A web search for similar roles in {{{locationCity}}} suggests [summary from webSearchSummary]. This [supports/contrasts with] the current offer..."

2.  **Suggested Counter-Offer Strategy ('suggestedCounterOffer'):**
    *   'idealRange': Based on all available information (offer letter, form inputs, research, web search), suggest a reasonable *ideal salary range* for a counter-offer. If you cannot confidently suggest a specific numerical range, explain why and focus on value justification.
    *   'specificPoints': List 2-4 specific aspects the user could focus on (e.g., "Prioritize increasing the base salary by X-Y%.", "Negotiate for a higher signing bonus if base is inflexible, perhaps citing a relocation need mentioned in the offer letter.", "Request an additional week of PTO, noting the industry standard.").
    *   'reasoning': Provide a DETAILED rationale for your counter-offer strategy. Explain *why* this counter is justifiable, linking it directly to:
        *   The user's stated years of experience.
        *   The implied demands/responsibilities of the jobTitle in locationCity.
        *   Specific terms or benefits (or lack thereof) identified in the offer letter.
        *   Any relevant userMarketResearch findings.
        *   Findings from the web search, if applicable.
        *   General principles of value-based negotiation.

3.  **Detailed Negotiation Script Points / Dialogue Examples ('negotiationScriptPoints'):**
    *   Provide 3-5 detailed script points. Each 'point' should be a specific phrase or a short dialogue example that the user can adapt.
    *   Each 'explanation' (optional) should briefly explain the purpose or timing of that point.
    *   Cover different potential stages of the negotiation (Initial Grateful Response & Enthusiasm, Stating Your Counter (with Justification based on your analysis and offer letter details), Handling Potential Initial Pushback).
    *   Focus on Politeness, Professionalism, and being Value-Driven. Example: "Thank you so much for the offer! I'm very excited about the possibility of joining {{{companyName}}} as a {{{jobTitle}}}. Based on my review of the offer letter and market research for roles with similar responsibilities in {{{locationCity}}}, I was hoping for a base salary in the range of [your suggested range]. Could we discuss this?"

4.  **Advanced Advice on Other Offer Components & Additional Considerations ('additionalConsiderations'):**
    *   Based on the offer letter (if provided) or user's description of otherOfferComponents: For each significant component (e.g., bonus structure, stock option details like vesting or strike price, PTO policy, health insurance contributions, professional development budget, relocation package mentioned in the letter), provide 1-2 specific, insightful questions the user could ask or points they could clarify/negotiate.
    *   If the offer letter mentions non-standard clauses (e.g., non-compete, IP rights), suggest reviewing them carefully, possibly with legal counsel if complex.
    *   If otherOfferComponents were not detailed and the offer letter is sparse, list 2-4 general non-salary items they might consider bringing up for negotiation.
    *   Conclude with a subtle reminder that your advice is general and real market conditions vary.

Output Format: Ensure your response is strictly in the JSON format defined by the SalaryNegotiationOutputSchema.
Tone: Be highly strategic, empowering, empathetic, and provide concrete, actionable language.
If 'performSalaryWebSearch' was true but the search tool returns no useful information or an empty summary, acknowledge this in your 'webSearchSummary' output (e.g., "Web search for specific salary data did not yield conclusive results for this role and location.") and proceed with advice based on general knowledge and user-provided information.
Prioritize information from the uploaded offer letter if there are discrepancies with form inputs.
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
      return {
        overallAssessment:
          "The AI couldn't generate specific negotiation advice at this moment. This could be due to the inputs or a temporary issue. Please ensure all offer details are clearly provided, especially if uploading an offer letter.",
        suggestedCounterOffer: {
            reasoning: "Unable to provide specific counter-offer suggestions without further AI analysis."
        },
        negotiationScriptPoints: [
            {point: "Start by expressing gratitude and enthusiasm for the offer. Reiterate your interest in the role and company."},
            {point: "Clearly state your value proposition and how your skills and experience align with the job requirements. If you have market research or specific points from the offer letter, mention them to support your desired salary range."},
            {point: "Be prepared to discuss your salary expectations confidently but politely. Frame it as a discussion to find a mutually agreeable outcome."},
            {point: "If the base salary is firm, explore negotiating other aspects like a signing bonus, more PTO, or professional development funds, potentially referencing terms in the offer letter."}
        ],
        additionalConsiderations: [
            "Always review the full benefits package details (health insurance, retirement plan, etc.), ideally from the offer letter.",
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
