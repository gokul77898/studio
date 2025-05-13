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

const performWebSearch = ai.defineTool(
  {
    name: 'performWebSearch',
    description: 'Performs a web search to find real-time information or answers to questions requiring current knowledge. Use this for topics like recent news, current trends, specific up-to-the-minute data, etc., especially if the user has requested web search or if the information is likely not in your training data.',
    inputSchema: z.object({
      query: z.string().describe('The search query for the web. Should be specific and targeted to the information needed.'),
    }),
    outputSchema: z.object({
      results: z.array(
        z.object({
          title: z.string().describe('The title of the search result.'),
          snippet: z.string().describe('A brief snippet or summary of the search result content.'),
          url: z.string().url().optional().describe('The URL of the search result, if available.'),
        })
      ).min(1).max(5).describe('A list of 1 to 5 relevant search results.'),
      summary: z.string().optional().describe('A brief overall summary of the search findings, if applicable, to help answer the user\'s question directly.')
    }),
  },
  async (input) => {
    console.log(`[WebSearchTool] Simulating web search for: "${input.query}"`);
    // In a real application, you would integrate with a search API (e.g., Google Search API, Bing API, Serper API, etc.)
    // For now, we return mock data. This mock tries to be somewhat responsive to the query.
    let mockResults = [
      { title: `Simulated Result for: ${input.query}`, snippet: `This is a general simulated search result for your query: "${input.query}". In a real system, live web data would be fetched and processed here.`, url: "https://example.com/mock-search" },
      { title: `Understanding "${input.query}"`, snippet: "Further details related to your search topic could be found here in a real scenario, providing deeper insights.", url: "https://example.com/mock-search-details" },
    ];
    let mockSummary = `Simulated search for "${input.query}" found 2 general results.`;

    if (input.query.toLowerCase().includes("latest news") || input.query.toLowerCase().includes("current trends")) {
        mockResults = [
            { title: `Mock News: AI in Job Market Skyrockets (${new Date().getFullYear()})`, snippet: "Recent reports indicate a massive surge in AI-related job openings, transforming the tech landscape.", url: "https://example.com/mock-news/ai-jobs" },
            { title: `Mock Trend: Remote Work Policies for ${new Date().getFullYear()}`, snippet: `The landscape of remote work continues to evolve with new tools and company policies focusing on hybrid models.`, url: "https://example.com/mock-trends/remote-work" },
            { title: `Mock Update: Top In-Demand Tech Skills`, snippet: "Skills in cloud computing, cybersecurity, and data science remain highly sought after this year.", url: "https://example.com/mock-updates/tech-skills" }
        ];
        mockSummary = "Simulated search indicates the AI job market is booming, remote work trends are evolving towards hybrid, and tech skills in cloud, cyber, and data are key.";
    } else if (input.query.toLowerCase().includes("stock price for acme corp")) {
        mockResults = [
            { title: `ACME Corp (ACME) Stock Price`, snippet: `Simulated: $${(Math.random() * 100 + 50).toFixed(2)} (As of today - mock data)`, url: "https://example.com/mock-stock/acme" }
        ];
        mockSummary = `ACME Corp stock is (simulated) $${(Math.random() * 100 + 50).toFixed(2)}.`;
    }

    return {
      results: mockResults.slice(0,3), // Return up to 3 mock results
      summary: mockSummary,
    };
  }
);


const CareerAdvisorInputSchema = z.object({
  question: z.string().min(1).describe("The user's question about careers, job searching, skills, coding, etc."),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({text: z.string()})),
  })).optional().describe("Previous messages in the conversation, for context."),
  useWebSearch: z.boolean().optional().describe("Whether the user explicitly requested to use web search for this query."),
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
  tools: [performWebSearch],
  prompt: `You are "Career Compass AI", a friendly, helpful, and knowledgeable career advisor.
Your primary goal is to provide clear, simple, and encouraging answers to user questions.
Users might ask about:
- Job searching strategies
- Application processes
- Skills development
- Coding concepts, languages, and best practices
- Job market trends
- Information about companies (general culture, typical interview styles, if widely known)
- Career path guidance

When responding, always:
- Be encouraging, positive, and supportive.
- Explain complex topics in a very simple and easy-to-understand manner.
- Provide actionable advice or concrete examples.
- If a question is vague, try to provide a helpful general answer first, then you can ask for clarification.
- If you don't know an answer or a question is outside your scope (e.g., personal financial/legal/medical advice, highly specific non-public company information), politely state that you cannot answer and suggest general resources if appropriate. This statement should be part of your "answer".
- Keep responses concise but informative. Use bullet points or short paragraphs for clarity.
- Do not make up information. Maintain a conversational and friendly tone.
- If the user provides chat history, use it to understand the context.

Web Search Capability:
{{#if useWebSearch}}
The user has explicitly requested to use web search for this query. You MUST prioritize using the 'performWebSearch' tool to gather the most current information to answer the question. Synthesize the search results into your answer.
{{else}}
If the user's question seems to require very current, real-time information (e.g., "What are the latest news on X?", "What is the stock price of Y today?"), or specific facts that are likely outside your general training knowledge, you SHOULD use the 'performWebSearch' tool to find relevant information. Clearly indicate if you are using web search results. Otherwise, answer from your existing knowledge.
{{/if}}
When using the web search tool, analyze the results and formulate a comprehensive answer. Don't just list the search results.

{{#if chatHistory}}
Conversation History:
{{#each chatHistory}}
{{this.role}}: {{this.parts.0.text}}
{{/each}}
{{/if}}

Current User's Question:
{{{question}}}

Your response MUST be structured as a JSON object matching the output schema, with an "answer" field containing your reply.
You must always provide content for the "answer" field.
If, after considering all information and using tools if necessary, you cannot provide a specific answer to the user's question (e.g., due to lack of information, the question being out of scope, or web search not yielding useful results), your "answer" field should clearly state this. For example: "I'm sorry, I couldn't find the information you're looking for." or "I am unable to answer that question as it is outside my scope."
Ensure the "answer" field is never empty or null.
`,
  config: {
    temperature: 0.6,
     safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH', // Relaxed from BLOCK_MEDIUM_AND_ABOVE
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH', // Relaxed from BLOCK_MEDIUM_AND_ABOVE
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
    const history = input.chatHistory?.map(message => ({
        role: message.role,
        parts: message.parts.map(part => ({ text: part.text })),
    }));

    const promptInput = {
      question: input.question,
      chatHistory: input.chatHistory, 
      useWebSearch: input.useWebSearch,
    };
    
    const { output } = await careerAdvisorPrompt(promptInput, { history });
    
    if (!output) {
        console.error("Career advisor flow received no output from the prompt. This might be due to safety filters or an inability to generate a response matching the schema.");
        return { answer: "I'm sorry, I encountered an issue and can't provide a response right now. Please try rephrasing your question or try again later." };
    }
    return output;
  }
);
