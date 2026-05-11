#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';

const PROJECT_REF = 'zvxdgdkukjrrwamdpqrg';
const MARKER = 'hv_signal_runtime_verify_20260511';
const DEFAULT_BASE_URL = 'https://harbourview.vercel.app';
const DEFAULT_OUTPUT = 'docs/control/evidence/signal-engine-runtime-verification.latest.json';
const FORBIDDEN = [
  'signals.signals',
  'canonical_source_url',
  'review_status',
  'public_safe',
  'publish_to_public',
  'sourceUrl',
  'sourceName',
  'Evidence captured',
  'provenanceSummary',
  'sourceEvidence',
  'verificationStatus',
  'availabilityStatus',
  'sellerAuthorizationStatus',
  'internalReviewNotes',
  'reviewedBy',
  'lastReviewedAt',
  'nextReviewDueAt',
  `https://example.invalid/${MARKER}`,
  MARKER,
];

const proof = { marker: MARKER, startedAt: new Date().toISOString(), finishedAt: null, decision: 'HOLD', checks: [], cleanup: [], failures: [] };
const users = [];

function at() { return new Date().toISOString(); }
function pass(name, details = {}) { proof.checks.push({ name, status: 'PASS', details, at: at() }); }
function fail(name, details = {}) { proof.checks.push({ name, status: 'FAIL', details, at: at() }); proof.failures.push({ name, details }); }
function clean(name, ok, details = {}) { proof.cleanup.push({ name, status: ok ? 'PASS' : 'FAIL', details, at: at() }); if (!ok) proof.failures.push({ name: `cleanup:${name}`, details }); }
function env(name) { const value = process.env[name]?.trim(); if (!value) throw new Error(`Missing required environment variable: ${name}`); return value; }
function opt(name, fallback = '') { return process.env[name]?.trim() || fallback; }
function arg(name) { const prefix = `--${name}=`; return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length) || ''; }
function base64Password() { return `Hv-${randomBytes(18).toString('base64url')}!9aZ`; }
function encoded(value) { return encodeURIComponent(value); }
function len(json) { return Array.isArray(json) ? json.length : 0; }

async function read(response) {
  const text = await response.text();
  try { return { status: response.status, ok: response.ok, text, json: text ? JSON.parse(text) : null }; }
  catch { return { status: response.status, ok: response.ok, text, json: null }; }
}

async function request(label, url, init, expectOk = true) {
  const result = await read(await fetch(url, init));
  if (expectOk && !result.ok) throw new Error(`${label} failed ${result.status}: ${result.text.slice(0, 400)}`);
  return result;
}

