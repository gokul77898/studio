'use server';
/**
 * @fileOverview AI-powered job search flow.
 *
 * - aiJobSearch - A function that recommends jobs based on user skills, resume, and available jobs.
 * - AiJobSearchInput - The input type for the aiJobSearch function.
 * - AiJobSearchOutput - The return type for the aiJobSearch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { JobSchema, JobTypeSchema } from '../schemas/jobSchema';

const AiJobSearchInputSchema = z.object({
  skills: z.string().min(1).describe("A comma-separated list or natural language description of the user's skills."),
  resumeDataUri: z.string().optional().describe("The user's resume as a data URI (e.g., 'data:application/pdf;base64,...') that must include a MIME type and use Base64 encoding. Optional."),
  availableJobs: z.array(JobSchema).describe("A list of available jobs to consider for recommendations."),
  location: z.string().optional().describe("Preferred job location. Can be 'Remote' or a city/state. Optional."),
  jobType: JobTypeSchema.optional().describe("Preferred job type (e.g., Full-time, Part-time). Optional."),
  githubUrl: z.string().url().optional().describe("Link to the user's GitHub profile. Optional."),
});
export type AiJobSearchInput = z.infer<typeof AiJobSearchInputSchema>;

const AiJobRecommendationSchema = z.object({
  jobId: z.string().describe("The ID of the recommended job from the provided list."),
  reason: z.string().describe("A brief explanation (1-2 sentences) why this job is a good fit based on the user's skills, resume (if provided), location, job type, and GitHub profile (if provided)."),
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
  prompt: `You are an expert career advisor and job matching AI. Your task is to analyze the user's inputs, then recommend the most suitable jobs from the provided list of available jobs.

User's Skills:
{{{skills}}}

{{#if resumeDataUri}}
User's Resume (file uploaded):
{{media url=resumeDataUri}}
{{else}}
User's Resume: Not provided.
{{/if}}

{{#if location}}
Preferred Location: {{{location}}}
{{/if}}

{{#if jobType}}
Preferred Job Type: {{{jobType}}}
{{/if}}

{{#if githubUrl}}
User's GitHub Profile: {{{githubUrl}}}
(When analyzing, consider repositories for relevant skills and project experience if the profile is provided. For example, look for projects using specific programming languages, frameworks, or demonstrating problem-solving abilities.)
{{/if}}

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

Based on the user's skills, resume (if available), GitHub profile (if available), preferred location (if specified), and preferred job type (if specified), identify the top 3-5 most relevant jobs from the "Available Jobs" list.
Prioritize matches based on all provided criteria. For example, if location is specified, highly relevant jobs in that location are preferred. If a GitHub profile is provided, factor in the skills and projects demonstrated there.
For each recommended job, you MUST provide its 'jobId' from the "Available Jobs" list and a concise 1-2 sentence 'reason' explaining why it's a strong match for the user considering all their inputs.
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
    const { output } = await jobSearchPrompt(input);
    
    if (!output) {
        console.error("AI job search flow received no output from the prompt.");
        return { recommendations: [] };
    }
    
    const validRecommendations = output.recommendations.filter(rec => 
        input.availableJobs.some(job => job.id === rec.jobId)
    );

    if (validRecommendations.length !== output.recommendations.length) {
        console.warn("AI job search flow: Some recommended jobIds were not found in the available jobs list and were filtered out.");
    }

    return { recommendations: validRecommendations };
  }
);
