import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), 'utf8')

const paths = {
  jobRefresh: 'supabase/functions/job-refresh/index.ts',
  schemaDrift: 'supabase/functions/schema-drift-monitor/index.ts',
  sourcePull: 'supabase/functions/hv-source-pull-runner/index.ts',
  privatePipeline: 'supabase/functions/hv-private-pipeline-runner/index.ts',
  passport: 'supabase/functions/compute-passport-score/index.ts',
  snapshot: 'supabase/functions/generate-org-snapshot/index.ts',
  migration: 'supabase/migrations/20260810222500_harden_edge_function_cron_auth.sql',
}

describe('production Edge Function authentication hardening', () => {
  it('canonicalizes job-refresh without embedding provider credentials', () => {
    const source = read(paths.jobRefresh)
    expect(source).toContain("Deno.env.get('ADZUNA_APP_ID')")
    expect(source).toContain("Deno.env.get('ADZUNA_APP_KEY')")
    expect(source).toContain("Deno.env.get('JOB_REFRESH_CRON_SECRET')")
    expect(source).toContain("req.method !== 'POST'")
    expect(source).toContain("x-harbourview-cron-secret")
    expect(source).toContain("dry_run")
    expect(source).not.toMatch(/ADZUNA_APP_KEY\s*=\s*['\"][^'\"]+['\"]/)
    expect(source).not.toMatch(/ADZUNA_APP_ID\s*=\s*['\"][^'\"]+['\"]/)
  })

  it('requires a dedicated cron secret for the schema drift monitor', () => {
    const source = read(paths.schemaDrift)
    expect(source).toContain('SCHEMA_DRIFT_CRON_SECRET')
    expect(source).toContain('x-harbourview-cron-secret')
    expect(source).toContain('service_not_configured')
    expect(source).toContain('get_tables_missing_from_api_schema')
    expect(source).toContain('get_functions_missing_from_api_schema')
  })

  it('removes source-visible static caller strings as authentication for pipeline runners', () => {
    const sourcePull = read(paths.sourcePull)
    const privatePipeline = read(paths.privatePipeline)

    expect(sourcePull).toContain('HV_SOURCE_PULL_RUNNER_SECRET')
    expect(sourcePull).toContain('x-harbourview-cron-secret')
    expect(sourcePull).not.toContain('EXPECTED_CRON_CALLER')
    expect(sourcePull).not.toContain('pg_cron_hv_source_pull_runner')

    expect(privatePipeline).toContain('HV_PRIVATE_PIPELINE_RUNNER_SECRET')
    expect(privatePipeline).toContain('x-harbourview-cron-secret')
    expect(privatePipeline).not.toContain('const EXPECTED = "pg_cron_hv_private_pipeline_runner"')
  })

  it('rejects substring-based service_role authorization in passport functions', () => {
    for (const path of [paths.passport, paths.snapshot]) {
      const source = read(path)
      expect(source).not.toContain('includes("service_role")')
      expect(source).not.toContain("includes('service_role')")
      expect(source).toContain('authHeader === `Bearer ${SUPABASE_SERVICE_KEY}`')
      expect(source).toContain('callerSecret === EDGE_OPERATOR_SECRET')
    }
  })

  it('uses Vault-backed cron helpers without committing secret values', () => {
    const sql = read(paths.migration)
    for (const name of [
      'job_refresh_cron_secret',
      'schema_drift_cron_secret',
      'hv_source_pull_runner_secret',
    ]) {
      expect(sql).toContain(name)
    }
    expect(sql).toContain('vault.decrypted_secrets')
    expect(sql).toContain("select public.invoke_job_refresh();")
    expect(sql).toContain("select public.invoke_schema_drift_monitor();")
    expect(sql).toContain("select public.hv_trigger_source_pull_runner();")
    expect(sql).not.toMatch(/x-harbourview-cron-secret['\"]?\s*[,=:]\s*['\"][A-Za-z0-9_\-]{20,}/)
  })

  it('preserves critical downstream behavior while changing only inbound auth', () => {
    const sourcePull = read(paths.sourcePull)
    const privatePipeline = read(paths.privatePipeline)
    const passport = read(paths.passport)

    expect(sourcePull).toContain('/functions/v1/source-engine-fetch')
    expect(privatePipeline).toContain('callFunction("hv-extract"')
    expect(privatePipeline).toContain('callFunction("hv-score"')
    expect(passport).toContain('/functions/v1/generate-org-snapshot')
    expect(passport).toContain('passport.score.computed')
  })
})
