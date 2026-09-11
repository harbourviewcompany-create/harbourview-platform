#!/usr/bin/env node
/**
 * Safe country_intel + playbook coverage expansion
 *
 * POLICY (must not violate):
 * - Never synthesize evidence-bearing commercial_pathway_summary / regulatory tiers
 * - Only upsert identity rows (country_code, country_name, review_status)
 * - Draft playbooks only when live signal evidence exists; status='draft' never auto-published
 * - Thin rows are queued for human/research enrichment, not filled with placeholder prose
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/safe-country-intel-enrichment.mjs
 *   DRY_RUN=1 node scripts/safe-country-intel-enrichment.mjs   # no writes
 *
 * Outputs:
 *   - country_intel identity coverage for all ISO-3166 alpha-2
 *   - research queue JSON (thin / missing enrichment)
 *   - draft playbook stubs for countries with reviewed signals but no playbook
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'
const OUT_DIR = resolve(ROOT, 'scripts', 'country-data', 'out')

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** Minimal ISO-3166 alpha-2 list (bundled fallback if network unavailable). */
function loadIsoCountries() {
  const candidates = [
    resolve(ROOT, 'scripts/country-data/iso3166-slim2.json'),
    resolve(ROOT, 'data/iso3166-slim2.json'),
    '/home/workdir/artifacts/iso3166-slim2.json',
  ]
  for (const p of candidates) {
    try {
      const raw = JSON.parse(readFileSync(p, 'utf8'))
      if (Array.isArray(raw) && raw.length > 100) {
        return raw
          .filter((r) => r['alpha-2'] && r.name)
          .map((r) => ({
            code: String(r['alpha-2']).toUpperCase(),
            name: r.name,
          }))
      }
    } catch {
      /* try next */
    }
  }
  throw new Error('iso3166-slim2.json not found — place under scripts/country-data/')
}

function isThinSummary(text) {
  if (!text || typeof text !== 'string') return true
  const t = text.trim()
  if (t.length < 80) return true
  const generics = [
    'baseline data available',
    'enrich via intelligence',
    'research ongoing',
    'no summary',
    'to be researched',
  ]
  const lower = t.toLowerCase()
  return generics.some((g) => lower.includes(g))
}

