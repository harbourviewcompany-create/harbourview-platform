#!/usr/bin/env node
/**
 * Fail when a migration classified `approved` is still not applied to production.
 *
 * WHY THIS EXISTS
 *
 * docs/control/AGENT_OPERATING_FACTS.md records the fact that silently
 * invalidates "done" in this repository:
 *
 *   > Merging a migration does not apply it to production. There is no CD for
 *   > migrations.
 *
 * and MIGRATION_DRIFT_2026-08-08.md names the resulting gap exactly:
 *
 *   > The real gap is that an `approved` migration can sit unapplied
 *   > indefinitely without escalation.
 *
 * On 2026-08-14 that gap was measured a second time. Three migrations approved
 * on 2026-08-02 were still unapplied twelve days later:
 *
 *   20260802073000  hv_dedup_assign_restore_hnsw_knn
 *   20260802152500  signal_feedback_api_rpcs
 *   20260802163000  elite_digest_rpc_boundary_hardening
 *
 * The second of those creates api.submit_signal_relevance_feedback and
 * api.signal_relevance_feedback_for_ranking. app/api/signals/feedback/route.ts
 * and lib/signals/feedbackScores.ts have been calling both against production
 * that whole time, against functions that did not exist. Nothing went red. The
 * feature was simply dead, and the only reason anyone noticed was a manual
 * audit.
 *
 * WHY IT IS SCOPED TO `approved` AND NOT TO ALL DRIFT
 *
 * There are 91 repository-only migrations at the time of writing. 70 are
 * `requiring_forward_reconciliation`, 5 are `obsolete`, 8 are
 * `separately_authorized`. A gate that failed on all of them would be red for
 * reasons no individual author can fix, and a gate that is permanently red is a
 * gate people learn to ignore -- the same trap the Vercel preview markers fell
 * into twice, and the reason check-migration-sql-parses.mjs parses instead of
 * replaying.
 *
 * `approved` is different, and it is the only classification that is. It means
 * a human already decided this must be in production. If it is not, that is not
 * an open question awaiting a decision -- it is a decision that was made and
 * then dropped. Exactly one party can clear it, and clearing it is unambiguous.
 *
 * The existing drift gate does not cover this. migration-ledger-manifest.mjs
 * computes both directions but the workflow fails only on
 * `applied_not_committed`; this is the reverse direction.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { parseSupabaseMigrationList } from './migration-ledger-manifest.mjs'

const DEFAULT_DECISIONS = 'supabase/release-controls/pending-production-migration-decisions.json'

function parseArgs(argv) {
  const args = new Map()
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      args.set(key, next)
      i += 1
    } else {
      args.set(key, 'true')
    }
  }
  return args
}

/**
 * Approved-but-unapplied versions, newest decision first.
 *
 * `appliedVersions` is the set actually present in
 * supabase_migrations.schema_migrations, as parsed from `supabase migration
 * list --linked`. A version counts as applied if it appears there under its own
 * number OR under any of its recorded `live_equivalent_versions` -- the ledger
 * uses that field for migrations that reached production under a different
 * apply-time version, and treating those as missing would produce a permanently
 * red gate that cannot be cleared.
 */
export function findUnappliedApproved(decision, appliedVersions) {
  const applied = new Set(appliedVersions)
  const records = decision.repository_only_decisions ?? []

  return records
    .filter((record) => record.classification === 'approved')
    .filter((record) => {
      if (applied.has(record.version)) return false
      const equivalents = record.live_equivalent_versions ?? []
      return !equivalents.some((version) => applied.has(version))
    })
    .sort((a, b) => b.version.localeCompare(a.version))
}

/** Whole days between a 14-digit YYYYMMDDHHMMSS version and now. */
export function ageInDays(version, now = new Date()) {
  const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(version)
  if (!match) return null
  const [, y, mo, d, h, mi, s] = match
  const stamped = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)
  if (Number.isNaN(stamped)) return null
  return Math.floor((now.getTime() - stamped) / 86_400_000)
}

