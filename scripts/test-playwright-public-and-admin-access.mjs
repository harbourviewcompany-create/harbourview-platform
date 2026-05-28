#!/usr/bin/env node
const BASE_URL = (process.env.HARBOURVIEW_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

async function importPlaywright() {
  try {
    return await import('playwright');
  } catch (error) {
    throw new Error(`Playwright is required. Run via: npx -y -p playwright node scripts/test-playwright-public-and-admin-access.mjs. ${error instanceof Error ? error.message : ''}`);
  }
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

async function getText(response) {
  try { return await response.text(); } catch { return ''; }
}

const privateLeakagePattern = /internal review notes|view source listing|evidence captured|provenance summary|source evidence|seller status|deal dashboard|active deals|prime score/i;
const failures = [];
const { chromium } = await importPlaywright();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const request = context.request;

try {
  const publicRoutes = ['/', '/marketplace', '/marketplace/wanted', '/intelligence', '/signals', '/intake'];
  for (const route of publicRoutes) {
    const res = await request.get(`${BASE_URL}${route}`, { failOnStatusCode: false });
    const body = await getText(res);
    assert(res.status() === 200, `${route} expected HTTP 200, received ${res.status()}`, failures);
    assert(!privateLeakagePattern.test(body), `${route} leaked admin/private provenance fields`, failures);
    console.log(`ok public ${route} -> ${res.status()}`);
  }

  const sellCandidates = ['/marketplace/sell', '/submit-listing'];
  let sellMatched = false;
  for (const route of sellCandidates) {
    const res = await request.get(`${BASE_URL}${route}`, { failOnStatusCode: false });
    const status = res.status();
    const body = await getText(res);
    const location = res.headers()['location'] || '';
    const valid = status === 200 || (status >= 300 && status < 400);
    if (valid) {
      sellMatched = true;
      assert(!privateLeakagePattern.test(body), `${route} leaked admin/private provenance fields`, failures);
      console.log(`ok sell route ${route} -> ${status}${location ? ` (${location})` : ''}`);
    }
  }
  assert(sellMatched, `Expected one sell route to be reachable: ${sellCandidates.join(' or ')}`, failures);

  const adminRoutes = ['/admin', '/admin/hub', '/admin/inquiries', '/admin/listings', '/admin/deal-dashboard'];
  for (const route of adminRoutes) {
    const res = await request.get(`${BASE_URL}${route}`, { failOnStatusCode: false, maxRedirects: 0 });
    const status = res.status();
    const location = res.headers()['location'] || '';
    const body = await getText(res);
    const denied = status === 401 || status === 403 || (status >= 300 && status < 400);
    assert(denied, `${route} expected anonymous denial (401/403/redirect), received ${status}`, failures);
    assert(!privateLeakagePattern.test(body), `${route} leaked admin/private fields to anonymous user`, failures);
    console.log(`ok admin ${route} denied anonymous -> ${status}${location ? ` (${location})` : ''}`);
  }

  const dealflowPost = await request.post(`${BASE_URL}/api/genetics-routing/dealflow`, {
    failOnStatusCode: false,
    data: { recordId: '00000000-0000-4000-8000-000000000000', action: 'mark_engaged' },
  });
  const dealflowStatus = dealflowPost.status();
  const dealflowBody = await getText(dealflowPost);
  assert(dealflowStatus === 401 || dealflowStatus === 403, `/api/genetics-routing/dealflow expected anonymous 401/403, received ${dealflowStatus}`, failures);
  assert(!/no_client|admin_data_client_unconfigured|dealflow_read_failed|dealflow_update_failed|dealflow_event_insert_failed/.test(dealflowBody), 'dealflow route reached service-role/Supabase path before auth denial');
  console.log(`ok admin POST /api/genetics-routing/dealflow denied anonymous before service-role work -> ${dealflowStatus}`);

  if (failures.length) {
    console.error('Playwright public/admin access checks failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('ok playwright integration checks validated public routes, anonymous admin denial, and pre-auth dealflow denial');
} finally {
  await context.close();
  await browser.close();
}
