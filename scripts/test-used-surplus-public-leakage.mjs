const forbiddenStrings = [
  'sourceUrl',
  'sourceName',
  'contactEmail',
  'provenance',
  'internal notes',
  'raw scraped text',
]

const publicPayload = JSON.stringify({
  title: 'Approved Used Surplus Listing',
  reviewStatus: 'approved',
  publicationStatus: 'published',
})

const detected = forbiddenStrings.filter((value) =>
  publicPayload.toLowerCase().includes(value.toLowerCase())
)

if (detected.length > 0) {
  console.error('Forbidden leakage detected:', detected)
  process.exit(1)
}

console.log('PASS: no forbidden used surplus leakage strings detected')
