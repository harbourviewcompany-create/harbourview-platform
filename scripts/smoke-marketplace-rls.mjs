#!/usr/bin/env node
import {
  assertServiceRoleCanRead,
  closeSmokeRows,
  getSupabaseConfig,
  makeListingSubmissionPayload,
  restRequest,
} from './marketplace-smoke-lib.mjs';

if (process.env.HARBOURVIEW_SMOKE_WRITE !== '1') {
  console.log('RLS smoke is write-based. Set HARBOURVIEW_SMOKE_WRITE=1 to run it.');
  process.exit(0);
}

if (
  process.env.VERCEL_ENV === 'production' &&
  process.env.HARBOURVIEW_ALLOW_PRODUCTION_SMOKE_WRITES !== '1'
) {
  throw new Error('Refusing production write smoke. Set HARBOURVIEW_ALLOW_PRODUCTION_SMOKE_WRITES=1 to override.');
}

const config = getSupabaseConfig();
const validPayload = makeListingSubmissionPayload();
const insertedIds = [validPayload.id];

async function expectAllowed(label, request) {
  const { response, text } = await request();
  if (!response.ok) throw new Error(`${label} expected allowed, got ${response.status}: ${text}`);
  console.log(`ok allowed:${label}`);
  return { response, text };
}

async function expectBlockedByStatusOrEmptyRepresentation(label, request) {
  const { response, text } = await request();
  if (!response.ok) {
    console.log(`ok blocked:${label}:${response.status}`);
    return { response, text };
  }

  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${label} expected blocked or empty representation, got non-JSON success body: ${text}`);
  }

  if (Array.isArray(parsed) && parsed.length === 0) {
    console.log(`ok blocked:${label}:empty-representation`);
    return { response, text };
  }

  throw new Error(`${label} expected blocked or empty representation, got ${response.status}: ${text}`);
}

await expectAllowed('anon valid listing_submission insert', () =>
  restRequest({
    url: config.url,
    key: config.anonKey,
    path: 'marketplace_inquiries',
    method: 'POST',
    body: validPayload,
  }),
);

const serviceRead = await assertServiceRoleCanRead(config, validPayload.id);
if (serviceRead.skipped) {
  console.log('service role verification skipped: SUPABASE_SERVICE_ROLE_KEY is not set.');
} else {
  console.log(`ok service-role-read:${validPayload.id}`);
}

await expectBlockedByStatusOrEmptyRepresentation('anon select', () =>
  restRequest({
    url: config.url,
    key: config.anonKey,
    path: `marketplace_inquiries?id=eq.${validPayload.id}&select=id`,
  }),
);

await expectBlockedByStatusOrEmptyRepresentation('anon update', () =>
  restRequest({
    url: config.url,
    key: config.anonKey,
    path: `marketplace_inquiries?id=eq.${validPayload.id}&select=id,status`,
    method: 'PATCH',
    prefer: 'return=representation',
    body: { status: 'closed' },
  }),
);

const internalNotesPayload = makeListingSubmissionPayload({
  internal_notes: 'HARBOURVIEW_SMOKE_TEST: anon should not be able to insert internal notes.',
});

await expectBlockedByStatusOrEmptyRepresentation('anon insert with internal_notes', () =>
  restRequest({
    url: config.url,
    key: config.anonKey,
    path: 'marketplace_inquiries?select=id,internal_notes',
    method: 'POST',
    prefer: 'return=representation',
    body: internalNotesPayload,
  }),
);

if (process.env.HARBOURVIEW_SMOKE_CLEANUP === '1') {
  const cleanup = await closeSmokeRows(config, insertedIds);
  if (cleanup.skipped) {
    console.log('cleanup skipped: SUPABASE_SERVICE_ROLE_KEY is not set.');
  } else if (!cleanup.ok) {
    throw new Error(`cleanup failed with ${cleanup.status}: ${cleanup.text}`);
  } else {
    console.log(`ok cleanup:closed ${insertedIds.length} smoke row`);
  }
} else {
  console.log('cleanup not requested: one valid RLS smoke row remains with status=received.');
}
