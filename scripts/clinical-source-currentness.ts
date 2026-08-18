/**
 * CLI entry for clinical source-metadata currentness (Phase B)
 *
 * Usage:
 *   npx tsx scripts/clinical-source-currentness.ts
 *   npx tsx scripts/clinical-source-currentness.ts --limit=50 --dry-run
 *   npx tsx scripts/clinical-source-currentness.ts --limit=80 --concurrency=4
 */

import { runSourceCurrentness } from '../lib/clinical/sourceCurrentness'

function parseArgs() {
  const args = process.argv.slice(2)
  let limit = 100
  let dryRun = false
  let concurrency = 3
  for (const a of args) {
    if (a.startsWith('--limit=')) limit = Math.max(1, parseInt(a.slice(8), 10) || 100)
    if (a === '--dry-run') dryRun = true
    if (a.startsWith('--concurrency=')) {
      concurrency = Math.max(1, Math.min(8, parseInt(a.slice(14), 10) || 3))
    }
  }
  return { limit, dryRun, concurrency }
}

async function main() {
  const { limit, dryRun, concurrency } = parseArgs()
  console.log(
    `[clinical-source-currentness] start limit=${limit} dryRun=${dryRun} concurrency=${concurrency}`
  )
  const summary = await runSourceCurrentness({ limit, dryRun, concurrency, priorityFirst: true })
  console.log('[clinical-source-currentness] done', summary)
  if (!summary.ok) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
