#!/usr/bin/env node

// Notifies on NEW live-only migration versions, as they appear, rather than
// requiring a human or agent to notice the same red "Compare repository and
// live migration ledgers" check that has been red for the pre-existing
// backlog since before this script existed.
//
// This is deliberately narrow. It does not attempt to reconcile drift, does
// not write migration files, and does not touch supabase/release-controls/
// itself. See docs/control/MIGRATION_DRIFT_RECONCILIATION_20260810.md rule 1:
// "Never manufacture SQL from current schema state." All this script does is
// make sure a version nobody has looked at yet gets a GitHub issue instead of
// silently joining a backlog that already numbers in the dozens.
//
// Scope is bounded by supabase/release-controls/migration-drift-watch-baseline.json.
// Only applied_not_committed versions strictly greater than the baseline are
// ever candidates for a new issue -- everything at or before the baseline is
// the responsibility of the existing MIGRATION_DRIFT_*.md reconciliation
// process, not this script. Bump the baseline forward (see that file's own
// `note` field) after each manual reconciliation sweep; do not bump it for
// any other reason, and never bump it past a version that has not actually
// been reconciled (either a matching repository migration committed, or a
// reviewed equivalence/historical attestation entry added).
//
// Deliberately does not fetch migration names from the live database. The
// existing CI job authenticates via `supabase link` + the Supabase CLI, whose
// `migration list` output (see tests/scripts/migration-ledger-manifest.test.mjs
// for the exact real format) has no name column -- only version and time.
// Adding a name lookup here would mean adding a new database credential this
// workflow does not currently hold, for a convenience a human can get in one
// query when they pick up the issue. Not worth the new secret.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const VERSION_RE = /^\d{14}$/
const ISSUE_LABEL = 'migration-drift'

/**
 * @param {string[]} appliedNotCommitted - versions from manifest.json's
 *   applied_not_committed array
 * @param {string} baselineVersion - from migration-drift-watch-baseline.json
 * @returns {string[]} versions strictly newer than the baseline, sorted ascending
 */
export function filterNewVersions(appliedNotCommitted, baselineVersion) {
  if (!VERSION_RE.test(baselineVersion)) {
    throw new Error(`Invalid baseline version: ${baselineVersion}`)
  }
  for (const v of appliedNotCommitted) {
    if (!VERSION_RE.test(v)) throw new Error(`Invalid applied_not_committed version: ${v}`)
  }
  return [...appliedNotCommitted].filter((v) => v > baselineVersion).sort()
}

/**
 * A version counts as already flagged if any OPEN issue carrying
 * ISSUE_LABEL contains the exact version string in its title or body.
 * This is the entire dedup mechanism -- deliberately no separate tracking
 * file for "already flagged," so there is exactly one place drift-watch
 * state lives and it is visible/searchable/closeable like any other issue,
 * not a JSON file only tooling ever reads.
 *
 * @param {string[]} newVersions
 * @param {{title: string, body: string}[]} openIssues - open issues already
 *   carrying ISSUE_LABEL
 * @returns {string[]} subset of newVersions not mentioned in any open issue
 */
export function versionsNotYetFlagged(newVersions, openIssues) {
  return newVersions.filter(
    (v) => !openIssues.some((issue) => issue.title.includes(v) || issue.body.includes(v)),
  )
}

/**
 * @param {string[]} versions - unflagged, sorted ascending
 * @param {string} sourceSha
 * @returns {{title: string, body: string}}
 */
