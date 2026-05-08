import { generateText, stepCountIs, tool } from 'ai';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 60;

const DEFAULT_MODEL = 'openai/gpt-5';

const RequestSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
});

const LocationSchema = z.object({
  location: z.string().trim().min(1).max(120),
});

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function getModel() {
  return process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON request body', 400);
  }

  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError('Prompt is required and must be a non-empty string', 400);
  }

  try {
    const result = await generateText({
      model: getModel(),
      prompt: parsed.data.prompt,
      stopWhen: stepCountIs(5),
      tools: {
        weather: tool({
          description: 'Get mock weather for a location.',
          inputSchema: LocationSchema,
          execute: async ({ location }) => ({
            location,
            temperature: 72 + Math.floor(Math.random() * 21) - 10,
          }),
        }),

        activities: tool({
          description: 'Get mock activities for a location.',
          inputSchema: LocationSchema,
          execute: async ({ location }) => ({
            location,
            activities: ['hiking', 'swimming', 'sightseeing'],
          }),
        }),
      },
    });

    return Response.json({
      finalAnswer: result.text,
      ...(process.env.NODE_ENV === 'development'
        ? {
            steps: result.steps.map((step) => ({
              text: step.text,
              toolCalls: step.toolCalls,
              toolResults: step.toolResults,
              finishReason: step.finishReason,
            })),
          }
        : {}),
    });
  } catch (error) {
    console.error('AI route error:', error);

    return jsonError('Failed to generate response', 500);
  }
}
