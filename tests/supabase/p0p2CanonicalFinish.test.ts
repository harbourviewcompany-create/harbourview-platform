import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const finishPath = path.join(
  process.cwd(),
  'supabase/migrations/20260821100000_p0_p2_canonical_finish.sql',
)
const repaired1598Path = path.join(
  process.cwd(),
  'supabase/migrations/20260820130000_hv_pipeline_optimization.sql',
)
const unsafe1606Path = path.join(
  process.cwd(),
  'supabase/migrations/20260820180000_p0_p2_pipeline_optimization.sql',
)

const read = (file: string) => fs.readFileSync(file, 'utf8')

describe('P0-P2 canonical finish contracts', () => {
  it('removes the unsafe PR1606 migration from canonical history', () => {
    expect(fs.existsSync(unsafe1606Path)).toBe(false)
  })

  it('preserves the repaired PR1598 classifier controls and translated pre-filter', () => {
    const sql = read(repaired1598Path)
    expect(sql).toContain('c_max_attempts constant int := 5')
    expect(sql).toContain('public.intel_classify_review_queue')
    expect(sql).toContain("hv-prefilter/v1-translated")
    expect(sql).toContain('translated_text_used')
    expect(sql).toMatch(/hv_consume_dispatch_budget\(\s*'classify'/i)
    expect(sql).toContain("'eligible_untranslated_non_english'")
    expect(sql).toContain("'filtered_low_relevance'")
  })

  it('implements an atomic measured 8000-unit global ceiling', () => {
    const sql = read(finishPath)
    expect(sql).toContain('hard_cap integer not null default 8000')
    expect(sql).toContain('for update;')
    expect(sql).toMatch(/v_allowed := least\([\s\S]*v_requested[\s\S]*v_stage_ceiling - v_stage_used[\s\S]*v_global_cap - v_global_used/i)
    expect(sql).toMatch(/set calls_used = calls_used \+ v_allowed/i)
    expect(sql).toMatch(/set dispatch_units = dispatch_units \+ v_allowed/i)
    expect(sql).not.toContain('hv_pipeline_budget_consume(30)')
    expect(sql).not.toContain('hv_pipeline_budget_consume(80)')
  })

  it('makes 0.80 a hard promotion floor without bypassing classifier_validation', () => {
    const sql = read(finishPath)
    expect(sql).toContain('p_min_conf numeric default 0.80')
    expect(sql).toContain('greatest(0.80, least(coalesce(p_min_conf, 0.80), 0.99))')
    expect(sql).toContain('s.quality_confidence >= 0.65')
    expect(sql).toMatch(/classifier_validation cv[\s\S]*cv\.gate_passed = true/i)
    expect(sql).toMatch(/q\.status in \('pending', 'rejected', 'skipped'\)/i)
  })

  it('force-enables RLS on every new internal table and keeps preservation boundaries', () => {
    const sql = read(finishPath)
    for (const table of [
      'hv_signal_review_queue',
      'hv_classify_prefilter_dispositions',
      'hv_pipeline_stage_log',
      'hv_pipeline_cost_budget',
    ]) {
      expect(sql).toContain(`alter table public.${table} force row level security`)
    }
    expect(sql).not.toMatch(/create\s+or\s+replace\s+function\s+public\.hv_dedup_assign/i)
    expect(sql).not.toMatch(/create\s+or\s+replace\s+function\s+public\.hv_pipeline_tick/i)
    expect(sql).not.toMatch(/create\s+index/i)
  })
})
