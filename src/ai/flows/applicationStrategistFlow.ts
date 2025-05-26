
'use server';
/**
 * @fileOverview AI-powered Application Strategist flow.
 *
 * - strategizeApplication - A function that provides a comprehensive application strategy.
 * - ApplicationStrategistInput - Input type.
 * - ApplicationStrategistOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import {
  ApplicationStrategistInputSchema,
  ApplicationStrategistOutputSchema,
  type ApplicationStrategistInput,
  type ApplicationStrategistOutput,
} from '../schemas/applicationStrategistSchema';

const applicationStrategistPrompt = ai.definePrompt({
  name: 'applicationStrategistPrompt',
  input: { schema: ApplicationStrategistInputSchema },
  output: { schema: ApplicationStrategistOutputSchema },
  prompt: `You are an expert Career Coach and Application Strategist AI.
Your task is to analyze the user's resume and a specific job description they are targeting. Based on this, provide a comprehensive application strategy.

User's Resume (analyze for skills, experiences, achievements):
{{media url=resumeDataUri}}

Target Job Description (analyze for key requirements, skills, company needs):
{{{jobDescriptionText}}}

Instructions for Generating the Application Strategy:

1.  **Resume-to-JD Match Analysis ('resumeJdMatchAnalysis'):**
    *   'strongMatches': Identify and list 3-5 key skills, experiences, or qualifications from the user's resume that are a strong match for the requirements mentioned in the job description.
    *   'potentialGaps': Identify and list 2-4 key requirements or desired qualifications from the job description that appear to be less emphasized or missing in the user's resume.
    *   'matchSummary': Provide a concise (1-2 sentences) summary of the overall alignment between the resume and the job description.

2.  **Targeted Resume Enhancements ('targetedResumeEnhancements'):**
    *   Provide 2-4 highly specific and actionable suggestions for how the user could tweak or rephrase parts of their *existing resume* to better highlight their suitability for *this particular job description*.
    *   For each suggestion, specify the 'areaToImprove' (e.g., "Experience section for Project X," "Summary statement," "Skills section") and the 'suggestion' itself (e.g., "Rephrase the bullet point about 'Managed a team' to 'Led a cross-functional team of 5 engineers to deliver Project Y, resulting in a 15% efficiency increase,' to better match the JD's emphasis on leadership and quantifiable results.").
    *   Focus on leveraging existing information in the resume and tailoring its presentation. Do not invent new experiences.

3.  **Cover Letter Talking Points ('coverLetterTalkingPoints'):**
    *   Generate 2-5 concise, impactful talking points or key themes that the user should emphasize in their cover letter for this specific job.
    *   These points should bridge the resume's strengths with the job's most critical requirements.
    *   Example: "Highlight your 5 years of experience with Python and Django, directly addressing the 'Required Skills' section of the JD."

4.  **Potential Interview Questions to Prepare For ('potentialInterviewQuestions'):**
    *   Suggest 2-4 potential interview questions the user might face for this specific role.
    *   For each 'question', provide a brief 'reasoning' explaining why this question might be asked (e.g., "This question probes your problem-solving approach, relevant to the 'complex challenges' mentioned in the JD," or "They will likely ask about your experience with 'cloud platforms' as it's listed as essential and appears on your resume.").
    *   Questions can be behavioral, technical (conceptual), or situational.

5.  **Overall Strategy Snippet ('overallStrategySnippet'):**
    *   Write a brief (1-2 paragraphs) summary that encapsulates the user's main strengths for this role (based on your analysis) and advises on the key areas they should emphasize throughout their entire application process (resume, cover letter, interview).

Output Format: Ensure your response is strictly in the JSON format defined by the ApplicationStrategistOutputSchema.
Tone: Be insightful, strategic, encouraging, and highly practical.
Focus: The advice must be tailored to the specific resume and job description provided.
`,
  config: {
    temperature: 0.6,
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
});

const applicationStrategistFlow = ai.defineFlow(
  {
    name: 'applicationStrategistFlow',
    inputSchema: ApplicationStrategistInputSchema,
    outputSchema: ApplicationStrategistOutputSchema,
  },
  async (input) => {
    const { output } = await applicationStrategistPrompt(input);
    if (!output) {
      console.error(
        'Application strategist flow received no output from the prompt.'
      );
      // Fallback to a generic message if AI fails to produce valid output
      return {
        resumeJdMatchAnalysis: {
            strongMatches: [],
            potentialGaps: [],
            matchSummary: "Could not perform analysis at this time. Please ensure your resume and job description are clear.",
        },
        targetedResumeEnhancements: [],
        coverLetterTalkingPoints: ["Ensure your cover letter clearly states the role you're applying for."],
        potentialInterviewQuestions: [{ question: "Tell me about yourself.", reasoning: "This is a common opening question."}],
        overallStrategySnippet:
          "The AI couldn't generate a specific strategy at this moment. Please review your resume and the job description for alignment and clarity.",
      };
    }
    return output;
  }
);

export async function strategizeApplication(
  input: ApplicationStrategistInput
): Promise<ApplicationStrategistOutput> {
  return applicationStrategistFlow(input);
}
