import { readFileSync } from 'node:fs';

const PUBLIC_FILES = [
  'app/marketplace/page.tsx',
  'app/marketplace/listings/page.tsx',
  'app/marketplace/listings/[slug]/page.tsx',
  'components/marketplace/MarketplaceListingCard.tsx'
];

const ADMIN_FILES = [
  'app/admin/layout.tsx',
  'app/admin/listings/page.tsx'
];

const PUBLIC_FORBIDDEN_PATTERNS = [
  /View source listing/i,
  /Evidence captured/i,
  /Provenance and review/i,
  /Provenance summary/i,
  /Internal review notes/i,
  /Internal-only source/i,
  /listing\.sourceUrl/,
  /listing\.sourceName/,
  /listing\.sourceType/,
  /listing\.sourceEvidence/,
  /listing\.provenanceSummary/,
  /listing\.internalReviewNotes/,
  /listing\.verificationStatus/,
  /listing\.availabilityStatus/,
  /listing\.sellerAuthorizationStatus/,
  /listing\.lastReviewedAt/,
  /listing\.nextReviewDueAt/,
  /listing\.confidenceScore/,
  /listing\.monetizationPath/,
  /verificationLabels/,
  /availabilityLabels/,
  /authorizationLabels/,
  /source-backed/i,
  /Source-backed/i,
  /source page/i,
  /source listing/i,
  /source lead/i
];

const ADMIN_REQUIRED_PATTERNS = [
  /View source listing/i,
  /Evidence captured/i,
  /Provenance summary/i,
  /Internal review notes/i,
  /listing\.sourceUrl/,
  /listing\.sourceName/,
  /listing\.sourceType/,
  /listing\.sourceEvidence/,
  /listing\.provenanceSummary/,
  /listing\.internalReviewNotes/,
  /HARBOURVIEW_ADMIN_REVIEW_ENABLED/
];

function read(path) {
  return readFileSync(path, 'utf8');
}

const failures = [];

for (const path of PUBLIC_FILES) {
  const content = read(path);
  for (const pattern of PUBLIC_FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      failures.push(`Public leakage: ${path} matched ${pattern}`);
    }
  }
}

const adminContent = ADMIN_FILES.map(read).join('\n');
for (const pattern of ADMIN_REQUIRED_PATTERNS) {
  if (!pattern.test(adminContent)) {
    failures.push(`Admin visibility missing: expected ${pattern}`);
  }
}

if (failures.length) {
  console.error('Provenance visibility test failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('ok public listing pages do not expose source/provenance fields');
console.log('ok admin listing review retains source/provenance/evidence fields');
