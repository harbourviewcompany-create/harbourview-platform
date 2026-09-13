#!/usr/bin/env node
/**
 * Assert that no migration re-creates a view with a column list PostgreSQL
 * cannot apply, when the migration tree is replayed from zero state.
 *
 * WHY THIS EXISTS
 *
 * `CREATE OR REPLACE VIEW` may only APPEND columns. The replacement list has to
 * begin with the existing list -- same names, same order. Anything else is:
 *
 *   ERROR:  cannot drop columns from view
 *   ERROR:  cannot change name of view column "x" to "y"
 *
 * This repository has hit that four times, and each time it was found by hand:
 *
 *   20260715085540  died on it in production and was converted to a no-op stub.
 *   20260626110925  cannot issue its recorded `SELECT * FROM public.signals` in
 *                   replay, because 20260618210840 creates public.signals with
 *                   all 53 of its final columns. It carries two hand-written
 *                   pins and a page of prose explaining them.
 *   20260715085610  re-created api.signals at the 29 columns production ran,
 *                   against the 32 the pin above establishes. That was not
 *                   fixed -- the file was added to REPLAY_ZERO_STATE_SKIPS in
 *                   prepare-production-faithful-migration-replay.mjs, so replay
 *                   went green by not running the migration at all, including
 *                   the `security_invoker = on` stamp that is half its purpose.
 *   api."regulatory_signals.signals"  same shape, same file, second hand pin.
 *
 * `docs/control/EVIDENCE_LOG.md` recommends a view-vs-base column check on each
 * occurrence. This is that check.
 *
 * WHY A STATIC CHECK RATHER THAN THE REPLAY
 *
 * The real `supabase db reset --local` replay in production-security-hardening.yml
 * is the stronger assertion and stays the authority. It is also expensive, gated
 * behind a `paths` filter, and -- as of 2026-09-13 -- dies before it reaches the
 * reset step whenever an earlier contract test in the same job fails. This check
 * is cheap, has no dependencies, and answers one question that the prose pins in
 * 20260626110925 currently answer on trust: does every view definition still
 * extend the one before it?
 *
 * WHAT IT MODELS
 *
 * The replay does not run supabase/migrations as-is. It excludes version-alias
 * duplicates, skips evidenced zero-state-inapplicable files, relocates and
 * renames some, synthesises a few foundations and patches some content. All of
 * that is owned by prepare-production-faithful-migration-replay.mjs, and this
 * check reuses its planners so the two cannot drift apart.
 *
 * KNOWN LIMITS, STATED RATHER THAN IMPLIED
 *
 * - `SELECT *` from a base TABLE is not statically resolvable, so those views
 *   are tracked as unknown and any later explicit list is not compared. A
 *   `SELECT *` from a view this check has already seen IS resolved.
 * - Column TYPE changes are not detected; only names and order.
 * - Views built by fully dynamic SQL (string concatenation) are not parsed.
 *   Views inside DO blocks / `execute $tag$ ... $tag$` ARE parsed.
 *
 * Usage:  node scripts/check-view-replay-narrowing.mjs [--json]
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import {
  planReplayContentPatches,
  planReplayExclusions,
  planReplayRelocations,
  planReplaySyntheticFoundations,
  planReplayVersionCollisionRenames,
  planReplayZeroStateSkips,
} from './prepare-production-faithful-migration-replay.mjs'

const MIGRATIONS_DIR = 'supabase/migrations'
const DECISIONS_FILE = 'supabase/release-controls/pending-production-migration-decisions.json'

// ── replay file plan ────────────────────────────────────────────────────────

export function planReplaySources({ repositoryRoot = process.cwd(), includeZeroStateSkips = false } = {}) {
  const migrationDirectory = path.join(repositoryRoot, MIGRATIONS_DIR)
  const decisions = JSON.parse(fs.readFileSync(path.join(repositoryRoot, DECISIONS_FILE), 'utf8'))
  const migrationFiles = fs.readdirSync(migrationDirectory).filter((f) => f.endsWith('.sql'))

  const zeroStateSkips = planReplayZeroStateSkips({ migrationFiles })
  const skip = new Set([
    ...planReplayExclusions({ decisions, migrationFiles }).map((item) => item.file),
    ...(includeZeroStateSkips ? [] : zeroStateSkips),
  ])
  const renames = new Map()
  for (const item of planReplayRelocations({ migrationFiles })) renames.set(item.source, item.destination)
  for (const item of planReplayVersionCollisionRenames({ migrationFiles })) renames.set(item.source, item.destination)

  const patches = new Map()
  for (const item of planReplayContentPatches({ migrationFiles })) {
    if (!patches.has(item.file)) patches.set(item.file, [])
    patches.get(item.file).push(item)
  }

  const sources = []
  for (const file of migrationFiles) {
    if (skip.has(file)) continue
    let sql = fs.readFileSync(path.join(migrationDirectory, file), 'utf8')
    for (const item of patches.get(file) ?? []) {
      const first = sql.indexOf(item.anchor)
      if (first !== -1 && first === sql.lastIndexOf(item.anchor)) sql = sql.replace(item.anchor, item.replacement)
    }
    sources.push({ name: renames.get(file) ?? file, origin: file, sql })
  }
  for (const item of planReplaySyntheticFoundations({ migrationFiles })) {
    sources.push({ name: item.destination, origin: `${item.destination} (synthetic)`, sql: item.content })
  }
  sources.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  return sources
}

export function zeroStateSkipList({ repositoryRoot = process.cwd() } = {}) {
  const migrationFiles = fs
    .readdirSync(path.join(repositoryRoot, MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
  return planReplayZeroStateSkips({ migrationFiles })
}

/**
 * A narrowing inside a file listed in REPLAY_ZERO_STATE_SKIPS is invisible to a
 * replay-faithful scan, because the replay never runs that file. That is exactly
 * how the api.signals defect survived: 20260715085610 was skipped rather than
 * repaired, so both the replay and any check modelling the replay went green.
 *
 * This pass re-runs the analysis with the zero-state skips put back, and reports
 * any narrowing that only the skip list is hiding. It is advisory, not fatal --
 * the remaining skips are individually evidenced -- but it must never be silent,
 * because each one is a migration that cannot be un-skipped without repair.
 */
