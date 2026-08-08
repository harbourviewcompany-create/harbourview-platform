import fs from 'node:fs'
import path from 'node:path'

const outDir = path.resolve('artifacts/release-safety')
fs.mkdirSync(outDir, { recursive: true })

const activeDir = path.resolve('supabase/migrations')
const reviewDir = path.resolve('supabase/migrations_pending_review')
const critical = []
const patterns = [
  ['drop', /\bdrop\s+(table|column|type|schema|policy)\b/i],
  ['column-type-rewrite', /\balter\s+table[\s\S]*\balter\s+column[\s\S]*\btype\b/i],
  ['policy-change', /\b(create|alter|drop)\s+policy\b/i],
  ['grant-change', /\b(grant|revoke)\b/i],
  ['bypassrls', /\bbypassrls\b/i],
  ['public-view', /\bcreate\s+(or\s+replace\s+)?view\s+(public\.)?/i]
]

if (fs.existsSync(activeDir)) {
  for (const file of fs.readdirSync(activeDir).filter((f) => f.endsWith('.sql')).sort()) {
    const sql = fs.readFileSync(path.join(activeDir, file), 'utf8')
    const flags = patterns.filter(([, re]) => re.test(sql)).map(([name]) => name)
    if (flags.length) critical.push({ file, flags })
  }
}

const report = {
  schemaVersion: 1,
  mode: 'shadow',
  generatedAt: new Date().toISOString(),
  gitSha: process.env.GITHUB_SHA || null,
  activeMigrationDirectory: 'supabase/migrations',
  pendingReviewDirectory: fs.existsSync(reviewDir) ? 'supabase/migrations_pending_review' : null,
  releaseCriticalMigrationsObserved: critical,
  note: 'Observational Stage 0/1 report only. Presence of a flagged migration is not itself failure; later required gates must compare changed migrations and explicit review evidence.'
}

fs.writeFileSync(path.join(outDir, 'migration-review-boundary.json'), JSON.stringify(report, null, 2) + '\n')
console.log(`Observed ${critical.length} active migration(s) containing release-critical SQL categories.`)
