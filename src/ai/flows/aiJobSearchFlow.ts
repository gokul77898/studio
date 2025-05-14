
'use server';
/**
 * @fileOverview AI-powered job search flow, focusing on tech domains.
 *
 * - aiJobSearch - A function that recommends tech jobs based on user skills, resume, and available jobs.
 * - AiJobSearchInput - The input type for the aiJobSearch function.
 * - AiJobSearchOutput - The return type for the aiJobSearch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { JobSchema, JobTypeSchema } from '../schemas/jobSchema';

const DetailedLocationSchema = z.object({
  country: z.string().optional().describe("User's preferred country for the job. Optional."),
  state: z.string().optional().describe("User's preferred state/province/region for the job. Optional."),
  city: z.string().optional().describe("User's preferred city/district for the job. Optional."),
  area: z.string().optional().describe("User's preferred specific area or neighborhood. Optional."),
}).optional();

const AiJobSearchInputSchema = z.object({
  skills: z.string().min(1).describe("A comma-separated list or natural language description of the user's skills, primarily for tech roles."),
  resumeDataUri: z.string().optional().describe("The user's resume as a data URI (e.g., 'data:application/pdf;base64,...') that must include a MIME type and use Base64 encoding. Optional."),
  availableJobs: z.array(JobSchema).describe("A list of available jobs to consider for recommendations. These jobs are expected to be primarily within tech domains."),
  location: z.string().optional().describe("General preferred job location (e.g., from a dropdown: 'New York, NY, USA', 'Remote (Global)', 'London, UK'). This can be a city, country, or remote specification. Optional."),
  detailedLocation: DetailedLocationSchema.describe("Specific preferred job location details (country, state, city, area). Optional. If provided, these should be prioritized."),
  jobType: JobTypeSchema.optional().describe("Preferred job type (e.g., Full-time, Part-time). Optional."),
  githubUrl: z.string().url().optional().describe("Link to the user's GitHub profile. Optional, but very relevant for tech roles."),
});
export type AiJobSearchInput = z.infer<typeof AiJobSearchInputSchema>;

const AiJobRecommendationSchema = z.object({
  jobId: z.string().describe("The ID of the recommended tech job from the provided list."),
  reason: z.string().describe("A brief explanation (1-2 sentences) why this tech job is a good fit based on the user's skills, resume (if provided), location preferences, job type, and GitHub profile (if provided)."),
});

const AiJobSearchOutputSchema = z.object({
  recommendations: z.array(AiJobRecommendationSchema).describe("A list of recommended tech jobs, ideally 3-5, sorted by relevance."),
});
export type AiJobSearchOutput = z.infer<typeof AiJobSearchOutputSchema>;

export async function aiJobSearch(input: AiJobSearchInput): Promise<AiJobSearchOutput> {
  return aiJobSearchFlow(input);
}

const jobSearchPrompt = ai.definePrompt({
  name: 'aiJobSearchPrompt',
  input: { schema: AiJobSearchInputSchema },
  output: { schema: AiJobSearchOutputSchema },
  prompt: `You are an expert global career advisor specializing in matching candidates with roles in **tech domains (e.g., software engineering, AI/ML, data science, cloud computing, cybersecurity, DevOps, UX/UI for tech products, technical product management, IT infrastructure, etc.)**.
Your task is to analyze the user's inputs, then recommend the most suitable **tech jobs** from the provided list of available jobs, which can be from anywhere in the world.

User's Tech Skills:
{{{skills}}}

{{#if resumeDataUri}}
User's Resume (file uploaded, analyze for tech relevance):
{{media url=resumeDataUri}}
{{else}}
User's Resume: Not provided.
{{/if}}

Location Preferences:
{{#if detailedLocation}}
  Specific Preferred Location Details (Prioritize these heavily if provided):
  {{#if detailedLocation.country}}Country: {{{detailedLocation.country}}}{{/if}}
  {{#if detailedLocation.state}}State/Region: {{{detailedLocation.state}}}{{/if}}
  {{#if detailedLocation.city}}City/District: {{{detailedLocation.city}}}{{/if}}
  {{#if detailedLocation.area}}Specific Area: {{{detailedLocation.area}}}{{/if}}
  (If these details are given, tech jobs matching them, especially at the city/area level, are strong candidates. The general 'location' field below can provide broader context like 'Remote' or a fallback if no specific details match.)
{{/if}}

{{#if location}}
General Preferred Location (from dropdown, e.g., 'New York, NY, USA', 'Remote (Global)', 'London, UK'): {{{location}}}
(Use this for matching if 'detailedLocation' is not provided. If 'detailedLocation' IS provided, this general location can offer additional context, such as confirming a 'Remote' preference or indicating a broader region if very specific matches are scarce. If this field says 'Remote (Global)' or similar, prioritize remote tech jobs irrespective of other location details unless specified otherwise.)
{{else}}
{{#unless detailedLocation}}
Preferred Location: Any (No specific preference provided. Consider all available tech jobs globally, focusing on skill match).
{{/unless}}
{{/if}}

{{#if jobType}}
Preferred Job Type: {{{jobType}}}
{{/if}}

{{#if githubUrl}}
User's GitHub Profile (analyze for tech projects, coding skills): {{{githubUrl}}}
(When analyzing, consider repositories for relevant tech skills, programming languages, frameworks, and project experience.)
{{/if}}

Available Tech Jobs (Title, Company, Description, Location (this can be very specific or general, e.g. "Berlin, Germany" or "Remote (USA)" or "APAC Region"), Type, Salary - ID is for your reference to return):
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

Based on all user inputs (skills, resume, GitHub, job type, and location preferences), identify the top 3-5 most relevant **tech jobs** from the "Available Tech Jobs" list.
Global Location Matching Logic for Tech Roles:
- If 'detailedLocation' (country, state, city, area) is provided, strive to match tech jobs as closely as possible to these specifics.
- If only the general 'location' (e.g., "London, UK", "Remote (Global)", "USA") is provided, use that for matching.
- If "Remote" is specified, prioritize remote tech jobs.
- If no location preferences are given ('Any'), match tech jobs globally based primarily on skills and experience.
- Be flexible with job location strings; they might be "City, Country", "City, State, Country", "Country", or "Remote (Region)".

Prioritize overall relevance based on tech skills and experience first, then filter/rank by location and other preferences.
For each recommended tech job, you MUST provide its 'jobId' from the "Available Tech Jobs" list and a concise 1-2 sentence 'reason' explaining why it's a strong match for the user considering all their inputs.
Structure your output strictly according to the defined schema. Only return jobs that are present in the "Available Tech Jobs" list and are clearly within a tech domain.
If no tech jobs are a good fit, return an empty recommendations array.
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
    // Ensure that availableJobs passed to the prompt are indeed tech jobs, if not already pre-filtered.
    // However, the page component /app/ai-search/page.tsx should ideally pre-filter.
    // This prompt assumes 'availableJobs' are already relevant (tech-focused).
    
    const { output } = await jobSearchPrompt(input);
    
    if (!output) {
        console.error("AI tech job search flow received no output from the prompt.");
        return { recommendations: [] };
    }
    
    // Ensure all recommended jobIds exist in the input availableJobs list
    const validRecommendations = output.recommendations.filter(rec => 
        input.availableJobs.some(job => job.id === rec.jobId)
    );

    if (validRecommendations.length !== output.recommendations.length) {
        console.warn("AI tech job search flow: Some recommended jobIds were not found in the available jobs list and were filtered out.");
    }
    
    if (input.availableJobs.length > 0 && validRecommendations.length === 0) {
        console.log("AI tech job search flow: No tech recommendations were made by the AI from the available jobs.");
    }

    return { recommendations: validRecommendations };
  }
);