export function buildIssue(versions, sourceSha) {
  const title =
    versions.length === 1
      ? `Migration drift: 1 new unattributed live version (${versions[0]})`
      : `Migration drift: ${versions.length} new unattributed live versions (${versions[0]}..${versions[versions.length - 1]})`

  const versionList = versions.map((v) => `- \`${v}\``).join('\n')

  const body = `## New live-only migration version(s) detected

Found by the hourly \`Compare repository and live migration ledgers\` check
(source \`${sourceSha}\`). These versions exist in the live
\`supabase_migrations.schema_migrations\` table with no matching migration file
on \`main\`, and are newer than the current
\`supabase/release-controls/migration-drift-watch-baseline.json\` baseline, so
they are not covered by any prior reconciliation sweep.

${versionList}

## To get the migration name(s)

This job does not hold a database credential capable of reading
\`schema_migrations.name\` directly (only the Supabase CLI access token used
for \`supabase migration list\`, which does not include names). Run this
against the live project to identify what each one is:

\`\`\`sql
select version, name from supabase_migrations.schema_migrations
where version in (${versions.map((v) => `'${v}'`).join(', ')});
\`\`\`

## Disposition (per \`docs/control/MIGRATION_DRIFT_RECONCILIATION_20260810.md\` rule 1)

For each version above, one of:

1. Recover exact provenance and commit the canonical repository migration file, or
2. If provenance is unrecoverable but content can be confirmed safe via a full
   schema/data diff, add a reviewed entry to
   \`supabase/release-controls/migration-live-version-equivalences.json\` or
   \`historical-remote-migration-attestations.json\` with a real
   \`statement_sha256\` -- never a fabricated one, and never SQL reconstructed
   from current schema state, and
3. Once reconciled, bump \`migration-drift-watch-baseline.json\`'s
   \`baseline_version\` forward to at least the highest version closed out by
   the reconciliation, and close this issue referencing the PR that did it.

This issue was opened automatically. Closing it without doing one of the
above just means the next hourly run reopens the same finding under a new
issue, since it is no longer present in any open \`${ISSUE_LABEL}\`-labeled issue.
`

  return { title, body }
}

async function fetchOpenLabeledIssues({ owner, repo, token, label }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&labels=${encodeURIComponent(label)}&per_page=100`
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to list existing ${label} issues: ${res.status} ${await res.text()}`)
  }
  const issues = await res.json()
  // Exclude pull requests, which the issues endpoint also returns.
  return issues
    .filter((i) => !i.pull_request)
    .map((i) => ({ title: i.title ?? '', body: i.body ?? '' }))
}

async function createIssue({ owner, repo, token, label, title, body }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body, labels: [label] }),
  })
  if (!res.ok) {
    throw new Error(`Failed to create issue: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

function loadBaseline(baselinePath) {
  const raw = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
  if (!VERSION_RE.test(raw.baseline_version ?? '')) {
    throw new Error(`Invalid or missing baseline_version in ${baselinePath}`)
  }
  return raw.baseline_version
}

function loadManifestAppliedNotCommitted(manifestPath) {
  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  if (!Array.isArray(raw.applied_not_committed)) {
    throw new Error(`${manifestPath} has no applied_not_committed array`)
  }
  return raw.applied_not_committed
}

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2)
      const value = argv[i + 1]
      args[key] = value
      i += 1
    }
  }
  return args
}

async function main(argv) {
  const args = parseArgs(argv)
  const manifestPath = args.manifest ?? 'artifacts/migration-drift/manifest.json'
  const baselinePath = args.baseline ?? 'supabase/release-controls/migration-drift-watch-baseline.json'
  const sourceSha = args['source-sha'] ?? process.env.GITHUB_SHA ?? 'unknown'
  const repoSlug = args.repo ?? process.env.GITHUB_REPOSITORY
  const token = args.token ?? process.env.GITHUB_TOKEN

  if (!repoSlug || !repoSlug.includes('/')) {
    throw new Error('--repo (or GITHUB_REPOSITORY) must be set as owner/repo')
  }
  if (!token) {
    throw new Error('--token (or GITHUB_TOKEN) is required to read/create issues')
  }
  const [owner, repo] = repoSlug.split('/')

  const appliedNotCommitted = loadManifestAppliedNotCommitted(manifestPath)
  const baselineVersion = loadBaseline(baselinePath)
  const newVersions = filterNewVersions(appliedNotCommitted, baselineVersion)

  if (newVersions.length === 0) {
    console.log(
      `No migration versions newer than baseline ${baselineVersion} found in applied_not_committed. Nothing to do.`,
    )
    return
  }

  const openIssues = await fetchOpenLabeledIssues({ owner, repo, token, label: ISSUE_LABEL })
  const unflagged = versionsNotYetFlagged(newVersions, openIssues)

  if (unflagged.length === 0) {
    console.log(
      `${newVersions.length} version(s) newer than baseline, but all already mentioned in an open ${ISSUE_LABEL} issue. Nothing new to file.`,
    )
    return
  }

  const { title, body } = buildIssue(unflagged, sourceSha)
  const issue = await createIssue({ owner, repo, token, label: ISSUE_LABEL, title, body })
  console.log(`Filed ${issue.html_url} for ${unflagged.length} new version(s): ${unflagged.join(', ')}`)
}

const isDirectExecution =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirectExecution) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
