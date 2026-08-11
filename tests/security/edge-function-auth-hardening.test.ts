import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  isOperatorOrServiceRoleAuthorized,
  matchesRequiredSecret,
} from '../../supabase/functions/_shared/harbourview-auth'

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), 'utf8')

const paths = {
  sharedAuth: 'supabase/functions/_shared/harbourview-auth.ts',
  jobRefresh: 'supabase/functions/job-refresh/index.ts',
  schemaDrift: 'supabase/functions/schema-drift-monitor/index.ts',
  sourcePull: 'supabase/functions/hv-source-pull-runner/index.ts',
  privatePipeline: 'supabase/functions/hv-private-pipeline-runner/index.ts',
  passport: 'supabase/functions/compute-passport-score/index.ts',
  snapshot: 'supabase/functions/generate-org-snapshot/index.ts',
  migration: 'supabase/migrations/20260810222500_harden_edge_function_cron_auth.sql',
}

// This repository does not currently provide a local migrated-Supabase/pgTAP
// harness (no supabase start/db reset/test path in package scripts or CI). ACL
// regression is therefore enforced as a fail-closed migration contract here and
// complemented by read-only live ACL verification before production release.

describe('production Edge Function authentication hardening', () => {
  it('fails closed for missing/wrong cron secrets and accepts only an exact match', () => {
    expect(matchesRequiredSecret('', '')).toBe(false)
    expect(matchesRequiredSecret(undefined, 'anything')).toBe(false)
    expect(matchesRequiredSecret('expected-secret', undefined)).toBe(false)
    expect(matchesRequiredSecret('expected-secret', 'wrong-secret')).toBe(false)
    expect(matchesRequiredSecret('expected-secret', 'expected-secret')).toBe(true)
  })

  it('accepts valid operator/service credentials and rejects fake service_role bearer strings', () => {
    const base = {
      operatorSecret: 'operator-secret-value',
      serviceRoleKey: 'service-role-key-value',
    }

    expect(isOperatorOrServiceRoleAuthorized({
      ...base,
      callerSecret: 'operator-secret-value',
      authorization: null,
    })).toBe(true)

    expect(isOperatorOrServiceRoleAuthorized({
      ...base,
      callerSecret: null,
      authorization: 'Bearer service-role-key-value',
    })).toBe(true)

    expect(isOperatorOrServiceRoleAuthorized({
      ...base,
      callerSecret: 'wrong-secret',
      authorization: 'Bearer service_role',
    })).toBe(false)

    expect(isOperatorOrServiceRoleAuthorized({
      ...base,
      callerSecret: null,
      authorization: 'Bearer attacker-service_role-token',
    })).toBe(false)

    expect(isOperatorOrServiceRoleAuthorized({
      operatorSecret: '',
      serviceRoleKey: '',
      callerSecret: '',
      authorization: 'Bearer ',
    })).toBe(false)
  })

  it('canonicalizes job-refresh without embedding provider credentials', () => {
    const source = read(paths.jobRefresh)
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
    const source = read(paths.schemaDrift)
    expect(source).toContain('SCHEMA_DRIFT_CRON_SECRET')
    expect(source).toContain('matchesRequiredSecret')
    expect(source).toContain('x-harbourview-cron-secret')
    expect(source).toContain('service_not_configured')
    expect(source).toContain('get_tables_missing_from_api_schema')
    expect(source).toContain('get_functions_missing_from_api_schema')
  })

  it('grants schema drift RPC execution only to service_role through both PostgREST layers', () => {
    const sql = read(paths.migration).toLowerCase()

    for (const fn of [
      'get_tables_missing_from_api_schema',
      'get_functions_missing_from_api_schema',
    ]) {
      for (const schema of ['api', 'public']) {
        expect(sql).toContain(`revoke execute on function ${schema}.${fn}() from public, anon, authenticated;`)
        expect(sql).toContain(`grant execute on function ${schema}.${fn}() to service_role;`)
        expect(sql).not.toMatch(new RegExp(`grant\\s+execute\\s+on\\s+function\\s+${schema}\\.${fn}\\(\\)\\s+to\\s+(?:public|anon|authenticated)\\b`))
      }
    }

    expect(sql).toContain('grant usage on schema api to service_role;')
    expect(sql).not.toMatch(/grant\s+usage\s+on\s+schema\s+api\s+to\s+(?:public|anon|authenticated)\b/)

    // ACL-only repair: do not redefine either existing drift detector in this migration.
    expect(sql).not.toMatch(/create\s+or\s+replace\s+function\s+(?:api|public)\.get_tables_missing_from_api_schema\s*\(/)
    expect(sql).not.toMatch(/create\s+or\s+replace\s+function\s+(?:api|public)\.get_functions_missing_from_api_schema\s*\(/)
  })

  it('limits schema drift alert API access to only SELECT/INSERT for service_role', () => {
    const sql = read(paths.migration).toLowerCase()

    expect(sql).toContain('revoke all on api.schema_drift_alerts from public, anon, authenticated;')
    expect(sql).toContain('grant select, insert on api.schema_drift_alerts to service_role;')
    expect(sql).not.toMatch(/grant\s+all(?:\s+privileges)?\s+on\s+api\.schema_drift_alerts\s+to\s+service_role/)
    expect(sql).not.toMatch(/grant\s+(?:delete|update|truncate|references|trigger)\b[^;]*api\.schema_drift_alerts[^;]*service_role/)
    expect(sql).not.toMatch(/grant\s+[^;]*api\.schema_drift_alerts[^;]*\b(?:public|anon|authenticated)\b/)
  })

  it('does not broaden unrelated API privileges while repairing schema drift access', () => {
    const sql = read(paths.migration).toLowerCase()

    const schemaGrants = [...sql.matchAll(/grant\s+usage\s+on\s+schema\s+api\s+to\s+([^;]+);/g)]
      .map((match) => match[1].trim())
    expect(schemaGrants).toEqual(['service_role'])

    const alertGrants = [...sql.matchAll(/grant\s+([^;]+)\s+on\s+api\.schema_drift_alerts\s+to\s+([^;]+);/g)]
      .map((match) => ({ privileges: match[1].replace(/\s+/g, ' ').trim(), grantee: match[2].trim() }))
    expect(alertGrants).toEqual([{ privileges: 'select, insert', grantee: 'service_role' }])
  })

  it('removes source-visible static caller strings as authentication for pipeline runners', () => {
    const sourcePull = read(paths.sourcePull)
    const privatePipeline = read(paths.privatePipeline)

    expect(sourcePull).toContain('HV_SOURCE_PULL_RUNNER_SECRET')
    expect(sourcePull).toContain('matchesRequiredSecret')
    expect(sourcePull).toContain('x-harbourview-cron-secret')
    expect(sourcePull).not.toContain('EXPECTED_CRON_CALLER')
    expect(sourcePull).not.toContain('pg_cron_hv_source_pull_runner')

    expect(privatePipeline).toContain('HV_PRIVATE_PIPELINE_RUNNER_SECRET')
    expect(privatePipeline).toContain('matchesRequiredSecret')
    expect(privatePipeline).toContain('x-harbourview-cron-secret')
    expect(privatePipeline).not.toContain('const EXPECTED = "pg_cron_hv_private_pipeline_runner"')
  })

  it('uses the tested exact auth helper in both passport functions', () => {
    for (const path of [paths.passport, paths.snapshot]) {
      const source = read(path)
      expect(source).not.toContain('includes("service_role")')
      expect(source).not.toContain("includes('service_role')")
      expect(source).toContain('isOperatorOrServiceRoleAuthorized')
      expect(source).toContain('operatorSecret: EDGE_OPERATOR_SECRET')
      expect(source).toContain('serviceRoleKey: SUPABASE_SERVICE_KEY')
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
    expect(sql).not.toMatch(/x-harbourview-cron-secret['"]?\s*[,=:]\s*['"][A-Za-z0-9_\-]{20,}/)
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
