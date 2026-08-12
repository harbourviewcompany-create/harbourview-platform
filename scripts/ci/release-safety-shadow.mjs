import fs from 'node:fs'
import path from 'node:path'

const outDir = path.resolve('artifacts/release-safety')
fs.mkdirSync(outDir, { recursive: true })

const findings = []
const note = (severity, code, message) => findings.push({ severity, code, message })

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
if (!pkg.scripts?.typecheck) note('error', 'missing-typecheck', 'package.json has no typecheck script')
if (!pkg.scripts?.build) note('error', 'missing-build', 'package.json has no build script')
if (!pkg.scripts?.['test:e2e']) note('warning', 'missing-e2e', 'package.json has no test:e2e script')
if (!pkg.scripts?.['test:security']) note('warning', 'missing-security', 'package.json has no test:security script')

const vercel = fs.existsSync('vercel.json') ? JSON.parse(fs.readFileSync('vercel.json', 'utf8')) : null
if (!vercel) note('error', 'missing-vercel-config', 'vercel.json is missing')
else if (vercel.git?.deploymentEnabled !== true) note('warning', 'vercel-git-disabled', 'Vercel Git deployment is not explicitly enabled')

if (!fs.existsSync('playwright.config.js') && !fs.existsSync('playwright.config.ts')) {
  note('error', 'missing-playwright-config', 'Playwright config is missing')
}

if (!fs.existsSync('supabase/migrations')) note('error', 'missing-supabase-migrations', 'supabase/migrations is missing')
if (!fs.existsSync('supabase/migrations_pending_review')) note('warning', 'missing-pending-review-boundary', 'supabase/migrations_pending_review is missing')

const workflowDir = path.resolve('.github/workflows')
if (fs.existsSync(workflowDir)) {
  for (const file of fs.readdirSync(workflowDir).filter((f) => /\.ya?ml$/.test(f))) {
    const text = fs.readFileSync(path.join(workflowDir, file), 'utf8')
    for (const m of text.matchAll(/uses:\s*([^@\s]+)@([^\s#]+)/g)) {
      const ref = m[2]
      if (!/^[0-9a-f]{40}$/i.test(ref) && !m[1].startsWith('./')) {
        note('info', 'mutable-action-ref', `${file}: ${m[1]}@${ref} is not pinned to a full commit SHA`)
      }
    }
    if (/permissions:\s*write-all/i.test(text)) note('warning', 'write-all', `${file}: permissions: write-all detected`)
    if (/pull_request_target\s*:/i.test(text)) note('warning', 'pull-request-target', `${file}: pull_request_target requires explicit trust-boundary review`)
  }
}

const report = {
  schemaVersion: 1,
  mode: 'shadow',
  gitSha: process.env.RELEASE_EVIDENCE_SHA || process.env.GITHUB_SHA || null,
  workflowSha: process.env.RELEASE_WORKFLOW_SHA || process.env.GITHUB_SHA || null,
  generatedAt: new Date().toISOString(),
  stack: {
    next: pkg.dependencies?.next || null,
    supabaseJs: pkg.dependencies?.['@supabase/supabase-js'] || null,
    supabaseSsr: pkg.dependencies?.['@supabase/ssr'] || null,
    playwright: pkg.devDependencies?.['@playwright/test'] || null,
    node: pkg.engines?.node || 'workflow-controlled'
  },
  findings,
  summary: {
    errors: findings.filter((x) => x.severity === 'error').length,
    warnings: findings.filter((x) => x.severity === 'warning').length,
    info: findings.filter((x) => x.severity === 'info').length
  }
}

fs.writeFileSync(path.join(outDir, 'repository-audit.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report.summary))

// Stage 0/1 is intentionally observational. Existing CI remains authoritative.
// This script does not fail the workflow until a later PR explicitly promotes a finding to a required gate.