function headers(apiKey, token = apiKey, schema = null, prefer = null) {
  const h = { apikey: apiKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (schema) { h['Accept-Profile'] = schema; h['Content-Profile'] = schema; }
  if (prefer) h.Prefer = prefer;
  return h;
}

async function rest({ supabaseUrl, apiKey, token, schema = 'public', path, method = 'GET', body, prefer, expectOk = true }) {
  return request(`${method} ${schema}.${path}`, `${supabaseUrl}/rest/v1/${path}`, { method, headers: headers(apiKey, token, schema, prefer), body: body === undefined ? undefined : JSON.stringify(body) }, expectOk);
}

async function authAdmin({ supabaseUrl, serviceKey, path, method = 'GET', body, expectOk = true }) {
  return request(`${method} auth.admin.${path}`, `${supabaseUrl}/auth/v1/admin/${path}`, { method, headers: headers(serviceKey), body: body === undefined ? undefined : JSON.stringify(body) }, expectOk);
}

async function createUser({ supabaseUrl, serviceKey, roleLabel, password }) {
  const email = `hv-signal-${roleLabel}-runtime-verify-20260511-${randomUUID()}@harbourview.invalid`;
  const result = await authAdmin({ supabaseUrl, serviceKey, path: 'users', method: 'POST', body: { email, password, email_confirm: true, user_metadata: { purpose: MARKER, roleLabel }, app_metadata: { purpose: MARKER } } });
  if (!result.json?.id) throw new Error(`Auth user creation did not return id for ${roleLabel}`);
  return { id: result.json.id, email, password, roleLabel };
}

async function signIn({ supabaseUrl, anonKey, email, password }) {
  const result = await request(`signIn ${email}`, `${supabaseUrl}/auth/v1/token?grant_type=password`, { method: 'POST', headers: headers(anonKey), body: JSON.stringify({ email, password }) });
  if (!result.json?.access_token) throw new Error(`Sign-in did not return access token for ${email}`);
  return result.json;
}

async function getAdminUserId({ supabaseUrl, serviceKey }) {
  const result = await rest({ supabaseUrl, apiKey: serviceKey, token: serviceKey, path: 'user_roles?role=eq.admin&select=user_id&limit=1' });
  const userId = result.json?.[0]?.user_id;
  if (!userId) throw new Error('No admin user found in public.user_roles');
  return userId;
}

async function setup({ supabaseUrl, anonKey, serviceKey }) {
  const password = base64Password();
  const adminUserId = await getAdminUserId({ supabaseUrl, serviceKey });
  pass('preflight:admin-user-role', { adminUserId });
  const identities = [
    { roleLabel: 'operator', role: 'operator', expected: 'allow' },
    { roleLabel: 'analyst', role: 'analyst', expected: 'deny' },
    { roleLabel: 'viewer', role: 'viewer', expected: 'deny' },
    { roleLabel: 'missing-role', role: null, expected: 'deny' },
  ];
  for (const identity of identities) {
    const user = Object.assign(await createUser({ supabaseUrl, serviceKey, roleLabel: identity.roleLabel, password }), identity);
    users.push(user);
    if (user.role) await rest({ supabaseUrl, apiKey: serviceKey, token: serviceKey, path: 'user_roles', method: 'POST', body: { user_id: user.id, role: user.role, created_by: adminUserId }, prefer: 'return=representation' });
    user.session = await signIn({ supabaseUrl, anonKey, email: user.email, password });
  }
  pass('setup:temporary-auth-users', { count: users.length });
  await rest({ supabaseUrl, apiKey: serviceKey, token: serviceKey, schema: 'signals', path: 'signals?on_conflict=slug', method: 'POST', prefer: 'resolution=merge-duplicates,return=representation', body: {
    slug: MARKER,
    headline: 'Harbourview Signal Engine runtime verification',
    signal_type: 'verification',
    review_status: 'draft',
    public_safe: false,
    publish_to_public: false,
    signal_date: new Date().toISOString().slice(0, 10),
    country_name: 'Verification',
    region: 'Verification',
    regulator_name: 'Verification',
    canonical_source_url: `https://example.invalid/${MARKER}`,
    public_summary: 'Temporary runtime verification row.',
    public_implication: 'Temporary runtime verification row.'
  }});
  pass('setup:signal-row', { slug: MARKER });
}

async function selectMarker(ctx, token) {
  return rest({ ...ctx, token, schema: 'signals', path: `signals?slug=eq.${encoded(MARKER)}&select=id,slug,public_summary`, expectOk: false });
}
async function insertSignal(ctx, token, slug) {
  return rest({ ...ctx, token, schema: 'signals', path: 'signals', method: 'POST', prefer: 'return=representation', expectOk: false, body: { slug, headline: `Runtime verification ${slug}`, signal_type: 'verification', review_status: 'draft', public_safe: false, publish_to_public: false, signal_date: new Date().toISOString().slice(0, 10) } });
}
async function updateSignal(ctx, token, slug, label) {
  return rest({ ...ctx, token, schema: 'signals', path: `signals?slug=eq.${encoded(slug)}`, method: 'PATCH', prefer: 'return=representation', expectOk: false, body: { public_summary: `Runtime update by ${label}` } });
}
async function deleteSignal(ctx, token, slug) {
  return rest({ ...ctx, token, schema: 'signals', path: `signals?slug=eq.${encoded(slug)}`, method: 'DELETE', prefer: 'return=representation', expectOk: false });
}

function allowed(r) { return r.selectVisible === 1 && r.insertOk && r.updateCount === 1 && r.deleteCount === 1; }
function denied(r) { return r.selectVisible === 0 && !r.insertOk && r.updateCount === 0 && r.deleteCount === 0; }

async function verifySupabaseMatrix({ supabaseUrl, anonKey }) {
  const ctx = { supabaseUrl, apiKey: anonKey };
  for (const user of users) {
    const token = user.session.access_token;
    const insertSlug = `${MARKER}_${user.roleLabel.replace(/-/g, '_')}_insert`;
    const selected = await selectMarker(ctx, token);
    const inserted = await insertSignal(ctx, token, insertSlug);
    const updated = await updateSignal(ctx, token, user.expected === 'allow' ? insertSlug : MARKER, user.roleLabel);
    const deleted = await deleteSignal(ctx, token, insertSlug);
    const result = { identity: user.roleLabel, expected: user.expected, selectStatus: selected.status, selectVisible: selected.ok ? len(selected.json) : 0, insertStatus: inserted.status, insertOk: inserted.ok, updateStatus: updated.status, updateCount: updated.ok ? len(updated.json) : 0, deleteStatus: deleted.status, deleteCount: deleted.ok ? len(deleted.json) : 0 };
    const ok = user.expected === 'allow' ? allowed(result) : denied(result);
    ok ? pass(`supabase-client:${user.roleLabel}`, result) : fail(`supabase-client:${user.roleLabel}`, result);
  }
  const selected = await selectMarker(ctx, anonKey);
  const inserted = await insertSignal(ctx, anonKey, `${MARKER}_anonymous_insert`);
  const updated = await updateSignal(ctx, anonKey, MARKER, 'anonymous');
  const deleted = await deleteSignal(ctx, anonKey, `${MARKER}_anonymous_insert`);
  const result = { identity: 'anonymous', expected: 'deny', selectStatus: selected.status, selectVisible: selected.ok ? len(selected.json) : 0, insertStatus: inserted.status, insertOk: inserted.ok, updateStatus: updated.status, updateCount: updated.ok ? len(updated.json) : 0, deleteStatus: deleted.status, deleteCount: deleted.ok ? len(deleted.json) : 0 };
  denied(result) ? pass('supabase-client:anonymous', result) : fail('supabase-client:anonymous', result);
}

async function verifyAdmin(baseUrl) {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch (error) { throw new Error(`Playwright required. Install with npm install --no-save playwright && npx playwright install chromium. ${error.message}`); }
  const browser = await chromium.launch({ headless: true });
  try {
    for (const user of users) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const result = { identity: user.roleLabel, expected: user.expected === 'allow' ? 'allow-admin' : 'deny-admin' };
      try {
        await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'domcontentloaded' });
        await page.locator('input[name="email"]').fill(user.email);
        await page.locator('input[name="password"]').fill(user.password);
        await Promise.all([page.waitForURL(/\/admin(\/login\?error=|\/inquiries|$)/, { timeout: 15000 }).catch(() => null), page.locator('button[type="submit"]').click()]);
        const text = await page.textContent('body').catch(() => '');
        result.finalUrl = page.url();
        result.bodySample = (text || '').slice(0, 300);
        result.pass = user.expected === 'allow' ? result.finalUrl.includes('/admin') && !result.finalUrl.includes('/admin/login?error=') : result.finalUrl.includes('/admin/login?error=forbidden') || /does not have the admin or operator role/i.test(text || '');
      } catch (error) { result.error = error.message; result.pass = false; }
      finally { await context.close(); }
      result.pass ? pass(`admin-playwright:${user.roleLabel}`, result) : fail(`admin-playwright:${user.roleLabel}`, result);
    }
    const context = await browser.newContext();
    const page = await context.newPage();
    const anon = { identity: 'anonymous', expected: 'deny-admin' };
    try {
      const response = await page.goto(`${baseUrl}/admin`, { waitUntil: 'domcontentloaded' });
      const text = await page.textContent('body').catch(() => '');
      anon.status = response?.status() || null;
      anon.finalUrl = page.url();
      anon.bodySample = (text || '').slice(0, 300);
      anon.vercelAuth = /Vercel Authentication|Authentication Required/i.test(text || '');
      anon.pass = !anon.vercelAuth && (anon.status === 401 || anon.finalUrl.includes('/admin/login') || /unauthorized|sign in|admin sign in/i.test(text || ''));
    } catch (error) { anon.error = error.message; anon.pass = false; }
    finally { await context.close(); }
    anon.pass ? pass('admin-playwright:anonymous', anon) : fail('admin-playwright:anonymous', anon);
  } finally { await browser.close(); }
}