export function auditSkipMaskedNarrowing({ repositoryRoot = process.cwd() } = {}) {
  const sources = planReplaySources({ repositoryRoot, includeZeroStateSkips: true })
  const skipped = new Set(zeroStateSkipList({ repositoryRoot }))
  const { findings } = findViewNarrowing(sources)
  return findings.filter((f) => skipped.has(f.file))
}

// ── SQL surface extraction ──────────────────────────────────────────────────

/**
 * Strip line/block comments. Dollar-quoted bodies are replaced with a
 * placeholder in the parent text and returned separately, because DO blocks and
 * `execute $tag$ ... $tag$` carry real view DDL (20260704160603 creates
 * public.signals_quality that way).
 */
export function extractSurfaces(sql) {
  const nested = []
  let out = ''
  let i = 0
  while (i < sql.length) {
    if (sql.startsWith('--', i)) {
      const j = sql.indexOf('\n', i)
      i = j === -1 ? sql.length : j
      continue
    }
    if (sql.startsWith('/*', i)) {
      const j = sql.indexOf('*/', i + 2)
      i = j === -1 ? sql.length : j + 2
      continue
    }
    if (sql[i] === "'") {
      const end = singleQuoteEnd(sql, i + 1)
      out += sql.slice(i, end)
      i = end
      continue
    }
    const tag = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i))
    if (tag) {
      const close = sql.indexOf(tag[0], i + tag[0].length)
      if (close === -1) { i = sql.length; continue }
      nested.push(sql.slice(i + tag[0].length, close))
      out += ' $DOLLARQUOTED$ '
      i = close + tag[0].length
      continue
    }
    out += sql[i]
    i += 1
  }
  const surfaces = [out]
  for (const body of nested) surfaces.push(...extractSurfaces(body))
  return surfaces
}

function singleQuoteEnd(text, from) {
  let j = from
  while (j < text.length) {
    if (text[j] === "'") {
      if (text[j + 1] === "'") { j += 2; continue }
      return j + 1
    }
    j += 1
  }
  return text.length
}

export function splitStatements(sql) {
  const stmts = []
  let buf = ''
  let depth = 0
  let i = 0
  while (i < sql.length) {
    const c = sql[i]
    if (c === "'") { const e = singleQuoteEnd(sql, i + 1); buf += sql.slice(i, e); i = e; continue }
    if (c === '"') { const e = sql.indexOf('"', i + 1); const end = e === -1 ? sql.length : e + 1; buf += sql.slice(i, end); i = end; continue }
    if (c === '(') depth += 1
    else if (c === ')') depth -= 1
    else if (c === ';' && depth === 0) { stmts.push(buf); buf = ''; i += 1; continue }
    buf += c
    i += 1
  }
  if (buf.trim()) stmts.push(buf)
  return stmts
}

function findTopLevelKeyword(text, word, from = 0) {
  let depth = 0
  let i = from
  const lower = text.toLowerCase()
  while (i < text.length) {
    const c = text[i]
    if (c === "'") { i = singleQuoteEnd(text, i + 1); continue }
    if (c === '"') { const e = text.indexOf('"', i + 1); i = e === -1 ? text.length : e + 1; continue }
    if (c === '(') depth += 1
    else if (c === ')') depth -= 1
    else if (depth === 0 && lower.startsWith(word, i)) {
      const before = i === 0 ? ' ' : text[i - 1]
      const after = text[i + word.length] ?? ' '
      if (!/[A-Za-z0-9_]/.test(before) && !/[A-Za-z0-9_]/.test(after)) return i
    }
    i += 1
  }
  return -1
}

