import fs from 'fs'

const repo = fs.readFileSync('./lib/regulatory-signals/public.ts','utf-8')
if (!repo.includes('toPublicRegulatorySignal')) {
  console.error('Projection layer not enforced')
  process.exit(1)
}

const schema = fs.readFileSync('./supabase/migrations/0099_regulatory_signals_v1.sql','utf-8')
if (!schema.includes('regulatory_signals.signals')) {
  console.error('Schema missing')
  process.exit(1)
}

console.log('regulatory signals contract ok')
