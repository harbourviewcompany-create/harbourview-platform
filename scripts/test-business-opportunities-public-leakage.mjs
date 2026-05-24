import { existsSync, readFileSync } from 'node:fs'

const pageChecks = [
  ['app/marketplace/business-opportunities/page.tsx', 'business_opportunities', 'business_opportunity', 'No opportunities listed', 'Business Opportunities'],
  ['app/marketplace/cannabis-inventory/page.tsx', 'cannabis_inventory', 'cannabis_inventory', 'No inventory listed', 'Cannabis Inventory'],
  ['app/marketplace/used-surplus/page.tsx', 'used_surplus', 'used_surplus', 'No listings available', 'Used & Surplus'],
]

const requiredRoutes = [
  'app/marketplace/page.tsx',
  'app/marketplace/sell/page.tsx',
  'app/contact/page.tsx',
  'app/intake/page.tsx',
]

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
  'internal_notes',
  'internal notes',
  'contactEmail',
  'licenceEvidence',
  'licenseEvidence',
  'diligenceStatus',
  'source registry',
  'source snapshots',
  'reviewedBy',
  'lastReviewedAt',
  'nextReviewDueAt',
  'raw_scraped_text',
  'raw scraped text',
]

const failures = []
const read = (path) => readFileSync(path, 'utf8')
const requireText = (content, expected, failure) => {
  if (!content.includes(expected)) failures.push(failure)
}

for (const routeFile of requiredRoutes) {
  if (!existsSync(routeFile)) failures.push(`Required CTA target route is missing: ${routeFile}`)
}

const helperPath = 'lib/server/listingsQuery.ts'
if (!existsSync(helperPath)) {
  failures.push('Missing public listings query helper: lib/server/listingsQuery.ts')
} else {
  const helper = read(helperPath)
  requireText(helper, "status: 'eq.approved'", 'Public listings helper must filter to approved records')
  requireText(helper, "public_visibility: 'eq.true'", 'Public listings helper must filter to public_visibility=true')
  requireText(helper, "cache: 'no-store'", 'Public listings helper should avoid stale public listing output')
  requireText(
    helper,
    "select: 'id,slug,title,description,category,marketplace_section,product_type,region,condition,location_country,price_amount,price_currency,seller_type,is_featured,high_level_specs,created_at'",
    'Public listings helper select list changed; review DTO boundary before exposing category pages',
  )

  for (const forbidden of forbiddenStrings) {
    if (helper.toLowerCase().includes(forbidden.toLowerCase())) {
      failures.push(`Public listings helper references forbidden private field/token: ${forbidden}`)
    }
  }
}

for (const [pagePath, category, ctaType, emptyState, routeLabel] of pageChecks) {
  if (!existsSync(pagePath)) {
    failures.push(`Missing marketplace category page: ${pagePath}`)
    continue
  }

  const page = read(pagePath)
  requireText(page, "import { getPublicListingsByCategory } from '@/lib/server/listingsQuery'", `${pagePath} is not using the server-only public listings query helper`)
  requireText(page, `getPublicListingsByCategory('${category}')`, `${pagePath} is not wired to the expected public category: ${category}`)
  requireText(page, emptyState, `${pagePath} is missing expected empty-state copy`)
  requireText(page, '/marketplace/sell', `${pagePath} is missing the submit/sell CTA route`)
  requireText(page, '/intake', `${pagePath} is missing the confidential intake CTA route`)
  requireText(page, 'href="/marketplace"', `${pagePath} is missing the marketplace breadcrumb route`)
  requireText(page, '/contact?ref=', `${pagePath} is missing listing-card contact CTA route`)
  requireText(page, `type=${ctaType}`, `${pagePath} listing-card contact CTA has the wrong type query`)
  requireText(page, 'listing.slug ?? listing.id', `${pagePath} listing-card contact CTA must include listing ref`)
  requireText(page, 'grid grid-cols-1', `${pagePath} is missing mobile-first single-column grid behavior`)
  requireText(page, 'sm:flex-row', `${pagePath} is missing small-screen CTA row breakpoint behavior`)
  requireText(page, 'lg:grid-cols-3', `${pagePath} is missing desktop listing grid behavior`)
  requireText(page, routeLabel, `${pagePath} is missing expected route label: ${routeLabel}`)

  for (const forbidden of forbiddenStrings) {
    if (page.toLowerCase().includes(forbidden.toLowerCase())) failures.push(`${pagePath} renders forbidden public leakage token: ${forbidden}`)
  }
}

if (failures.length) {
  console.error('Marketplace category page verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok marketplace category CTA target routes exist')
console.log('ok category pages use getPublicListingsByCategory for approved public listings')
console.log('ok category pages include listing-card CTA routes, empty states and responsive grid breakpoints')
console.log('ok category pages and query helper omit forbidden private leakage tokens')
