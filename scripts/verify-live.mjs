#!/usr/bin/env node
/**
 * scripts/verify-live.mjs
 * Harbourview live verification script.
 *
 * Run:  npm run verify:live
 *
 * Reads .env.local from the project root.
 * Creates HV_VERIFY_-prefixed test rows, runs all checks, cleans up.
 * Never modifies existing production data.
 * If cleanup fails, prints exact SQL to finish manually.
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

const env      = loadEnv()
const SB_URL   = env.NEXT_PUBLIC_SUPABASE_URL
const SB_ANON  = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const SB_SVC   = env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL  = (env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')

if (!SB_URL || !SB_SVC) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env.local')
  process.exit(1)
}

// ─── Clients ─────────────────────────────────────────────────────────────────

const svc = createClient(SB_URL, SB_SVC, { auth: { autoRefreshToken: false, persistSession: false } })
const anon = SB_ANON
  ? createClient(SB_URL, SB_ANON, { auth: { autoRefreshToken: false, persistSession: false } })
  : null

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sha256 = s => createHash('sha256').update(s, 'utf8').digest('hex')
const mkToken = () => `hvfeed_HV_VERIFY_${randomBytes(20).toString('hex')}`

const results = {}
const log = { pass: [], fail: [], unverified: [] }

function PASS (key)              { results[key] = 'PASS';       console.log(`  ✅  ${key}`) }
function FAIL (key, why)         { results[key] = 'FAIL';       console.log(`  ❌  ${key}: ${why}`) }
function UNVERIFIED (key, why)   { results[key] = 'UNVERIFIED'; console.log(`  ⚠️   ${key}: ${why}`) }

// Seed profile UUIDs from 0009_seed_data.sql — must exist in live DB
const ADMIN_ID    = '9866753f-1a8d-495c-8ab8-d0d1eebfce04'
const ANALYST_ID  = '31e6281c-aec9-4c6d-a9c3-4852b1c057d5'
const WS_ID       = '00000000-0000-0000-0000-000000000010'  // Germany Intelligence

// Track created rows for cleanup (FK-safe ordering built into cleanup fn)
const rows = { sources: [], docs: [], signals: [], dossiers: [], pe: [], ft: [], workspaces: [] }

// ─── Phase 1: Schema ─────────────────────────────────────────────────────────

async function phase1_schema () {
  console.log('\n── Phase 1: Schema ─────────────────────────────────────────────')

  // Use PostgREST OpenAPI spec (service role sees all tables regardless of RLS)
  let spec = null
  try {
    const r = await fetch(`${SB_URL}/rest/v1/`, {
      headers: { apikey: SB_SVC, Authorization: `Bearer ${SB_SVC}` }
    })
    spec = await r.json()
  } catch (e) { UNVERIFIED('schema_openapi_reachable', e.message); return }

  const defs = spec?.definitions || {}

  // 1a. public_feed_tokens table
  if (defs.public_feed_tokens)       PASS('table_public_feed_tokens')
  else                                FAIL('table_public_feed_tokens', 'not in OpenAPI spec')

  // 1b. public_feed_token_access_events table
  if (defs.public_feed_token_access_events) PASS('table_public_feed_token_access_events')
  else                                       FAIL('table_public_feed_token_access_events', 'not in OpenAPI spec')

  // 1c. Expected columns on public_feed_tokens
  const cols = Object.keys(defs.public_feed_tokens?.properties || {})
  const required = ['id', 'token_hash', 'snapshot', 'workspace_id', 'publish_event_id', 'expires_at', 'status']
  const missing  = required.filter(c => !cols.includes(c))
  if (missing.length === 0) PASS('public_feed_tokens_columns')
  else                       FAIL('public_feed_tokens_columns', `missing: ${missing.join(', ')}`)

  // 1d. workspace_memberships must NOT exist
  if (!defs.workspace_memberships) PASS('no_workspace_memberships_in_schema')
  else                              FAIL('no_workspace_memberships_in_schema', 'table exists — should not')

  // 1e. workspace_members MUST exist
  if (defs.workspace_members) PASS('workspace_members_exists')
  else                         FAIL('workspace_members_exists', 'missing from schema')

  // 1f. Direct probe: attempting to SELECT workspace_memberships must fail
  const { error: wmErr } = await svc.from('workspace_memberships').select('id').limit(1)
  if (wmErr) PASS('workspace_memberships_unreachable')
  else        FAIL('workspace_memberships_unreachable', 'table is queryable — should not exist')
}

// ─── Phase 2: Policy spot-check via is_workspace_member() behaviour ──────────

async function phase2_policies () {
  console.log('\n── Phase 2: Policy behaviour ───────────────────────────────────')

  // Call is_workspace_member() via RPC — if it references workspace_memberships
  // it would throw "relation does not exist" at runtime, not at function creation.
  // If workspace_members is correct it returns a boolean cleanly.
  const { data, error } = await svc.rpc('is_workspace_member', {
    ws_id: WS_ID
  })
  if (error) FAIL('is_workspace_member_runs', error.message)
  else        PASS('is_workspace_member_runs')

  // is_platform_admin() sanity check
  const { error: adErr } = await svc.rpc('is_platform_admin')
  if (adErr) FAIL('is_platform_admin_runs', adErr.message)
  else        PASS('is_platform_admin_runs')
}

// ─── Phase 3: Publish flow ───────────────────────────────────────────────────

let activeToken, dossierId, publishEventId, feedTokenId

async function phase3_publish () {
  console.log('\n── Phase 3: Publish flow ───────────────────────────────────────')

  // 3a. Workspace — sources.workspace_id is NOT NULL in live schema
  const slug = `hv-verify-${Date.now()}`
  const { data: ws, error: wsErr } = await svc.from('workspaces').insert({
    name: 'HV_VERIFY_Workspace',
    slug,
    is_internal: true,
    created_by_profile_id: ADMIN_ID
  }).select('id').single()
  if (wsErr) { FAIL('publish_workspace', wsErr.message); return }
  const verifyWsId = ws.id
  rows.workspaces.push(ws.id)

  // 3b. Source — workspace_id required (NOT NULL on live schema)
  const { data: src, error: srcErr } = await svc.from('sources').insert({
    name: 'HV_VERIFY_Source',
    canonical_url: `https://hv-verify.test/s-${Date.now()}`,
    domain: 'hv-verify.test',
    source_tier: 'company_primary',
    status: 'active',
    jurisdiction: 'DE',
    entity_type: 'company',
    workspace_id: verifyWsId,
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

  // 3c. Signal — INSERT with review_status=approved is valid:
  //     check_signal_has_evidence trigger fires only on UPDATE of review_status.
  const { data: sig, error: sigErr } = await svc.from('signals').insert({
    title: 'HV_VERIFY_Signal',
    summary: 'Verification signal — safe to delete',
    signal_type: 'test',
    jurisdiction: 'DE',
    data_class: 'observed',
    confidence_level: 'high',
    review_status: 'approved',
    visibility_scope: 'internal',
    source_id: src.id,
    created_by_profile_id: ANALYST_ID,
    updated_by_profile_id: ADMIN_ID,
    submitted_by_profile_id: ANALYST_ID,
    reviewed_by_profile_id: ADMIN_ID
  }).select('id').single()
  if (sigErr) { FAIL('publish_signal', sigErr.message); return }
  rows.signals.push(sig.id)

  // 3d. Evidence (needed for integrity, also used for sanitization snapshot)
  await svc.from('signal_evidence').insert({
    signal_id: sig.id,
    source_document_id: doc.id,
    evidence_type: 'paraphrased_fact',
    evidence_source_type: 'human',
    evidence_text: 'HV_VERIFY evidence text',
    citation_reference: 'HV_VERIFY para 1',
    created_by_profile_id: ANALYST_ID
  })

  // 3e. Dossier
  const { data: dos, error: dosErr } = await svc.from('dossiers').insert({
    workspace_id: WS_ID,
    title: 'HV_VERIFY_Dossier',
    status: 'draft',
    jurisdiction: 'DE',
    created_by_profile_id: ADMIN_ID,
    updated_by_profile_id: ADMIN_ID
  }).select('id').single()
  if (dosErr) { FAIL('publish_dossier', dosErr.message); return }
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

  // 3g. Build snapshot — deliberately include internal_notes to test sanitizer
  const snapshot = {
    schema_version: '1.0',
    dossier_id: dos.id,
    title: 'HV_VERIFY_Dossier',
    jurisdiction: 'DE',
    workspace: { id: WS_ID, name: 'Germany Intelligence' },
    signals: [{
      id: sig.id,
      title: 'HV_VERIFY_Signal',
      summary: 'Verification signal',
      internal_notes: 'HV_VERIFY_SHOULD_NOT_APPEAR_IN_FEED',
      analyst_notes:  'HV_VERIFY_SHOULD_NOT_APPEAR_IN_FEED',
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
  publishEventId = pe.id
  rows.pe.push(pe.id)
  PASS('publish_events_row')

  // Mark dossier published (single atomic update — immutability trigger safe
  // because OLD.status = 'draft', not 'published')
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

  // 3j. Verify link
  if (ft.publish_event_id === pe.id && ft.status === 'active') PASS('feed_token_linked_to_publish_event')
  else FAIL('feed_token_linked_to_publish_event', `publish_event_id=${ft.publish_event_id} status=${ft.status}`)
}

// ─── Phase 4: Feed HTTP ───────────────────────────────────────────────────────

async function phase4_feed () {
  console.log('\n── Phase 4: Feed HTTP ──────────────────────────────────────────')
  console.log(`  APP_URL: ${APP_URL}`)

  // 4a. Create revoked token row
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
  if (!rftErr) rows.ft.push(rft.id)

  // 4b. Create expired token row
  const expiredTok = mkToken()
  const { data: eft, error: eftErr } = await svc.from('public_feed_tokens').insert({
    workspace_id: WS_ID,
    token_hash: sha256(expiredTok),
    status: 'active',
    snapshot: { schema_version: '1.0', title: 'HV_VERIFY_expired' },
    expires_at: new Date(Date.now() - 60000).toISOString(), // already expired
    created_by_profile_id: ADMIN_ID
  }).select('id').single()
  if (!eftErr) rows.ft.push(eft.id)

  // Helper
  async function feedGet (tok, label) {
    try {
      const r = await fetch(`${APP_URL}/api/feed/${tok}`, { signal: AbortSignal.timeout(8000) })
      return { ok: true, status: r.status, body: await r.json() }
    } catch (e) {
      UNVERIFIED(label, `App not reachable at ${APP_URL}: ${e.message}`)
      return { ok: false }
    }
  }

  // 4c. Active token → 200
  if (activeToken) {
    const r = await feedGet(activeToken, 'feed_active_200')
    if (r.ok) {
      if (r.status === 200)  PASS('feed_active_200')
      else                   FAIL('feed_active_200', `HTTP ${r.status}`)

      // Sanitization — these keys must NOT appear anywhere in the response body
      const bodyStr = JSON.stringify(r.body)
      const mustAbsent = [
        'internal_notes', 'analyst_notes', 'item_notes',
        'reviewer_notes', 'service_role', 'token_hash',
        'api_key', 'raw_payload', 'HV_VERIFY_SHOULD_NOT_APPEAR_IN_FEED'
      ]
      const leaking = mustAbsent.filter(k => bodyStr.includes(k))
      if (leaking.length === 0) PASS('feed_sanitization')
      else                       FAIL('feed_sanitization', `leaking: ${leaking.join(', ')}`)

      // workspace should be present (we unblocked it in sanitizer)
      const bodyObj = r.body
      if (bodyObj?.dossier?.workspace) PASS('feed_workspace_present')
      else                              FAIL('feed_workspace_present', 'workspace missing from feed — sanitizer may still be blocking it')

      // dossier_id round-trip
      if (bodyObj?.dossier?.dossier_id === dossierId) PASS('feed_dossier_id_correct')
      else FAIL('feed_dossier_id_correct', `expected ${dossierId}, got ${bodyObj?.dossier?.dossier_id}`)
    }
  }

  // 4d. Revoked token → 410 with revoked:true
  if (!rftErr) {
    const r = await feedGet(revokedTok, 'feed_revoked_410')
    if (r.ok) {
      if (r.status === 410 && r.body?.revoked === true) PASS('feed_revoked_410')
      else FAIL('feed_revoked_410', `HTTP ${r.status} body=${JSON.stringify(r.body)}`)
    }
  } else {
    UNVERIFIED('feed_revoked_410', `setup failed: ${rftErr.message}`)
  }

  // 4e. Expired token → 410 with expired:true
  if (!eftErr) {
    const r = await feedGet(expiredTok, 'feed_expired_410')
    if (r.ok) {
      if (r.status === 410 && r.body?.expired === true) PASS('feed_expired_410')
      else FAIL('feed_expired_410', `HTTP ${r.status} body=${JSON.stringify(r.body)}`)
    }
  } else {
    UNVERIFIED('feed_expired_410', `setup failed: ${eftErr.message}`)
  }

  // 4f. Completely unknown token → 404
  const garbage = `hvfeed_HV_VERIFY_${'z'.repeat(40)}`
  const r = await feedGet(garbage, 'feed_unknown_404')
  if (r.ok) {
    if (r.status === 404) PASS('feed_unknown_404')
    else                   FAIL('feed_unknown_404', `HTTP ${r.status}`)
  }
}

// ─── Phase 5: Audit trail ─────────────────────────────────────────────────────

async function phase5_audit () {
  console.log('\n── Phase 5: Audit trail ────────────────────────────────────────')

  if (!rows.signals.length) { UNVERIFIED('audit_write', 'no signal created — skipping'); return }

  const sigId = rows.signals[0]

  // Write via DB function
  const { error: wErr } = await svc.rpc('write_audit_event', {
    p_entity_type: 'signal',
    p_entity_id: sigId,
    p_action_type: 'update',
    p_performed_by_profile_id: ADMIN_ID,
    p_change_summary: 'HV_VERIFY audit test'
  })
  if (wErr) { FAIL('audit_write', wErr.message); return }
  PASS('audit_write')

  // Verify written
  const { data: events } = await svc.from('audit_events')
    .select('id, change_summary')
    .eq('entity_id', sigId)
    .ilike('change_summary', 'HV_VERIFY%')
    .limit(1)
  if (events?.length) PASS('audit_event_persisted')
  else                 FAIL('audit_event_persisted', 'event not found after write')

  // Immutability — UPDATE must be blocked
  if (events?.length) {
    const { error: upErr } = await svc.from('audit_events')
      .update({ change_summary: 'mutated' })
      .eq('id', events[0].id)
    if (upErr) PASS('audit_immutability_trigger')
    else        FAIL('audit_immutability_trigger', 'audit event was mutated — trigger not firing')
  }
}

// ─── Phase 6: RLS spot checks ─────────────────────────────────────────────────

async function phase6_rls () {
  console.log('\n── Phase 6: RLS ────────────────────────────────────────────────')

  if (!anon) { UNVERIFIED('rls_anon_signals', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set'); return }

  // Unauthenticated request must not read signals
  const { data: sigData, error: sigErr } = await anon.from('signals').select('id').limit(1)
  if (sigErr || !sigData?.length) PASS('rls_anon_cannot_read_signals')
  else                             FAIL('rls_anon_cannot_read_signals', 'anon can read signals')

  // Unauthenticated request must not read public_feed_tokens directly
  const { data: ftData, error: ftErr } = await anon.from('public_feed_tokens').select('id').limit(1)
  if (ftErr || !ftData?.length) PASS('rls_anon_cannot_read_feed_tokens')
  else                           FAIL('rls_anon_cannot_read_feed_tokens', 'anon can read public_feed_tokens directly')

  // Publish events should not be readable by anon
  const { data: peData, error: peErr } = await anon.from('publish_events').select('id').limit(1)
  if (peErr || !peData?.length) PASS('rls_anon_cannot_read_publish_events')
  else                           FAIL('rls_anon_cannot_read_publish_events', 'anon can read publish_events')
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

async function cleanup () {
  console.log('\n── Cleanup ─────────────────────────────────────────────────────')
  const errs = []

  async function del (table, col, ids, label) {
    if (!ids.length) return
    const { error } = await svc.from(table).delete().in(col, ids)
    if (error) errs.push({ label, error: error.message })
  }

  // FK-safe order:
  // public_feed_token_access_events → public_feed_tokens → publish_events → dossiers
  // signals → source_documents → sources
  await del('public_feed_token_access_events', 'public_feed_token_id', rows.ft,      'access_events')
  await del('public_feed_tokens',              'id',                   rows.ft,      'feed_tokens')

  // Revocation rows in publish_events (revokes_event_id → pe row)
  if (rows.pe.length)
    await svc.from('publish_events').delete().in('revokes_event_id', rows.pe)

  await del('publish_events', 'id', rows.pe, 'publish_events')
  // dossier_items cascade-deleted with dossier
  await del('dossiers',       'id', rows.dossiers, 'dossiers')
  // signal_evidence and review_queue_items cascade-deleted with signal
  await del('signals',        'id', rows.signals,  'signals')
  await del('source_documents','id', rows.docs,    'source_documents')
  await del('sources',        'id', rows.sources,  'sources')
  // workspace must be last — sources FK it (restrict)
  await del('workspaces',     'id', rows.workspaces, 'workspaces')

  if (!errs.length) {
    console.log('  ✅  All HV_VERIFY_ rows deleted')
  } else {
    console.log('  ⚠️   Some cleanup failed. Run this SQL in Supabase SQL Editor:\n')
    const q = (ids) => ids.map(i => `'${i}'`).join(', ') || 'null'
    console.log(`
delete from public_feed_token_access_events where public_feed_token_id in (${q(rows.ft)});
delete from public_feed_tokens where id in (${q(rows.ft)});
delete from publish_events where revokes_event_id in (${q(rows.pe)});
delete from publish_events where id in (${q(rows.pe)});
delete from dossier_items where dossier_id in (${q(rows.dossiers)});
delete from dossiers where id in (${q(rows.dossiers)});
delete from signal_evidence where signal_id in (${q(rows.signals)});
delete from review_queue_items where signal_id in (${q(rows.signals)});
delete from signals where id in (${q(rows.signals)});
delete from source_documents where id in (${q(rows.docs)});
delete from sources where id in (${q(rows.sources)});
delete from workspaces where id in (${q(rows.workspaces)});
    `.trim())
    errs.forEach(e => console.log(`  [${e.label}] ${e.error}`))
  }
}

// ─── Verdict ──────────────────────────────────────────────────────────────────

function verdict () {
  const v = k => results[k] || 'UNVERIFIED'
  const group = (...keys) => {
    if (keys.some(k => v(k) === 'FAIL'))        return 'FAIL'
    if (keys.some(k => v(k) === 'UNVERIFIED'))   return 'UNVERIFIED'
    return 'PASS'
  }
  const icon = s => s === 'PASS' ? '✅' : s === 'FAIL' ? '❌' : '⚠️ '

  const schema   = group('table_public_feed_tokens','table_public_feed_token_access_events',
                         'public_feed_tokens_columns','no_workspace_memberships_in_schema',
                         'workspace_members_exists','workspace_memberships_unreachable',
                         'is_workspace_member_runs')
  const publish  = group('publish_events_row','public_feed_tokens_row','feed_token_linked_to_publish_event')
  const active   = v('feed_active_200')
  const revoked  = v('feed_revoked_410')
  const expired  = v('feed_expired_410')
  const sanitize = group('feed_sanitization','feed_workspace_present')
  const rls      = group('rls_anon_cannot_read_signals','rls_anon_cannot_read_feed_tokens',
                         'rls_anon_cannot_read_publish_events')
  const audit    = group('audit_write','audit_event_persisted','audit_immutability_trigger')

  const allPass  = [schema,publish,active,revoked,expired,sanitize,rls,audit].every(s => s === 'PASS')

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
  console.log('Harbourview Live Verifier')
  console.log(`Supabase: ${SB_URL}`)
  console.log(`App:      ${APP_URL}`)

  try {
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
