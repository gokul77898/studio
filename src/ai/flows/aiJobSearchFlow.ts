
'use server';
/**
 * @fileOverview AI-powered job search flow, focusing on Software Engineering, Full Stack, AI, and ML domains.
 *
 * - aiJobSearch - A function that recommends jobs based on user skills, resume, and available jobs.
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
  skills: z.string().min(1).describe("A comma-separated list or natural language description of the user's skills, primarily for Software, Full Stack, AI, or ML roles."),
  resumeDataUri: z.string().optional().describe("The user's resume as a data URI (e.g., 'data:application/pdf;base64,...') that must include a MIME type and use Base64 encoding. Optional."),
  availableJobs: z.array(JobSchema).describe("A list of available jobs to consider for recommendations. These jobs are expected to be primarily within Software, Full Stack, AI, or ML domains."),
  location: z.string().optional().describe("General preferred job location (e.g., from a dropdown: 'New York, NY, USA', 'Remote (Global)', 'London, UK'). This can be a city, country, or remote specification. Optional."),
  detailedLocation: DetailedLocationSchema.describe("Specific preferred job location details (country, state, city, area). Optional. If provided, these should be prioritized."),
  jobType: JobTypeSchema.optional().describe("Preferred job type (e.g., Full-time, Part-time). Optional."),
  githubUrl: z.string().url().optional().describe("Link to the user's GitHub profile. Optional, but very relevant for Software, Full Stack, AI, or ML roles."),
});
export type AiJobSearchInput = z.infer<typeof AiJobSearchInputSchema>;

const AiJobRecommendationSchema = z.object({
  jobId: z.string().describe("The ID of the recommended Software, Full Stack, AI, or ML job from the provided list."),
  reason: z.string().describe("A brief explanation (1-2 sentences) why this Software, Full Stack, AI, or ML job is a good fit based on the user's skills, resume (if provided), location preferences, job type, and GitHub profile (if provided)."),
});

const AiJobSearchOutputSchema = z.object({
  recommendations: z.array(AiJobRecommendationSchema).describe("A list of recommended Software, Full Stack, AI, or ML jobs, ideally 3-5, sorted by relevance."),
});
export type AiJobSearchOutput = z.infer<typeof AiJobSearchOutputSchema>;

export async function aiJobSearch(input: AiJobSearchInput): Promise<AiJobSearchOutput> {
  return aiJobSearchFlow(input);
}

const jobSearchPrompt = ai.definePrompt({
  name: 'aiJobSearchPrompt',
  input: { schema: AiJobSearchInputSchema },
  output: { schema: AiJobSearchOutputSchema },
  prompt: `You are an expert global career advisor specializing in matching candidates with roles in **Software Engineering (including Frontend, Backend), Full Stack Development, Artificial Intelligence (AI), and Machine Learning (ML)** domains.
Your task is to analyze the user's inputs, then recommend the most suitable **Software, Full Stack, AI, or ML jobs** from the provided list of available jobs, which can be from anywhere in the world.

User's Skills (relevant to Software, Full Stack, AI, ML):
{{{skills}}}

{{#if resumeDataUri}}
User's Resume (file uploaded, analyze for Software, Full Stack, AI, ML relevance):
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
  (If these details are given, Software, Full Stack, AI, or ML jobs matching them, especially at the city/area level, are strong candidates. The general 'location' field below can provide broader context like 'Remote' or a fallback if no specific details match.)
{{/if}}

{{#if location}}
General Preferred Location (from dropdown, e.g., 'New York, NY, USA', 'Remote (Global)', 'London, UK'): {{{location}}}
(Use this for matching if 'detailedLocation' is not provided. If 'detailedLocation' IS provided, this general location can offer additional context, such as confirming a 'Remote' preference or indicating a broader region if very specific matches are scarce. If this field says 'Remote (Global)' or similar, prioritize remote Software, Full Stack, AI, or ML jobs irrespective of other location details unless specified otherwise.)
{{else}}
{{#unless detailedLocation}}
Preferred Location: Any (No specific preference provided. Consider all available Software, Full Stack, AI, or ML jobs globally, focusing on skill match).
{{/unless}}
{{/if}}

{{#if jobType}}
Preferred Job Type: {{{jobType}}}
{{/if}}

{{#if githubUrl}}
User's GitHub Profile (analyze for Software, Full Stack, AI, ML projects, coding skills): {{{githubUrl}}}
(When analyzing, consider repositories for relevant skills, programming languages, frameworks, and project experience in Software, Full Stack, AI, or ML.)
{{/if}}

Available Software, Full Stack, AI, or ML Jobs (Title, Company, Description, Location (this can be very specific or general, e.g. "Berlin, Germany" or "Remote (USA)" or "APAC Region"), Type, Salary - ID is for your reference to return):
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

Based on all user inputs (skills, resume, GitHub, job type, and location preferences), identify the top 3-5 most relevant **Software, Full Stack, AI, or ML jobs** from the "Available Software, Full Stack, AI, or ML Jobs" list.
Global Location Matching Logic for Software, Full Stack, AI, or ML Roles:
- If 'detailedLocation' (country, state, city, area) is provided, strive to match Software, Full Stack, AI, or ML jobs as closely as possible to these specifics.
- If only the general 'location' (e.g., "London, UK", "Remote (Global)", "USA") is provided, use that for matching.
- If "Remote" is specified, prioritize remote Software, Full Stack, AI, or ML jobs.
- If no location preferences are given ('Any'), match Software, Full Stack, AI, or ML jobs globally based primarily on skills and experience.
- Be flexible with job location strings; they might be "City, Country", "City, State, Country", "Country", or "Remote (Region)".

Prioritize overall relevance based on Software, Full Stack, AI, or ML skills and experience first, then filter/rank by location and other preferences.
For each recommended Software, Full Stack, AI, or ML job, you MUST provide its 'jobId' from the "Available Software, Full Stack, AI, or ML Jobs" list and a concise 1-2 sentence 'reason' explaining why it's a strong match for the user considering all their inputs.
Structure your output strictly according to the defined schema. Only return jobs that are present in the "Available Software, Full Stack, AI, or ML Jobs" list and are clearly within a **Software Engineering, Full Stack Development, AI, or ML domain**.
If no Software, Full Stack, AI, or ML jobs are a good fit, return an empty recommendations array.
`,
  config: {
    temperature: 0.3, // Lower temperature for more deterministic and focused output
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH', // More permissive for "dangerous content" if job descriptions might innocuously trigger stricter filters.
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH', // More permissive for "sexually explicit" if job descriptions might innocuously trigger.
      },
    ],
  }
});

const aiJobSearchFlow = ai.defineFlow(
  {
    name: 'aiJobSearchFlow',
    inputSchema: AiJobSearchInputSchema,
    outputSchema: AiJobSearchOutputSchema,
  },
  async (input) => {
    // The page component /app/ai-search/page.tsx should pre-filter for Software, Full Stack, AI, ML jobs.
    // This prompt assumes 'availableJobs' are already relevant.
    
    const { output } = await jobSearchPrompt(input);
    
    if (!output) {
        console.error("AI job search flow (Software/FS/AI/ML focus) received no output from the prompt.");
        return { recommendations: [] };
    }
    
    // Ensure all recommended jobIds exist in the input availableJobs list
    const validRecommendations = output.recommendations.filter(rec => 
        input.availableJobs.some(job => job.id === rec.jobId)
    );

    if (validRecommendations.length !== output.recommendations.length) {
        console.warn("AI job search flow (Software/FS/AI/ML focus): Some recommended jobIds were not found in the available jobs list and were filtered out.");
    }
    
    if (input.availableJobs.length > 0 && validRecommendations.length === 0) {
        console.log("AI job search flow (Software/FS/AI/ML focus): No recommendations were made by the AI from the available jobs.");
    }

    return { recommendations: validRecommendations };
  }
);

