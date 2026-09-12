#!/usr/bin/env node

/**
 * Identity-only country_intel coverage expansion.
 *
 * Safety contract:
 * - reads ISO identity from data/globe/geography-registry.ts
 * - writes only country_code, country_name and review_status
 * - never assigns regulatory tiers, hemp status, pathway summaries or scores
 * - emits unresolved rows to a research queue instead of inventing values
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'
const OUT_DIR = resolve(ROOT, 'scripts/country-data/out')
const REGISTRY_PATH = resolve(ROOT, 'data/globe/geography-registry.ts')

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

function loadRegistry() {
  const source = readFileSync(REGISTRY_PATH, 'utf8')
  const match = source.match(/const ISO_3166_PAIRS = '([^']+)'/)
  if (!match) throw new Error('ISO_3166_PAIRS registry constant not found')

  const pairs = match[1].split('|').map((pair) => {
    const [code, alpha3] = pair.split(',')
    return { code, alpha3 }
  })
  if (pairs.length !== 249) throw new Error(`Expected 249 ISO-3166-1 pairs, found ${pairs.length}`)
  if (new Set(pairs.map((row) => row.code)).size !== 249) throw new Error('Duplicate ISO alpha-2 code')
  if (new Set(pairs.map((row) => row.alpha3)).size !== 249) throw new Error('Duplicate ISO alpha-3 code')
  return pairs
}

async function fetchAll(supabase, columns) {
  const pageSize = 1000
  const rows = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from('country_intel').select(columns).range(from, from + pageSize - 1)
    if (error) throw new Error(`country_intel read failed: ${error.message}`)
    if (!data?.length) break
    rows.push(...data)
    if (data.length < pageSize) break
  }
  return rows
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const registry = loadRegistry()
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const existing = await fetchAll(supabase, 'country_code,country_name,commercial_pathway_summary,public_summary,review_status,regulatory_tier,last_reviewed_at,last_enriched_at')
  const byCode = new Map(existing.map((row) => [String(row.country_code).toUpperCase(), row]))
  const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })

  const identityRows = registry.map(({ code }) => ({
    country_code: code,
    country_name: displayNames.of(code) ?? code,
    review_status: byCode.get(code)?.review_status ?? 'active',
  }))
  const missingIdentity = identityRows.filter((row) => !byCode.has(row.country_code))

  if (!DRY_RUN && missingIdentity.length) {
    for (let i = 0; i < missingIdentity.length; i += 100) {
      const { error } = await supabase.from('country_intel').upsert(missingIdentity.slice(i, i + 100), {
        onConflict: 'country_code',
        ignoreDuplicates: false,
      })
      if (error) throw new Error(`country_intel identity upsert failed: ${error.message}`)
    }
  }

  const researchQueue = existing
    .filter((row) => !row.commercial_pathway_summary && !row.public_summary)
    .map((row) => ({
      country_code: String(row.country_code).toUpperCase(),
      country_name: row.country_name,
      reason: 'No reviewed public/commercial summary; primary-source research required',
      action: 'research_before_publication',
    }))
    .sort((a, b) => a.country_code.localeCompare(b.country_code))

  writeFileSync(
    resolve(OUT_DIR, 'country-intel-research-queue.json'),
    JSON.stringify({
      generated_at: new Date().toISOString(),
      dry_run: DRY_RUN,
      registry_count: registry.length,
      existing_rows: existing.length,
      identity_upserts: missingIdentity.length,
      queue_count: researchQueue.length,
      policy: 'No regulatory classification or summary is synthesized by this tool.',
      queue: researchQueue,
    }, null, 2),
  )

  console.log(JSON.stringify({
    dryRun: DRY_RUN,
    registryCount: registry.length,
    existingRows: existing.length,
    identityUpserts: missingIdentity.length,
    researchQueue: researchQueue.length,
    writes: DRY_RUN ? 0 : missingIdentity.length,
    verdict: 'IDENTITY_ONLY',
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
