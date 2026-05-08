import assert from 'node:assert/strict'
import {
  getLiveConsumableOpportunities,
  isValidPublicImageUrl,
  normalizeLiveOpportunity,
} from '../lib/marketplace/liveOpportunities.ts'

const fallbackListings = [
  {
    id: 'fixture-1',
    title: 'Fallback Fixture',
    description: 'Fallback description',
    price: 'Price on request',
    location: 'Canada',
    tags: ['Fixture'],
    postedDate: '2026-01-01',
  },
]

assert.equal(isValidPublicImageUrl('https://images.example.com/photo.jpg'), true)
assert.equal(isValidPublicImageUrl('http://images.example.com/photo.jpg'), false)
assert.equal(isValidPublicImageUrl('https://localhost/photo.jpg'), false)
assert.equal(isValidPublicImageUrl('javascript:alert(1)'), false)

const normalized = normalizeLiveOpportunity({
  id: 'live-1',
  title: 'Verified Mylar Packaging',
  description: 'Bulk child-resistant pouches',
  imageSrc: 'https://cdn.example.com/mylar.jpg',
  sourceUrl: 'https://supplier.example.com/private',
  contactEmail: 'private@supplier.com',
  provenance: 'Internal provenance',
  rawSupplierMetadata: 'hidden',
})

assert.ok(normalized)
assert.equal(normalized?.image?.src, 'https://cdn.example.com/mylar.jpg')
assert.equal(normalized?.contactEmail, 'harbourviewcompany@gmail.com')
assert.equal('sourceUrl' in normalized!, false)
assert.equal('provenance' in normalized!, false)
assert.equal('rawSupplierMetadata' in normalized!, false)

const invalidImage = normalizeLiveOpportunity({
  id: 'live-2',
  title: 'Invalid Image Listing',
  description: 'Testing invalid image handling',
  imageSrc: 'http://unsafe.example.com/photo.jpg',
})

assert.equal(invalidImage?.image, undefined)

const originalFetch = global.fetch

global.fetch = async () => ({ ok: false })

process.env.HARBOURVIEW_CONSUMABLES_FEED_URL = 'https://feeds.example.com/consumables.json'

const fallbackResult = await getLiveConsumableOpportunities(fallbackListings)
assert.deepEqual(fallbackResult, fallbackListings)

global.fetch = originalFetch

console.log('ok live consumables feed fallback works')
console.log('ok invalid image urls fail closed')
console.log('ok public listings omit provenance and supplier metadata')
