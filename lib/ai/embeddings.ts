// lib/ai/embeddings.ts
// Google text-embedding-004 via the Gemini API.
// 768-dim output. Free tier: 1500 RPM / 1M tokens per day.
// Uses GOOGLE_API_KEY — already set in Vercel.
//
// Server-only.

import 'server-only'

const EMBED_MODEL = 'text-embedding-004'
const MAX_CHARS   = 25_000 // ~6k tokens, well under the 2048 token limit

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('[embeddings] GOOGLE_API_KEY not set')

  const truncated = text.trim().slice(0, MAX_CHARS)
  if (!truncated) throw new Error('[embeddings] Cannot embed empty text')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${apiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:   `models/${EMBED_MODEL}`,
        content: { parts: [{ text: truncated }] },
      }),
    },
  )

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`[embeddings] Google API ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  const embedding: number[] = data?.embedding?.values

  if (!Array.isArray(embedding) || embedding.length !== 768) {
    throw new Error(`[embeddings] Expected 768-dim vector, got ${embedding?.length ?? 'none'}`)
  }

  return embedding
}

export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}
