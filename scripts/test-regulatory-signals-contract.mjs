import fs from 'fs'

const publicLayer = fs.readFileSync('./lib/regulatory-signals/public.ts','utf-8')
// Originally checked for `toPublicRegulatorySignal` (added 2026-05-05,
// "Enforce public regulatory signal projection"). That function still exists
// in ./safety.ts, fully intact, but public.ts's actual live data paths
// (mapApprovedRow for the editorial-reviewed view, mapSignalRow for the
// automated-intake path) never called it or anything equivalent — this test
// had been failing against production main for some time as a result.
// toPublicRegulatorySignal itself can't be dropped in as-is: it requires
// review_status/public_safe/publish_to_public on its input, and the
// `regulatory_signals.public_signals` view doesn't expose those columns by
// design (a row can't appear in the view unless it already passed the gate
// at the database layer — see the view definition in
// 20260312000000_regulatory_signals_v1.sql). What both paths were actually
// missing was the *content* leak-scan half of that function:
// assertPublicRegulatorySignalSafe, which re-serializes the shaped signal
// and throws if any forbidden internal/marketplace term appears in it. That
// is now wired into both mapApprovedRow and mapSignalRow (fail-open per row,
// not per feed — one bad signal is excluded and logged, not a 500).
if (!publicLayer.includes('assertPublicRegulatorySignalSafe')) {
  console.error('Projection layer not enforced')
  process.exit(1)
}

const schema = fs.readFileSync('./supabase/migrations/20260312000000_regulatory_signals_v1.sql','utf-8')
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

console.log('regulatory signals contract ok')
