
'use server';
/**
 * @fileOverview AI-powered Skill Gap Analysis flow, framed as a Job-Resume Match Score.
 *
 * - analyzeSkillGap - A function that analyzes the gap between resume skills and job requirements.
 * - SkillGapAnalysisInput - The input type for the analyzeSkillGap function.
 * - SkillGapAnalysisOutput - The return type for the analyzeSkillGap function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod'; // Correct import
import {
  SkillGapAnalysisInputSchema,
  SkillGapAnalysisOutputSchema,
  type SkillGapAnalysisInput,
  type SkillGapAnalysisOutput,
} from '../schemas/skillGapAnalysisSchema';

const skillGapAnalysisPrompt = ai.definePrompt({
  name: 'skillGapAnalysisPrompt',
  input: { schema: SkillGapAnalysisInputSchema },
  output: { schema: SkillGapAnalysisOutputSchema },
  prompt: `You are an expert career coach and skills analyst. Your task is to perform a detailed skill gap analysis by comparing a user's resume against a target job description, ultimately providing a "Job-Resume Match Score".

User's Resume (provided as media):
{{media url=resumeDataUri}}

Target Job Description:
{{{jobDescription}}}

Instructions for Skill Gap Analysis & Match Score:
1.  **Identify User Skills:** Meticulously scan the user's resume. Extract a comprehensive list of technical skills, soft skills, tools, programming languages, frameworks, certifications, and relevant experiences. Populate the 'identifiedUserSkills' array.
2.  **Identify Job Requirements:** Carefully read the job description. Extract a list of essential and preferred skills, technologies, tools, qualifications, and experience levels mentioned. Populate the 'identifiedJobRequirements' array.
3.  **Find Matching Skills:** Compare the 'identifiedUserSkills' with 'identifiedJobRequirements'. List all skills that are clearly present in both and are relevant to the job. Populate the 'matchingSkills' array.
4.  **Identify Missing Skills (Keyword Gaps):** Identify key skills, specific phrases, or requirements from the job description that are NOT EVIDENT or NOT SUFFICIENTLY EMPHASIZED in the user's resume. These are the critical gaps. Populate the 'missingSkills' array with these specific items. Be precise.
5.  **Skill Gap Summary:** Provide a concise summary (2-3 sentences) of the overall alignment. Mention if the user is a strong, moderate, or weak fit based on the skill overlap, and briefly highlight the most critical gaps from 'missingSkills'. Populate the 'skillGapSummary' string.
6.  **Suggestions for Improvement:** For the identified 'missingSkills', provide specific and actionable suggestions. This could include recommending online courses (general types, not specific URLs unless very well-known like "Coursera"), personal projects, areas to study, or ways to rephrase existing experience on the resume to better highlight relevant skills. Populate the 'suggestionsForImprovement' array.
7.  **Overall Fit Score (Job-Resume Match Score):** Based on your comprehensive analysis of matching and missing skills, provide an 'overallFitScore' (a number between 0 and 100) representing your estimation of how well the user's current resume aligns with the job requirements. This score is the primary "Job-Resume Match Score". A higher score indicates a better fit.

Output your analysis strictly in the JSON format defined by the output schema. Be encouraging but realistic in your feedback.
`,
  config: {
    temperature: 0.5,
     safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
});

const skillGapAnalysisFlow = ai.defineFlow(
  {
    name: 'skillGapAnalysisFlow',
    inputSchema: SkillGapAnalysisInputSchema,
    outputSchema: SkillGapAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await skillGapAnalysisPrompt(input);
    if (!output) {
      console.error("Skill gap analysis flow received no output from the prompt.");
      // Provide a default error structure matching the schema
      return {
        identifiedUserSkills: [],
        identifiedJobRequirements: [],
        matchingSkills: [],
        missingSkills: [],
        skillGapSummary: "Error: Could not perform skill gap analysis. The AI did not return a valid response.",
        suggestionsForImprovement: [],
        overallFitScore: 0,
      };
    }
    return output;
  }
);

export async function analyzeSkillGap(
  input: SkillGapAnalysisInput
): Promise<SkillGapAnalysisOutput> {
  return skillGapAnalysisFlow(input);
}

