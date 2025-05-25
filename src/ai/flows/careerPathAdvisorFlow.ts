
'use server';
/**
 * @fileOverview AI-powered Career Path Prediction and conceptual guidance.
 *
 * - predictCareerPaths - A function that predicts career paths based on resume and goals.
 * - CareerPathInput - Input type for the function.
 * - CareerPathOutput - Output type for the function.
 */

import { ai } from '@/ai/genkit';
import {
  CareerPathInputSchema,
  CareerPathOutputSchema,
  type CareerPathInput,
  type CareerPathOutput,
} from '../schemas/careerPathAdvisorSchema';

const careerPathPredictionPrompt = ai.definePrompt({
  name: 'careerPathPredictionPrompt',
  input: { schema: CareerPathInputSchema },
  output: { schema: CareerPathOutputSchema },
  prompt: `You are an expert Career Strategist AI. Your task is to analyze the user's resume and their stated career goals/aspirations (if provided) to suggest 3-5 viable future career paths.

User's Resume (analyze for skills, experience, roles, education):
{{media url=resumeDataUri}}

{{#if userGoals}}
User's Stated Goals/Aspirations:
"{{{userGoals}}}"
Base your suggestions primarily on aligning the resume with these goals.
{{else}}
User's Stated Goals/Aspirations: Not provided.
Base your suggestions primarily on the skills, experience, and potential progression evident from the resume.
{{/if}}

Instructions for Career Path Suggestions:
1.  **Analyze Thoroughly:** Carefully consider the user's current skills, past roles, and educational background from their resume. If user goals are provided, deeply reflect on them. If not, infer potential directions from the resume itself.
2.  **Suggest Viable Paths:** Based on the analysis, propose 3 to 5 distinct and realistic career paths that the user could pursue. These paths should be a logical progression or a feasible pivot.
3.  **For Each Suggested Path, Provide:**
    *   pathTitle: A clear and concise title for the career path (e.g., "Senior Data Scientist specializing in NLP", "Cybersecurity Analyst (Cloud Focus)", "Product Manager for AI Solutions").
    *   description: A brief explanation (2-3 sentences) of what the role entails and why it might align with the user's profile and/or goals (if goals were provided).
    *   roadmap: A high-level textual roadmap. This should be an array of strings, with each string representing a step or key consideration. Include:
        *   Key skills or knowledge areas the user might need to develop or strengthen.
        *   Potential types of certifications, courses, or further education that could be beneficial (be general, e.g., "Advanced Python certification," "Master's in Data Science," "Project Management Professional (PMP)").
        *   A brief conceptual outlook on the role or industry.
    *   conceptualSkills (optional array of strings): List 3-5 core technical or soft skills central to this path.
    *   conceptualCertifications (optional array of strings): List 1-3 general types of certifications or learning paths relevant to this career.
    *   salaryOutlookGeneral (optional string): Provide a very general, qualitative statement about the salary potential (e.g., "Strong earning potential with experience," "Typically offers competitive salaries," "Varies widely based on specialization"). Do NOT give specific numbers.
    *   timeEstimateGeneral (optional string): Provide a very general, qualitative statement about the potential time commitment for transition or establishment (e.g., "May require 1-2 years of focused skill development," "Transition possible within 6-12 months for experienced candidates," "Long-term path requiring continuous learning"). Do NOT give specific years unless it's a very broad range like "several years."
4.  **Tone:** Be encouraging, insightful, and realistic.
5.  **Output Format:** Strictly adhere to the JSON output schema defined. Ensure the 'suggestedPaths' array contains 3-5 items.

Example for a roadmap item: "Focus on advanced Python programming and libraries like TensorFlow/PyTorch."
Example for a conceptual skill: "Statistical Analysis and Modeling"
Example for a conceptual certification: "AWS Certified Solutions Architect"

Do not invent information not deducible from the resume or common career knowledge.
The "roadmap" should offer actionable, albeit high-level, advice.
The salary and time estimates must be very general and qualitative due to the lack of precise real-time market data.
`,
  config: {
    temperature: 0.7, // Allow for some creative but grounded suggestions
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
});

const careerPathAdvisorFlow = ai.defineFlow(
  {
    name: 'careerPathAdvisorFlow',
    inputSchema: CareerPathInputSchema,
    outputSchema: CareerPathOutputSchema,
  },
  async (input) => {
    const promptInput = {
      resumeDataUri: input.resumeDataUri,
      userGoals: input.userGoals || undefined, // Pass undefined if empty
    };
    const { output } = await careerPathPredictionPrompt(promptInput);
    if (!output || !output.suggestedPaths || output.suggestedPaths.length === 0) {
      console.error("Career path prediction flow received no or invalid output from the prompt.");
      // Fallback to a generic message if AI fails to produce valid output
      return {
        suggestedPaths: [{
          pathTitle: "Further Exploration Needed",
          description: "The AI couldn't generate specific career paths at this moment. This could be due to the inputs or a temporary issue.",
          roadmap: [
            "Ensure your resume is clear and provides sufficient detail.",
            "If you have goals, consider adding them for more tailored suggestions next time.",
            "Research current job market trends in areas that interest you based on your resume.",
            "Seek advice from career counselors or mentors in your field."
          ],
        }],
      };
    }
    return output;
  }
);

export async function predictCareerPaths(
  input: CareerPathInput
): Promise<CareerPathOutput> {
  return careerPathAdvisorFlow(input);
}

