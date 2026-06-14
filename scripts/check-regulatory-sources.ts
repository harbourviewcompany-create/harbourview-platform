import { runRegulatoryWatch } from '../lib/regulatory-sources/runWatch'

async function main() {
  const limit = Number(process.env.HARBOURVIEW_SOURCE_CHECK_LIMIT || process.argv[2] || 20)
  const summary = await runRegulatoryWatch(limit)
  if (!summary.ok) throw new Error(summary.error || 'runRegulatoryWatch failed')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
