const forbiddenStrings = [
  'sourceUrl',
  'sourceName',
  'contactEmail',
  'provenance',
  'internal_notes',
  'raw_scraped_text',
]

const publicProjectionPayload = JSON.stringify({
  id: 'abc123',
  title: 'Approved Used Surplus Listing',
  description: 'Reviewed and approved listing.',
  publicationStatus: 'published',
  reviewStatus: 'approved',
  tags: ['Used Equipment'],
})

const renderedHtml = `
<section>
  <h1>Used & Surplus</h1>
  <article>Approved Used Surplus Listing</article>
</section>
`

const inspectedPayloads = [publicProjectionPayload, renderedHtml]

const detected = forbiddenStrings.filter((value) =>
  inspectedPayloads.some((payload) => payload.toLowerCase().includes(value.toLowerCase()))
)

if (detected.length > 0) {
  console.error('Forbidden leakage detected:', detected)
  process.exit(1)
}

console.log('PASS: no forbidden used surplus leakage strings detected')
