import { readFileSync } from 'node:fs'

const PUBLIC_FILES = [
  'app/network/clinical-education/page.tsx',
  'app/network/clinical-education/[slug]/page.tsx',
  'app/network/clinical-education/request/page.tsx',
  'components/clinical-education/ClinicalEducationComponents.tsx',
  'lib/fixtures/clinical-education.ts',
]

const REQUIRED_PATTERNS = [
  /Harbourview Clinical Education is provided for regulated-market education only/i,
  /not medical advice/i,
  /not provide patient-specific/i,
  /Research in progress/i,
  /Professional review required/i,
  /Available by request/i,
]

const PROHIBITED_PATTERNS = [
  /recommended dose/i,
  /take this amount/i,
  /prescribe this dose/i,
  /best for pain/i,
  /best for anxiety/i,
  /treats/i,
  /cures/i,
  /prevents/i,
  /works for/i,
  /safe for patients/i,
  /guaranteed relief/i,
  /clinically proven relief/i,
  /use this product/i,
  /choose this formula/i,
  /supplierName/i,
  /supplierContact/i,
  /sourceUrl/i,
  /sourceName/i,
  /sourceEvidence/i,
  /provenanceSummary/i,
  /internalReviewNotes/i,
  /availabilityStatus/i,
  /verificationStatus/i,
  /private COA/i,
  /inventory available/i,
  /supplier available/i,
  /contact supplier/i,
  /confirmed buyers/i,
  /exclusive supply/i,
]

const MARKETPLACE_IMPORT_PATTERNS = [
  /from ['"]@\/lib\/marketplace/,
  /from ['"]@\/components\/marketplace/,
  /from ['"]@\/lib\/fixtures\/marketplace/,
  /from ['"]@\/lib\/fixtures\/listings/,
]

const failures = []
const combined = PUBLIC_FILES.map((path) => `\n/* ${path} */\n${readFileSync(path, 'utf8')}`).join('\n')

for (const pattern of REQUIRED_PATTERNS) {
  if (!pattern.test(combined)) failures.push(`Missing required clinical education guardrail text: ${pattern}`)
}

for (const path of PUBLIC_FILES) {
  const content = readFileSync(path, 'utf8')
  const scanContent = content
    .replace(/PROHIBITED_PATTERNS\s*=\s*\[[\s\S]*?\]/g, 'PROHIBITED_PATTERNS = []')
    .replace(/restrictedLanguage:\s*\[[\s\S]*?\]/g, 'restrictedLanguage: []')

  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(scanContent)) failures.push(`Clinical guardrail failed: ${path} matched ${pattern}`)
  }

  for (const pattern of MARKETPLACE_IMPORT_PATTERNS) {
    if (pattern.test(content)) failures.push(`Clinical education imports marketplace internals: ${path} matched ${pattern}`)
  }
}

if (failures.length) {
  console.error('Clinical education guardrail test failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ok clinical education includes required disclaimers and status controls')
console.log('ok clinical education avoids prohibited clinical and supplier leakage language')
console.log('ok clinical education does not import marketplace internals')
