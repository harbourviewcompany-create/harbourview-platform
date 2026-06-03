#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const migrationPath = path.join(repoRoot, 'supabase/migrations/20260603000000_harden_signal_engine_security.sql')
const planPath = path.join(repoRoot, 'docs/control/signal-engine-hardening/EXECUTION_PLAN.md')
const liveScriptPath = path.join(repoRoot, 'scripts/signal-engine/fetch-live-supabase-signal-security.mjs')

const requiredTables = [
  'source_documents',
  'source_chunks',
  'signal_duplicate_groups',
  'signal_candidates',
  'signal_evidence',
  'signal_review_events',
  'signal_jobs',
  'signal_risk_flags',
  'model_prompt_versions',
  'model_call_logs',
  'entities',
  'signal_entity_mentions',
  'signal_conversions',
  'signal_processing_errors',
]

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function read(filePath) {
  assert(fs.existsSync(filePath), `Missing required file: ${path.relative(repoRoot, filePath)}`)
  return fs.readFileSync(filePath, 'utf8')
}

const migration = read(migrationPath)
const plan = read(planPath)
const liveScript = read(liveScriptPath)

assert(migration.includes('create schema if not exists private'), 'Migration must create/use the private helper schema')
assert(migration.includes('create or replace function private.is_signal_admin()'), 'Migration must define private.is_signal_admin()')
assert(migration.includes("set search_path = ''"), 'private.is_signal_admin() must pin search_path')
assert(migration.includes('from public.user_roles'), 'Admin helper must use canonical public.user_roles')
assert(migration.includes("user_roles.role in ('admin', 'operator')"), 'Admin helper must limit Signal Engine admins to admin/operator')
assert(migration.includes('drop function if exists public.is_signal_admin()'), 'Migration must drop exposed public.is_signal_admin()')
assert(migration.includes('drop function if exists public.is_service_role()'), 'Migration must drop exposed public.is_service_role()')
assert(migration.includes('revoke all on function public.is_signal_admin()'), 'Migration must revoke legacy public.is_signal_admin() before dropping it')
assert(migration.includes('using (private.is_signal_admin())'), 'Admin policies must call the private helper')
assert(migration.includes('with check (private.is_signal_admin())'), 'Admin write policies must call the private helper')
assert(!/public\.marketplace|marketplace_[a-z_]+/i.test(migration), 'Signal Engine hardening migration must not touch marketplace objects')

for (const table of requiredTables) {
  assert(migration.includes(`public.${table} force row level security`), `Missing FORCE RLS for ${table}`)
}

assert(plan.includes('zvxdgdkukjrrwamdpqrg'), 'Execution plan must name the canonical Supabase project ref')
assert(plan.includes('Harbourview Signal Engine V1'), 'Execution plan must reference the canonical Signal Engine spec')
assert(plan.includes('Supabase advisor'), 'Execution plan must include advisor verification steps')
assert(plan.includes('Rollback'), 'Execution plan must include rollback guidance')
assert(liveScript.includes('/advisors/security'), 'Live script must fetch Supabase security advisors')
assert(liveScript.includes('/analytics/endpoints/logs.all'), 'Live script must fetch Supabase logs')

console.log('Signal Engine hardening workspace verification passed.')