function splitTopLevelCommas(text) {
  const parts = []
  let buf = ''
  let depth = 0
  let i = 0
  while (i < text.length) {
    const c = text[i]
    if (c === "'") { const e = singleQuoteEnd(text, i + 1); buf += text.slice(i, e); i = e; continue }
    if (c === '"') { const e = text.indexOf('"', i + 1); const end = e === -1 ? text.length : e + 1; buf += text.slice(i, end); i = end; continue }
    if (c === '(' || c === '[') depth += 1
    else if (c === ')' || c === ']') depth -= 1
    else if (c === ',' && depth === 0) { parts.push(buf); buf = ''; i += 1; continue }
    buf += c
    i += 1
  }
  if (buf.trim()) parts.push(buf)
  return parts
}

const RESERVED_TAIL = new Set(['end', 'null', 'true', 'false', 'asc', 'desc', 'else'])

export function outputColumnName(expr) {
  const e = expr.trim()
  if (!e) return null
  if (e === '*' || /\.\*$/.test(e)) return '*'
  const aliased = /\bas\s+"?([A-Za-z_][A-Za-z0-9_$]*)"?\s*$/i.exec(e)
  if (aliased) return aliased[1].toLowerCase()
  const bare = e.replace(/::[A-Za-z_][A-Za-z0-9_ \[\]().]*$/, '').trim()
  if (/^[A-Za-z_][A-Za-z0-9_$]*(\.[A-Za-z_][A-Za-z0-9_$]*)*$/.test(bare)) {
    return bare.split('.').pop().toLowerCase()
  }
  if (/^"[^"]+"$/.test(bare)) return bare.slice(1, -1).toLowerCase()
  const tail = /\s"?([A-Za-z_][A-Za-z0-9_$]*)"?\s*$/.exec(bare)
  if (tail && !RESERVED_TAIL.has(tail[1].toLowerCase())) return tail[1].toLowerCase()
  return '?expr'
}

const VIEW_NAME = '(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_$]*)'
const CREATE_VIEW_RE = new RegExp(
  String.raw`create\s+(or\s+replace\s+)?(?:recursive\s+)?(?:temp\w*\s+)?view\s+(?:if\s+not\s+exists\s+)?` +
  String.raw`(${VIEW_NAME}(?:\.${VIEW_NAME})?)`,
  'i',
)

