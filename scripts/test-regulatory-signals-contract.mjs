import fs from 'fs'

const publicLayer = fs.readFileSync('./lib/regulatory-signals/public.ts','utf-8')
if (!publicLayer.includes('toPublicRegulatorySignal')) {
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