const SELF_TEST_CASES = [
  {
    name: 'approved and applied is clean',
    decision: { repository_only_decisions: [{ version: '20260802073000', file: 'a.sql', classification: 'approved' }] },
    applied: ['20260802073000'],
    expected: [],
  },
  {
    name: 'approved and unapplied is flagged',
    decision: { repository_only_decisions: [{ version: '20260802073000', file: 'a.sql', classification: 'approved' }] },
    applied: ['20260801000000'],
    expected: ['20260802073000'],
  },
  {
    name: 'a live equivalent counts as applied',
    decision: {
      repository_only_decisions: [
        { version: '20260802073000', file: 'a.sql', classification: 'approved', live_equivalent_versions: ['20260730104633'] },
      ],
    },
    applied: ['20260730104633'],
    expected: [],
  },
  {
    name: 'the other three classifications never trip this gate',
    decision: {
      repository_only_decisions: [
        { version: '20260101000000', file: 'a.sql', classification: 'requiring_forward_reconciliation' },
        { version: '20260101000001', file: 'b.sql', classification: 'obsolete' },
        { version: '20260101000002', file: 'c.sql', classification: 'separately_authorized' },
      ],
    },
    applied: [],
    expected: [],
  },
  {
    name: 'an empty decision set passes rather than throwing',
    decision: {},
    applied: [],
    expected: [],
  },
]

function runSelfTest() {
  const failures = []
  for (const testCase of SELF_TEST_CASES) {
    const actual = findUnappliedApproved(testCase.decision, testCase.applied).map((r) => r.version)
    if (JSON.stringify(actual) !== JSON.stringify(testCase.expected)) {
      failures.push(
        `SELF-TEST FAIL ${testCase.name}: expected [${testCase.expected}], got [${actual}]`,
      )
    }
  }

  // The age helper is what makes the failure message actionable, so it is
  // covered too: a wrong number here would understate how long something sat.
  const age = ageInDays('20260802073000', new Date(Date.UTC(2026, 7, 14, 7, 30, 0)))
  if (age !== 12) failures.push(`SELF-TEST FAIL ageInDays: expected 12, got ${age}`)
  if (ageInDays('not-a-version') !== null) failures.push('SELF-TEST FAIL ageInDays: malformed version must return null')

  if (failures.length > 0) {
    for (const failure of failures) console.error(failure)
    process.exit(1)
  }
  console.log(`GO: approved-migration escalation self-test passed (${SELF_TEST_CASES.length + 2} cases).`)
}

function main(argv) {
  const args = parseArgs(argv)

  if (args.get('self-test') === 'true') {
    runSelfTest()
    return
  }

  const decisionsPath = args.get('decisions') ?? DEFAULT_DECISIONS
  const remoteListPath = args.get('remote-list')

  if (!remoteListPath) {
    console.error('HOLD: --remote-list <path> is required (output of `supabase migration list --linked`).')
    process.exit(1)
  }
  for (const [label, filePath] of [['decisions', decisionsPath], ['remote list', remoteListPath]]) {
    if (!fs.existsSync(filePath)) {
      console.error(`HOLD: ${label} file not found: ${filePath}`)
      process.exit(1)
    }
  }

  const decision = JSON.parse(fs.readFileSync(path.resolve(decisionsPath), 'utf8'))
  const { remoteVersions } = parseSupabaseMigrationList(fs.readFileSync(path.resolve(remoteListPath), 'utf8'))

  const approvedCount = (decision.repository_only_decisions ?? []).filter(
    (record) => record.classification === 'approved',
  ).length
  const unapplied = findUnappliedApproved(decision, remoteVersions)

  console.log('Approved-migration application check')
  console.log(`Decisions:        ${decisionsPath}`)
  console.log(`Applied versions: ${remoteVersions.length}`)
  console.log(`Classified approved: ${approvedCount}`)

  if (unapplied.length === 0) {
    console.log('GO: every approved migration is applied to production.')
    return
  }

  console.error('')
  console.error(`HOLD: ${unapplied.length} approved migration(s) are merged but NOT applied to production.`)
  for (const record of unapplied) {
    const age = ageInDays(record.version)
    const suffix = age === null ? '' : ` (approved ${age} day${age === 1 ? '' : 's'} ago)`
    console.error(`- ${record.version} ${record.file}${suffix}`)
  }
  console.error('')
  console.error('`approved` means the decision to apply was already made. Code that depends on')
  console.error('these migrations is running against a schema that does not have them, and no')
  console.error('other check in this repository is red about it.')
  console.error('')
  console.error('Apply them through the production migration workflow, then re-run this check.')
  process.exit(1)
}

// Guarded so the unit test can import findUnappliedApproved/ageInDays without
// the CLI running (and calling process.exit) on import.
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main(process.argv.slice(2))
}
