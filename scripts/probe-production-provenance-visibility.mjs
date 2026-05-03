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
  '/marketplace/listings',
  ...slugMatches.map((slug) => `/marketplace/listings/${slug}`),
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
  'internalReviewNotes',
  'reviewedBy',
  'lastReviewedAt',
  'nextReviewDueAt',
  ...sourceUrlMatches,
];

const failures = [];
const results = [];

for (const route of routes) {
  const url = `${baseUrl}${route}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'HarbourviewProvenanceVisibilityProbe/1.0',
    },
  });
  const html = await response.text();
  const matches = forbiddenStrings.filter((value) => value && html.includes(value));

  results.push({ route, status: response.status, bytes: html.length, matches });

  if (!response.ok) {
    failures.push(`${route} returned HTTP ${response.status}`);
  }

  for (const match of matches) {
    failures.push(`${route} leaked forbidden string: ${match}`);
  }
}

console.log(JSON.stringify({ baseUrl, checkedAt: new Date().toISOString(), routes: results }, null, 2));

if (failures.length) {
  console.error('Production provenance visibility probe failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ok production public marketplace HTML contains no forbidden source/provenance strings');
