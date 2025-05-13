'use server';
/**
 * @fileOverview AI-powered career advisor chatbot flow.
 *
 * - careerAdvice - A function that provides advice based on user questions.
 * - CareerAdvisorInput - The input type for the careerAdvice function.
 * - CareerAdvisorOutput - The return type for the careerAdvice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CareerAdvisorInputSchema = z.object({
  question: z.string().min(1).describe("The user's question about careers, job searching, skills, coding, etc."),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({text: z.string()})),
  })).optional().describe("Previous messages in the conversation, for context."),
});
export type CareerAdvisorInput = z.infer<typeof CareerAdvisorInputSchema>;

const CareerAdvisorOutputSchema = z.object({
  answer: z.string().describe("The AI's answer to the user's question."),
});
export type CareerAdvisorOutput = z.infer<typeof CareerAdvisorOutputSchema>;

export async function careerAdvice(input: CareerAdvisorInput): Promise<CareerAdvisorOutput> {
  return careerAdvisorFlow(input);
}

const careerAdvisorPrompt = ai.definePrompt({
  name: 'careerAdvisorPrompt',
  input: { schema: CareerAdvisorInputSchema },
  output: { schema: CareerAdvisorOutputSchema },
  prompt: `You are "Career Compass AI", a friendly, helpful, and knowledgeable career advisor.
Your primary goal is to provide clear, simple, and encouraging answers to user questions.
Users might ask about:
- Job searching strategies (e.g., "How do I find remote jobs?")
- Application processes (e.g., "What should I include in a cover letter?")
- Skills development (e.g., "What are good skills for a web developer?", "How can I learn Python?")
- Coding concepts, languages, and best practices (e.g., "Explain JavaScript closures simply.", "What is version control?")
- Job market trends (e.g., "Are AI jobs in demand?")
- Information about companies (general culture, typical interview styles, if widely known. Avoid specifics you can't verify.)
- Career path guidance (e.g., "I like design and code, what jobs fit?")

When responding, always:
- Be encouraging, positive, and supportive.
- Explain complex topics in a very simple and easy-to-understand manner, as if explaining to a beginner.
- Provide actionable advice or concrete examples when possible.
- If a question is vague, you can ask for clarification, but try to provide a helpful general answer first.
- If you don't know an answer or a question is outside your scope (e.g., personal financial advice, legal advice, medical advice, highly specific non-public company information), politely state that you cannot answer that specific query and, if appropriate, suggest general resources or types of professionals who might help.
- Keep your responses concise but informative. Use bullet points or short paragraphs if it helps clarity.
- Do not make up information.
- Do not give financial, legal, or medical advice.
- Maintain a conversational and friendly tone.
- If the user provides chat history, use it to understand the context of the current question.

{{#if chatHistory}}
Conversation History:
{{#each chatHistory}}
{{this.role}}: {{this.parts.0.text}}
{{/each}}
{{/if}}

Current User's Question:
{{{question}}}

Your Answer (keep it simple and helpful):
`,
  config: {
    temperature: 0.7, // Allow for a bit more creativity in responses
     safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});

const careerAdvisorFlow = ai.defineFlow(
  {
    name: 'careerAdvisorFlow',
    inputSchema: CareerAdvisorInputSchema,
    outputSchema: CareerAdvisorOutputSchema,
  },
  async (input) => {
    // Construct prompt history if available
    const history = input.chatHistory?.map(message => ({
        role: message.role,
        parts: message.parts.map(part => ({ text: part.text })),
    }));

    const { output } = await careerAdvisorPrompt(input, { history });
    
    if (!output) {
        console.error("Career advisor flow received no output from the prompt.");
        return { answer: "I'm sorry, I encountered an issue and can't provide a response right now." };
    }
    return output;
  }
);

