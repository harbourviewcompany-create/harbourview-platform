// app/api/cron/embed-artifacts/route.ts
// Vercel Cron — 0 5 * * * (05:00 UTC daily, runs after intelligence-extract at 04:00)
//
// Finds hv_artifacts rows with no corresponding hv_embeddings.embedding_384 row
// and generates one via the free HF Serverless Inference API (no dedicated
// endpoint, no cost). This is what makes public.hv_search_artifacts() actually
// return semantic results — previously hv_embeddings had zero rows, so every
// semantic search silently fell through to FTS regardless of which embedding
// branch the caller requested.
//
// Required env vars:
//   CRON_SECRET                — shared cron bearer token
//   HF_TOKEN_SERVER             — free HF read token (https://huggingface.co/settings/tokens)
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { EmbeddingGenerator } from '@/lib/intelligence-engine/adapters/embedding-generator'
import crypto from 'node:crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const ARTIFACTS_PER_RUN = 15
const CHUNK_BATCH = 8        // texts per HF request
const INTER_BATCH_DELAY = 500 // ms between HF batch calls — free tier is ~300 req/hr

function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms))
}

interface ArtifactRow {
  id: string
  workspace_id: string
  title: string
  body: string | null
  content_hash: string | null
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const embedder = new EmbeddingGenerator()
  if (!embedder.isConfigured) {
    return NextResponse.json(
      { ok: false, error: 'HF_TOKEN_SERVER not set — get a free read token at https://huggingface.co/settings/tokens' },
      { status: 503 },
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  // Pull recent artifacts, then filter out ones that already have an embedding.
  // (No FK/anti-join in one PostgREST call, so we do it in two steps.)
  const { data: recentArtifacts, error: artErr } = await supabase
    .from('hv_artifacts')
    .select('id, workspace_id, title, body, content_hash')
    .order('created_at', { ascending: false })
    .limit(100)

  if (artErr) {
    return NextResponse.json({ ok: false, error: artErr.message }, { status: 500 })
  }
  if (!recentArtifacts?.length) {
    return NextResponse.json({ ok: true, message: 'No artifacts found', embedded: 0 })
  }

  const allIds = recentArtifacts.map((a) => a.id as string)
  const { data: existingEmbeds } = await supabase
    .from('hv_embeddings')
    .select('artifact_id')
    .in('artifact_id', allIds)
    .not('embedding_384', 'is', null)

  const alreadyEmbedded = new Set((existingEmbeds ?? []).map((e) => e.artifact_id as string))
  const toEmbed = (recentArtifacts as ArtifactRow[])
    .filter((a) => !alreadyEmbedded.has(a.id) && Boolean((a.title || a.body || '').trim()))
    .slice(0, ARTIFACTS_PER_RUN)

  if (!toEmbed.length) {
    return NextResponse.json({ ok: true, message: 'All recent artifacts already embedded', embedded: 0 })
  }

  let embedded = 0
  let failed = 0
  const errors: string[] = []

  for (const artifact of toEmbed) {
    const text = `${artifact.title}\n\n${artifact.body ?? ''}`.trim()
    const chunks = EmbeddingGenerator.chunkText(text, 1500)

    try {
      const allVectors: number[][] = []
      for (let i = 0; i < chunks.length; i += CHUNK_BATCH) {
        const batch = chunks.slice(i, i + CHUNK_BATCH)
        const vectors = await embedder.embedBatch(batch)
        allVectors.push(...vectors)
        if (i + CHUNK_BATCH < chunks.length) await sleep(INTER_BATCH_DELAY)
      }

      const rows = chunks.map((chunk, idx) => ({
        artifact_id:    artifact.id,
        workspace_id:   artifact.workspace_id,
        model_id:       embedder.modelId,
        model_provider: 'huggingface',
        dimensions:     embedder.dims,
        chunk_index:    idx,
        chunk_text:     chunk.slice(0, 8000),
        embedding_384:  embedder.dims === 384 ? allVectors[idx] : null,
        embedding_1024: embedder.dims === 1024 ? allVectors[idx] : null,
        content_hash:   artifact.content_hash || crypto.createHash('sha256').update(chunk).digest('hex'),
        is_current:     true,
      }))

      const { error: insertErr } = await supabase.from('hv_embeddings').insert(rows)
      if (insertErr) throw new Error(insertErr.message)

      embedded++
      console.info(`[embed-artifacts] ✓ ${artifact.id} → ${rows.length} chunk(s)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${artifact.id}: ${msg}`)
      console.error(`[embed-artifacts] ✗ ${artifact.id}:`, msg)
      failed++
    }

    await sleep(INTER_BATCH_DELAY)
  }

  return NextResponse.json({ ok: true, embedded, failed, total: toEmbed.length, errors })
}