async function verifyPublicLeakage(baseUrl) {
  for (const route of ['/signals', '/admin']) {
    const response = await fetch(`${baseUrl}${route}`, { redirect: 'manual' });
    const text = await response.text();
    const matches = FORBIDDEN.filter((value) => text.includes(value));
    const vercelAuth = /Vercel Authentication|Authentication Required/i.test(text);
    const statusOk = route === '/signals' ? response.status === 200 : [200, 302, 303, 401, 403].includes(response.status);
    const result = { status: response.status, forbiddenMatches: matches, vercelAuth, bodySample: text.slice(0, 500) };
    statusOk && matches.length === 0 && !vercelAuth ? pass(`public-leakage:${route}`, result) : fail(`public-leakage:${route}`, result);
  }
}

async function cleanup({ supabaseUrl, serviceKey }) {
  const ctx = { supabaseUrl, apiKey: serviceKey, token: serviceKey };
  for (const slug of [MARKER, `${MARKER}_operator_insert`, `${MARKER}_analyst_insert`, `${MARKER}_viewer_insert`, `${MARKER}_missing_role_insert`, `${MARKER}_anonymous_insert`]) {
    await deleteSignal(ctx, serviceKey, slug).catch((error) => clean(`delete signal ${slug}`, false, { error: error.message }));
  }
  for (const user of users) {
    if (user.role) await rest({ ...ctx, path: `user_roles?user_id=eq.${encoded(user.id)}&role=eq.${encoded(user.role)}`, method: 'DELETE', prefer: 'return=representation', expectOk: false }).catch((error) => clean(`delete role ${user.roleLabel}`, false, { error: error.message }));
  }
  for (const user of users) {
    const result = await authAdmin({ supabaseUrl, serviceKey, path: `users/${encoded(user.id)}`, method: 'DELETE', expectOk: false }).catch((error) => ({ status: 0, ok: false, error: error.message }));
    clean(`delete auth user ${user.roleLabel}`, [200, 204, 404].includes(result.status), { status: result.status, error: result.error });
  }
  const signalRows = await rest({ ...ctx, schema: 'signals', path: `signals?slug=like.${encoded(`${MARKER}%`)}&select=slug`, expectOk: false });
  clean('signal rows removed', signalRows.ok && len(signalRows.json) === 0, { status: signalRows.status, rows: signalRows.json });
  const ids = users.map((user) => encoded(user.id)).join(',');
  const roleRows = ids ? await rest({ ...ctx, path: `user_roles?user_id=in.(${ids})&select=user_id,role`, expectOk: false }) : { ok: true, status: 200, json: [] };
  clean('role rows removed', roleRows.ok && len(roleRows.json) === 0, { status: roleRows.status, rows: roleRows.json });
}

