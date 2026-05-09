import { z } from 'zod'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
})

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return jsonError('Invalid JSON request body', 400)
  }

  const parsed = RequestSchema.safeParse(body)

  if (!parsed.success) {
    return jsonError('Prompt is required and must be a non-empty string', 400)
  }

  return Response.json({
    finalAnswer: 'This public route is not enabled. Use the contact or intake route for reviewed requests.',
  })
}
