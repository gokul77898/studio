
/**
 * @fileOverview Zod schemas for AI Outreach Message Optimizer flow.
 */
import { z } from 'zod';

export const MessageTypeSchema = z.enum([
  'Cold Email to Recruiter/Hiring Manager',
  'Follow-up Email after Application',
  'Networking Email/Message',
  'LinkedIn Connection Request Message',
  'LinkedIn InMail Message',
  'Other Professional Outreach',
]);
export type MessageType = z.infer<typeof MessageTypeSchema>;

export const OutreachOptimizerInputSchema = z.object({
  messageText: z
    .string()
    .min(50, { message: 'Message text must be at least 50 characters.' })
    .describe('The full text content of the outreach message/email body.'),
  subjectLine: z
    .string()
    .optional()
    .describe(
      'The subject line of the email, if applicable. Important for emails.'
    ),
  jobDescriptionText: z
    .string()
    .optional()
    .describe(
      'The text of the job description the user is applying to or referencing. Provides context for the AI.'
    ),
  messageType: MessageTypeSchema.describe(
    'The type of outreach message this is, to help the AI tailor its advice.'
  ),
  userResumeSummary: z
    .string()
    .optional()
    .describe(
      "A brief summary of the user's background or key skills from their resume. This helps the AI understand the sender's profile."
    ),
});
export type OutreachOptimizerInput = z.infer<
  typeof OutreachOptimizerInputSchema
>;

export const OutreachOptimizerOutputSchema = z.object({
  overallAssessment: z
    .string()
    .describe(
      "A qualitative assessment of the message's potential effectiveness (e.g., 'Good start, but could be more concise', 'Strong call to action'). Not a numerical score."
    ),
  strengths: z
    .array(z.string())
    .optional()
    .describe('Specific positive aspects of the message.'),
  areasForImprovement: z
    .array(z.string())
    .describe('Specific areas where the message could be improved.'),
  suggestedSubjectLine: z
    .string()
    .optional()
    .describe(
      'An improved subject line, if a subject was provided or if it is highly recommended for the message type.'
    ),
  suggestedMessageBody: z
    .string()
    .describe(
      'A revised version of the message body incorporating improvements, or specific sentence suggestions.'
    ),
  keyRecommendations: z
    .array(z.string())
    .min(1)
    .describe(
      'A list of 2-4 actionable key recommendations for the user to consider.'
    ),
});
export type OutreachOptimizerOutput = z.infer<
  typeof OutreachOptimizerOutputSchema
>;
