import { readFileSync } from 'node:fs'

const disallowedTokens = [
  'SUPABASE_',
  'createClient',
  'service_role',
  'RLS',
  'auth.',
  'sourceEvidence',
  'provenanceSummary',
  'internalReviewNotes',
  'sourceUrl',
  'sourceName',
]

const files = [
  'app/page.tsx',
  'components/globe/GlobeSameScreenRouterLanding.tsx',
  'components/globe/HarbourviewSovereignPlateGlobe.tsx',
  'components/globe/RoleChipSelector.tsx',
  'components/globe/IntentCardGrid.tsx',
  'components/globe/useGlobeRouterState.ts',
  'lib/globe/route-resolver.ts',
  'types/globe-router.ts',
]

const violations = []

for (const file of files) {
  const content = readFileSync(file, 'utf8')

  for (const token of disallowedTokens) {
    if (content.includes(token)) {
      violations.push(`${file}: contains disallowed token ${token}`)
    }
  }
}

if (violations.length > 0) {
  console.error('Globe router scope violations detected:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log('Globe router scope guard passed: no Supabase/auth/RLS/admin/provenance tokens in scoped files.')
