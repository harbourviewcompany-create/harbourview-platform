#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const canonicalPhrases = [
  'Public summaries do not guarantee availability, pricing, introduction, transaction terms or legal/regulatory outcomes.',
  'Intake submissions are reviewed before follow-up, counterparty routing, commercial disclosure or any protected access discussion.',
  'Contact details are private, inquiries are reviewed before routing and submissions do not guarantee introductions, availability, transaction terms or regulatory outcomes.',
]

const approvedModules = new Set([
  'lib/content/complianceCopy.ts',
])

const files = execSync('find app lib -type f \\( -name "*.ts" -o -name "*.tsx" \\)', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((file) => (file.endsWith('.ts') || file.endsWith('.tsx')) && file !== 'lib/content/complianceCopy.ts')
const violations = []

for (const file of files) {
  if (approvedModules.has(file)) continue
  const src = readFileSync(file, 'utf8')
  canonicalPhrases.forEach((phrase) => {
    if (src.includes(phrase)) violations.push(`${file}: "${phrase}"`)
  })
}

if (violations.length) {
  console.error('Duplicate canonical public copy detected outside approved module(s):')
  violations.forEach((v) => console.error(`- ${v}`))
  process.exit(1)
}

console.log('Public copy dedup check passed.')
