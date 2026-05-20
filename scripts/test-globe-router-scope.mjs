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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildDisallowedTokenPattern(token) {
  const escaped = escapeRegex(token)
  const startsWithWord = /^\w/.test(token)
  const endsWithWord = /\w$/.test(token)
  const prefix = startsWithWord ? '\\b' : ''
  const suffix = endsWithWord ? '\\b' : ''
  return new RegExp(`${prefix}${escaped}${suffix}`)
}

const disallowedPatterns = disallowedTokens.map((token) => ({
  token,
  pattern: buildDisallowedTokenPattern(token),
}))

const violations = []

for (const file of files) {
  const content = readFileSync(file, 'utf8')

  for (const { token, pattern } of disallowedPatterns) {
    if (pattern.test(content)) {
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
