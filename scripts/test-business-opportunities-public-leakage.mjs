import { readFileSync } from 'node:fs'

const PUBLIC_RENDER_FILES = [
  'app/marketplace/business-opportunities/page.tsx',
  'components/ListingCard.tsx',
]

const PUBLIC_PIPELINE_FILES = [
  'app/marketplace/business-opportunities/page.tsx',
  'lib/server/listingsQuery.ts',
]

const REQUIRED_PAGE_PIPELINE_PATTERNS = [
  /getPublicListingsByCategory/,
  /getPublicListingsByCategory\(['"]business_opportunities['"]\)/,
]

const REQUIRED_QUERY_PIPELINE_PATTERNS = [
  /TARGET_PUBLIC_VIEW\s*=\s*['"]marketplace_public_listings_v1['"]/,
  /SELECT_COLS/,
  /NEXT_PUBLIC_SUPABASE_ANON_KEY/,
  /category.*eq\.\$\{normalized\}/s,
  /category\.replace\(\/\-\/g, ['"]_['"]\)/,
]

const FORBIDDEN_PUBLIC_RENDER_PATTERNS = [
  /sourceUrl/,
  /sourceName/,
  /contactEmail/,
  /licenceEvidence/,
  /licenseEvidence/,
  /provenance/,
  /diligenceStatus/,
  /internalNotes/,
  /internal notes/i,
  /raw scraped text/i,
  /source registry/i,
  /source snapshots/i,
]

const FORBIDDEN_PUBLIC_PIPELINE_PATTERNS = [
  ...FORBIDDEN_PUBLIC_RENDER_PATTERNS,
  /privateContactEmail/,
  /source_registry/,
  /source_snapshots/,
  /marketplace_candidates/,
  /candidate_review_events/,
  /captured_url/,
  /captured_text/,
  /raw_html_hash/,
  /review_notes/,
  /reviewed_by/,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /service_role/,
]


function read(path) {
  return readFileSync(path, 'utf8')
}

const failures = []
const pageContent = read('app/marketplace/business-opportunities/page.tsx')
const publicRenderContent = PUBLIC_RENDER_FILES.map(read).join('\n')
const publicPipelineContent = PUBLIC_PIPELINE_FILES.map(read).join('\n')

for (const pattern of REQUIRED_PAGE_PIPELINE_PATTERNS) {
  if (!pattern.test(pageContent)) failures.push(`Business Opportunities page missing current public listings pipeline: ${pattern}`)
}

for (const pattern of REQUIRED_QUERY_PIPELINE_PATTERNS) {
  if (!pattern.test(publicPipelineContent)) failures.push(`Business Opportunities public listings query missing required guard: ${pattern}`)
}
for (const pattern of FORBIDDEN_PUBLIC_RENDER_PATTERNS) {
  if (pattern.test(publicRenderContent)) failures.push(`Business Opportunities public render leakage: ${pattern}`)
}

for (const pattern of FORBIDDEN_PUBLIC_PIPELINE_PATTERNS) {
  if (pattern.test(publicPipelineContent)) failures.push(`Business Opportunities public listings pipeline exposes private field: ${pattern}`)
}

if (/getLiveBusinessOpportunities\(businessOpportunities\)/.test(pageContent)) {
  failures.push('Business Opportunities page should use the canonical public listings view, not the legacy live feed adapter')
}

if (failures.length) {
  console.error('Business Opportunities public leakage test failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok business opportunities page uses canonical marketplace_public_listings_v1 public listings pipeline')
console.log('ok business opportunities public query projects only public listing fields through the anon public view')
console.log('ok business opportunities public render files omit source, contact, provenance, evidence, diligence and internal-note fields')
console.log('ok business opportunities public pipeline does not map private source or review fields')
