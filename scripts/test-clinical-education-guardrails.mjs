import { readFileSync } from 'node:fs'

const CLINICAL_PUBLIC_FILES = [
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
  /Professional review required/i,
  /Research in progress/i,
]

const PROHIBITED_PUBLIC_PATTERNS = [
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
  /this strain/i,
  /this will make you feel/i,
  /doctor recommended/i,
  /patient-specific dose/i,
  /most effective/i,
  /preferred treatment/i,
]

const PROHIBITED_LEAKAGE_PATTERNS = [
  /Supplier Directory/i,
  /supplierName/,
  /supplierContact/,
  /sourceUrl/,
  /sourceName/,
  /sourceEvidence/,
  /provenanceSummary/,
  /internalReviewNotes/,
  /sellerAuthorizationStatus/,
  /availabilityStatus/,
  /verificationStatus/,
  /reviewedBy/,
  /lastReviewedAt/,
  /nextReviewDueAt/,
  /private COA/i,
  /inventory available/i,
  /supplier available/i,
  /contact supplier/i,
  /confirmed buyers/i,
  /exclusive supply/i,
]

const MARKETPLACE_IMPORT_PATTERNS = [
  /from ['"]@\/lib\/marketplace\//,
  /from ['"]@\/components\/marketplace\//,
  /from ['"]@\/lib\/fixtures\/marketplace/,
  /from ['"]@\/lib\/fixtures\/listings/,
  /from ['"]@\/lib\/marketplaceCandidates/,
]

function read(path) {
  return readFileSync(path, 'utf8')
}

const failures = []
const combined = CLINICAL_PUBLIC_FILES.map((path) => `\n/* ${path} */\n${read(path)}`).join('\n')

for (const pattern of REQUIRED_PATTERNS) {
  if (!pattern.test(combined)) failures.push(`Clinical education missing required guardrail text: ${pattern}`)
}

for (const path of CLINICAL_PUBLIC_FILES) {
  const content = read(path)
  const scanContent = content
    .replace(/restrictedLanguage:\s*\[[\s\S]*?\]/g, 'restrictedLanguage: []')
    .replace(/PROHIBITED_PUBLIC_PATTERNS\s*=\s*\[[\s\S]*?\]/g, 'PROHIBITED_PUBLIC_PATTERNS = []')
    .replace(/PROHIBITED_LEAKAGE_PATTERNS\s*=\s*\[[\s\S]*?\]/g, 'PROHIBITED_LEAKAGE_PATTERNS = []')

  for (const pattern of PROHIBITED_PUBLIC_PATTERNS) {
    if (pattern.test(scanContent)) failures.push(`Clinical claim guardrail failed: ${path} matched ${pattern}`)
  }

  for (const pattern of PROHIBITED_LEAKAGE_PATTERNS) {
    if (pattern.test(scanContent)) failures.push(`Clinical supplier/source leakage failed: ${path} matched ${pattern}`)
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

console.log('ok clinical education includes required disclaimers and module status controls')
console.log('ok clinical education public files avoid prohibited clinical claim language')
console.log('ok clinical education public files avoid supplier/source/provenance leakage')
console.log('ok clinical education does not import marketplace internals')
