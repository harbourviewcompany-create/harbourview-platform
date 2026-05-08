import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const fixtureFiles = [
  'lib/fixtures/new-products.ts',
  'lib/fixtures/used-surplus.ts',
  'lib/fixtures/business-opportunities.ts',
  'lib/fixtures/cannabis-inventory.ts',
  'lib/fixtures/services.ts',
  'lib/fixtures/consumables.ts',
  'lib/fixtures/wanted-requests.ts',
]

const DEAL_TRIGGER_PATTERNS = [
  /surplus/i,
  /liquidat/i,
  /facil.*clos/i,
  /clos.*facil/i,
  /clos.*operat/i,
  /closing (test|lab|operation)/i,
  /facility upgrade/i,
  /\bexcess\b/i,
  /overstock/i,
  /relocat/i,
  /consolidat/i,
  /retirement\b/i,
  /\bexit\b/i,
  /dormant/i,
  /activat/i,
  /recurring supply/i,
  /replenishment/i,
  /standing[- ]order/i,
  /bulk available/i,
  /available (for|on|now)/i,
  /available per lot/i,
  /immediate (order|sale|purchase)/i,
  /new (capacity|stock|inventory|production|equipment)/i,
  /scale.up/i,
  /expansion project/i,
  /new.*engagement/i,
  /new.*client/i,
  /capacity.*addition/i,
  /bulk supply/i,
  /wholesale.*available/i,
  /\blot available\b/i,
]

const BUYER_TYPE_PATTERNS = [
  /licensed (producer|operator|processor|cultivator|retailer|dispensary|distributor|testing|lab|cannabis)/i,
  /licensed operators?/i,
  /dispensary (group|operator|chain|network)/i,
  /\bdispensaries\b/i,
  /\bprocessor\b/i,
  /\bprocessors\b/i,
  /\bcultivator\b/i,
  /\bcultivators\b/i,
  /\bdistributor\b/i,
  /\bdistributors\b/i,
  /retail operator/i,
  /extraction operator/i,
  /extraction (program|operation|lab)/i,
  /integrated operator/i,
  /cannabis operator/i,
  /packaging operation/i,
  /qualified (buyer|operator|investor|acquirer)/i,
  /import.*licen/i,
  /operators? (holding|seeking|in|with)/i,
]

const SCALE_ANCHOR_PATTERNS = [
  /\d[\d,.]*\s*(lb|lbs|kg|g|units?|seeds?|sq\.?\s*ft|square\s*feet|L\b|litre|liter|gallon)/i,
  /\b(10|20|25|50|100|200|500|1[,.]000|2[,.]000|5[,.]000|10[,.]000|25[,.]000|50[,.]000)\b/,
  /minimum (order|quantity|lot)/i,
  /\d+[- ]ton/i,
  /\d+[- ]pallet/i,
  /\d[\d,.]+\s*(\/\s*)?(month|hour|day|batch|unit|lot)/i,
  /per.unit pricing/i,
  /multi.unit/i,
  /bulk (quantity|pricing|order|lot)/i,
  /high.throughput/i,
  /high.volume/i,
  /commercial (volume|scale|capacity)/i,
  /multi.site/i,
  /multi.location/i,
  /multi.facility/i,
  /\d[\d,.]*\s*sq/i,
  /\d[\d,.]*\s*L\s+(vessel|column|capacity|minimum)/i,
  /\d[\d,.]*\s*[Aa]/i,
  /pallet.quantity/i,
  /case pricing/i,
  /lot pricing/i,
  /\d+\s*[×xX]\s*\d+/i,
]

const ACCESS_MODEL_PATTERNS = [
  /inquiry required/i,
  /inquire to buy/i,
  /harbourview/i,
  /\bintroduction\b/i,
  /NDA required/i,
  /NDA\b/i,
  /routed (through|via)/i,
  /reviewed (by|before)/i,
  /managed (through|via|by)/i,
  /through harbourview/i,
  /via harbourview/i,
  /available on inquiry/i,
  /handled by inquiry/i,
  /inquiry.first/i,
]

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/gm, '')
}

function splitTopLevelObjects(source) {
  const objects = []
  let depth = 0
  let start = -1
  let quote = null
  let escaped = false

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]

    if (quote) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === '\'' || char === '"' || char === '`') {
      quote = char
      continue
    }

    if (char === '{') {
      if (depth === 0) start = i
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0 && start >= 0) {
        objects.push(source.slice(start, i + 1))
        start = -1
      }
    }
  }

  return objects
}

function unquote(value) {
  if (!value) return ''
  return value
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractStringProperty(objectSource, propertyName) {
  const match = objectSource.match(new RegExp(`${propertyName}:\\s*(['\"` + '`' + `])([\\s\\S]*?)\\1`))
  return match ? unquote(match[2]) : ''
}

function extractTags(objectSource) {
  const tagsMatch = objectSource.match(/tags:\s*\[([\s\S]*?)\]/)
  if (!tagsMatch) return []

  return Array.from(tagsMatch[1].matchAll(/['"]([^'"]+)['"]/g)).map((match) => unquote(match[1]))
}

function extractListings(filePath) {
  const fullPath = path.join(root, filePath)
  const source = stripComments(fs.readFileSync(fullPath, 'utf8'))
  const objects = splitTopLevelObjects(source)

  return objects
    .map((objectSource) => {
      const id = extractStringProperty(objectSource, 'id')
      const title = extractStringProperty(objectSource, 'title')
      const description = extractStringProperty(objectSource, 'description')
      const tags = extractTags(objectSource)

      return { id, title, description, tags, filePath }
    })
    .filter((listing) => listing.id && listing.title && listing.description)
}

function checkSignal(patterns, haystack) {
  return patterns.some((pattern) => pattern.test(haystack))
}

function validateListing(listing) {
  const haystack = `${listing.title} ${listing.description} ${listing.tags.join(' ')}`
  const failures = []

  if (!checkSignal(DEAL_TRIGGER_PATTERNS, haystack)) failures.push('deal-trigger')
  if (!checkSignal(BUYER_TYPE_PATTERNS, haystack)) failures.push('buyer-type')
  if (!checkSignal(SCALE_ANCHOR_PATTERNS, haystack)) failures.push('scale-anchor')
  if (!checkSignal(ACCESS_MODEL_PATTERNS, haystack)) failures.push('access-model')

  return failures
}

const listings = fixtureFiles.flatMap(extractListings)
const failures = listings
  .map((listing) => ({ ...listing, failures: validateListing(listing) }))
  .filter((listing) => listing.failures.length > 0)

if (failures.length > 0) {
  console.error(`not ok marketplace listing quality: ${failures.length} listing(s) failed`)
  for (const failure of failures) {
    console.error(`- ${failure.filePath} ${failure.id} "${failure.title}": ${failure.failures.join(', ')}`)
  }
  process.exit(1)
}

console.log(`ok marketplace listing quality: ${listings.length} listing(s) passed deal-trigger, buyer-type, scale-anchor, and access-model checks`)
