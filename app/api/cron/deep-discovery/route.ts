// app/api/cron/deep-discovery/route.ts
// Vercel Cron — runs every Sunday at 01:00 UTC.
//
// Walks source_registry for ISO codes that have no recent ia_graph_entities
// entries (last_activity older than 30 days or no entry at all), then uses
// EntityResolver (Claude Haiku) to identify the real-world regulatory bodies
// for each SOURCE_TAXONOMY role in that jurisdiction, upserting results into
// ia_graph_entities so the entity graph stays current.
//
// Capped at MAX_JURISDICTIONS per run to fit within the 300s budget.
// At ~18 taxonomy roles × 1–2 s per Haiku call × 3 jurisdictions ≈ 54–108 s.
//
// Required env vars:
//   CRON_SECRET          — shared bearer token
//   ANTHROPIC_API_KEY    — Claude Haiku for entity resolution
//   NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { EntityResolver } from '@/lib/intelligence-engine/deep-discovery/entity-resolver'

export const dynamic    = 'force-dynamic'
export const maxDuration = 300

const MAX_JURISDICTIONS = 3
const STALE_DAYS        = 30

const ISO_TO_NAME: Record<string, string> = {
  US: 'United States', CA: 'Canada', DE: 'Germany', AU: 'Australia', GB: 'United Kingdom',
  NL: 'Netherlands', PT: 'Portugal', IL: 'Israel', CO: 'Colombia', BR: 'Brazil',
  MX: 'Mexico', CH: 'Switzerland', AT: 'Austria', CZ: 'Czech Republic', DK: 'Denmark',
  SE: 'Sweden', NO: 'Norway', PL: 'Poland', ZA: 'South Africa', TH: 'Thailand',
  MT: 'Malta', IT: 'Italy', FR: 'France', ES: 'Spain', NZ: 'New Zealand',
  JM: 'Jamaica', UY: 'Uruguay', AR: 'Argentina', CL: 'Chile', PE: 'Peru',
  EC: 'Ecuador', NG: 'Nigeria', KE: 'Kenya', GH: 'Ghana', MA: 'Morocco',
  LS: 'Lesotho', SZ: 'Eswatini', LB: 'Lebanon', TR: 'Turkey', IN: 'India',
  SG: 'Singapore', JP: 'Japan', KR: 'South Korea', PH: 'Philippines', MY: 'Malaysia',
  ZW: 'Zimbabwe', LU: 'Luxembourg', GR: 'Greece', AE: 'United Arab Emirates',
  JO: 'Jordan', EG: 'Egypt', TZ: 'Tanzania', PY: 'Paraguay', HK: 'Hong Kong',
  TW: 'Taiwan',
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret)
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  if (authHeader !== `Bearer ${cronSecret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('deep_discovery_cron: ANTHROPIC_API_KEY not set — skipping')
    return NextResponse.json({ ok: false, reason: 'ANTHROPIC_API_KEY not configured' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } },
  )

  // ── Find ISOs eligible for (re)discovery ─────────────────────────────────────
  // Pull every active ISO from source_registry
  const { data: registryRows } = await supabase
    .from('source_registry')
    .select('iso')
    .eq('is_active', true)
    .not('iso', 'is', null)

  const allIsos = [...new Set(
    ((registryRows ?? []) as Array<{ iso: string }>)
      .map(r => r.iso)
      .filter(Boolean)
  )]

  // Pull ISOs with recent ia_graph_entities (last_activity > 30d ago)
  const since30d = new Date(Date.now() - STALE_DAYS * 86_400_000).toISOString().slice(0, 10)
  const { data: recentEntities } = await supabase
    .from('ia_graph_entities')
    .select('market')
    .gte('last_activity', since30d)

  const recentIsoNames = new Set(
    ((recentEntities ?? []) as Array<{ market: string }>).map(r => r.market)
  )

  // Eligible = ISOs whose country name has no recent ia_graph_entities row
  const eligible = allIsos.filter(iso => {
    const name = ISO_TO_NAME[iso]
    return name && !recentIsoNames.has(name)
  })

  const targets = eligible.slice(0, MAX_JURISDICTIONS)

  if (targets.length === 0) {
    console.info('deep_discovery_cron: all active jurisdictions are fresh — nothing to do')
    return NextResponse.json({ ok: true, jurisdictions_processed: 0, entities_upserted: 0 })
  }

  const resolver = new EntityResolver()
  let entitiesUpserted = 0
  let jurisdictionsProcessed = 0

  for (const iso of targets) {
    const country = ISO_TO_NAME[iso]
    if (!country) continue

    console.info(`deep_discovery_cron: resolving ${country} (${iso})`)
    const entities = await resolver.resolveTaxonomyForCountry(country, iso)

    if (!entities.length) continue

    const today = new Date().toISOString().slice(0, 10)

    for (const entity of entities) {
      if (!entity.primary_url) continue // skip entities with no actionable URL

      const entityId = `${iso}-${entity.category}-${entity.role}`
        .toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 200)

      const { error } = await supabase
        .from('ia_graph_entities')
        .upsert(
          {
            id:               entityId,
            type:             'regulator',
            label:            entity.official_name_english,
            market:           country,
            category:         entity.category,
            connection_count: 0,
            signal_count:     0,
            last_activity:    today,
          },
          { onConflict: 'id' },
        )

      if (error) {
        console.error(`deep_discovery_cron: upsert failed for ${entityId}:`, error.message)
      } else {
        entitiesUpserted++
      }
    }

    // Also auto-seed source_registry with discovered URLs that aren't already tracked
    for (const entity of entities) {
      if (!entity.primary_url) continue

      const { error: regErr } = await supabase
        .from('source_registry')
        .insert({
          source_name:    entity.official_name_english,
          source_url:     entity.primary_url,
          iso,
          adapter:        'html_snapshot',
          tier:           1,
          is_active:      false, // require manual activation before crawling
          crawl_allowed:  false,
          crawl_cadence:  168,
          network_status: 'unknown',
          notes:          entity.category,
        })
        .select('id')
        .limit(1)

      if (regErr && !regErr.message.includes('unique')) {
        console.error(`deep_discovery_cron: source_registry seed failed for ${entity.primary_url}:`, regErr.message)
      }
    }

    jurisdictionsProcessed++
  }

  const summary = {
    ok: true,
    jurisdictions_processed: jurisdictionsProcessed,
    entities_upserted:       entitiesUpserted,
    eligible_total:          eligible.length,
  }
  console.info('deep_discovery_cron: run complete', summary)
  return NextResponse.json(summary)
}
