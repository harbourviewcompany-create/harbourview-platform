import { NextResponse } from 'next/server'
import { getAdminAuthCheck } from '@/lib/auth/adminGuard'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Text to embed for each source — name + category + notes
function buildEmbedText(source: { name: string; category: string; notes: string | null }): string {
  return [source.name, source.category, source.notes ?? ''].filter(Boolean).join('. ').trim()
}

type SourceRow = {
  id:       string
  name:     string
  category: string
  notes:    string | null
}

type EmbedResponse = {
  data?: { embedding: number[]; index: number }[]
}

export async function POST(request: Request) {
  const secret      = process.env.HARBOURVIEW_EDGE_OPERATOR_SECRET?.trim()
  const openaiKey   = process.env.OPENAI_API_KEY?.trim()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  // Accept either a static operator secret (for CI/cron) or a live admin session (for browser)
  const authHeader = request.headers.get('authorization') ?? ''
  const hasSecretAuth = secret && authHeader === `Bearer ${secret}`
  if (!hasSecretAuth) {
    const sessionCheck = await getAdminAuthCheck()
    if (!sessionCheck.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  if (!openaiKey || !supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 503 })
  }

  const headers: Record<string, string> = {
    'Content-Type':  'application/json',
    'apikey':         supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
  }

  // 1. Fetch all active sources
  const sourcesRes = await fetch(
    `${supabaseUrl}/rest/v1/ia_sources?status=eq.active&select=id,name,category,notes`,
    { headers },
  )
  if (!sourcesRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch sources', status: sourcesRes.status }, { status: 502 })
  }
  const sources: SourceRow[] = await sourcesRes.json()

  if (sources.length === 0) {
    return NextResponse.json({ message: 'No active sources found', embedded: 0, skipped: 0 })
  }

  // 2. Find which ones already have embeddings (skip re-embedding)
  const existingRes = await fetch(
    `${supabaseUrl}/rest/v1/ia_source_embeddings?select=source_id`,
    { headers },
  )
  const existing: { source_id: string }[] = existingRes.ok ? await existingRes.json() : []
  const alreadyEmbedded = new Set(existing.map(r => r.source_id))

  const toEmbed = sources.filter(s => !alreadyEmbedded.has(s.id))
  if (toEmbed.length === 0) {
    return NextResponse.json({ message: 'All sources already embedded', embedded: 0, skipped: sources.length })
  }

  // 3. Embed in batches of 20 (OpenAI limit is 2048 inputs, but small batches keep payloads manageable)
  const BATCH = 20
  let embedded = 0
  const errors: string[] = []

  for (let i = 0; i < toEmbed.length; i += BATCH) {
    const batch = toEmbed.slice(i, i + BATCH)
    const texts = batch.map(buildEmbedText)

    const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: texts }),
    })
    if (!embedRes.ok) {
      const msg = `Batch ${i}-${i + batch.length}: OpenAI error ${embedRes.status}`
      console.error('[backfill-source-embeddings]', msg)
      errors.push(msg)
      continue
    }
    const embedData: EmbedResponse = await embedRes.json()
    if (!embedData.data?.length) { errors.push(`Batch ${i}: empty response`); continue }

    // 4. Upsert embeddings
    const rows = batch.map((src, idx) => ({
      source_id: src.id,
      embedding: embedData.data![idx].embedding,
      model:     'text-embedding-3-small',
    }))

    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/ia_source_embeddings`, {
      method:  'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows),
    })
    if (!upsertRes.ok) {
      const msg = `Batch ${i}: upsert error ${upsertRes.status} — ${await upsertRes.text()}`
      console.error('[backfill-source-embeddings]', msg)
      errors.push(msg)
      continue
    }
    embedded += batch.length
  }

  return NextResponse.json({
    total:    sources.length,
    skipped:  alreadyEmbedded.size,
    embedded,
    errors:   errors.length ? errors : undefined,
  })
}
