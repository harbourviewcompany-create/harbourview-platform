#!/usr/bin/env node
import { closeSmokeRows, getSupabaseConfig, restRequest } from './marketplace-smoke-lib.mjs';

const BASE_URL = (process.env.HARBOURVIEW_SMOKE_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const SMOKE_RUN_ID = `browser-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const SMOKE_EMAIL = `smoke+${SMOKE_RUN_ID}@harbourview.local`;
const SMOKE_NAME = `Harbourview Browser Smoke ${SMOKE_RUN_ID}`;
const SMOKE_COMPANY = `Harbourview Browser Smoke ${SMOKE_RUN_ID}`;
const SMOKE_MARKER = `HARBOURVIEW_BROWSER_SMOKE_TEST:${SMOKE_RUN_ID}`;
const writeEnabled = process.env.HARBOURVIEW_SMOKE_WRITE === '1';
const cleanupEnabled = process.env.HARBOURVIEW_SMOKE_CLEANUP === '1';
const isProductionTarget = BASE_URL.includes('harbourview-platform.vercel.app') || process.env.VERCEL_ENV === 'production';

function assertWriteGates() {
  if (!writeEnabled) {
    throw new Error('Browser smoke writes are disabled. Set HARBOURVIEW_SMOKE_WRITE=1.');
  }

  if (!cleanupEnabled) {
    throw new Error('Browser smoke cleanup is required. Set HARBOURVIEW_SMOKE_CLEANUP=1.');
  }

  if (isProductionTarget && process.env.HARBOURVIEW_ALLOW_PRODUCTION_SMOKE_WRITES !== '1') {
    throw new Error('Refusing production browser smoke writes. Set HARBOURVIEW_ALLOW_PRODUCTION_SMOKE_WRITES=1.');
  }
}

async function importPlaywright() {
  try {
    return await import('playwright');
  } catch (error) {
    throw new Error(
      `Playwright is required for browser smoke tests. Run via npx -y -p playwright npm run smoke:marketplace:browser, or install playwright in the runner. ${error instanceof Error ? error.message : ''}`,
    );
  }
}

async function waitForRow(config, expectedType) {
  const encodedEmail = encodeURIComponent(SMOKE_EMAIL);
  const encodedType = encodeURIComponent(expectedType);
  const path = `marketplace_inquiries?contact_email=eq.${encodedEmail}&inquiry_type=eq.${encodedType}&select=id,inquiry_type,status,contact_email,message,internal_notes,created_at&order=created_at.desc&limit=1`;
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    const { response, text } = await restRequest({
      url: config.url,
      key: config.serviceRoleKey,
      path,
    });

    if (!response.ok) {
      throw new Error(`service role verification failed with ${response.status}: ${text}`);
    }

    const rows = JSON.parse(text);
    const row = Array.isArray(rows) ? rows.find((candidate) => candidate.message?.includes(SMOKE_MARKER)) : null;
    if (row) return row;

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  throw new Error(`No Supabase row found for ${expectedType} and ${SMOKE_EMAIL}.`);
}

async function closeRows(config, ids) {
  const cleanup = await closeSmokeRows(config, ids);
  if (cleanup.skipped) {
    throw new Error('Cleanup skipped because SUPABASE_SERVICE_ROLE_KEY is missing.');
  }
  if (!cleanup.ok) {
    throw new Error(`Cleanup failed with ${cleanup.status}: ${cleanup.text}`);
  }
}

async function fillByName(page, name, value) {
  await page.locator(`[name="${name}"]`).fill(value);
}

async function selectByName(page, name, value) {
  await page.locator(`[name="${name}"]`).selectOption(value);
}

async function submitQuote(page) {
  await page.goto(`${BASE_URL}/marketplace/quote?listing=${encodeURIComponent(`Smoke Listing ${SMOKE_RUN_ID}`)}`, {
    waitUntil: 'networkidle',
  });

  await fillByName(page, 'volume', `1000 units ${SMOKE_MARKER}`);
  await selectByName(page, 'timeline', 'Future planning');
  await fillByName(page, 'budget', 'Smoke test only');
  await fillByName(page, 'supplierPreference', 'Smoke test only');
  await fillByName(page, 'requirements', `Browser quote smoke verification. ${SMOKE_MARKER}`);
  await fillByName(page, 'name', SMOKE_NAME);
  await fillByName(page, 'email', SMOKE_EMAIL);
  await fillByName(page, 'phone', '+1 555 0100');
  await fillByName(page, 'company', SMOKE_COMPANY);
  await selectByName(page, 'buyerType', 'Licensed Producer / Operator');
  await fillByName(page, 'targetMarket', 'Canada');

  await Promise.all([
    page.waitForSelector('[data-testid="quote-diagnostic-message"]', { timeout: 20_000 }),
    page.getByRole('button', { name: 'Request Quote' }).click(),
  ]);

  const diagnostic = await page.locator('[data-testid="quote-diagnostic-message"]').innerText();
  if (!diagnostic.includes('[QUOTE_OK]')) {
    throw new Error(`Quote browser submit did not report success: ${diagnostic}`);
  }
}

async function submitListing(page, listingType, expectedType) {
  await page.goto(`${BASE_URL}/marketplace/sell`, { waitUntil: 'networkidle' });

  await fillByName(page, 'name', SMOKE_NAME);
  await fillByName(page, 'email', SMOKE_EMAIL);
  await fillByName(page, 'company', SMOKE_COMPANY);
  await selectByName(page, 'listingType', listingType);
  await fillByName(page, 'title', `${listingType} Browser Smoke ${SMOKE_RUN_ID}`);
  await fillByName(page, 'price', 'Smoke test only');
  await fillByName(page, 'location', 'Canada');
  await fillByName(page, 'description', `Browser ${expectedType} verification. ${SMOKE_MARKER}`);

  await Promise.all([
    page.waitForSelector('[data-testid="listing-submission-diagnostic-message"]', { timeout: 20_000 }),
    page.getByRole('button', { name: 'Submit Listing' }).click(),
  ]);

  const diagnostic = await page.locator('[data-testid="listing-submission-diagnostic-message"]').innerText();
  if (!diagnostic.includes('[LISTING_SUBMISSION_OK]')) {
    throw new Error(`${expectedType} browser submit did not report success: ${diagnostic}`);
  }
}

assertWriteGates();

const config = getSupabaseConfig();
if (!config.serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for browser smoke verification and cleanup.');
}

const { chromium } = await importPlaywright();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
const insertedIds = [];

try {
  console.log(`browser smoke base=${BASE_URL}`);
  console.log(`browser smoke run=${SMOKE_RUN_ID}`);

  await submitQuote(page);
  const quoteRow = await waitForRow(config, 'quote_routing');
  insertedIds.push(quoteRow.id);
  console.log(`ok browser quote_routing:${quoteRow.id}`);

  await submitListing(page, 'New Product', 'listing_submission');
  const listingRow = await waitForRow(config, 'listing_submission');
  insertedIds.push(listingRow.id);
  console.log(`ok browser listing_submission:${listingRow.id}`);

  await submitListing(page, 'Wanted Request', 'wanted_request_submission');
  const wantedRow = await waitForRow(config, 'wanted_request_submission');
  insertedIds.push(wantedRow.id);
  console.log(`ok browser wanted_request_submission:${wantedRow.id}`);
} finally {
  await browser.close();

  if (insertedIds.length > 0) {
    await closeRows(config, insertedIds);
    console.log(`ok cleanup:closed ${insertedIds.length} browser smoke rows`);
  }
}
