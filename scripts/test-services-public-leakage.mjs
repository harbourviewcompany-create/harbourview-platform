import fs from 'node:fs'

const forbidden = [
  'sourceUrl',
  'sourceName',
  'contactEmail',
  'captured_text',
  'raw_html_hash',
  'reviewed_at',
  'reviewed_by',
  'provenance',
  'raw_text'
]

const targets = [
  'lib/marketplace/liveServices.ts',
  'lib/marketplace/publicServiceProjection.ts',
  'app/marketplace/services/page.tsx'
]

const failures = []

for (const target of targets) {
  const content = fs.readFileSync(target, 'utf8')

  for (const token of forbidden) {
    const exposed = content.includes(token) && !content.includes(`forbidden`) && !content.includes(`const forbidden`)

    if (exposed) {
      failures.push(`${target} exposes forbidden token: ${token}`)
    }
  }
}

if (fs.existsSync('.next')) {
  const scan = JSON.stringify(fs.readdirSync('.next'))

  for (const token of forbidden) {
    if (scan.includes(token)) {
      failures.push(`Built output references forbidden token: ${token}`)
    }
  }
}

if (failures.length > 0) {
  console.error('FAIL services public leakage regression')
  for (const failure of failures) {
    console.error(failure)
  }
  process.exit(1)
}

console.log('PASS services public leakage regression')
