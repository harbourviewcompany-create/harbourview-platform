#!/usr/bin/env node
/**
 * scripts/verify-live.mjs
 * Harbourview live verification script.
 *
 * Run:  npm run verify:live
 *
 * Reads .env.local from the project root. No secrets in chat or CI logs.
 * Creates HV_VERIFY_-prefixed rows, runs all checks, cleans up in FK-safe order.
 * If cleanup fails, exact SQL is printed — no "in (null)" lines.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { createHash, randomBytes } from 'crypto'

// ─── Env ─────────────────────────────────────────────────────────────────────

function loadEnv () {
  let raw
  try { raw = readFileSync('.env.local', 'utf8') }
  catch { console.error('ERROR: cannot read .env.local — run from project root'); process.exit(1) }
  const env = {}
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 0) continue
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
  return env
}

const env     = loadEnv()
const SB_URL  = env.NEXT_PUBLIC_SUPABASE_URL
const SB_ANON = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const SB_SVC  = env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = (env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')

if (!SB_URL || !SB_SVC) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env.local')
  process.exit(1)
}

// Infer project ref from URL (https://<ref>.supabase.co)
const projectRef = SB_URL.replace('https://', '').split('.')[0] || 'unknown'

// ─── Clients ─────────────────────────────────────────────────────────────────

const svc = createClient(SB_URL, SB_SVC, {
  auth: { autoRefreshToken: false, persistSession: false }
})
const anon = SB_ANON
  ? createClient(SB_URL, SB_ANON, { auth: { autoRefreshToken: false, persistSession: false } })
  : null

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sha256   = s => createHash('sha256').update(s, 'utf8').digest('hex')
const mkToken  = () => `hvfeed_HV_VERIFY_${randomBytes(20).toString('hex')}`

const results  = {}
function PASS (key)            { results[key] = 'PASS';       console.log(`  ✅  ${key}`) }
function FAIL (key, why)       { results[key] = 'FAIL';       console.log(`  ❌  ${key}: ${why}`) }
function UNVER(key, why)       { results[key] = 'UNVERIFIED'; console.log(`  ⚠️   ${key}: ${why}`) }

// Seed profile / workspace IDs from 0009_seed_data + 0012_germany_operator_seed
const ADMIN_ID   = '9866753f-1a8d-495c-8ab8-d0d1eebfce04'
const ANALYST_ID = '31e6281c-aec9-4c6d-a9c3-4852b1c057d5'
// Germany Intelligence workspace from seed — use existing to avoid FK on audit_events
const WS_ID      = '00000000-0000-0000-0000-000000000010'

// Track created rows for FK-safe cleanup. Workspaces are NOT created — we use
// the seeded workspace to avoid audit_events FK blocking workspace deletion.
const rows = { sources: [], docs: [], signals: [], evidence: [], dossiers: [], pe: [], ft: [] }

// ─── Phase 0: Diagnostics ─────────────────────────────────────────────────────

async function phase0_diagnostics () {
  console.log('\n── Phase 0: Diagnostics ─────────────────────────────────────────')
  console.log(`  Supabase URL  : ${SB_URL}`)
  console.log(`  Project ref   : ${projectRef}`)
  console.log(`  App URL       : ${APP_URL}`)
  console.log(`  Anon key      : ${SB_ANON ? 'set' : 'NOT SET — RLS phase will be UNVERIFIED'}`)

  // Does service client reach Supabase at all?
  const { error: pingErr } = await svc.from('profiles').select('id').limit(0)
  if (pingErr && pingErr.code !== 'PGRST116') {
    // PGRST116 = no rows found (fine for limit 0 with RLS)
    FAIL('supabase_reachable', pingErr.message)
  } else {
    PASS('supabase_reachable')
  }

  // Does the seeded workspace exist?
  const { data: ws, error: wsErr } = await svc
    .from('workspaces').select('id, name').eq('id', WS_ID).maybeSingle()
  if (wsErr || !ws) {
    FAIL('seed_workspace_exists',
      wsErr?.message ?? `WS_ID ${WS_ID} not found — seed data may not be applied`)
  } else {
    PASS(`seed_workspace_exists (${ws.name})`)
  }
}

// ─── Phase 1: Schema — direct table probe, no OpenAPI ─────────────────────────
//
// OpenAPI/PostgREST spec omits tables that the PostgREST role cannot see.
// public_feed_tokens has RLS deny-all for authenticated/anon users, so it
// never appears in the OpenAPI spec even if it exists.
// Solution: query the table directly with service role (bypasses RLS) and
// inspect the error code to distinguish table-missing from other failures.

async function probe (table, cols = 'id') {
  const { data, error } = await svc.from(table).select(cols).limit(0)
  if (!error) return { exists: true, colsOk: true, error: null }
  // PGRST200 = relation does not exist
  // 42703    = column does not exist
  // 42P01    = table does not exist (pg error code)
  const msg = error.message ?? ''
  const code = error.code ?? ''
  if (code === 'PGRST200' || msg.includes('does not exist') || msg.includes('relation'))
    return { exists: false, colsOk: false, error: msg }
  if (msg.toLowerCase().includes('column'))
    return { exists: true, colsOk: false, error: msg }
  return { exists: true, colsOk: true, error: null }
}

async function phase1_schema () {
  console.log('\n── Phase 1: Schema ─────────────────────────────────────────────')

  // 1a. public_feed_tokens — existence
  const ft = await probe('public_feed_tokens', 'id')
  ft.exists ? PASS('table_public_feed_tokens') : FAIL('table_public_feed_tokens', ft.error)

  // 1b. public_feed_token_access_events — existence
  const ae = await probe('public_feed_token_access_events', 'id')
  ae.exists
    ? PASS('table_public_feed_token_access_events')
    : FAIL('table_public_feed_token_access_events', ae.error)

  // 1c. Expected columns on public_feed_tokens
  if (ft.exists) {
    const cols = 'id, token_hash, snapshot, workspace_id, publish_event_id, expires_at, status'
    const colProbe = await probe('public_feed_tokens', cols)
    colProbe.colsOk
      ? PASS('public_feed_tokens_columns')
      : FAIL('public_feed_tokens_columns', colProbe.error)
  } else {
    FAIL('public_feed_tokens_columns', 'table missing — cannot check columns')
  }

  // 1d. workspace_memberships must NOT exist
  const wm = await probe('workspace_memberships', 'id')
  !wm.exists
    ? PASS('no_workspace_memberships_table')
    : FAIL('no_workspace_memberships_table', 'table exists — should not')

  // 1e. workspace_members MUST exist
  const wmOk = await probe('workspace_members', 'id')
  wmOk.exists
    ? PASS('workspace_members_exists')
    : FAIL('workspace_members_exists', wmOk.error)
}

// ─── Phase 2: Policy behaviour ────────────────────────────────────────────────

async function phase2_policies () {
  console.log('\n── Phase 2: Policy behaviour ───────────────────────────────────')

  // is_workspace_member — correct param name is ws_id per live schema
  const { error: wmErr } = await svc.rpc('is_workspace_member', { ws_id: WS_ID })
  wmErr
    ? FAIL('is_workspace_member_runs', wmErr.message)
    : PASS('is_workspace_member_runs')

  // is_platform_admin
  const { error: adErr } = await svc.rpc('is_platform_admin')
  adErr
    ? FAIL('is_platform_admin_runs', adErr.message)
    : PASS('is_platform_admin_runs')
}

// ─── Phase 3: Publish flow ────────────────────────────────────────────────────

let activeToken, dossierId, feedTokenId

async function phase3_publish () {
  console.log('\n── Phase 3: Publish flow ───────────────────────────────────────')

  // 3a. Source — workspace_id is NOT NULL on live schema; use seeded workspace
  const { data: src, error: srcErr } = await svc.from('sources').insert({
    name: 'HV_VERIFY_Source',
    canonical_url: `https://hv-verify.test/s-${Date.now()}`,
    domain: 'hv-verify.test',
    source_tier: 'company_primary',
    status: 'active',
    jurisdiction: 'DE',
    entity_type: 'company',
    workspace_id: WS_ID,
    created_by_profile_id: ADMIN_ID
  }).select('id').single()
  if (srcErr) { FAIL('publish_source', srcErr.message); return }
  rows.sources.push(src.id)

  // 3b. Source document
  const { data: doc, error: docErr } = await svc.from('source_documents').insert({
    source_id: src.id,
    title: 'HV_VERIFY_Doc',
    url: `https://hv-verify.test/doc-${Date.now()}`,
    status: 'captured',
    created_by_profile_id: ADMIN_ID
  }).select('id').single()
  if (docErr) { FAIL('publish_source_doc', docErr.message); return }
  rows.docs.push(doc.id)

  // 3c. Signal — workspace_id is NOT NULL on live schema; use seeded workspace
  const { data: sig, error: sigErr } = await svc.from('signals').insert({
    title: 'HV_VERIFY_Signal',
    summary: 'Verification signal — safe to delete',
    signal_type: 'test',
    jurisdiction: 'DE',
    data_class: 'observed',
    confidence_level: 'high',
    review_status: 'approved',
    visibility_scope: 'internal',
    workspace_id: WS_ID,
    source_id: src.id,
    created_by_profile_id: ANALYST_ID,
    updated_by_profile_id: ADMIN_ID,
    submitted_by_profile_id: ANALYST_ID,
    reviewed_by_profile_id: ADMIN_ID
  }).select('id').single()
  if (sigErr) { FAIL('publish_signal', sigErr.message); return }
  rows.signals.push(sig.id)

  // 3d. Evidence
  const { data: ev, error: evErr } = await svc.from('signal_evidence').insert({
    signal_id: sig.id,
    source_document_id: doc.id,
    evidence_type: 'paraphrased_fact',
    evidence_source_type: 'human',
    evidence_text: 'HV_VERIFY evidence text',
    citation_reference: 'HV_VERIFY para 1',
    created_by_profile_id: ANALYST_ID
  }).select('id').single()
  if (!evErr && ev) rows.evidence.push(ev.id)

  // 3e. Dossier
  const { data: dos, error: dosErr } = await svc.from('dossiers').insert({
    workspace_id: WS_ID,
    title: 'HV_VERIFY_Dossier',
    status: 'draft',
    jurisdiction: 'DE',
    created_by_profile_id: ADMIN_ID,
    updated_by_profile_id: ADMIN_ID
  }).select('id').single()
  if (dosErr) { FAIL('publish_dossier_create', dosErr.message); return }
  dossierId = dos.id
  rows.dossiers.push(dos.id)

  // 3f. Dossier item
  const { error: diErr } = await svc.from('dossier_items').insert({
    dossier_id: dos.id,
    signal_id: sig.id,
    display_order: 1,
    created_by_profile_id: ADMIN_ID
  })
  if (diErr) { FAIL('publish_dossier_item', diErr.message); return }

  // 3g. Snapshot — include canary fields for sanitization test
  const snapshot = {
    schema_version: '1.0',
    dossier_id: dos.id,
    title: 'HV_VERIFY_Dossier',
    jurisdiction: 'DE',
    workspace: { id: WS_ID, name: 'Germany Intelligence' },
    internal_notes: 'HV_VERIFY_CANARY_INTERNAL',
    analyst_notes: 'HV_VERIFY_CANARY_ANALYST',
    analyst_interpretation: 'HV_VERIFY_CANARY_INTERPRETATION',
    snapshot_json: { raw: 'HV_VERIFY_CANARY_SNAPSHOT_JSON' },
    signals: [{
      id: sig.id,
      title: 'HV_VERIFY_Signal',
      summary: 'Verification signal',
      analyst_interpretation: 'HV_VERIFY_CANARY_INTERPRETATION',
      item_notes: 'HV_VERIFY_CANARY_ITEM_NOTES',
      evidence: []
    }]
  }

  // 3h. publish_events row
  const { data: pe, error: peErr } = await svc.from('publish_events').insert({
    dossier_id: dos.id,
    workspace_id: WS_ID,
    status: 'completed',
    published_by_profile_id: ADMIN_ID,
    snapshot_json: snapshot
  }).select('id').single()
  if (peErr) { FAIL('publish_events_row', peErr.message); return }
  rows.pe.push(pe.id)
  PASS('publish_events_row')

  // Mark dossier published
  await svc.from('dossiers').update({
    status: 'published',
    published_at: new Date().toISOString(),
    published_by_profile_id: ADMIN_ID
  }).eq('id', dos.id)

  // 3i. public_feed_tokens row (active)
  activeToken = mkToken()
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  const { data: ft, error: ftErr } = await svc.from('public_feed_tokens').insert({
    workspace_id: WS_ID,
    publish_event_id: pe.id,
    token_hash: sha256(activeToken),
    status: 'active',
    snapshot,
    expires_at: expires,
    created_by_profile_id: ADMIN_ID
  }).select('id, publish_event_id, status').single()
  if (ftErr) { FAIL('public_feed_tokens_row', ftErr.message); return }
  feedTokenId = ft.id
  rows.ft.push(ft.id)
  PASS('public_feed_tokens_row')

  if (ft.publish_event_id === pe.id && ft.status === 'active')
    PASS('feed_token_linked_to_publish_event')
  else
    FAIL('feed_token_linked_to_publish_event',
      `publish_event_id=${ft.publish_event_id} status=${ft.status}`)
}

// ─── Phase 4: Feed HTTP ───────────────────────────────────────────────────────

async function phase4_feed () {
  console.log('\n── Phase 4: Feed HTTP ──────────────────────────────────────────')

  // Create revoked token
  const revokedTok = mkToken()
  const { data: rft, error: rftErr } = await svc.from('public_feed_tokens').insert({
    workspace_id: WS_ID,
    token_hash: sha256(revokedTok),
    status: 'revoked',
    snapshot: { schema_version: '1.0', title: 'HV_VERIFY_revoked' },
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    revoked_at: new Date().toISOString(),
    created_by_profile_id: ADMIN_ID
  }).select('id').single()
  if (!rftErr && rft) rows.ft.push(rft.id)

  // Create expired token
  const expiredTok = mkToken()
  const { data: eft, error: eftErr } = await svc.from('public_feed_tokens').insert({
    workspace_id: WS_ID,
    token_hash: sha256(expiredTok),
    status: 'active',
    snapshot: { schema_version: '1.0', title: 'HV_VERIFY_expired' },
    expires_at: new Date(Date.now() - 60000).toISOString(),
    created_by_profile_id: ADMIN_ID
  }).select('id').single()
  if (!eftErr && eft) rows.ft.push(eft.id)

  async function feedGet (tok, label) {
    try {
      const r = await fetch(`${APP_URL}/api/feed/${tok}`,
        { signal: AbortSignal.timeout(8000) })
      return { ok: true, status: r.status, body: await r.json() }
    } catch (e) {
      UNVER(label, `App not reachable at ${APP_URL}: ${e.message}`)
      return { ok: false }
    }
  }

  // Active → 200
  if (activeToken) {
    const r = await feedGet(activeToken, 'feed_active_200')
    if (r.ok) {
      r.status === 200 ? PASS('feed_active_200') : FAIL('feed_active_200', `HTTP ${r.status}`)

      // Sanitization canaries
      const body = JSON.stringify(r.body)
      const leaking = [
        'internal_notes', 'analyst_notes', 'analyst_interpretation',
        'item_notes', 'snapshot_json', 'api_token',
        'reviewer_notes', 'HV_VERIFY_CANARY'
      ].filter(k => body.includes(k))
      leaking.length === 0
        ? PASS('feed_sanitization')
        : FAIL('feed_sanitization', `leaking: ${leaking.join(', ')}`)

      // workspace should be present (unblocked in sanitizer)
      r.body?.dossier?.workspace
        ? PASS('feed_workspace_present')
        : FAIL('feed_workspace_present', 'workspace key missing from feed response')
    }
  }

  // Revoked → 410
  if (!rftErr) {
    const r = await feedGet(revokedTok, 'feed_revoked_410')
    if (r.ok) {
      r.status === 410 && r.body?.revoked === true
        ? PASS('feed_revoked_410')
        : FAIL('feed_revoked_410', `HTTP ${r.status} body=${JSON.stringify(r.body)}`)
    }
  } else {
    UNVER('feed_revoked_410', `setup failed: ${rftErr.message}`)
  }

  // Expired → 410
  if (!eftErr) {
    const r = await feedGet(expiredTok, 'feed_expired_410')
    if (r.ok) {
      r.status === 410 && r.body?.expired === true
        ? PASS('feed_expired_410')
        : FAIL('feed_expired_410', `HTTP ${r.status} body=${JSON.stringify(r.body)}`)
    }
  } else {
    UNVER('feed_expired_410', `setup failed: ${eftErr.message}`)
  }

  // Unknown → 404
  const r = await feedGet(`hvfeed_HV_VERIFY_${'z'.repeat(40)}`, 'feed_unknown_404')
  if (r.ok) {
    r.status === 404 ? PASS('feed_unknown_404') : FAIL('feed_unknown_404', `HTTP ${r.status}`)
  }
}

// ─── Phase 5: Audit trail ─────────────────────────────────────────────────────

async function phase5_audit () {
  console.log('\n── Phase 5: Audit trail ────────────────────────────────────────')

  if (!rows.signals.length) { UNVER('audit_write', 'no signal created'); return }
  const sigId = rows.signals[0]

  const { error: wErr } = await svc.rpc('write_audit_event', {
    p_entity_type: 'signal',
    p_entity_id: sigId,
    p_action_type: 'update',
    p_performed_by_profile_id: ADMIN_ID,
    p_change_summary: 'HV_VERIFY audit test'
  })
  if (wErr) { FAIL('audit_write', wErr.message); return }
  PASS('audit_write')

  const { data: events } = await svc.from('audit_events')
    .select('id, change_summary')
    .eq('entity_id', sigId)
    .ilike('change_summary', 'HV_VERIFY%')
    .limit(1)
  events?.length ? PASS('audit_event_persisted') : FAIL('audit_event_persisted', 'not found')

  if (events?.length) {
    const { error: upErr } = await svc.from('audit_events')
      .update({ change_summary: 'mutated' })
      .eq('id', events[0].id)
    upErr ? PASS('audit_immutability_trigger') : FAIL('audit_immutability_trigger', 'event was mutated')
  }
}

// ─── Phase 6: RLS spot checks ─────────────────────────────────────────────────

async function phase6_rls () {
  console.log('\n── Phase 6: RLS ────────────────────────────────────────────────')

  if (!anon) {
    UNVER('rls_anon_signals',       'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set')
    UNVER('rls_anon_feed_tokens',   'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set')
    UNVER('rls_anon_publish_events','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set')
    return
  }

  const { data: s, error: sErr } = await anon.from('signals').select('id').limit(1)
  sErr || !s?.length ? PASS('rls_anon_signals') : FAIL('rls_anon_signals', 'anon can read signals')

  const { data: f, error: fErr } = await anon.from('public_feed_tokens').select('id').limit(1)
  fErr || !f?.length ? PASS('rls_anon_feed_tokens') : FAIL('rls_anon_feed_tokens', 'anon can read feed tokens directly')

  const { data: p, error: pErr } = await anon.from('publish_events').select('id').limit(1)
  pErr || !p?.length ? PASS('rls_anon_publish_events') : FAIL('rls_anon_publish_events', 'anon can read publish_events')
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

async function cleanup () {
  console.log('\n── Cleanup ─────────────────────────────────────────────────────')
  const errs = []

  async function del (table, col, ids, label) {
    if (!ids.length) return
    const { error } = await svc.from(table).delete().in(col, ids)
    if (error) errs.push({ label, error: error.message, ids })
  }

  // FK-safe order:
  // access_events → feed_tokens → publish_events (revocations first)
  // dossier_items cascade with dossiers
  // signal_evidence + review_queue_items cascade with signals
  // sources last (source_documents cascade)
  // NOTE: audit_events references workspace_id ON DELETE SET NULL, so deleting
  // the seeded workspace is not attempted — we never created a HV_VERIFY_ workspace.
  // Audit events created for HV_VERIFY_ signals will have entity_id = signal UUID
  // and will be cascade-deleted when the signal is deleted (if FK is cascade),
  // OR will have signal UUID as entity_id which is a text field (no FK).

  await del('public_feed_token_access_events', 'public_feed_token_id', rows.ft,      'access_events')
  await del('public_feed_tokens',              'id',                   rows.ft,      'feed_tokens')
  // Delete any revocation publish_events rows that reference our pe rows
  if (rows.pe.length)
    await svc.from('publish_events').delete().in('revokes_event_id', rows.pe)
  await del('publish_events', 'id', rows.pe, 'publish_events')
  // dossier_items cascade with dossier
  await del('dossiers',        'id', rows.dossiers, 'dossiers')
  // signal_evidence and review_queue_items cascade with signal
  await del('signals',         'id', rows.signals,  'signals')
  // source_documents cascade with source
  await del('sources',         'id', rows.sources,  'sources')

  if (!errs.length) {
    console.log('  ✅  All HV_VERIFY_ rows deleted')
    return
  }

  console.log('  ⚠️   Cleanup failed for some rows. Run this SQL in Supabase SQL Editor:\n')

  // Only emit lines with real IDs — never "in (null)"
  const clause = ids => ids.length ? `in (${ids.map(i => `'${i}'`).join(', ')})` : null
  const lines = [
    rows.ft.length      && `delete from public.public_feed_token_access_events where public_feed_token_id ${clause(rows.ft)};`,
    rows.ft.length      && `delete from public.public_feed_tokens where id ${clause(rows.ft)};`,
    rows.pe.length      && `delete from public.publish_events where revokes_event_id ${clause(rows.pe)};`,
    rows.pe.length      && `delete from public.publish_events where id ${clause(rows.pe)};`,
    rows.dossiers.length && `delete from public.dossier_items where dossier_id ${clause(rows.dossiers)};`,
    rows.dossiers.length && `delete from public.dossiers where id ${clause(rows.dossiers)};`,
    rows.signals.length  && `delete from public.signal_evidence where signal_id ${clause(rows.signals)};`,
    rows.signals.length  && `delete from public.review_queue_items where signal_id ${clause(rows.signals)};`,
    rows.signals.length  && `delete from public.signals where id ${clause(rows.signals)};`,
    rows.docs.length     && `delete from public.source_documents where id ${clause(rows.docs)};`,
    rows.sources.length  && `delete from public.sources where id ${clause(rows.sources)};`,
  ].filter(Boolean)

  console.log(lines.join('\n'))
  errs.forEach(e => console.log(`\n  [${e.label}] ${e.error}`))
}

// ─── Verdict ──────────────────────────────────────────────────────────────────

function verdict () {
  const v = k => results[k] || 'UNVERIFIED'
  const group = (...keys) => {
    if (keys.some(k => v(k) === 'FAIL'))      return 'FAIL'
    if (keys.some(k => v(k) === 'UNVERIFIED')) return 'UNVERIFIED'
    return 'PASS'
  }
  const icon = s => s === 'PASS' ? '✅' : s === 'FAIL' ? '❌' : '⚠️ '

  const schema   = group('supabase_reachable','table_public_feed_tokens',
                         'table_public_feed_token_access_events','public_feed_tokens_columns',
                         'no_workspace_memberships_table','workspace_members_exists',
                         'is_workspace_member_runs')
  const publish  = group('publish_events_row','public_feed_tokens_row','feed_token_linked_to_publish_event')
  const active   = v('feed_active_200')
  const revoked  = v('feed_revoked_410')
  const expired  = v('feed_expired_410')
  const sanitize = group('feed_sanitization','feed_workspace_present')
  const rls      = group('rls_anon_signals','rls_anon_feed_tokens','rls_anon_publish_events')
  const audit    = group('audit_write','audit_event_persisted','audit_immutability_trigger')

  const allPass = [schema,publish,active,revoked,expired,sanitize,rls,audit].every(s => s === 'PASS')

  console.log('\n══════════════════════════════════════════════════════════════════')
  console.log('LIVE VERIFICATION VERDICT')
  console.log('══════════════════════════════════════════════════════════════════')
  console.log(`${icon(schema)}   Database schema:        ${schema}`)
  console.log(`${icon(publish)}  Publish action:         ${publish}`)
  console.log(`${icon(active)}   Feed active token:      ${active}`)
  console.log(`${icon(revoked)}  Feed revoked token:     ${revoked}`)
  console.log(`${icon(expired)}  Feed expired token:     ${expired}`)
  console.log(`${icon(sanitize)} Sanitization/privacy:   ${sanitize}`)
  console.log(`${icon(rls)}      RLS/security:           ${rls}`)
  console.log(`${icon(audit)}    Audit trail:            ${audit}`)
  console.log('')
  if (allPass) console.log('✅  Marketplace work can begin: YES')
  else          console.log('❌  Marketplace work can begin: NO — fix failures above first')
  console.log('══════════════════════════════════════════════════════════════════\n')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main () {
  console.log('Harbourview Live Verifier — npm run verify:live')
  try {
    await phase0_diagnostics()
    await phase1_schema()
    await phase2_policies()
    await phase3_publish()
    await phase4_feed()
    await phase5_audit()
    await phase6_rls()
  } finally {
    await cleanup()
    verdict()
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
