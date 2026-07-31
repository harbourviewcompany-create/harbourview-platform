// lib/ai/embedSearchQuery1024.ts
// Embeds free-text into the SAME vector space as public.signals.embedding_1024.
//
// signals.embedding_1024 is populated with OpenAI text-embedding-3-small at
// dimensions=1024 (matryoshka-truncated) -- confirmed live against the
// project's own data (atttypmod=1024; embedding_model='text-embedding-3-small'
// on every embedded row). A different model, or the same model without
// dimensions=1024, produces a vector in a different space: cosine distance
// against embedding_1024 would still return a number, just a meaningless one.
//
// Deliberately separate from lib/ai/embeddings.ts, which calls Google
// text-embedding-004 (768-dim) for ia_signals search -- a different table in
// a different vector space entirely. Do not consolidate these without
// re-embedding one side to match the other.

import 'server-only'

const MODEL = 'text-embedding-3-small'
const DIMENSIONS = 1024
const MAX_CHARS = 25_000 // generous truncation guard; OpenAI's real limit is ~8k tokens

export async function embedSearchQuery1024(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) throw new Error('[embedSearchQuery1024] OPENAI_API_KEY not set')

  const truncated = text.trim().slice(0, MAX_CHARS)
  if (!truncated) throw new Error('[embedSearchQuery1024] Cannot embed empty text')

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, input: truncated, dimensions: DIMENSIONS }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`[embedSearchQuery1024] OpenAI ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  const embedding: number[] | undefined = data?.data?.[0]?.embedding

  if (!Array.isArray(embedding) || embedding.length !== DIMENSIONS) {
    throw new Error(`[embedSearchQuery1024] Expected ${DIMENSIONS}-dim vector, got ${embedding?.length ?? 'none'}`)
  }

  return embedding
}

export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}