async function writeProof() {
  proof.finishedAt = at();
  proof.decision = proof.failures.length === 0 ? 'GO' : 'HOLD';
  const outputPath = resolve(opt('HV_SIGNAL_VERIFY_OUTPUT', DEFAULT_OUTPUT));
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(proof, null, 2)}\n`);
  console.log(JSON.stringify({ decision: proof.decision, outputPath, failures: proof.failures }, null, 2));
}

async function main() {
  const token = env('HV_SIGNAL_VERIFY_TOKEN');
  const confirmToken = arg('token') || env('HV_SIGNAL_VERIFY_TOKEN_CONFIRM');
  if (opt('HV_SIGNAL_RUNTIME_VERIFY') !== '1') throw new Error('Refusing to run unless HV_SIGNAL_RUNTIME_VERIFY=1');
  if (token !== confirmToken) throw new Error('Refusing to run: verification token mismatch');
  const supabaseUrl = opt('NEXT_PUBLIC_SUPABASE_URL', `https://${PROJECT_REF}.supabase.co`).replace(/\/$/, '');
  if (new URL(supabaseUrl).hostname !== `${PROJECT_REF}.supabase.co`) throw new Error(`Refusing Supabase URL outside ${PROJECT_REF}`);
  const anonKey = opt('NEXT_PUBLIC_SUPABASE_ANON_KEY') || env('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  const baseUrl = opt('HARBOURVIEW_PUBLIC_BASE_URL', DEFAULT_BASE_URL).replace(/\/$/, '');
  pass('preflight:target', { supabaseUrl: new URL(supabaseUrl).host, baseUrl });
  try {
    await setup({ supabaseUrl, anonKey, serviceKey });
    await verifySupabaseMatrix({ supabaseUrl, anonKey });
    await verifyAdmin(baseUrl);
    await verifyPublicLeakage(baseUrl);
  } catch (error) {
    fail('runtime verification aborted', { error: error.message, stack: error.stack });
  } finally {
    await cleanup({ supabaseUrl, serviceKey }).catch((error) => clean('cleanup execution', false, { error: error.message }));
    await writeProof();
  }
  if (proof.decision !== 'GO') process.exit(1);
}

main().catch(async (error) => {
  fail('unhandled runtime verification failure', { error: error.message, stack: error.stack });
  await writeProof();
  process.exit(1);
});
