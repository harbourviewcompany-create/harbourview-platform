import fs from 'fs'
import { spawnSync } from 'node:child_process'

const schema = fs.readFileSync('./supabase/migrations/20260312000000_regulatory_signals_v1.sql', 'utf-8')
if (!schema.includes('regulatory_signals.signals')) {
  console.error('Schema missing')
  process.exit(1)
}

const regulatorySurface = [
  './lib/regulatory-signals/public.ts',
  './lib/regulatory-signals/types.ts',
]
  .filter((path) => fs.existsSync(path))
  .map((path) => fs.readFileSync(path, 'utf-8'))
  .join('\n')
  .toLowerCase()

if (regulatorySurface.includes('deal') || regulatorySurface.includes('supplier')) {
  console.error('Marketplace signal contamination detected')
  process.exit(1)
}

// The public projection contract is behavioral, not a source-text grep. This
// suite exercises both live feed paths, canonical_source_url, normalized content
// leakage, and exact forbidden structural fields. Because this script is run by
// CI's Domain Logic job, a regression blocks the protected Next.js Build chain.
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const result = spawnSync(
  npx,
  ['vitest', 'run', 'tests/regulatory-signals/public-safety.test.ts'],
  { stdio: 'inherit' },
)

if (result.error) {
  console.error('Unable to execute regulatory signals behavioral contract:', result.error.message)
  process.exit(1)
}

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log('regulatory signals contract ok')
