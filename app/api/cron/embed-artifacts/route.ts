// app/api/cron/embed-artifacts/route.ts
// Vercel Cron — generates BGE-M3 1024-dim embeddings for hv_artifacts rows
// that do not yet have a current row in hv_embeddings.
//
// Pipeline: intelligence-extract (04:00 UTC) → embed-artifacts (05:00 UTC)
//           → intelligence-embed (06:00 UTC) runs ia_signal_embeddings separately
//
// Required env vars:
//   CRON_SECRET
//   HF_TOKEN_SERVER
//   HF_ENDPOINT_EMBED_BGE_M3
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { embedBGEM3, toVectorLiteral } from '@/lib/hf/embeddings'
import { parseHfEnv } from '@/lib/hf/env'
import crypto from 'node:crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const BATCH_SIZE = 20
const HV_WORKSPACE_ID = 'a85840b4-c522-4cb8-9097-2f6c30a78417'

interface ArtifactRow {
  id: string
  title: string
  body: string | null
  workspace_id: string
}

function buildEmbedInput(a: ArtifactRow): string {
  return [a.title, a.body].filter(Boolean).join('\n').trim().slice(0, 8_000)
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret)
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  if (authHeader !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hfParse = parseHfEnv()
  if (!hfParse.success || !hfParse.data.HF_ENDPOINT_EMBED_BGE_M3) {
    console.warn('embed_artifacts_cron: HF_ENDPOINT_EMBED_BGE_M3 not configured')
    return NextResponse.json({ ok: false, reason: 'HF_ENDPOINT_EMBED_BGE_M3 not configured', embedded: 0 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } },
  )

  // Overselect recent artifacts then filter in-memory to avoid NOT EXISTS subquery
  const { data: candidates, error: candidateErr } = await supabase
    .from('hv_artifacts')
    .select('id, title, body, workspace_id')
    .eq('workspace_id', HV_WORKSPACE_ID)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(BATCH_SIZE * 3)

  if (candidateErr) {
    console.error('embed_artifacts_cron: candidate fetch error', candidateErr.message)
    return NextResponse.json({ ok: false, error: candidateErr.message }, { status: 500 })
  }

  const allCandidates = (candidates as ArtifactRow[] | null) ?? []
  if (allCandidates.length === 0)
    return NextResponse.json({ ok: true, embedded: 0, failed: 0, skipped: 0 })

  const candidateIds = allCandidates.map(r => r.id)
  const { data: existing } = await supabase
    .from('hv_embeddings')
    .select('artifact_id')
    .in('artifact_id', candidateIds)
    .eq('is_current', true)

  const alreadyEmbedded = new Set((existing ?? []).map((r: { artifact_id: string }) => r.artifact_id))
  const toProcess = allCandidates.filter(r => !alreadyEmbedded.has(r.id)).slice(0, BATCH_SIZE)

  console.info(`embed_artifacts_cron: ${toProcess.length} to embed (${alreadyEmbedded.size} already done)`)

  if (toProcess.length === 0)
    return NextResponse.json({ ok: true, embedded: 0, failed: 0, skipped: allCandidates.length })

  let embedded = 0
  let failed = 0

  for (const artifact of toProcess) {
    const inputText = buildEmbedInput(artifact)
    if (!inputText) { failed++; continue }

    try {
      const embeddingVector = await embedBGEM3(inputText)
      const contentHash = crypto.createHash('sha256').update(inputText).digest('hex').slice(0, 16)

      const { error: insertErr } = await supabase
        .from('hv_embeddings')
        .insert({
          artifact_id:    artifact.id,
          workspace_id:   artifact.workspace_id,
          model_id:       'bge-m3',
          model_provider: 'huggingface',
          model_version:  '1024',
          dimensions:     1024,
          chunk_index:    0,
          chunk_text:     inputText.slice(0, 1_000),
          embedding_1024: toVectorLiteral(embeddingVector),
          source_field:   'title+body',
          content_hash:   contentHash,
          is_current:     true,
        })

      if (insertErr) {
        console.error(`embed_artifacts_cron: insert failed (id=${artifact.id}):`, insertErr.message)
        failed++
        continue
      }

      embedded++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`embed_artifacts_cron: embed failed (id=${artifact.id}):`, msg)
      failed++
    }
  }

  const summary = { ok: true, total: toProcess.length, embedded, failed }
  console.info('embed_artifacts_cron: run complete', summary)
  return NextResponse.json(summary)
}
