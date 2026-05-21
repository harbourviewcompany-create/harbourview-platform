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
    assert(!/internal review notes|view source listing|evidence captured/i.test(body), `${route} leaked admin/private provenance fields`, failures);
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
      assert(!/internal review notes|view source listing|evidence captured/i.test(body), `${route} leaked admin/private provenance fields`, failures);
      console.log(`ok sell route ${route} -> ${status}${location ? ` (${location})` : ''}`);
    }
  }
  assert(sellMatched, `Expected one sell route to be reachable: ${sellCandidates.join(' or ')}`, failures);

  const adminRes = await request.get(`${BASE_URL}/admin`, { failOnStatusCode: false, maxRedirects: 0 });
  const adminStatus = adminRes.status();
  const adminLocation = adminRes.headers()['location'] || '';
  const adminBody = await getText(adminRes);
  const denied = adminStatus === 401 || adminStatus === 403 || (adminStatus >= 300 && adminStatus < 400);
  assert(denied, `/admin expected anonymous denial (401/403/redirect), received ${adminStatus}`, failures);
  assert(!/internal review notes|view source listing|evidence captured/i.test(adminBody), '/admin leaked admin/private provenance fields to anonymous user', failures);
  console.log(`ok admin /admin denied anonymous -> ${adminStatus}${adminLocation ? ` (${adminLocation})` : ''}`);

  if (failures.length) {
    console.error('Playwright public/admin access checks failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('ok playwright integration checks validated public routes and anonymous admin denial');
} finally {
  await context.close();
  await browser.close();
}
