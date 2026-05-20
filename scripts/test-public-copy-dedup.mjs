import { readFileSync } from 'node:fs'
import { globSync } from 'glob'

const approvedModules = new Set([
  'lib/content/complianceCopy.ts',
  'lib/institutional/content.ts',
])

const canonicalPhrases = [
  'Public summaries are for orientation only and do not guarantee availability, pricing, introductions, transaction terms or legal/regulatory outcomes.',
  'Submissions are reviewed before follow-up, counterparty routing, commercial disclosure or any protected-access discussion.',
  'Contact details remain private, inquiries are reviewed before routing, and introductions are not automatic.',
]

const files = globSync('{app,lib}/**/*.{ts,tsx}', {
  ignore: ['**/*.d.ts', '**/node_modules/**'],
})

const violations = []
for (const file of files) {
  if (approvedModules.has(file)) continue
  const source = readFileSync(file, 'utf8')
  for (const phrase of canonicalPhrases) {
    if (source.includes(phrase)) violations.push(`${file}: ${phrase}`)
  }
}

if (violations.length) {
  console.error('public copy dedup regression detected')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log(`ok public copy dedup: ${files.length} files checked`) 
