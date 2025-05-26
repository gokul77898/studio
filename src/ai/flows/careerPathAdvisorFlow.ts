
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
  type EmploymentPreference, // Import EmploymentPreference type
} from '../schemas/careerPathAdvisorSchema';

const careerPathPredictionPrompt = ai.definePrompt({
  name: 'careerPathPredictionPrompt',
  input: { schema: CareerPathInputSchema },
  output: { schema: CareerPathOutputSchema },
  prompt: `You are an expert Career Strategist AI. Your task is to analyze the user's resume completely, their stated career goals/aspirations (if provided), and their employment preference (if provided) to suggest 3-5 viable future career paths.

User's Resume (analyze thoroughly for all skills, experiences, roles, education, and projects):
{{media url=resumeDataUri}}

{{#if userGoals}}
User's Stated Goals/Aspirations:
"{{{userGoals}}}"
Base your suggestions primarily on aligning the resume with these goals, considering their employment preference.
{{else}}
User's Stated Goals/Aspirations: Not provided.
Base your suggestions primarily on the skills, experience, and potential progression evident from the resume, considering their employment preference.
{{/if}}

{{#if employmentPreference}}
User's Employment Preference / Current Stage: {{{employmentPreference}}}
Consider this strongly. For 'Fresher' or 'Internship', focus on entry-level roles, internships, or paths suitable for starting a career. For 'Full-time', 'Part-time', or 'Contract', tailor suggestions for roles matching those types, aligned with their experience level from the resume.
{{else}}
User's Employment Preference / Current Stage: Not specified.
Infer appropriate career levels from the resume.
{{/if}}

Instructions for Career Path Suggestions:
1.  **Analyze Thoroughly and Comprehensively:** Carefully consider all aspects of the user's current profile from their resume, including all listed skills (technical and soft), past roles, responsibilities, achievements, educational background, and any projects mentioned. If user goals are provided, deeply reflect on them. Factor in their employment preference when shaping path suggestions.
2.  **Suggest Viable Paths:** Based on the analysis, propose 3 to 5 distinct and realistic career paths that the user could pursue. These paths should be a logical progression or a feasible pivot based on the full resume content and stated preferences.
3.  **For Each Suggested Path, Provide:**
    *   pathTitle: A clear and concise title for the career path (e.g., "Senior Data Scientist specializing in NLP", "Cybersecurity Analyst (Cloud Focus)", "Product Manager for AI Solutions", "Entry-Level Software Developer").
    *   description: A brief explanation (2-3 sentences) of what the role entails and why it might align with the user's profile, goals (if provided), and employment preference.
    *   roadmap: A high-level textual roadmap. This should be an array of strings, with each string representing a step or key consideration. Include:
        *   Key skills or knowledge areas the user might need to develop or strengthen, drawing connections to their existing skillset *as identified from their resume*. Consider the employment preference for skill depth.
        *   Potential types of certifications, courses, or further education that could be beneficial (be general, e.g., "Advanced Python certification," "Master's in Data Science," "Project Management Professional (PMP)"), considering any existing credentials from the resume and relevance to the employment preference.
        *   A brief conceptual outlook on the role or industry.
    *   conceptualSkills: List 3-5 core technical or soft skills central to this path, especially those that build upon or complement skills found in the resume. If none are clearly identifiable, this can be an empty array.
    *   conceptualCertifications: List 1-3 general types of certifications or learning paths relevant to this career. If none are clearly identifiable, this can be an empty array.
    *   salaryOutlookGeneral: Provide a very general, qualitative statement about the salary potential (e.g., "Strong earning potential with experience," "Typically offers competitive salaries," "Varies widely based on specialization"). Do NOT give specific numbers. If no clear outlook, this can be an empty string or omitted.
    *   timeEstimateGeneral: Provide a very general, qualitative statement about the potential time commitment for transition or establishment (e.g., "May require 1-2 years of focused skill development," "Transition possible within 6-12 months for experienced candidates," "Long-term path requiring continuous learning"). Do NOT give specific years unless it's a very broad range like "several years." If no clear estimate, this can be an empty string or omitted.
    *   transferableSkillsFromResume: Identify 2-4 key skills *directly from the user's resume* that are highly transferable to this suggested path. Be specific about the skill from the resume. If none are clearly identifiable, this can be an empty array.
    *   learningResourceSuggestions: Provide 2-3 conceptual suggestions for learning. Examples: "Explore online courses in 'Cloud Architecture' on platforms like Coursera or AWS Skill Builder.", "Contribute to open-source projects in Python to enhance backend skills.", "Read industry blogs and follow thought leaders in Cybersecurity." If no specific suggestions, this can be an empty array.
    *   industryOutlook: A brief, general statement about the outlook for this role or industry. Example: "This field is experiencing significant growth with advancements in AI." If no clear outlook, this can be an empty string or omitted.
    *   potentialChallenges: List 1-2 potential challenges or important considerations for this path. Examples: "Keeping up with the rapid pace of technological change.", "May require strong analytical skills for complex problem-solving." If no specific challenges, this can be an empty array.
4.  **Strive to populate all fields for each path** (pathTitle, description, roadmap, conceptualSkills, conceptualCertifications, salaryOutlookGeneral, timeEstimateGeneral, transferableSkillsFromResume, learningResourceSuggestions, industryOutlook, potentialChallenges) if relevant information can be derived from the inputs.
5.  **Strongest Fit Recommendation (Optional):** After detailing the 3-5 paths, if one or two paths stand out as a particularly strong alignment based on the comprehensive analysis of the resume, goals, and employment preference, populate the 'strongestFitAnalysis' field. Include the 'recommendedPathTitle' (from the paths you suggested) and 'reasoning' (a 1-2 sentence explanation for why it's a strong fit). If no single path particularly stands out more than others, you can omit this field or leave it empty. Do not provide a numerical "success rate."
6.  **Tone:** Be encouraging, insightful, and realistic.
7.  **Output Format:** Strictly adhere to the JSON output schema defined. Ensure the 'suggestedPaths' array contains 3-5 items.

Example for a roadmap item: "Focus on advanced Python programming and libraries like TensorFlow/PyTorch, building on your existing Python experience evident in the resume."
Example for a conceptual skill: "Statistical Analysis and Modeling"
Example for a conceptual certification: "AWS Certified Solutions Architect"
Example for transferableSkillsFromResume: "Your experience with 'Project Management' listed under 'XYZ Corp' on your resume is highly relevant."
Example for learningResourceSuggestions: "Take an online course on 'Data Visualization with Tableau' to enhance your analytics presentation skills."

Do not invent information not deducible from the resume or common career knowledge.
The "roadmap" should offer actionable, albeit high-level, advice, directly relevant to bridging any gaps or leveraging strengths identified from the user's specific resume.
The salary and time estimates must be very general and qualitative due to the lack of precise real-time market data.
Ensure that your analysis of the resume is complete before suggesting paths.
Ensure suggestions align with the user's employment preference if provided.
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
      userGoals: input.userGoals || undefined,
      employmentPreference: input.employmentPreference || undefined,
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
            "Ensure your resume is clear and provides sufficient detail covering all your skills and experiences.",
            "If you have goals, consider adding them for more tailored suggestions next time.",
            "Consider specifying your employment preference (e.g., Fresher, Full-time) if applicable.",
            "Research current job market trends in areas that interest you based on your resume.",
            "Seek advice from career counselors or mentors in your field."
          ],
           learningResourceSuggestions: ["General career advice websites or books may be helpful."],
           industryOutlook: "The job market is constantly evolving; staying informed is key.",
           // Fallback does not include transferableSkillsFromResume or potentialChallenges by default here,
           // as they are highly dependent on the resume content.
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

