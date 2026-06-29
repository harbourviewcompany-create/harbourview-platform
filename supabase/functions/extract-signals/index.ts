// supabase/functions/extract-signals/index.ts
// Deno Edge Function — runs Claude Haiku over a regulatory_signals.source_snapshot
// and creates draft regulatory_signals.signals entries (review_status='captured').
//
// Called by:
//   • The /api/admin/signals/trigger-ingest Next.js route after a changed snapshot
//   • Manually from admin UI for any snapshot
//
// Request body: { snapshot_id: string }
// Response:     { ok, snapshot_id, signals_created } | { ok: false, error }
//
// Required Supabase secrets:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY         = Deno.env.get('ANTHROPIC_API_KEY')!

const MAX_TEXT_CHARS = 48_000

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

async function db<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`DB ${res.status} for ${path}: ${text.slice(0, 300)}`)
  return (text ? JSON.parse(text) : null) as T
}

const SYSTEM_PROMPT = `You are a regulatory intelligence analyst for Harbourview, a global cannabis industry compliance platform. Extract structured regulatory signals from the text of a regulatory authority page or feed.

A signal is a meaningful development: new regulation, licensing change, import/export rule, enforcement action, market access change, consultation, or policy announcement relevant to the cannabis/hemp industry.

Return a JSON array of signal objects, or [] if nothing relevant is found. Each object must include:
- slug: string — kebab-case, max 80 chars, derived from headline
- headline: string — one clear sentence, max 200 chars
- signal_type: one of [regulatory_change, licensing_market_access, enforcement_compliance_action, import_export_pathway, consultation_pending_rule_change, prescription_patient_access, hemp_cbd_controlled_cannabinoids, controlled_substance_scheduling, quality_standard_requirement]
- confidence: one of [official_confirmed, high, medium, low]
- impact_level: one of [critical, high, moderate, low]
- signal_date: "YYYY-MM-DD" or null
- raw_excerpt: string — short verbatim quote from the source text, max 400 chars
- private_summary: string — 2-3 sentence internal analyst summary
- public_summary: string — 2-3 sentence public-safe summary (no internal speculation)
- public_implication: string — one sentence on commercial implication for operators
- requires_diligence: boolean — true if legal/compliance verification needed before acting

Return ONLY a JSON array, no markdown fences.`

interface ExtractedSignal {
  slug: string
  headline: string
  signal_type: string
  confidence: string
  impact_level: string
  signal_date: string | null
  raw_excerpt: string
  private_summary: string
  public_summary: string
  public_implication: string
  requires_diligence: boolean
}

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405)

  let body: { snapshot_id?: string }
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const { snapshot_id } = body
  if (!snapshot_id) return json({ error: 'snapshot_id required' }, 400)

  if (!ANTHROPIC_API_KEY) return json({ error: 'ANTHROPIC_API_KEY not configured' }, 503)

  // Load snapshot + parent source
  const snapshots = await db<Record<string, unknown>[]>(
    `/rest/v1/regulatory_signals.source_snapshots?id=eq.${encodeURIComponent(snapshot_id)}&select=id,source_id,source_url,raw_text&limit=1`,
  ).catch(() => [])

  const snapshot = snapshots[0]
  if (!snapshot) return json({ error: 'Snapshot not found', snapshot_id }, 404)
  if (!snapshot.raw_text) return json({ error: 'Snapshot has no text', snapshot_id }, 422)

  const sources = await db<Record<string, unknown>[]>(
    `/rest/v1/regulatory_signals.sources?id=eq.${encodeURIComponent(String(snapshot.source_id))}&select=source_name,source_type,source_tier,country_code,country_name,region,jurisdiction,regulator_name&limit=1`,
  ).catch(() => [])

  const source = sources[0] ?? {}

  // Build prompt
  const context = [source.source_name, source.regulator_name, source.country_name, source.jurisdiction]
    .filter(Boolean).join(' / ')

  const userText = `Source: ${context}\nURL: ${snapshot.source_url || 'unknown'}\n\n---\n\n${String(snapshot.raw_text).slice(0, MAX_TEXT_CHARS)}`

  // Call Claude Haiku via Anthropic Messages API
  const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userText }],
    }),
    signal: AbortSignal.timeout(55_000),
  }).catch((err) => { throw new Error(`Anthropic fetch error: ${err.message}`) })

  if (!anthropicResp.ok) {
    const errText = await anthropicResp.text().catch(() => '')
    return json({ ok: false, snapshot_id, error: `Anthropic ${anthropicResp.status}: ${errText.slice(0, 300)}` }, 500)
  }

  const anthropicData = await anthropicResp.json() as { content: Array<{ type: string; text: string }> }
  const rawOutput = anthropicData.content.find(b => b.type === 'text')?.text ?? ''

  let signals: ExtractedSignal[] = []
  try {
    const parsed = JSON.parse(rawOutput.trim())
    signals = Array.isArray(parsed) ? parsed : []
  } catch {
    console.error('extract-signals: failed to parse model output:', rawOutput.slice(0, 500))
    return json({ ok: false, snapshot_id, error: 'Model output was not valid JSON', raw: rawOutput.slice(0, 300) }, 500)
  }

  if (signals.length === 0) {
    return json({ ok: true, snapshot_id, signals_created: 0, reason: 'No signals extracted' })
  }

  // Insert signals (skip duplicates via slug)
  let created = 0
  const suffix = Date.now().toString(36)

  for (const s of signals.slice(0, 10)) {
    const slug = `${(s.slug || 'signal').slice(0, 70)}-${suffix}`
    const { error: insertErr } = await fetch(
      `${SUPABASE_URL}/rest/v1/regulatory_signals.signals`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=ignore-duplicates,return=minimal',
        },
        body: JSON.stringify({
          source_id:          snapshot.source_id,
          slug,
          headline:           s.headline.slice(0, 240),
          signal_type:        s.signal_type,
          review_status:      'captured',
          confidence:         s.confidence,
          impact_level:       s.impact_level,
          source_tier:        source.source_tier ?? null,
          source_type:        source.source_type ?? null,
          country_code:       source.country_code ?? null,
          country_name:       source.country_name ?? null,
          region:             source.region ?? null,
          jurisdiction:       source.jurisdiction ?? null,
          regulator_name:     source.regulator_name ?? null,
          signal_date:        s.signal_date,
          source_url:         snapshot.source_url ?? null,
          canonical_source_url: snapshot.source_url ?? null,
          raw_excerpt:        s.raw_excerpt?.slice(0, 400) ?? null,
          private_summary:    s.private_summary,
          public_summary:     s.public_summary,
          public_implication: s.public_implication,
          private_notes:      'Draft created by extract-signals Edge Function. Requires human review.',
          requires_diligence: s.requires_diligence,
          public_safe:        false,
          publish_to_public:  false,
          internal_only:      true,
        }),
      },
    ).then(async r => {
      if (!r.ok) return { error: await r.text() }
      return { error: null }
    }).catch(err => ({ error: String(err) }))

    if (!insertErr) created++
    else console.error('extract-signals: insert error:', insertErr)
  }

  return json({ ok: true, snapshot_id, signals_created: created, signals_extracted: signals.length })
})
