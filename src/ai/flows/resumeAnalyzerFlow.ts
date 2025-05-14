
'use server';
/**
 * @fileOverview AI-powered resume analysis and feedback flow.
 *
 * - analyzeResume - A function that analyzes a resume and provides feedback.
 * - ResumeAnalysisInput - The input type for the analyzeResume function.
 * - ResumeAnalysisOutput - The return type for the analyzeResume function.
 */

import { ai } from '@/ai/genkit';
import {
  ResumeAnalysisInputSchema,
  ResumeAnalysisOutputSchema,
  type ResumeAnalysisInput,
  type ResumeAnalysisOutput,
} from '../schemas/resumeAnalyzerSchema'; // Corrected import path

const resumeAnalyzerPrompt = ai.definePrompt({
  name: 'resumeAnalyzerPrompt',
  input: { schema: ResumeAnalysisInputSchema },
  output: { schema: ResumeAnalysisOutputSchema },
  prompt: `You are an expert resume reviewer and career coach AI. Your task is to meticulously analyze the provided resume and offer constructive, actionable feedback.

Resume to Analyze:
{{media url=resumeDataUri}}

{{#if jobDescription}}
The user has also provided a job description for comparison and tailoring advice:
Job Description:
{{{jobDescription}}}

Based on this job description, please:
1.  Provide specific 'tailoringTips' (array of strings) on how to better align the resume with this particular role. Focus on skills, experiences, and keywords that should be emphasized or added.
2.  Estimate a 'suitabilityScore' (number between 0 and 100) indicating how well the current resume matches the provided job description.
{{else}}
The user has not provided a specific job description. Please:
1.  Provide general 'keywordSuggestions' (array of strings) for common roles that seem relevant based on the skills and experiences evident in the resume. For example, if the resume mentions web development, suggest keywords like 'React,' 'Node.js,' 'API Integration.'
{{/if}}

For all resumes, please provide the following:
1.  'overallFeedback': A concise (1-2 paragraphs) summary of the resume's effectiveness, highlighting its strongest points and main weaknesses.
2.  'strengths': An array of 3-5 key strengths of the resume.
3.  'areasForImprovement': An array of 3-5 specific areas where the resume could be improved, with actionable advice for each.
4.  'formattingClarityScore': A score from 1 (poor) to 10 (excellent) for the resume's formatting, visual appeal, and readability. If not a 10, briefly explain why.
5.  'atsFriendlinessScore': A score from 1 (poor) to 10 (excellent) for how well the resume is structured for Applicant Tracking Systems (ATS). Consider aspects like standard fonts, clear sections, and keyword optimization. If not a 10, briefly explain why.
6.  'impactQuantificationScore': A score from 1 (poor) to 10 (excellent) assessing how well the resume quantifies achievements using numbers, data, or specific results. If not a 10, provide examples of how it could be improved.

Output your analysis strictly in the JSON format defined by the output schema. Ensure all fields are populated appropriately based on whether a job description was provided or not.
Be encouraging and professional in your tone.
`,
  config: {
    temperature: 0.5, // Moderately creative for suggestions but still factual for analysis
     safetySettings: [ // Adjusted safety settings
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

const resumeAnalyzerFlow = ai.defineFlow(
  {
    name: 'resumeAnalyzerFlow',
    inputSchema: ResumeAnalysisInputSchema,
    outputSchema: ResumeAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await resumeAnalyzerPrompt(input);
    if (!output) {
      console.error("Resume analyzer flow received no output from the prompt. This might be due to safety filters or an inability to generate a response matching the schema.");
      // Return a default error structure matching the schema
      return {
        overallFeedback: "I'm sorry, I encountered an issue and can't provide feedback right now. Please try again later.",
        strengths: [],
        areasForImprovement: [],
      };
    }
    return output;
  }
);

export async function analyzeResume(
  input: ResumeAnalysisInput
): Promise<ResumeAnalysisOutput> {
  return resumeAnalyzerFlow(input);
}
