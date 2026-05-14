#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const forbidden = [
  'View source listing','sourceUrl','sourceName','Evidence captured','provenanceSummary','sourceEvidence','verificationStatus','availabilityStatus','sellerAuthorizationStatus','internalReviewNotes','reviewedBy','lastReviewedAt','nextReviewDueAt',
];

const files = [
  'app/marketplace/page.tsx','app/marketplace/listings/page.tsx','app/marketplace/services/page.tsx','app/marketplace/new-products/page.tsx','app/supplier-directory/page.tsx','components/ListingCard.tsx','components/marketplace/MarketplaceListingCard.tsx','lib/marketplace/publicListings.ts'
];

const failures = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const token of forbidden) {
    if (text.includes(token)) failures.push(`static leak token '${token}' in ${file}`);
  }
}

const baseUrl = process.env.HARBOURVIEW_PUBLIC_BASE_URL;
if (baseUrl) {
  const routes = ['/marketplace','/marketplace/listings','/marketplace/services','/supplier-directory'];
  for (const route of routes) {
    try {
      const res = await fetch(`${baseUrl}${route}`);
      const html = await res.text();
      for (const token of forbidden) {
        if (html.includes(token)) failures.push(`runtime leak token '${token}' on ${route}`);
      }
    } catch (error) {
      failures.push(`runtime probe failed for ${route}: ${error.message}`);
    }
  }
}

if (failures.length) {
  console.error('FAIL public leakage probe');
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}

console.log(`PASS public leakage probe (${files.length} static files${baseUrl ? ' + runtime routes' : ''})`);
