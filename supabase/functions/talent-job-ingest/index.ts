import { createClient } from 'jsr:@supabase/supabase-js@2'
import { matchesRequiredSecret } from '../_shared/harbourview-auth.ts'

const INGESTION_SECRET = Deno.env.get('TALENT_INGESTION_SECRET') ?? ''

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
}

function text(value: unknown, max: number) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })
  if (!INGESTION_SECRET) return json(503, { error: 'service_not_configured' })
  if (!matchesRequiredSecret(INGESTION_SECRET, req.headers.get('x-harbourview-talent-ingestion-secret'))) return json(401, { error: 'unauthorized' })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json(400, { error: 'invalid_json' }) }
  const sourceKey = text(body.sourceKey, 120)
  const externalId = text(body.externalId, 240)
  const title = text(body.title, 300)
  const contentHash = text(body.contentHash, 128)
  if (!sourceKey || !externalId || !title || !contentHash) return json(400, { error: 'missing_required_fields' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !serviceRole) return json(503, { error: 'supabase_not_configured' })
  const sb = createClient(supabaseUrl, serviceRole, { db: { schema: 'api' }, auth: { persistSession: false } })

  const { data, error } = await sb.rpc('talent_ingest_job_observation', {
    p_source_key: sourceKey,
    p_external_id: externalId,
    p_title: title,
    p_employer_name: text(body.employerName, 300),
    p_location: text(body.location, 300),
    p_source_url: text(body.sourceUrl, 2000),
    p_source_payload: typeof body.sourcePayload === 'object' && body.sourcePayload !== null ? body.sourcePayload : {},
    p_observed_at: text(body.observedAt, 80) ?? new Date().toISOString(),
    p_content_hash: contentHash,
    p_run_key: text(body.runKey, 240),
  })

  if (error) {
    const disabled = error.message?.includes('EXTERNAL_INGESTION_DISABLED') || error.message?.includes('SOURCE_STORAGE_NOT_AUTHORIZED')
    console.info('harbourview_talent_ingestion_rejected', { sourceKey, code: error.code ?? 'unknown', disabled })
    return json(disabled ? 403 : 400, { error: disabled ? 'ingestion_not_authorized' : 'ingestion_failed' })
  }
  return json(200, { data })
})
