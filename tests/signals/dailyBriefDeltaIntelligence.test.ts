import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260815204500_daily_brief_delta_intelligence.sql'),
  'utf8',
)
const historyBackfill = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260815213000_daily_brief_delta_history_backfill.sql'),
  'utf8',
)
const dedupMigration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260815190715_daily_brief_event_dedup_hardening.sql'),
  'utf8',
)
const publicDto = readFileSync(
  resolve(process.cwd(), 'lib/harbourview/dto/public.ts'),
  'utf8',
)
const dailyPage = readFileSync(resolve(process.cwd(), 'app/daily/page.tsx'), 'utf8')
const commandDto = readFileSync(resolve(process.cwd(), 'lib/dashboard/dashboardShared.ts'), 'utf8')
const commandApi = readFileSync(resolve(process.cwd(), 'app/api/dashboard/digest/route.ts'), 'utf8')
const commandPage = readFileSync(resolve(process.cwd(), 'components/dashboard/pages/DigestPage.tsx'), 'utf8')

describe('Daily Brief cross-edition delta intelligence', () => {
  it('keeps the merged representative/canonical event-dedup layer in front of the writer', () => {
    expect(dedupMigration).toContain('public.signal_digest_canonical_links')
    expect(dedupMigration).toContain('coalesce(s.is_representative, true) is true')
    expect(migration).toContain('from public.signals_for_digest d')
    expect(migration).toContain("where d.source_table = 'signals'")
    expect(migration).toContain('left join public.signal_digest_canonical_links l')
  })

  it('classifies every candidate and makes unchanged repeats ineligible', () => {
    expect(migration).toContain('You MUST classify EVERY candidate')
    expect(migration).toContain("'unchanged_duplicate'")
    expect(migration).toContain("c.delta_status in ('new_event','material_advancement')")
    expect(migration).toContain("where c.include_in_edition is true")
    expect(migration).toContain("delta_status='unchanged_duplicate'")
  })

  it('persists material-advancement lineage and the exact advancement reason', () => {
    expect(migration).toContain('create table if not exists public.digest_event_lineage')
    expect(migration).toContain('prior_event_key text null')
    expect(migration).toContain('latest_advancement_reason text null')
    expect(migration).toContain("nullif(c.item->>'advancement_reason','')")
    expect(migration).toContain("coalesce((select root_event_key from public.digest_event_lineage where event_key = p.prior_event_key)")
  })

  it('allows only one presentation record for one event in an edition', () => {
    expect(migration).toContain('constraint digest_presentation_history_one_event_per_edition unique (digest_date, event_key)')
    expect(migration).toContain('row_number() over (partition by c.event_key')
    expect(migration).toContain('select * from ranked where event_rn = 1')
    expect(migration).toContain('on conflict (digest_date, event_key) do nothing')
  })

  it('seeds source-backed pre-delta editions into canonical event memory', () => {
    expect(historyBackfill).toContain("where d.status = 'published'")
    expect(historyBackfill).toContain("nullif(h.item->>'signal_id', '') is not null")
    expect(historyBackfill).toContain("join public.signals s on s.id = l.item->>'signal_id'")
    expect(historyBackfill).toContain('coalesce(link.canonical_signal_id, s.cluster_rep_id, s.id) as event_key')
    expect(historyBackfill).toContain('insert into public.digest_presentation_history')
    expect(historyBackfill).toContain('insert into public.digest_event_lineage')
    expect(historyBackfill).toContain('on conflict (digest_date, event_key) do nothing')
  })

  it('does not invent lineage for legacy cards without a source-backed signal', () => {
    expect(historyBackfill).toContain('Only historical cards with a valid signal_id are seeded')
    expect(historyBackfill).not.toContain("coalesce(nullif(h.item->>'signal_id', ''),")
  })

  it('preserves source evidence instead of deleting or rewriting source signals', () => {
    expect(migration).not.toMatch(/delete\s+from\s+public\.signals/i)
    expect(migration).not.toMatch(/update\s+public\.signals\s+set\s+(headline|summary|source|cluster_rep_id|is_representative)/i)
    expect(historyBackfill).not.toMatch(/delete\s+from\s+public\.signals/i)
    expect(historyBackfill).not.toMatch(/update\s+public\.signals/i)
    expect(migration).toContain('update public.signals s set used_in_digest_at = now()')
    expect(migration).toContain('where s.id in (select signal_id from presentation_write)')
  })

  it('keeps candidate assessment and presentation history private', () => {
    for (const table of [
      'digest_event_lineage',
      'digest_candidate_assessments',
      'digest_presentation_history',
    ]) {
      expect(migration).toContain(`alter table public.${table} enable row level security;`)
      expect(migration).toContain(`revoke all on table public.${table} from anon, authenticated;`)
      expect(migration).toContain(`grant all on table public.${table} to service_role;`)
    }
  })

  it('records the priority domains, fact/inference split and major-operator position flag', () => {
    expect(migration).toContain("'import_export_eu_gmp'")
    expect(migration).toContain("'pharmaceutical_cannabinoid_technology'")
    expect(migration).toContain("'verified_facts'")
    expect(migration).toContain("'inferences'")
    expect(migration).toContain("'competitive_position_change'")
    expect(migration).toContain("'competitive_position_detail'")
  })

  it('exposes only the structured public-safe delta metadata and renders competitive shifts explicitly', () => {
    expect(publicDto).toContain('competitive_position_change: boolean;')
    expect(publicDto).toContain('verified_facts: string[];')
    expect(publicDto).toContain('inferences: string[];')
    expect(dailyPage).toContain('Competitive position changed')
    expect(dailyPage).toContain('Competitive-position change:')
    expect(dailyPage).toContain('Verified facts')
    expect(dailyPage).toContain('Inference')
  })

  it('carries the same safe delta contract through authenticated Command', () => {
    expect(commandDto).toContain('deltaStatus?: DigestDeltaStatus | null')
    expect(commandDto).toContain('competitivePositionChange?: boolean')
    expect(commandApi).toContain('normalizeDigestDeltaMetadata(h)')
    expect(commandApi).toContain('competitivePositionDetail: delta.competitivePositionDetail')
    expect(commandPage).toContain('Material advancement')
    expect(commandPage).toContain('Competitive position changed')
    expect(commandPage).toContain('Competitive-position change:')
  })
})
