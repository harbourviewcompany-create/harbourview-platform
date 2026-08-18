/**
 * CLI entry for clinical source-metadata currentness (Phase A+)
 *
 * Usage:
 *   npx tsx scripts/clinical-source-currentness.ts
 *   npx tsx scripts/clinical-source-currentness.ts --limit=50 --dry-run
 */

import { runSourceCurrentness } from '../lib/clinical/sourceCurrentness'

function parseArgs() {
  const args = process.argv.slice(2)
  let limit = 100
  let dryRun = false
  for (const a of args) {
    if (a.startsWith('--limit=')) limit = Math.max(1, parseInt(a.slice(8), 10) || 100)
    if (a === '--dry-run') dryRun = true
  }
  return { limit, dryRun }
}

async function main() {
  const { limit, dryRun } = parseArgs()
  console.log(`[clinical-source-currentness] start limit=${limit} dryRun=${dryRun}`)
  const summary = await runSourceCurrentness({ limit, dryRun })
  console.log('[clinical-source-currentness] done', summary)
  if (!summary.ok) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
