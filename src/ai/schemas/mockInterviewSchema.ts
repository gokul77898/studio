
/**
 * @fileOverview Zod schemas for AI Mock Interview Practice flow.
 */
import { z } from 'zod';

export const MockInterviewTurnSchema = z.object({
  question: z.string().describe("The question asked by the AI interviewer."),
  answer: z.string().describe("The user's answer to the question."),
  feedback: z.string().optional().describe("AI's feedback on the user's answer. This is feedback from the AI *on* the user's answer to the *AI's question* in this turn."),
});
export type MockInterviewTurn = z.infer<typeof MockInterviewTurnSchema>;

export const InterviewTypeSchema = z.enum([
  "General / Behavioral",
  "Technical - Conceptual (Software Engineering)",
  "Technical - Conceptual (AI/ML)",
  "Technical - Conceptual (Data Science)",
]);
export type InterviewType = z.infer<typeof InterviewTypeSchema>;

export const MockInterviewInputSchema = z.object({
  resumeDataUri: z.string().optional().describe("User's resume as a data URI. Provided at the start of the session. Optional for subsequent turns if already processed."),
  userSkills: z.string().optional().describe("User's self-described skills. Provided at the start."),
  targetCompanyName: z.string().optional().describe("The company the user is targeting. Provided at the start."),
  jobContext: z.string().optional().describe("General context about the job or type of interview (e.g., 'Software Engineer behavioral questions'). This can be used if resume/company is not detailed enough or for general practice."),
  interviewType: InterviewTypeSchema.optional().describe("Specific type of interview the user wants to practice for (e.g., Behavioral, Technical Conceptual)."),
  
  userAnswer: z.string().optional().describe("The user's answer to the AI's previous question. Omit for the first question of the session."),
  interviewHistory: z.array(MockInterviewTurnSchema).optional().describe("History of previous questions asked by AI, user's answers, and AI's feedback on those answers."),
  lastAiQuestion: z.string().optional().describe("The last question asked by the AI, to which 'userAnswer' (if provided) is a response. Important for feedback context."),
  endSessionSignal: z.boolean().optional().default(false).describe("Signal from the user to end the interview session."),
});
export type MockInterviewInput = z.infer<typeof MockInterviewInputSchema>;

export const MockInterviewOutputSchema = z.object({
  aiResponseText: z.string().describe("The AI's comprehensive response. This should include feedback on the user's last answer (if applicable) AND the next interview question, or just the first question if it's the start, or concluding remarks if the session is over. The UI will display this text directly."),
  currentAiQuestion: z.string().optional().describe("The specific question the AI is currently posing to the user. Extracted for UI state management. Can be empty if session is over."),
  isSessionOver: z.boolean().optional().default(false).describe("True if the AI considers the mock interview session complete."),
});
export type MockInterviewOutput = z.infer<typeof MockInterviewOutputSchema>;