function normaliseName(raw) {
  return raw
    .split(/\.(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((p) => (p.startsWith('"') ? p.slice(1, -1) : p.toLowerCase()))
    .join('.')
}

/** Parse one CREATE VIEW statement into { name, replace, columns, starFrom }. */
export function parseCreateView(stmt) {
  const m = CREATE_VIEW_RE.exec(stmt)
  if (!m) return null
  const name = normaliseName(m[2])
  const replace = Boolean(m[1])
  let rest = stmt.slice(m.index + m[0].length)

  const aliasList = /^\s*\(([^()]*)\)/.exec(rest)
  if (aliasList && !/^\s*\(\s*select/i.test(rest)) {
    const columns = aliasList[1].split(',').map((c) => c.trim().replace(/^"|"$/g, '').toLowerCase()).filter(Boolean)
    return { name, replace, columns, starFrom: null }
  }

  const asAt = findTopLevelKeyword(rest, 'as')
  if (asAt === -1) return { name, replace, columns: null, starFrom: null }
  let body = rest.slice(asAt + 2)

  if (/^\s*with\b/i.test(body)) {
    const sel = findTopLevelKeyword(body, 'select')
    if (sel === -1) return { name, replace, columns: null, starFrom: null }
    body = body.slice(sel)
  }
  const selAt = findTopLevelKeyword(body, 'select')
  if (selAt === -1) return { name, replace, columns: null, starFrom: null }

  let list = body.slice(selAt + 'select'.length)
  list = list.replace(/^\s*(distinct(\s+on\s*\([^)]*\))?|all)\b/i, '')
  const fromAt = findTopLevelKeyword(list, 'from')
  const selectList = fromAt === -1 ? list : list.slice(0, fromAt)

  const columns = []
  let star = false
  for (const part of splitTopLevelCommas(selectList)) {
    const col = outputColumnName(part)
    if (col === null) continue
    if (col === '*') star = true
    columns.push(col)
  }
  if (columns.length === 0) return { name, replace, columns: null, starFrom: null }

  let starFrom = null
  if (star && columns.length === 1 && fromAt !== -1) {
    const src = new RegExp(String.raw`^\s*(${VIEW_NAME}(?:\.${VIEW_NAME})?)`, 'i')
      .exec(list.slice(fromAt + 'from'.length))
    if (src) starFrom = normaliseName(src[1])
  }
  return { name, replace, columns: star ? null : columns, starFrom }
}

const DROP_VIEW_RE = new RegExp(
  String.raw`\bdrop\s+view\s+(?:if\s+exists\s+)?(${VIEW_NAME}(?:\.${VIEW_NAME})?)`, 'i',
)

// ── the check ───────────────────────────────────────────────────────────────

export function findViewNarrowing(sources) {
  const known = new Map()   // view -> ordered column names
  const setBy = new Map()   // view -> file that last set it
  const findings = []

  for (const source of sources) {
    for (const surface of extractSurfaces(source.sql)) {
      for (const stmt of splitStatements(surface)) {
        if (!stmt.trim()) continue
        const hasCreate = /\bcreate\s+(or\s+replace\s+)?(recursive\s+)?(temp\w*\s+)?view\b/i.test(stmt)

        if (!hasCreate) {
          const dropped = DROP_VIEW_RE.exec(stmt)
          if (dropped) {
            const n = normaliseName(dropped[1])
            known.delete(n)
            setBy.delete(n)
          }
          continue
        }

        const parsed = parseCreateView(stmt)
        if (!parsed) continue
        const droppedFirst = DROP_VIEW_RE.test(stmt)

        let columns = parsed.columns
        if (columns === null && parsed.starFrom && known.has(parsed.starFrom)) {
          columns = known.get(parsed.starFrom).slice()
        }

        if (columns === null) {
          known.delete(parsed.name)
          setBy.delete(parsed.name)
          continue
        }

        const previous = known.get(parsed.name)
        if (parsed.replace && !droppedFirst && previous) {
          const isPrefixExtension =
            columns.length >= previous.length && previous.every((c, i) => columns[i] === c)
          if (!isPrefixExtension) {
            let detail = 'reordered'
            for (let i = 0; i < previous.length; i += 1) {
              if (i >= columns.length) { detail = `drops "${previous[i]}" at position ${i}`; break }
              if (columns[i] !== previous[i]) { detail = `position ${i}: "${previous[i]}" -> "${columns[i]}"`; break }
            }
            findings.push({
              view: parsed.name,
              file: source.name,
              previousFile: setBy.get(parsed.name) ?? null,
              previousColumns: previous.length,
              newColumns: columns.length,
              detail,
              dropped: previous.filter((c) => !columns.includes(c)),
            })
          }
        }
        known.set(parsed.name, columns)
        setBy.set(parsed.name, source.name)
      }
    }
  }
  return { findings, trackedViews: known.size }
}

function main() {
  const asJson = process.argv.includes('--json')
  const sources = planReplaySources()
  const { findings, trackedViews } = findViewNarrowing(sources)
  const skipMasked = auditSkipMaskedNarrowing()

  if (asJson) {
    console.log(JSON.stringify({
      replay_sources: sources.length,
      tracked_views: trackedViews,
      findings,
      skip_masked_findings: skipMasked,
    }, null, 2))
  } else {
    console.log('View replay narrowing check')
    console.log(`Replay-active migrations: ${sources.length}`)
    console.log(`Views with a resolvable column list: ${trackedViews}`)
    if (findings.length === 0) {
      console.log('GO: every CREATE OR REPLACE VIEW extends the definition before it.')
    } else {
      console.log('')
      console.log(`STOP: ${findings.length} view replacement(s) PostgreSQL cannot apply on replay.`)
      for (const f of findings) {
        console.log('')
        console.log(`  view ${f.view}`)
        console.log(`    in       ${f.file}  (${f.previousColumns} -> ${f.newColumns} columns)`)
        console.log(`    against  ${f.previousFile}`)
        console.log(`    ${f.detail}`)
        if (f.dropped.length > 0) console.log(`    dropped: ${f.dropped.join(', ')}`)
      }
      console.log('')
      console.log('CREATE OR REPLACE VIEW can only append columns. Either extend the')
      console.log('earlier definition instead of rewriting it, or DROP the view first.')
    }

    if (skipMasked.length > 0) {
      console.log('')
      console.log(`WARNING: ${skipMasked.length} narrowing(s) hidden by REPLAY_ZERO_STATE_SKIPS.`)
      console.log('These do not fail the replay only because the replay does not run the file.')
      for (const f of skipMasked) {
        console.log(`  ${f.view}: ${f.detail}  (skipped file ${f.file})`)
      }
      console.log('Repair the migration so it appends, then remove it from the skip list.')
    }
  }
  process.exit(findings.length === 0 ? 0 : 1)
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)
if (invokedDirectly) main()