async function fetchAll(table, columns, filters = {}) {
  const pageSize = 1000
  let from = 0
  const rows = []
  for (;;) {
    let q = supabase.from(table).select(columns).range(from, from + pageSize - 1)
    for (const [k, v] of Object.entries(filters)) {
      if (v?.eq != null) q = q.eq(k, v.eq)
      if (v?.neq != null) q = q.neq(k, v.neq)
    }
    const { data, error } = await q
    if (error) throw new Error(`${table}: ${error.message}`)
    if (!data?.length) break
    rows.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return rows
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const iso = loadIsoCountries()
  console.log(`ISO countries loaded: ${iso.length}`)
  console.log(DRY_RUN ? 'DRY_RUN=1 — no writes' : 'LIVE write mode')

  const existingIntel = await fetchAll(
    'country_intel',
    'country_code,country_name,commercial_pathway_summary,public_summary,review_status,regulatory_tier,last_reviewed_at,last_enriched_at',
  )
  const byCode = new Map(existingIntel.map((r) => [String(r.country_code).toUpperCase(), r]))
  console.log(`Existing country_intel rows: ${existingIntel.length}`)

  const missingIdentity = iso.filter((c) => !byCode.has(c.code))
  const identityPayload = missingIdentity.map((c) => ({
    country_code: c.code,
    country_name: c.name,
    review_status: 'active',
  }))

  console.log(`Missing identity rows to upsert: ${identityPayload.length}`)
  if (!DRY_RUN && identityPayload.length) {
    const chunk = 100
    for (let i = 0; i < identityPayload.length; i += chunk) {
      const slice = identityPayload.slice(i, i + chunk)
      const { error } = await supabase
        .from('country_intel')
        .upsert(slice, { onConflict: 'country_code', ignoreDuplicates: false })
      if (error) throw new Error(`country_intel upsert: ${error.message}`)
    }
    console.log(`Upserted ${identityPayload.length} identity rows`)
  }

  const refreshed = DRY_RUN
    ? existingIntel
    : await fetchAll(
        'country_intel',
        'country_code,country_name,commercial_pathway_summary,public_summary,review_status,regulatory_tier,last_reviewed_at,last_enriched_at',
      )

  const researchQueue = refreshed
    .filter(
      (r) =>
        isThinSummary(r.commercial_pathway_summary) ||
        isThinSummary(r.public_summary),
    )
    .map((r) => ({
      country_code: r.country_code,
      country_name: r.country_name,
      regulatory_tier: r.regulatory_tier,
      thin_commercial: isThinSummary(r.commercial_pathway_summary),
      thin_public: isThinSummary(r.public_summary),
      last_reviewed_at: r.last_reviewed_at,
      last_enriched_at: r.last_enriched_at,
      priority: ['CA', 'US', 'DE', 'GB', 'AU', 'IL', 'PT', 'NL', 'ES', 'FR', 'IT', 'PL', 'TH', 'CO', 'MX', 'BR', 'UY', 'NZ', 'JP', 'KR'].includes(
        String(r.country_code).toUpperCase(),
      )
        ? 'P0'
        : 'P1',
    }))
    .sort((a, b) => (a.priority === b.priority ? a.country_code.localeCompare(b.country_code) : a.priority.localeCompare(b.priority)))

  writeFileSync(
    resolve(OUT_DIR, 'country-intel-research-queue.json'),
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        total_intel_rows: refreshed.length,
        thin_count: researchQueue.length,
        policy: 'Do not auto-fill summaries. Research-backed enrichment only.',
        queue: researchQueue,
      },
      null,
      2,
    ),
  )
  console.log(`Research queue written: ${researchQueue.length} thin rows`)

  const playbooks = await fetchAll('jurisdiction_playbooks', 'country_iso2,status,country_name')
  const playbookCodes = new Set(playbooks.map((p) => String(p.country_iso2).toUpperCase()))
  console.log(`Existing playbooks: ${playbooks.length} (${playbooks.filter((p) => p.status === 'published').length} published)`)

  let signalCountries = []
  try {
    const { data, error } = await supabase
      .from('signals')
      .select('country')
      .eq('reviewed', true)
      .not('country', 'is', null)
      .limit(5000)
    if (error) throw error
    const counts = new Map()
    for (const row of data || []) {
      const c = String(row.country || '').trim()
      if (!c) continue
      const code = c.length === 2 ? c.toUpperCase() : null
      if (code) counts.set(code, (counts.get(code) || 0) + 1)
    }
    signalCountries = [...counts.entries()]
      .filter(([, n]) => n >= 1)
      .map(([code, n]) => ({ code, signal_count: n }))
  } catch (e) {
    console.warn('Could not scan signals for draft playbook candidates:', e.message)
  }

  const nameByCode = new Map(iso.map((c) => [c.code, c.name]))
  for (const r of refreshed) {
    nameByCode.set(String(r.country_code).toUpperCase(), r.country_name)
  }

  const draftCandidates = signalCountries
    .filter((s) => !playbookCodes.has(s.code) && nameByCode.has(s.code))
    .map((s) => ({
      country_iso2: s.code,
      country_name: nameByCode.get(s.code),
      difficulty: 'moderate',
      legal_framework_summary: null,
      steps: [],
      key_regulators: [],
      common_pitfalls: [],
      status: 'draft',
      _signal_count: s.signal_count,
    }))

  console.log(`Draft playbook candidates (signals, no playbook): ${draftCandidates.length}`)

  if (!DRY_RUN && draftCandidates.length) {
    const payload = draftCandidates.map(({ _signal_count, ...row }) => row)
    const chunk = 50
    for (let i = 0; i < payload.length; i += chunk) {
      const slice = payload.slice(i, i + chunk)
      const { error } = await supabase
        .from('jurisdiction_playbooks')
        .upsert(slice, { onConflict: 'country_iso2', ignoreDuplicates: true })
      if (error) {
        console.warn(`playbook upsert chunk warning: ${error.message}`)
      }
    }
    console.log(`Attempted draft upsert for ${payload.length} playbooks (status=draft only)`)
  }

  writeFileSync(
    resolve(OUT_DIR, 'playbook-draft-candidates.json'),
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        policy: 'status=draft only; legal_framework_summary left null until researched',
        candidates: draftCandidates,
      },
      null,
      2,
    ),
  )

  const summary = {
    generated_at: new Date().toISOString(),
    dry_run: DRY_RUN,
    iso_countries: iso.length,
    country_intel_before: existingIntel.length,
    identity_upserts: identityPayload.length,
    thin_research_queue: researchQueue.length,
    playbooks_existing: playbooks.length,
    playbook_draft_candidates: draftCandidates.length,
    next_human_steps: [
      'Review scripts/country-data/out/country-intel-research-queue.json P0 markets first',
      'Research-backed commercial_pathway_summary updates only — no LLM hallucination without sources',
      'Promote draft playbooks to published only after legal_framework_summary + steps reviewed',
      'Re-run corridor-coverage API after publish wave',
    ],
  }
  writeFileSync(resolve(OUT_DIR, 'enrichment-run-summary.json'), JSON.stringify(summary, null, 2))
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
