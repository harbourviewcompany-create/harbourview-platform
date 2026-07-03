import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are Harbourview's executive briefing engine. Given a jurisdiction and operator role, produce a 2–3 sentence intelligence summary that a senior professional can act on immediately. Be specific, factual in tone, and forward-looking. Never hedge excessively. Write in present tense. No markdown, no bullet points — prose only.`

type Body = {
  country?: unknown
  role?: unknown
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    const body = (await request.json()) as Body
    const country = typeof body.country === 'string' ? body.country.trim() : 'Global'
    const role = typeof body.role === 'string' ? body.role.trim() : 'Operator'

    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 200,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [
        {
          role: 'user',
          content: `Jurisdiction: ${country}\nRole: ${role}\n\nWrite a 2–3 sentence executive intelligence briefing for today.`,
        },
      ],
    })

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')

    return NextResponse.json({ briefing: text })
  } catch (error) {
    console.error('[briefing route]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Request failed' },
      { status: 500 },
    )
  }
}
