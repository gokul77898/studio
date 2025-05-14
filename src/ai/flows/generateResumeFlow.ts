
'use server';
/**
 * @fileOverview AI-powered resume generation flow.
 *
 * - generateResume - A function that generates an improved resume based on analysis.
 * - GenerateResumeInput - The input type for the generateResume function.
 * - GenerateResumeOutput - The return type for the generateResume function.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateResumeInputSchema,
  GenerateResumeOutputSchema,
  type GenerateResumeInput,
  type GenerateResumeOutput,
} from '../schemas/generateResumeSchema';

const resumeGenerationPrompt = ai.definePrompt({
  name: 'resumeGenerationPrompt',
  input: { schema: GenerateResumeInputSchema },
  output: { schema: GenerateResumeOutputSchema },
  prompt: `You are an expert resume writer AI. Your task is to generate an improved resume in Markdown format based on an original resume, expert analysis feedback, and an optional job description.

Original Resume (provided as media):
{{media url=originalResumeDataUri}}

Analysis Feedback:
Overall Feedback: {{{analysisFeedback.overallFeedback}}}
Strengths:
{{#each analysisFeedback.strengths}}
- {{{this}}}
{{/each}}
Areas for Improvement:
{{#each analysisFeedback.areasForImprovement}}
- {{{this}}}
{{/each}}
{{#if analysisFeedback.keywordSuggestions.length}}
Keyword Suggestions:
{{#each analysisFeedback.keywordSuggestions}}
- {{{this}}}
{{/each}}
{{/if}}
{{#if analysisFeedback.tailoringTips.length}}
Tailoring Tips (for the job description below):
{{#each analysisFeedback.tailoringTips}}
- {{{this}}}
{{/each}}
{{/if}}

{{#if jobDescription}}
Target Job Description:
{{{jobDescription}}}
When generating the resume, heavily tailor it to this job description, incorporating the tailoring tips and focusing on relevant skills and experiences.
{{else}}
No specific job description was provided. Focus on general improvements and incorporating keyword suggestions if available.
{{/if}}

Instructions for Resume Generation:
1.  Structure: Generate a complete resume in Markdown format. Use standard resume sections (e.g., Contact Information, Summary/Objective, Experience, Education, Skills).
2.  Content:
    *   Retain factual information from the original resume (like work history titles, company names, dates, education degrees, schools, contact details if visible in the original).
    *   Improve the presentation and wording of this factual information based on the 'Areas for Improvement'.
    *   Emphasize the 'Strengths' identified.
    *   Naturally incorporate 'Keyword Suggestions' where appropriate.
    *   If 'Tailoring Tips' are available (due to a job description), prioritize implementing these tips.
    *   Rewrite bullet points to be action-oriented and quantify achievements where possible, even if you have to make reasonable inferences based on the original content.
3.  Tone: Professional, clear, concise, and impactful.
4.  Format: Use Markdown for structure (headings, lists, bolding, italics). Ensure it's well-organized and readable.

Generate the improved resume text below:
`,
  config: {
    temperature: 0.6, // Slightly more creative for generation
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const generateResumeFlow = ai.defineFlow(
  {
    name: 'generateResumeFlow',
    inputSchema: GenerateResumeInputSchema,
    outputSchema: GenerateResumeOutputSchema,
  },
  async (input) => {
    const { output } = await resumeGenerationPrompt(input);
    if (!output) {
      console.error("Resume generation flow received no output from the prompt.");
      return { generatedResumeText: "Error: Could not generate resume content." };
    }
    return output;
  }
);

export async function generateResume(
  input: GenerateResumeInput
): Promise<GenerateResumeOutput> {
  return generateResumeFlow(input);
}
