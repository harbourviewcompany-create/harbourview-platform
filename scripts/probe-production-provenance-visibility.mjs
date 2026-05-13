#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const DEFAULT_BASE_URL = 'https://harbourview.vercel.app';
const baseUrl = (process.env.HARBOURVIEW_PUBLIC_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || DEFAULT_BASE_URL)
  .replace(/^([^h])/, 'https://$1')
  .replace(/\/$/, '');

const listingsSource = readFileSync('lib/marketplace/listings.ts', 'utf8');
const slugMatches = [...listingsSource.matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1]);
const sourceUrlMatches = [...listingsSource.matchAll(/sourceUrl:\s*'([^']+)'/g)].map((match) => match[1]);
const categoryRoutes = [
  'consumables',
  'cannabis-inventory',
  'new-products',
  'used-surplus',
  'services',
  'business-opportunities',
].map((slug) => `/marketplace/${slug}`);

const routes = [
  '/marketplace',
  '/marketplace/listings',
  ...categoryRoutes,
  '/marketplace/sell',
  '/marketplace/sell?type=wanted',
  '/marketplace/wanted',
  '/intake',
  ...slugMatches.map((slug) => `/marketplace/listings/${slug}`),
];

const adminRoutes = [
  '/admin',
  '/admin/inquiries',
  '/admin/listings',
  '/admin/sources',
  '/admin/candidates',
];

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
  'source_registry',
  'source_snapshots',
  'marketplace_candidates',
  'candidate_review_events',
  'captured_url',
  'captured_text',
  'raw_html_hash',
  'confidence_score',
  'commercial_relevance_score',
  'compliance_risk_score',
  'supplier_verified',
  'seller_authorization_status',
  'certifications_claimed',
  'certifications_verified',
  'coa_available',
  'expiry_date',
  'lot_tracking_available',
  'requires_license_review',
  'restricted_item',
  'review_notes',
  'analyst notes',
  'raw evidence',
  'Supplier Directory',
  'contactEmail',
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
        'User-Agent': 'HarbourviewProvenanceVisibilityProbe/1.2',
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
    if (response.status === 200) {
      failures.push(`${route} returned HTTP 200 anonymously — expected 403 or auth redirect`);
    }
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

for (const route of routes) {
  await probeRoute(route, false);
}

for (const route of adminRoutes) {
  await probeRoute(route, true);
}

for (const route of apiRoutes) {
  const url = `${baseUrl}${route}`;
  let response;
  let body = '';
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'HarbourviewProvenanceVisibilityProbe/1.2' },
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
