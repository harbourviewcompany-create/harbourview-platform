import fs from 'node:fs'

const map = fs.readFileSync('lib/marketplace/categoryCapabilityMap.ts', 'utf8')
const page = fs.readFileSync('app/marketplace/page.tsx', 'utf8')

const requiredIds = [
  'reviewed-listings',
  'used-surplus',
  'business-opportunities',
  'consumables',
  'new-products',
  'licensed-inventory',
  'services',
  'wanted-requests',
  'genetics',
  'request-introduction',
]

const requiredFields = ['capabilityStatus', 'visibility', 'criticality', 'publicLabel', 'liveDataExpectation', 'privateBoundary', 'relatedCapabilityIds', 'acceptanceTests']
const requiredExpectations = ['live-approved-records', 'static-orientation', 'request-capture', 'private-routing']

const missingIds = requiredIds.filter((id) => !map.includes(`id: '${id}'`))
const missingFields = requiredFields.filter((field) => !map.includes(`${field}:`))
const missingExpectations = requiredExpectations.filter((value) => !map.includes(value))
const pageMissing = ['marketplaceCategoryCapabilityMap', 'privateBoundary', 'publicLabel'].filter((text) => !page.includes(text))

if (missingIds.length || missingFields.length || missingExpectations.length || pageMissing.length) {
  console.error(JSON.stringify({ missingIds, missingFields, missingExpectations, pageMissing }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, categories: requiredIds.length }, null, 2))
