#!/usr/bin/env node
import {
  assertPayloadShape,
  closeSmokeRows,
  getSupabaseConfig,
  insertInquiry,
  makeListingInquiryPayload,
  makeQuotePayload,
} from './marketplace-smoke-lib.mjs';

const writeEnabled = process.env.HARBOURVIEW_SMOKE_WRITE === '1';
const cleanupEnabled = process.env.HARBOURVIEW_SMOKE_CLEANUP === '1';

const checks = [
  ['quote request', makeQuotePayload()],
  ['listing inquiry', makeListingInquiryPayload()],
];

for (const [name, payload] of checks) {
  assertPayloadShape(name, payload);
  console.log(`ok payload:${name}`);
}

if (!writeEnabled) {
  console.log('dry-run only: set HARBOURVIEW_SMOKE_WRITE=1 to insert smoke rows.');
  process.exit(0);
}

if (
  process.env.VERCEL_ENV === 'production' &&
  process.env.HARBOURVIEW_ALLOW_PRODUCTION_SMOKE_WRITES !== '1'
) {
  throw new Error('Refusing production write smoke. Set HARBOURVIEW_ALLOW_PRODUCTION_SMOKE_WRITES=1 to override.');
}

const config = getSupabaseConfig();
const insertedIds = [];

for (const [name, payload] of checks) {
  const { response, text } = await insertInquiry(config, payload);
  if (!response.ok) {
    throw new Error(`${name} insert failed with ${response.status}: ${text}`);
  }

  insertedIds.push(payload.id);
  console.log(`ok insert:${name}:${payload.id}`);
}

if (cleanupEnabled) {
  const cleanup = await closeSmokeRows(config, insertedIds);
  if (cleanup.skipped) {
    console.log('cleanup skipped: SUPABASE_SERVICE_ROLE_KEY is not set.');
  } else if (!cleanup.ok) {
    throw new Error(`cleanup failed with ${cleanup.status}: ${cleanup.text}`);
  } else {
    console.log(`ok cleanup:closed ${insertedIds.length} smoke rows`);
  }
} else {
  console.log('cleanup not requested: smoke rows remain with status=received.');
}
