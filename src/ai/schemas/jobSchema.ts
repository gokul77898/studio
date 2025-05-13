
/**
 * @fileOverview Zod schemas for Job data structures used in AI flows.
 *
 * - JobTypeSchema - Zod schema for job types.
 * - JobSchema - Zod schema for job objects.
 * - Job - TypeScript type inferred from JobSchema.
 */
import { z } from 'zod';

export const JobTypeSchema = z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']);

export const JobSchema = z.object({
  id: z.string().describe("Unique identifier for the job."),
  title: z.string().describe("The title of the job position."),
  company: z.string().describe("The name of the company offering the job."),
  description: z.string().describe("A detailed description of the job responsibilities and requirements."),
  location: z.string().describe("The geographical location of the job. Can be 'Remote'."),
  type: JobTypeSchema.describe("The type of employment (e.g., Full-time, Part-time)."),
  url: z.string().url().describe("The URL to the job posting or application page."),
  postedDate: z.string().describe("The date the job was posted, in ISO 8601 format."), // Kept as string as per original Job type
  salary: z.string().optional().describe("The salary or salary range for the job, if available."),
  equity: z.boolean().optional().describe("Whether equity is offered as part of the compensation, if applicable."),
});

export type Job = z.infer<typeof JobSchema>;
