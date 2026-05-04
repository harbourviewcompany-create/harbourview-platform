#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const DEFAULT_BASE_URL = 'https://harbourview-platform.vercel.app';
const baseUrl = (process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || DEFAULT_BASE_URL)
  .replace(/^([^h])/, 'https://$1')
  .replace(/\/$/, '');

const listingsSource = readFileSync('lib/marketplace/listings.ts', 'utf8');
const slugMatches = [...listingsSource.matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1]);
const sourceUrlMatches = [...listingsSource.matchAll(/sourceUrl:\s*'([^']+)'/g)].map((match) => match[1]);

const routes = [
  '/marketplace',
  '/marketplace/sell',
  '/marketplace/sell?type=wanted',
  '/marketplace/wanted',
  '/intake',
  ...slugMatches.map((slug) => `/marketplace/listings/${slug}`),
];

// Admin routes — expected to return 403 or auth redirect, not leak data
const adminRoutes = [
  '/admin',
  '/admin/inquiries',
  '/admin/listings',
];

// API routes to probe for leakage
const apiRoutes = [
  '/api/marketplace/capture',
  '/api/marketplace/quote',
  '/api/marketplace/listing-submission',
];

const forbiddenStrings = [
  'View source listing',
  'sourceUrl',
  'sourceName',
  'Evidence captured',
  'provenanceSummary',
  'sourceEvidence',
  'verificationStatus',
  'availabilityStatus',
  'sellerAuthorizationStatus',
  'review_status',
  'priority',
  'last_contacted_at',
  'next_follow_up_at',
  'internal_response_notes',
  'internal_notes',
  'private_notes',
  'service_role',
  'SUPABASE_SERVICE_ROLE_KEY',
  'internalReviewNotes',
  'reviewedBy',
  'lastReviewedAt',
  'nextReviewDueAt',
  ...sourceUrlMatches,
];

const failures = [];
const results = [];

async function probeRoute(route, expectForbidden = false) {
  const url = `${baseUrl}${route}`;
  let response;
  let html = '';
  try {
    response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        Accept: 'text/html',
        'User-Agent': 'HarbourviewProvenanceVisibilityProbe/1.1',
      },
    });
    html = await response.text();
  } catch (err) {
    failures.push(`${route} fetch error: ${err.message}`);
    results.push({ route, status: 'error', error: err.message, matches: [] });
    return;
  }

  const matches = forbiddenStrings.filter((value) => value && html.includes(value));
  results.push({ route, status: response.status, bytes: html.length, matches });

  if (expectForbidden) {
    // Admin routes must NOT return 200 anonymously
    if (response.status === 200) {
      failures.push(`${route} returned HTTP 200 anonymously — expected 403 or auth redirect`);
    }
    // Admin routes must not leak forbidden strings regardless
    for (const match of matches) {
      failures.push(`${route} leaked forbidden string: ${match}`);
    }
  } else {
    if (!response.ok) {
      failures.push(`${route} returned HTTP ${response.status}`);
    }
    for (const match of matches) {
      failures.push(`${route} leaked forbidden string: ${match}`);
    }
  }
}

// Probe public routes
for (const route of routes) {
  await probeRoute(route, false);
}

// Probe admin routes (expect 403/redirect, not 200)
for (const route of adminRoutes) {
  await probeRoute(route, true);
}

// Probe API routes with GET (expect non-200 but check for leakage in any response)
for (const route of apiRoutes) {
  const url = `${baseUrl}${route}`;
  let response;
  let body = '';
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'HarbourviewProvenanceVisibilityProbe/1.1' },
    });
    body = await response.text();
  } catch (err) {
    results.push({ route, status: 'error', error: err.message, matches: [] });
    continue;
  }
  const matches = forbiddenStrings.filter((value) => value && body.includes(value));
  results.push({ route, status: response.status, bytes: body.length, matches });
  for (const match of matches) {
    failures.push(`${route} (API) leaked forbidden string: ${match}`);
  }
}

console.log(JSON.stringify({ baseUrl, checkedAt: new Date().toISOString(), routes: results }, null, 2));

if (failures.length) {
  console.error('Production provenance visibility probe failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ok production public marketplace HTML contains no forbidden source/provenance strings');
