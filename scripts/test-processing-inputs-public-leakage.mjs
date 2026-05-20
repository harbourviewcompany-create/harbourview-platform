import fs from 'node:fs'

const forbidden = [
  'sourceContactEmail',
  'internalNotes',
  'sourceEvidence',
  'private-source@example.com',
]

const targets = [
  'lib/server/processingInputsIntake.ts',
  'lib/marketplace/processingInputsPublic.ts',
  'app/marketplace/processing-inputs/page.tsx',
]

const failures = []

for (const target of targets) {
  const content = fs.readFileSync(target, 'utf8')

  for (const token of forbidden) {
    const exposed =
      target !== 'lib/server/processingInputsIntake.ts' &&
      content.includes(token) &&
      !content.includes('forbidden') &&
      !content.includes('const forbidden')

    if (exposed) failures.push(`${target} exposes forbidden token: ${token}`)
  }
}

if (failures.length > 0) {
  console.error('FAIL processing inputs public leakage regression')
  for (const failure of failures) console.error(failure)
  process.exit(1)
}

console.log('PASS processing inputs public leakage regression')
