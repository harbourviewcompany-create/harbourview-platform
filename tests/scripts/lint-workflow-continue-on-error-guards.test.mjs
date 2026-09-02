import assert from 'node:assert/strict'
import { globSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  findUnsafeContinueOnErrorGuards,
  parseWorkflowSteps,
} from '../../scripts/lint-workflow-continue-on-error-guards.mjs'

const BUGGY_FIXTURE = `name: Test
on: push
jobs:
  check-drift:
    runs-on: ubuntu-latest
    steps:
      - name: Generate exact drift manifest
        id: manifest
        continue-on-error: true
        run: |
          node scripts/migration-ledger-manifest.mjs --mode drift

      - name: Notify on new migration drift
        if: always() && steps.manifest.outcome == 'success'
        continue-on-error: true
        run: |
          node scripts/notify-new-migration-drift.mjs
`

const FIXED_FIXTURE = `name: Test
on: push
jobs:
  check-drift:
    runs-on: ubuntu-latest
    steps:
      - name: Generate exact drift manifest
        id: manifest
        continue-on-error: true
        run: |
          node scripts/migration-ledger-manifest.mjs --mode drift

      - name: Notify on new migration drift
        if: always()
        continue-on-error: true
        run: |
          if [ ! -f artifacts/migration-drift/manifest.json ]; then
            exit 0
          fi
          node scripts/notify-new-migration-drift.mjs
`

const RUN_BLOCK_TRAP_FIXTURE = `name: Test
on: push
jobs:
  check-drift:
    runs-on: ubuntu-latest
    steps:
      - name: Generate exact drift manifest
        id: manifest
        continue-on-error: true
        run: |
          node scripts/migration-ledger-manifest.mjs --mode drift

      - name: Totally safe step with a trap comment
        if: always()
        run: |
          echo "if: always() && steps.manifest.outcome == 'success'"
          echo "this is just text inside a run block, not a real if: condition"
`

test('parseWorkflowSteps extracts name, id, if, and continue-on-error per step', () => {
  const steps = parseWorkflowSteps(BUGGY_FIXTURE)
  assert.equal(steps.length, 2)
  assert.equal(steps[0].name, 'Generate exact drift manifest')
  assert.equal(steps[0].id, 'manifest')
  assert.equal(steps[0].continueOnError, true)
  assert.equal(steps[1].name, 'Notify on new migration drift')
  assert.equal(steps[1].if, "always() && steps.manifest.outcome == 'success'")
  assert.equal(steps[1].continueOnError, true)
})

test('parseWorkflowSteps does not treat run: block content as step-level fields', () => {
  const steps = parseWorkflowSteps(RUN_BLOCK_TRAP_FIXTURE)
  assert.equal(steps.length, 2)
  // The second step's real `if:` is `always()`; the block-scalar body contains
  // a line that LOOKS like a different if: condition, in an echo string. That
  // must never be picked up as this step's actual condition.
  assert.equal(steps[1].if, 'always()')
})

test('findUnsafeContinueOnErrorGuards flags the exact shape of the real PR #1705/#1722 bug', () => {
  const steps = parseWorkflowSteps(BUGGY_FIXTURE)
  const violations = findUnsafeContinueOnErrorGuards(steps)
  assert.equal(violations.length, 1)
  assert.equal(violations[0].step, 'Notify on new migration drift')
  assert.equal(violations[0].referencedId, 'manifest')
})

test('findUnsafeContinueOnErrorGuards passes the corrected version from PR #1722', () => {
  const steps = parseWorkflowSteps(FIXED_FIXTURE)
  const violations = findUnsafeContinueOnErrorGuards(steps)
  assert.deepEqual(violations, [])
})

test('findUnsafeContinueOnErrorGuards ignores lookalike text inside run: blocks', () => {
  const steps = parseWorkflowSteps(RUN_BLOCK_TRAP_FIXTURE)
  const violations = findUnsafeContinueOnErrorGuards(steps)
  assert.deepEqual(violations, [])
})

test('findUnsafeContinueOnErrorGuards does not flag a step referencing its own outcome when that step lacks continue-on-error', () => {
  const steps = parseWorkflowSteps(`name: Test
on: push
jobs:
  j:
    runs-on: ubuntu-latest
    steps:
      - name: Build
        id: build
        run: echo hi

      - name: Deploy
        if: steps.build.outcome == 'success'
        run: echo deploying
`)
  const violations = findUnsafeContinueOnErrorGuards(steps)
  assert.deepEqual(violations, [])
})

test('regression: every real workflow file in this repository is clean', () => {
  const files = globSync('.github/workflows/*.yml')
  assert.ok(files.length > 0, 'expected to find at least one workflow file')

  const allViolations = files.flatMap((file) => {
    const steps = parseWorkflowSteps(readFileSync(file, 'utf8'))
    return findUnsafeContinueOnErrorGuards(steps).map((v) => ({ file, ...v }))
  })

  assert.deepEqual(
    allViolations,
    [],
    `Found unsafe continue-on-error guard(s):\n${JSON.stringify(allViolations, null, 2)}`,
  )
})
