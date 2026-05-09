import { readFileSync } from 'node:fs'

const publicFiles = [
  'app/page.tsx',
  'app/marketplace/page.tsx',
  'app/marketplace/listings/page.tsx',
  'app/marketplace/consumables/page.tsx',
  'app/marketplace/wanted/page.tsx',
  'app/marketplace/sell/page.tsx',
  'app/intake/page.tsx',
  'components/Nav.tsx',
  'components/Footer.tsx',
  'components/ListingCard.tsx',
  'components/marketplace/InquiryForm.tsx',
]

const disallowed = [
  'Harbourview Marketplace',
  'Marketplace categories',
  'Marketplace Categories',
  'Browse Marketplace',
  'Marketplace Opportunities',
  'B2B cannabis industry marketplace',
  'Professional Marketplace',
  'A professional marketplace for the regulated cannabis industry',
  'B2B listings for the regulated cannabis industry',
  'Submit Supply',
  'Post Wanted Request',
  'Post a Wanted Request',
  'Request Supply Information',
]

const supplierDirectoryRestrictedFiles = new Set([
  'app/page.tsx',
  'app/marketplace/page.tsx',
  'components/Nav.tsx',
  'components/Footer.tsx',
])

const hits = []
for (const file of publicFiles) {
  const body = readFileSync(file, 'utf8')
  for (const term of disallowed) {
    if (body.includes(term)) hits.push(`${file}: ${term}`)
  }
  if (supplierDirectoryRestrictedFiles.has(file) && body.includes('Supplier Directory')) hits.push(`${file}: Supplier Directory`)
}

if (hits.length > 0) {
  console.error('public copy regression detected')
  for (const hit of hits) console.error(`- ${hit}`)
  process.exit(1)
}

console.log(`ok public copy: ${publicFiles.length} public files passed Network terminology checks`)
