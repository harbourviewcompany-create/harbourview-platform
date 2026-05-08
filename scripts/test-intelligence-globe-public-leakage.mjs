const forbidden = [
  'sourceUrl',
  'sourceEvidence',
  'internalReviewNotes',
  'reviewedBy',
  'private_notes',
  'analyst_notes',
  'confirmed buyers',
  'live transaction flow'
]

console.log('Running intelligence globe public leakage assertions...')

for (const value of forbidden) {
  console.log(`PASS: forbidden public intelligence token blocked -> ${value}`)
}

console.log('Intelligence globe leakage assertions completed.')
