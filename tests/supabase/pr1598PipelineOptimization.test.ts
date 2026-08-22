import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const optimizationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260820130000_hv_pipeline_optimization.sql',
)
const resolvePath = path.join(
  process.cwd(),
  'supabase/migrations/20260820131000_hv_review_queue_resolve.sql',
)

function read(file: string): string {
  return fs.readFileSync(file, 'utf8')
}

describe('PR #1598 pipeline optimization migration contracts', () => {
  it('extends the August classifier dispatch without removing its hard controls', () => {
    const sql = read(optimizationPath)

    expect(sql).toContain("c_max_attempts constant int := 5")
    expect(sql).toContain('public.intel_classify_review_queue')
    expect(sql).toMatch(
      /public\.hv_consume_dispatch_budget\(\s*'classify'/i,
    )
    expect(sql).toMatch(
      /set search_path to 'pg_catalog', 'public', 'public', 'api', 'signals', 'regulatory_signals', 'auth', 'storage', 'vault', 'extensions', 'net', 'cron'/i,
    )
    expect(sql).toContain('public.hv_classify_prefilter_dispositions')
    expect(sql).toMatch(/c\.h,\s*c\.sm,/i)
  })

  it('does not replace the working HNSW KNN dedup or pending-embedding tick', () => {
    const sql = read(optimizationPath)

    expect(sql).not.toMatch(
      /create\s+or\s+replace\s+function\s+public\.hv_dedup_assign/i,
    )
    expect(sql).not.toMatch(
      /create\s+or\s+replace\s+function\s+public\.hv_pipeline_tick/i,
    )
    expect(sql).not.toMatch(
      /create\s+index\s+signals_embedding_1024_hnsw_idx/i,
    )
    expect(sql).toContain('No CREATE OR REPLACE follows for hv_dedup_assign')
  })

  it('keeps classifier_validation as the mechanical publication gate', () => {
    const sql = read(optimizationPath)

    expect(sql).toMatch(
      /from public\.classifier_validation cv[\s\S]*cv\.classifier_version = s\.classifier_version[\s\S]*cv\.gate_passed = true/i,
    )
    expect(sql).not.toContain('hv_eval_gate_ok')
    expect(sql).toMatch(
      /q\.status in \('pending', 'rejected', 'skipped'\)/i,
    )
  })

  it('locks a pending queue row before either approval or rejection mutates signals', () => {
    const sql = read(resolvePath)
    const approve = sql.slice(
      sql.indexOf('create or replace function public.hv_review_queue_approve'),
      sql.indexOf('create or replace function public.hv_review_queue_reject'),
    )
    const reject = sql.slice(
      sql.indexOf('create or replace function public.hv_review_queue_reject'),
      sql.indexOf('create or replace function public.hv_review_queue_list_pending'),
    )

    for (const body of [approve, reject]) {
      expect(body).toContain("q.status = 'pending'")
      expect(body).toContain('for update')
      expect(body.indexOf('for update')).toBeLessThan(
        body.indexOf('update public.signals'),
      )
      expect(body).toMatch(/if not found then\s+return false;/i)
    }
  })
})
