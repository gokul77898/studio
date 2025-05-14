
'use server';
/**
 * @fileOverview AI-powered cover letter generation flow.
 *
 * - generateCoverLetter - A function that generates a cover letter.
 * - GenerateCoverLetterInput - The input type for the generateCoverLetter function.
 * - GenerateCoverLetterOutput - The return type for the generateCoverLetter function.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateCoverLetterInputSchema,
  GenerateCoverLetterOutputSchema,
  type GenerateCoverLetterInput,
  type GenerateCoverLetterOutput,
} from '../schemas/coverLetterGeneratorSchema';

const coverLetterGenerationPrompt = ai.definePrompt({
  name: 'coverLetterGenerationPrompt',
  input: { schema: GenerateCoverLetterInputSchema },
  output: { schema: GenerateCoverLetterOutputSchema },
  prompt: `You are an expert career coach and professional resume writer AI. Your task is to generate a compelling and tailored cover letter in Markdown format.

User's Resume (provided as media):
{{media url=resumeDataUri}}

Target Job Description:
{{{jobDescription}}}

{{#if userName}}
User's Name: {{{userName}}}
{{/if}}

{{#if companyName}}
Hiring Company's Name: {{{companyName}}}
{{/if}}

{{#if jobTitle}}
Job Title: {{{jobTitle}}}
{{/if}}

Instructions for Cover Letter Generation:
1.  **Objective:** Create a professional, enthusiastic, and concise cover letter that highlights the user's qualifications from their resume and directly addresses the requirements mentioned in the job description.
2.  **Structure:**
    *   **Introduction:** Briefly introduce the user, state the position they are applying for ({{{jobTitle}}}) at {{{companyName}}}, and mention where they saw the advertisement (if not specified, assume a general application). Express strong interest.
    *   **Body Paragraphs (2-3):**
        *   Connect the user's key skills, experiences, and achievements (from their resume) directly to the most important requirements and responsibilities outlined in the job description.
        *   Use specific examples from the resume to illustrate these connections. Quantify achievements if possible, drawing from the resume.
        *   Demonstrate understanding of the company ({{{companyName}}}) if possible, or the industry, and express genuine interest in contributing to their goals.
    *   **Conclusion:** Reiterate interest in the role and the company. State availability for an interview and thank the reader for their time and consideration.
3.  **Tone:** Professional, confident, enthusiastic, and tailored. Avoid generic statements.
4.  **Personalization:**
    *   Address the letter to "Hiring Manager" if no specific contact person is known.
    *   If {{{userName}}} is provided, use it for the sign-off. Otherwise, use a generic placeholder like "[Your Name]".
5.  **Format:** Generate the output strictly in Markdown. Use appropriate formatting for readability (e.g., paragraphs).
6.  **Content Focus:**
    *   Do NOT invent skills or experiences not present in the resume.
    *   Focus on the most relevant aspects of the resume for the specific job description.
    *   Ensure the language is professional and free of errors.

Generate the cover letter text below:
`,
  config: {
    temperature: 0.7, // Slightly more creative for generation, but still grounded.
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
});

const generateCoverLetterFlow = ai.defineFlow(
  {
    name: 'generateCoverLetterFlow',
    inputSchema: GenerateCoverLetterInputSchema,
    outputSchema: GenerateCoverLetterOutputSchema,
  },
  async (input) => {
    // Try to extract company name and job title from job description if not provided explicitly
    // This is a very basic extraction, more sophisticated NLP could be used here.
    let companyName = input.companyName;
    if (!companyName) {
        const companyMatch = input.jobDescription.match(/company:\s*(.*)/i) || input.jobDescription.match(/^(.*?)\s+is hiring/i);
        if (companyMatch && companyMatch[1]) {
            companyName = companyMatch[1].trim().split('\n')[0]; // Take first line if multi-line
        }
    }

    let jobTitle = input.jobTitle;
     if (!jobTitle) {
        const titleMatch = input.jobDescription.match(/job title:\s*(.*)/i) || input.jobDescription.match(/position:\s*(.*)/i);
        if (titleMatch && titleMatch[1]) {
            jobTitle = titleMatch[1].trim().split('\n')[0];
        } else {
            // Try to grab first line if it looks like a title
            const firstLine = input.jobDescription.split('\n')[0].trim();
            if (firstLine.length < 80 && (firstLine.toLowerCase().includes('engineer') || firstLine.toLowerCase().includes('developer') || firstLine.toLowerCase().includes('manager') || firstLine.toLowerCase().includes('analyst') || firstLine.toLowerCase().includes('specialist'))) {
                jobTitle = firstLine;
            }
        }
    }


    const promptInput = {
        ...input,
        companyName: companyName || "the company",
        jobTitle: jobTitle || "the role",
    };

    const { output } = await coverLetterGenerationPrompt(promptInput);
    if (!output) {
      console.error("Cover letter generation flow received no output from the prompt.");
      return { generatedCoverLetterText: "Error: Could not generate cover letter content." };
    }
    return output;
  }
);

export async function generateCoverLetter(
  input: GenerateCoverLetterInput
): Promise<GenerateCoverLetterOutput> {
  return generateCoverLetterFlow(input);
}
