import { z } from 'zod';
import { LLM_PROVIDERS, type LlmGatewayRequest } from './types';

export const MAX_LLM_MESSAGES = 12;
export const MAX_LLM_MESSAGE_CHARS = 6_000;
export const MAX_LLM_TOTAL_CHARS = 18_000;

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().trim().min(1).max(MAX_LLM_MESSAGE_CHARS),
}).strict();

export const llmGatewayRequestSchema = z.object({
  provider: z.enum(LLM_PROVIDERS).optional(),
  messages: z.array(messageSchema).min(1).max(MAX_LLM_MESSAGES),
  temperature: z.number().min(0).max(1).optional(),
  maxOutputTokens: z.number().int().min(1).max(4_096).optional(),
  requestId: z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9_.:-]+$/).optional(),
}).strict().superRefine((value, ctx) => {
  const totalChars = value.messages.reduce((sum, message) => sum + message.content.length, 0);
  if (totalChars > MAX_LLM_TOTAL_CHARS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Total message content must be ${MAX_LLM_TOTAL_CHARS} characters or less.`,
      path: ['messages'],
    });
  }
});

export function parseLlmGatewayRequest(value: unknown): LlmGatewayRequest {
  return llmGatewayRequestSchema.parse(value);
}
