
/**
 * @fileOverview Zod schemas for AI Salary Negotiation Coach flow.
 */
import { z } from 'zod';

export const SalaryNegotiationInputSchema = z.object({
  jobTitle: z
    .string()
    .min(3, { message: 'Job title must be at least 3 characters.' })
    .describe('The title of the job offer.'),
  companyName: z
    .string()
    .min(2, { message: 'Company name must be at least 2 characters.' })
    .describe('The name of the company providing the offer.'),
  locationCity: z
    .string()
    .min(2, { message: 'Location city must be at least 2 characters.' })
    .describe('The city where the job is located.'),
  locationCountry: z
    .string()
    .min(2, { message: 'Location country must be at least 2 characters.' })
    .describe('The country where the job is located.'),
  yearsOfExperience: z
    .number()
    .min(0)
    .max(50)
    .describe('The user\'s relevant years of experience for this role.'),
  offeredSalaryAmount: z
    .number()
    .positive({ message: 'Offered salary must be a positive number.' })
    .describe('The numerical amount of the base salary offered.'),
  offeredSalaryCurrency: z
    .string()
    .min(3, { message: 'Currency code must be 3 characters (e.g., USD, EUR).' })
    .max(3)
    .describe('The currency of the offered salary (e.g., USD, EUR, CAD).'),
  otherOfferComponents: z
    .string()
    .optional()
    .describe(
      'Text description of other components of the offer, like bonus, stock options, benefits, etc. (e.g., "10% annual bonus, 50k RSU over 4 years, standard health insurance").'
    ),
  userMarketResearch: z
    .string()
    .optional()
    .describe(
      'Optional: Any market research the user has done on salaries for similar roles (e.g., "Glassdoor shows average for this role in this city is X to Y").'
    ),
  performSalaryWebSearch: z
    .boolean()
    .optional()
    .describe('Whether the AI should attempt to perform a web search for comparable salary data. This is experimental.'),
});
export type SalaryNegotiationInput = z.infer<
  typeof SalaryNegotiationInputSchema
>;

const NegotiationPointSchema = z.object({
    point: z.string().describe("A specific point or phrase to use in negotiation."),
    explanation: z.string().optional().describe("Brief explanation of why this point is effective or how to use it.")
});

export const SalaryNegotiationOutputSchema = z.object({
  overallAssessment: z
    .string()
    .describe(
      'A qualitative assessment of the offer (e.g., "The base salary appears competitive for your experience level and location, but there might be room to negotiate on the bonus structure."). This may include findings from web search if performed.'
    ),
  suggestedCounterOffer: z
    .object({
      idealRange: z
        .string()
        .optional()
        .describe(
          'A suggested ideal salary range for a counter-offer (e.g., "110,000 - 120,000 USD").'
        ),
      specificPoints: z.array(z.string()).optional().describe("Specific aspects to focus on in the counter (e.g., base salary, signing bonus, stock options)."),
      reasoning: z
        .string()
        .optional()
        .describe(
          'Brief reasoning for the suggested counter-offer strategy, based on the input and general market understanding (and web search if performed).'
        ),
    })
    .describe('Suggestions for a counter-offer.'),
  negotiationScriptPoints: z
    .array(NegotiationPointSchema)
    .min(1)
    .describe(
      'Key talking points, phrases, or a sample script outline for negotiating the offer politely and professionally.'
    ),
  additionalConsiderations: z
    .array(z.string())
    .optional()
    .describe(
      'Other factors the user might consider or bring up in negotiation (e.g., "Ask about performance review cycles for future salary increases," "Clarify remote work policy," "Negotiate professional development budget").'
    ),
  webSearchSummary: z
    .string()
    .optional()
    .describe("A summary of relevant salary information found via web search, if performed. Includes caveats about the data's nature."),
});
export type SalaryNegotiationOutput = z.infer<
  typeof SalaryNegotiationOutputSchema
>;
