
'use server';
/**
 * @fileOverview AI-powered job search flow.
 *
 * - aiJobSearch - A function that recommends jobs based on user skills, resume, and available jobs.
 * - AiJobSearchInput - The input type for the aiJobSearch function.
 * - AiJobSearchOutput - The return type for the aiJobSearch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import { JobSchema } from '../schemas/jobSchema';

const AiJobSearchInputSchema = z.object({
  skills: z.string().min(1).describe("A comma-separated list or natural language description of the user's skills."),
  resumeText: z.string().min(1).describe("The full text of the user's resume."),
  availableJobs: z.array(JobSchema).describe("A list of available jobs to consider for recommendations."),
});
export type AiJobSearchInput = z.infer<typeof AiJobSearchInputSchema>;

const AiJobRecommendationSchema = z.object({
  jobId: z.string().describe("The ID of the recommended job from the provided list."),
  reason: z.string().describe("A brief explanation (1-2 sentences) why this job is a good fit based on the user's skills and resume."),
});

const AiJobSearchOutputSchema = z.object({
  recommendations: z.array(AiJobRecommendationSchema).describe("A list of recommended jobs, ideally 3-5, sorted by relevance."),
});
export type AiJobSearchOutput = z.infer<typeof AiJobSearchOutputSchema>;

export async function aiJobSearch(input: AiJobSearchInput): Promise<AiJobSearchOutput> {
  return aiJobSearchFlow(input);
}

const jobSearchPrompt = ai.definePrompt({
  name: 'aiJobSearchPrompt',
  input: { schema: AiJobSearchInputSchema },
  output: { schema: AiJobSearchOutputSchema },
  prompt: `You are an expert career advisor and job matching AI. Your task is to analyze the user's skills and resume text, then recommend the most suitable jobs from the provided list of available jobs.

User's Skills:
{{{skills}}}

User's Resume Text:
{{{resumeText}}}

Available Jobs (Title, Company, Description, Location, Type, Salary - ID is for your reference to return):
{{#each availableJobs}}
Job ID: {{this.id}}
Title: {{this.title}}
Company: {{this.company}}
Description: {{this.description}}
Location: {{this.location}}
Type: {{this.type}}
{{#if this.salary}}Salary: {{this.salary}}{{/if}}
---
{{/each}}

Based on the user's skills and resume, identify the top 3-5 most relevant jobs from the "Available Jobs" list.
For each recommended job, you MUST provide its 'jobId' from the "Available Jobs" list and a concise 1-2 sentence 'reason' explaining why it's a strong match for the user.
Structure your output strictly according to the defined schema. Only return jobs that are present in the "Available Jobs" list.
If no jobs are a good fit, return an empty recommendations array.
`,
  config: {
    temperature: 0.3, // Lower temperature for more deterministic and focused output
  }
});

const aiJobSearchFlow = ai.defineFlow(
  {
    name: 'aiJobSearchFlow',
    inputSchema: AiJobSearchInputSchema,
    outputSchema: AiJobSearchOutputSchema,
  },
  async (input) => {
    // Sanitize availableJobs to ensure only necessary fields are passed if needed,
    // or if descriptions are too long, they could be summarized first.
    // For now, passing them as is.
    const { output } = await jobSearchPrompt(input);
    
    if (!output) {
        // Handle cases where the LLM might return a non-compliant or empty response
        console.error("AI job search flow received no output from the prompt.");
        return { recommendations: [] };
    }
    
    // Ensure all recommended jobIds actually exist in the input availableJobs
    // This is a safeguard against hallucinated jobIds
    const validRecommendations = output.recommendations.filter(rec => 
        input.availableJobs.some(job => job.id === rec.jobId)
    );

    if (validRecommendations.length !== output.recommendations.length) {
        console.warn("AI job search flow: Some recommended jobIds were not found in the available jobs list and were filtered out.");
    }

    return { recommendations: validRecommendations };
  }
);
