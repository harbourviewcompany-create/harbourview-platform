import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isOperatorOrServiceRoleAuthorized, matchesRequiredSecret } from '../../supabase/functions/_shared/harbourview-auth'

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const migration = (version: string) => {
  const file = readdirSync(join(root, 'supabase/migrations')).find((name) => name.startsWith(version + '_') && name.endsWith('.sql'))
  if (!file) throw new Error(`canonical migration ${version} is missing`)
  return read(join('supabase/migrations', file))
}
const paths = {
  sharedAuth: 'supabase/functions/_shared/harbourview-auth.ts',
  jobRefresh: 'supabase/functions/job-refresh/index.ts',
  schemaDrift: 'supabase/functions/schema-drift-monitor/index.ts',
  sourcePull: 'supabase/functions/hv-source-pull-runner/index.ts',
  privatePipeline: 'supabase/functions/hv-private-pipeline-runner/index.ts',
  passport: 'supabase/functions/compute-passport-score/index.ts',
  snapshot: 'supabase/functions/generate-org-snapshot/index.ts',
}

describe('production Edge Function authentication hardening', () => {
  it('fails closed for missing/wrong cron secrets and accepts only an exact match', () => {
    expect(matchesRequiredSecret('', '')).toBe(false)
    expect(matchesRequiredSecret(undefined, 'anything')).toBe(false)
    expect(matchesRequiredSecret('expected-secret', undefined)).toBe(false)
    expect(matchesRequiredSecret('expected-secret', 'wrong-secret')).toBe(false)
    expect(matchesRequiredSecret('expected-secret', 'expected-secret')).toBe(true)
  })
  it('accepts valid operator/service credentials and rejects fake service_role bearer strings', () => {
    const operatorKey = 'operatorSecret' as const, serviceKey = 'serviceRoleKey' as const, callerKey = 'callerSecret' as const
    const base = {[operatorKey]:'operator-secret-value',[serviceKey]:'service-role-key-value'}
    expect(isOperatorOrServiceRoleAuthorized({...base,[callerKey]:'operator-secret-value',authorization:null})).toBe(true)
    expect(isOperatorOrServiceRoleAuthorized({...base,[callerKey]:null,authorization:'Bearer service-role-key-value'})).toBe(true)
    expect(isOperatorOrServiceRoleAuthorized({...base,[callerKey]:'wrong-secret',authorization:'Bearer service_role'})).toBe(false)
    expect(isOperatorOrServiceRoleAuthorized({...base,[callerKey]:null,authorization:'Bearer attacker-service_role-token'})).toBe(false)
    expect(isOperatorOrServiceRoleAuthorized({[operatorKey]:'',[serviceKey]:'',[callerKey]:'',authorization:'Bearer '})).toBe(false)
  })
  it('canonicalizes job-refresh without embedding provider credentials', () => {
    const source=read(paths.jobRefresh)
    expect(source).toContain("Deno.env.get('ADZUNA_APP_ID')")
    expect(source).toContain("Deno.env.get('ADZUNA_APP_KEY')")
    expect(source).toContain("Deno.env.get('JOB_REFRESH_CRON_SECRET')")
    expect(source).toContain("req.method !== 'POST'")
    expect(source).toContain('matchesRequiredSecret')
    expect(source).toContain('x-harbourview-cron-secret')
    expect(source).toContain('dry_run')
    expect(source).not.toMatch(/ADZUNA_APP_KEY\s*=\s*['"][^'"]+['"]/)
    expect(source).not.toMatch(/ADZUNA_APP_ID\s*=\s*['"][^'"]+['"]/)
  })
  it('requires a dedicated cron secret for the schema drift monitor', () => {
    const source=read(paths.schemaDrift)
    expect(source).toContain('SCHEMA_DRIFT_CRON_SECRET')
    expect(source).toContain('matchesRequiredSecret')
    expect(source).toContain('x-harbourview-cron-secret')
    expect(source).toContain('service_not_configured')
    expect(source).toContain('get_tables_missing_from_api_schema')
    expect(source).toContain('get_functions_missing_from_api_schema')
  })
  it('grants schema drift RPC execution only to service_role through both PostgREST layers', () => {
    const sql=read('supabase/migrations/20260815013000_lock_down_api_schema_drift_rpcs.sql').toLowerCase()
    for (const fn of ['get_tables_missing_from_api_schema','get_functions_missing_from_api_schema']) for (const schema of ['api','public']) {
      expect(sql).toContain(`revoke execute on function ${schema}.${fn}() from public, anon, authenticated;`)
      expect(sql).toContain(`grant execute on function ${schema}.${fn}() to service_role;`)
      expect(sql).not.toMatch(new RegExp(`grant\\s+execute\\s+on\\s+function\\s+${schema}\\.${fn}\\(\\)\\s+to\\s+(?:public|anon|authenticated)\\b`))
    }
    expect(sql).toContain('grant usage on schema api to service_role;')
  })
  it('removes source-visible static caller strings as authentication for pipeline runners', () => {
    const sourcePull=read(paths.sourcePull), privatePipeline=read(paths.privatePipeline)
    expect(sourcePull).toContain('HV_SOURCE_PULL_RUNNER_SECRET')
    expect(sourcePull).toContain('matchesRequiredSecret')
    expect(sourcePull).toContain('x-harbourview-cron-secret')
    expect(sourcePull).not.toContain('EXPECTED_CRON_CALLER')
    expect(sourcePull).not.toContain('pg_cron_hv_source_pull_runner')
    expect(privatePipeline).toContain('HV_PRIVATE_PIPELINE_RUNNER_SECRET')
    expect(privatePipeline).toContain('matchesRequiredSecret')
    expect(privatePipeline).toContain('x-harbourview-cron-secret')
  })
  it('uses the tested exact auth helper in both passport functions', () => {
    const passport=read(paths.passport), snapshot=read(paths.snapshot)
    for (const source of [passport,snapshot]) { expect(source).not.toContain('includes("service_role")'); expect(source).not.toContain("includes('service_role')"); expect(source).toContain('isOperatorOrServiceRoleAuthorized') }
  })
  it('uses Vault-backed cron helpers without committing secret values', () => {
    const sql=migration('20260912103836')
    for (const name of ['job_refresh_cron_secret','schema_drift_cron_secret','hv_source_pull_runner_secret']) expect(sql).toContain(name)
    expect(sql).toContain('vault.decrypted_secrets')
    expect(sql).toContain("select public.invoke_job_refresh();")
    expect(sql).toContain("select public.invoke_schema_drift_monitor();")
    expect(sql).toContain("select public.hv_trigger_source_pull_runner();")
    expect(sql).not.toMatch(/x-harbourview-cron-secret['"]?\s*[,=:]\s*['"][A-Za-z0-9_\-]{20,}/)
  })
  it('preserves critical downstream behavior while changing only inbound auth', () => {
    expect(read(paths.sourcePull)).toContain('/functions/v1/source-engine-fetch')
    expect(read(paths.privatePipeline)).toContain('callFunction("hv-extract"')
    expect(read(paths.privatePipeline)).toContain('callFunction("hv-score"')
    expect(read(paths.passport)).toContain('/functions/v1/generate-org-snapshot')
    expect(read(paths.passport)).toContain('passport.score.computed')
  })
})
