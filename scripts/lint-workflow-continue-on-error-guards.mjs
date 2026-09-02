#!/usr/bin/env node

// Detects the exact class of bug fixed in
// fix/drift-watch-outcome-guard-20260831 (PR #1722): a step's `if:`
// condition checking `steps.<id>.outcome == 'success'` for a step <id> that
// itself has `continue-on-error: true`.
//
// That combination is a trap, not necessarily a bug on its own -- but it
// was the exact shape of the real bug: `continue-on-error: true` only
// overrides a step's *displayed conclusion*; `steps.<id>.outcome` in `if:`
// expressions still reflects the raw, pre-override result. A step that
// intentionally uses continue-on-error specifically because it is *expected*
// to fail under the condition a later step needs to act on (as
// migration-ledger-manifest.mjs deliberately does in --mode drift) will
// silently skip anything gated this way, with no error, no failed check,
// nothing -- exactly what happened for roughly a day between #1705 and #1722.
//
// This is not a general GitHub Actions expression-language interpreter and
// does not try to be one. It is a small, purpose-built extractor for the
// step-block shape actually used in this repository's workflow files
// (6-space step starts, 8-space fields, block-scalar `run: |` bodies at
// >=10 spaces -- see the cat -A inspection this was written against). It
// exists to catch a regression of one specific, already-shipped bug class,
// not to validate workflow YAML in general.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'node:fs'

/**
 * @param {string} yamlText
 * @returns {{name: string|null, id: string|null, if: string|null, continueOnError: boolean}[]}
 */
export function parseWorkflowSteps(yamlText) {
  const lines = yamlText.split('\n')
  const steps = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const stepStart = line.match(/^(\s*)-\s+(?:name|uses|run):/)
    if (!stepStart) {
      i += 1
      continue
    }

    const baseIndent = stepStart[1].length
    const step = { name: null, id: null, if: null, continueOnError: false }
    const nameMatch = line.match(/^\s*-\s+name:\s*(.*)$/)
    if (nameMatch) step.name = nameMatch[1].trim()

    i += 1
    while (i < lines.length) {
      const l = lines[i]
      if (l.trim() === '') {
        i += 1
        continue
      }
      const indent = l.match(/^(\s*)/)[1].length
      if (indent <= baseIndent) break // dedent out of this step

      if (indent === baseIndent + 2) {
        const idMatch = l.match(/^\s*id:\s*(\S+)/)
        const ifMatch = l.match(/^\s*if:\s*(.*)$/)
        const coeMatch = l.match(/^\s*continue-on-error:\s*(true|false)/)
        const runBlockMatch = l.match(/^\s*run:\s*[|>]/)

        if (idMatch) step.id = idMatch[1].trim()
        if (ifMatch) step.if = ifMatch[1].trim()
        if (coeMatch) step.continueOnError = coeMatch[1] === 'true'

        if (runBlockMatch) {
          // Skip the entire block-scalar body: every subsequent line
          // indented more than this `run:` line belongs to it, regardless
          // of what it looks like (including lines that would otherwise
          // match id:/if:/continue-on-error: patterns above).
          const runIndent = indent
          i += 1
          while (i < lines.length) {
            const bl = lines[i]
            if (bl.trim() === '') {
              i += 1
              continue
            }
            const bIndent = bl.match(/^(\s*)/)[1].length
            if (bIndent <= runIndent) break
            i += 1
          }
          continue
        }
      }
      i += 1
    }
    steps.push(step)
  }

  return steps
}

/**
 * @param {{name: string|null, id: string|null, if: string|null, continueOnError: boolean}[]} steps
 * @returns {{step: string, referencedId: string, if: string}[]}
 */
export function findUnsafeContinueOnErrorGuards(steps) {
  const continueOnErrorIds = new Set(
    steps.filter((s) => s.continueOnError && s.id).map((s) => s.id),
  )
  const violations = []

  for (const step of steps) {
    if (!step.if) continue
    for (const id of continueOnErrorIds) {
      const pattern = new RegExp(`steps\\.${id}\\.outcome\\s*==\\s*'success'`)
      if (pattern.test(step.if)) {
        violations.push({
          step: step.name ?? step.id ?? '(unnamed step)',
          referencedId: id,
          if: step.if,
        })
      }
    }
  }

  return violations
}

function checkFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  const steps = parseWorkflowSteps(text)
  return findUnsafeContinueOnErrorGuards(steps).map((v) => ({ file: filePath, ...v }))
}

async function main(argv) {
  const globPattern = argv[0] ?? '.github/workflows/*.yml'
  const files = globSync(globPattern).sort()

  if (files.length === 0) {
    console.error(`No files matched: ${globPattern}`)
    process.exitCode = 1
    return
  }

  const allViolations = files.flatMap(checkFile)

  if (allViolations.length === 0) {
    console.log(`GO: checked ${files.length} workflow file(s), no unsafe continue-on-error guards found.`)
    return
  }

  console.error(`HOLD: found ${allViolations.length} unsafe continue-on-error guard(s):\n`)
  for (const v of allViolations) {
    console.error(`  ${v.file} -- step "${v.step}"`)
    console.error(`    if: ${v.if}`)
    console.error(
      `    references steps.${v.referencedId}.outcome == 'success', but "${v.referencedId}" has continue-on-error: true.`,
    )
    console.error(
      `    steps.<id>.outcome reflects the raw pre-override result, not the displayed conclusion -- this guard`,
    )
    console.error(
      `    is false on exactly the runs where "${v.referencedId}" is expected to fail. Guard on something else`,
    )
    console.error(`    (a file the step writes regardless of outcome, always(), a different signal).\n`)
  }
  process.exitCode = 1
}

const isDirectExecution =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirectExecution) {
  main(process.argv.slice(2))
}
