import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const client = new Anthropic()

const rateLimit = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT    = 20
const RATE_WINDOW_MS = 60 * 1000

const SYSTEM_PROMPT = `You are the Harbourview Compliance Intelligence Assistant — a specialist in global cannabis regulatory compliance, market access, and trade law across 191 jurisdictions.

You help cannabis industry professionals — importers, exporters, investors, cultivators, retailers, pharmacists, researchers, and compliance officers — navigate regulatory requirements, market access pathways, and cross-border trade.

Core capabilities:
- Regulatory status interpretation (medical, adult-use, hemp/CBD frameworks by jurisdiction)
- Import/export licensing requirements, permit workflows, and documentation checklists
- GMP, GCP, GACP, and quality standard compliance requirements
- Market access pathway guidance and counterparty verification
- Cross-border trade documentation: COA, phytosanitary certificates, import/export permits
- Risk assessment by jurisdiction, role type, and product category
- Regulatory intelligence: reform tracking, enforcement trends, posture shifts

When answering:
- Be specific to the user's jurisdiction and role context when provided
- Cite regulatory frameworks where relevant (e.g., EU GMP Annex, GACP, ICH guidelines, national cannabis acts, UN conventions)
- Acknowledge when regulations are evolving or jurisdiction-specific details need expert verification
- For high-stakes decisions, recommend review by qualified regulatory counsel in the relevant jurisdiction
- Use precise, professional language appropriate for institutional cannabis operators
- Where uncertainty exists, say so explicitly — do not speculate on regulatory requirements

You represent Harbourview's intelligence layer. You are accurate, professional, and jurisdiction-aware.`

type Message = { role: 'user' | 'assistant'; content: string }

type Body = {
  message?: unknown
  country?: unknown
  role?:    unknown
  history?: unknown
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const now = Date.now()
    const rl = rateLimit.get(ip)
    if (rl && rl.resetAt > now) {
      if (rl.count >= RATE_LIMIT) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
      rl.count++
    } else {
      rateLimit.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    }

    const body = (await request.json()) as Body

    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!message)          return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    if (message.length > 4000) return NextResponse.json({ error: 'Message too long' }, { status: 400 })

    const country = typeof body.country === 'string' ? body.country.trim() : ''
    const role    = typeof body.role    === 'string' ? body.role.trim()    : ''

    const rawHistory = Array.isArray(body.history) ? body.history : []
    const history: Message[] = rawHistory
      .filter((m): m is Message =>
        m !== null &&
        typeof m === 'object' &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.length <= 8000,
      )
      .slice(-10)

    const contextPrefix = country || role
      ? `[Context — Jurisdiction: ${country || 'Global'} · Role: ${role || 'Unspecified'}]\n\n`
      : ''

    const messages: Anthropic.MessageParam[] = [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: contextPrefix + message },
    ]

    const stream = await client.messages.stream({
      model:      'claude-sonnet-5',
      max_tokens: 1500,
      system:     [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }
        } catch (err) {
          console.error('[compliance stream]', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type':  'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('[compliance route]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Request failed' },
      { status: 500 },
    )
  }
}
