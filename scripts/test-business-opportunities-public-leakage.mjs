import { readFileSync } from 'node:fs'

const PUBLIC_FILES = [
  'app/marketplace/business-opportunities/page.tsx',
  'lib/marketplace/liveOpportunities.ts',
  'components/ListingCard.tsx',
]

const REQUIRED_PUBLIC_PIPELINE_PATTERNS = [
  /getLiveBusinessOpportunities/,
  /normalizeBusinessOpportunity/,
  /sanitizeBusinessOpportunity/,
  /reviewStatus\s*===\s*['"]approved['"]/,
  /publicationStatus\s*===\s*['"]published['"]/,
  /visibility\s*===\s*['"]public['"]/,
  /expiresAt/,
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

const ALLOWED_INTERNAL_ADAPTER_PATTERNS = [
  /contactEmail: fallbackContactEmail/,
]

function read(path) {
  return readFileSync(path, 'utf8')
}

const failures = []
const pageContent = read('app/marketplace/business-opportunities/page.tsx')
const adapterContent = read('lib/marketplace/liveOpportunities.ts')
const listingCardContent = read('components/ListingCard.tsx')
const publicRenderContent = `${pageContent}\n${listingCardContent}`

for (const pattern of REQUIRED_PUBLIC_PIPELINE_PATTERNS) {
  if (!pattern.test(adapterContent)) failures.push(`Business Opportunities pipeline missing required guard: ${pattern}`)
}

for (const pattern of FORBIDDEN_PUBLIC_RENDER_PATTERNS) {
  if (pattern.test(publicRenderContent)) failures.push(`Business Opportunities public render leakage: ${pattern}`)
}

for (const pattern of FORBIDDEN_PUBLIC_RENDER_PATTERNS) {
  const adapterMatches = adapterContent.match(new RegExp(pattern.source, pattern.flags.replace('g', '')))
  if (adapterMatches && !ALLOWED_INTERNAL_ADAPTER_PATTERNS.some((allowed) => allowed.test(adapterMatches[0]))) {
    if (['/sourceUrl/', '/sourceName/', '/licenceEvidence/', '/licenseEvidence/', '/provenance/', '/diligenceStatus/', '/internalNotes/'].includes(pattern.toString())) {
      failures.push(`Business Opportunities adapter should not declare private field for public projection: ${pattern}`)
    }
  }
}

if (!/image:\s*imageSrc\s*\?/.test(adapterContent)) {
  failures.push('Business Opportunities adapter missing reviewed image projection gate')
}

if (!/getLiveBusinessOpportunities\(businessOpportunities\)/.test(pageContent) &&
    !/getPublicListingsByCategory\(/.test(pageContent)) {
  failures.push('Business Opportunities page is not wired to the reviewed live feed adapter')
}

if (failures.length) {
  console.error('Business Opportunities public leakage test failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok business opportunities page uses reviewed live feed adapter')
console.log('ok business opportunities adapter filters approved, published, public and unexpired records')
console.log('ok business opportunities public render files omit source, contact, provenance, evidence, diligence and internal-note fields')
console.log('ok business opportunities public projection does not map private source or review fields')
