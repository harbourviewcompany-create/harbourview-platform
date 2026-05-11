import { readFileSync } from 'node:fs'

const PUBLIC_RENDER_FILES = [
  'app/marketplace/page.tsx',
  'app/marketplace/listings/page.tsx',
  'app/marketplace/consumables/page.tsx',
  'app/marketplace/wanted/page.tsx',
  'app/marketplace/sell/page.tsx',
  'app/marketplace/listings/[slug]/page.tsx',
  'app/marketplace/genetics/page.tsx',
  'app/marketplace/genetics/[slug]/page.tsx',
  'app/marketplace/business-opportunities/page.tsx',
  'app/marketplace/cannabis-inventory/page.tsx',
  'app/marketplace/new-products/page.tsx',
  'app/marketplace/services/page.tsx',
  'app/marketplace/used-surplus/page.tsx',
  'app/supplier-directory/page.tsx',
  'components/marketplace/MarketplaceListingCard.tsx',
  'components/ListingCard.tsx',
  'components/SupplierCard.tsx',
  'lib/fixtures/business-opportunities.ts',
  'lib/fixtures/cannabis-inventory.ts',
  'lib/fixtures/consumables.ts',
  'lib/fixtures/new-products.ts',
  'lib/fixtures/services.ts',
  'lib/fixtures/suppliers.ts',
  'lib/fixtures/used-surplus.ts',
  'lib/fixtures/wanted-requests.ts',
  'lib/fixtures/types.ts',
]

const ADMIN_FILES = ['app/admin/(protected)/listings/page.tsx']

const ADMIN_GUARD_FILES = ['app/admin/(protected)/layout.tsx', 'lib/auth/adminGuard.ts']

const PUBLIC_PROJECTION_FILE = 'lib/marketplace/publicListings.ts'

const PUBLIC_FORBIDDEN_PATTERNS = [
  /View source listing/i,
  /Evidence captured/i,
  /Provenance and review/i,
  /Provenance summary/i,
  /Internal review notes/i,
  /Internal-only source/i,
  /review_status/,
  /priority/,
  /last_contacted_at/,
  /next_follow_up_at/,
  /internal_response_notes/,
  /internal_notes/,
  /private_notes/,
  /service_role/,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /source_registry/,
  /source_snapshots/,
  /marketplace_candidates/,
  /candidate_review_events/,
  /captured_url/,
  /captured_text/,
  /raw_html_hash/,
  /confidence_score/,
  /commercial_relevance_score/,
  /compliance_risk_score/,
  /supplier_verified/,
  /seller_authorization_status/,
  /certifications_claimed/,
  /certifications_verified/,
  /coa_available/,
  /expiry_date/,
  /lot_tracking_available/,
  /requires_license_review/,
  /restricted_item/,
  /review_notes/,
  /analyst notes/i,
  /raw evidence/i,
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
  /source lead/i,
  /equipnet/i,
  /labx/i,
  /machinio/i,
  /thc label solutions/i,
  /marijuana packaging/i,
  /Supplier Directory/i,
  /contactEmail/,
  /privateContactEmail/,
]

const PUBLIC_PROJECTION_REQUIRED_PATTERNS = [
  /PublicMarketplaceListing/,
  /toPublicMarketplaceListing/,
  /publicMarketplaceListings/,
  /getPublicMarketplaceListing/,
]

const PUBLIC_PROJECTION_FORBIDDEN_PATTERNS = [
  /sourceUrl:/,
  /sourceName:/,
  /sourceType:/,
  /sourceEvidence:/,
  /provenanceSummary:/,
  /internalReviewNotes:/,
  /verificationStatus:/,
  /availabilityStatus:/,
  /sellerAuthorizationStatus:/,
  /lastReviewedAt:/,
  /nextReviewDueAt:/,
  /confidenceScore:/,
  /monetizationPath:/,
  /review_status:/,
  /priority:/,
  /last_contacted_at:/,
  /next_follow_up_at:/,
  /internal_response_notes:/,
  /internal_notes:/,
  /private_notes:/,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /service_role/,
  /source_registry:/,
  /source_snapshots:/,
  /marketplace_candidates:/,
  /candidate_review_events:/,
  /captured_url:/,
  /captured_text:/,
  /raw_html_hash:/,
  /confidence_score:/,
  /commercial_relevance_score:/,
  /compliance_risk_score:/,
  /supplier_verified:/,
  /seller_authorization_status:/,
  /certifications_claimed:/,
  /certifications_verified:/,
  /coa_available:/,
  /expiry_date:/,
  /lot_tracking_available:/,
  /requires_license_review:/,
  /restricted_item:/,
  /review_notes:/,
  /contactEmail:/,
  /privateContactEmail:/,
]

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
]

const ADMIN_GUARD_REQUIRED_PATTERNS = [
  /requireAdminAuth/,
  /hasAdminRole/,
  /unauthorized/,
  /forbidden/,
  /admin.*operator/s,
  /analyst.*viewer/s,
]

function read(path) {
  return readFileSync(path, 'utf8')
}

const failures = []

for (const path of PUBLIC_RENDER_FILES) {
  const content = read(path)

  for (const pattern of PUBLIC_FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      failures.push(`Public leakage: ${path} matched ${pattern}`)
    }
  }
}

const publicProjectionContent = read(PUBLIC_PROJECTION_FILE)

for (const pattern of PUBLIC_PROJECTION_REQUIRED_PATTERNS) {
  if (!pattern.test(publicProjectionContent)) {
    failures.push(`Public projection missing: expected ${pattern}`)
  }
}

for (const pattern of PUBLIC_PROJECTION_FORBIDDEN_PATTERNS) {
  if (pattern.test(publicProjectionContent)) {
    failures.push(`Public projection exposes internal field: ${PUBLIC_PROJECTION_FILE} matched ${pattern}`)
  }
}

const adminContent = ADMIN_FILES.map(read).join('\n')

for (const pattern of ADMIN_REQUIRED_PATTERNS) {
  if (!pattern.test(adminContent)) {
    failures.push(`Admin visibility missing: expected ${pattern}`)
  }
}

const adminGuardContent = ADMIN_GUARD_FILES.map(read).join('\n')

for (const pattern of ADMIN_GUARD_REQUIRED_PATTERNS) {
  if (!pattern.test(adminGuardContent)) {
    failures.push(`Admin role guard missing: expected ${pattern}`)
  }
}

if (failures.length) {
  console.error('Provenance visibility test failed:')

  for (const failure of failures) {
    console.error(`- ${failure}`)
  }

  process.exit(1)
}

console.log('ok public listing render files and fixtures do not expose source/provenance/contactEmail fields')
console.log('ok public listing projection omits internal source/provenance/contactEmail fields')
console.log('ok admin listing review retains source/provenance/evidence fields')
console.log('ok admin provenance route uses server-side role guard')