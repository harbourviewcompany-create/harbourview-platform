import { STARTER_REGULATORY_SOURCES } from '../lib/regulatory-sources/officialSources'

type SupabaseConfig = {
  url: string
  serviceRoleKey: string
}

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to seed regulatory sources.')
  }

  return { url, serviceRoleKey }
}

async function supabaseRequest<T>(config: SupabaseConfig, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${config.url}${path}`, {
    ...init,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Supabase ${response.status} for ${path}: ${text.slice(0, 400)}`)
  }

  return (text ? JSON.parse(text) : null) as T
}

async function upsertSource(config: SupabaseConfig, source: (typeof STARTER_REGULATORY_SOURCES)[number]) {
  const query = new URLSearchParams({
    select: 'id,source_name,base_url',
    source_name: `eq.${source.source_name}`,
    base_url: `eq.${source.base_url}`,
    limit: '1',
  })

  const existing = await supabaseRequest<{ id: string }[]>(
    config,
    `/rest/v1/regulatory_signals.sources?${query.toString()}`,
  )

  const payload = {
    ...source,
    crawl_allowed: false,
    is_active: true,
    watcher_enabled: true,
    watch_status: 'manual_review',
    internal_notes: 'Seeded by Harbourview Fresh Regulatory Sources Engine.',
  }

  if (existing[0]?.id) {
    await supabaseRequest(config, `/rest/v1/regulatory_signals.sources?id=eq.${existing[0].id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(payload),
    })
    return { action: 'updated' as const, source: source.source_name }
  }

  await supabaseRequest(config, '/rest/v1/regulatory_signals.sources', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(payload),
  })

  return { action: 'created' as const, source: source.source_name }
}

async function main() {
  const config = getSupabaseConfig()
  const results = []

  for (const source of STARTER_REGULATORY_SOURCES) {
    results.push(await upsertSource(config, source))
  }

  const created = results.filter((r) => r.action === 'created').length
  const updated = results.filter((r) => r.action === 'updated').length

  console.log(JSON.stringify({
    ok: true,
    seeded: results.length,
    created,
    updated,
    sources: results,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
