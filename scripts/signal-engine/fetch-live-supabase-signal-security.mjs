#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const PROJECT_REF = 'zvxdgdkukjrrwamdpqrg'
const API_BASE = 'https://api.supabase.com/v1'
const DEFAULT_OUTPUT = 'docs/control/signal-engine-hardening/live-supabase-signal-security.json'
const SIGNAL_TERMS = [
  'source_documents',
  'source_chunks',
  'signal_duplicate_groups',
  'signal_candidates',
  'signal_evidence',
  'signal_review_events',
  'signal_jobs',
  'signal_risk_flags',
  'model_prompt_versions',
  'model_call_logs',
  'entities',
  'signal_entity_mentions',
  'signal_conversions',
  'signal_processing_errors',
  'is_signal_admin',
  'is_service_role',
]

function parseArgs(argv) {
  const args = {
    out: DEFAULT_OUTPUT,
    start: undefined,
    end: undefined,
    skipLogs: false,
    skipAdvisors: false,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--out') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error('--out requires a value')
      args.out = argv[++i]
    } else if (arg === '--start') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error('--start requires a value')
      args.start = argv[++i]
    } else if (arg === '--end') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error('--end requires a value')
      args.end = argv[++i]
    }
    else if (arg === '--skip-logs') args.skipLogs = true
    else if (arg === '--skip-advisors') args.skipAdvisors = true
    else if (arg === '--help') {
      console.log(`Usage: node scripts/signal-engine/fetch-live-supabase-signal-security.mjs [--out path] [--start ISO] [--end ISO] [--skip-logs] [--skip-advisors]

Requires SUPABASE_ACCESS_TOKEN with advisors_read and analytics_logs_read permissions.
Writes sanitized advisor/log evidence for Supabase project ${PROJECT_REF}.`)
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return args
}

function requireAccessToken() {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) {
    throw new Error('SUPABASE_ACCESS_TOKEN is required; use a fine-grained token with advisors_read and analytics_logs_read permissions.')
  }
  return token
}

function redact(value) {
  if (typeof value === 'string') {
    return value
      .replace(/sb_(secret|publishable)_[A-Za-z0-9_-]+/g, 'sb_$1_[REDACTED]')
      .replace(/eyJ[A-Za-z0-9._-]+/g, 'jwt_[REDACTED]')
      .replace(/(apikey|authorization|bearer|token|password|secret)=([^\s&]+)/gi, '$1=[REDACTED]')
      .replace(/https:\/\/zvxdgdkukjrrwamdpqrg\.supabase\.co\/[^\s'"]+/g, 'https://zvxdgdkukjrrwamdpqrg.supabase.co/[REDACTED_PATH]')
  }

  if (Array.isArray(value)) return value.map(redact)

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, redact(entry)]))
  }

  return value
}

async function apiGet(token, pathname, params = {}) {
  const url = new URL(`${API_BASE}${pathname}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
      'user-agent': 'harbourview-signal-engine-hardening/1.0',
    },
  })

  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { raw: text }
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} from ${url.pathname}: ${JSON.stringify(redact(body))}`)
  }

  return body
}

function advisorSummary(advisors) {
  const lints = Array.isArray(advisors?.lints) ? advisors.lints : []
  const signalLints = lints.filter((lint) => {
    const text = JSON.stringify(lint).toLowerCase()
    return SIGNAL_TERMS.some((term) => text.includes(term.toLowerCase()))
  })

  return {
    total: lints.length,
    signalEngineTotal: signalLints.length,
    byLevel: signalLints.reduce((acc, lint) => {
      const level = lint.level ?? 'UNKNOWN'
      acc[level] = (acc[level] ?? 0) + 1
      return acc
    }, {}),
    signalEngineLints: signalLints.map((lint) => ({
      name: lint.name,
      title: lint.title,
      level: lint.level,
      categories: lint.categories,
      detail: lint.detail,
      metadata: lint.metadata,
      cache_key: lint.cache_key,
    })),
  }
}

function logsSql() {
  const filters = SIGNAL_TERMS.map((term) => `event_message ilike '%${term.replaceAll("'", "''")}%'`).join(' or ')
  return `select cast(timestamp as string) as timestamp, event_message, count() as events
from postgres_logs
where ${filters}
group by timestamp, event_message
order by timestamp desc
limit 100`
}

async function main() {
  const args = parseArgs(process.argv)
  const token = requireAccessToken()
  const capturedAt = new Date().toISOString()
  const evidence = {
    projectRef: PROJECT_REF,
    capturedAt,
    source: 'Supabase Management API',
    advisors: null,
    logs: null,
  }

  if (!args.skipAdvisors) {
    const advisors = await apiGet(token, `/projects/${PROJECT_REF}/advisors/security`)
    evidence.advisors = {
      summary: advisorSummary(advisors),
      raw: redact(advisors),
    }
  }

  if (!args.skipLogs) {
    const logParams = { sql: logsSql() }
    if (args.start) logParams.iso_timestamp_start = args.start
    if (args.end) logParams.iso_timestamp_end = args.end
    const logs = await apiGet(token, `/projects/${PROJECT_REF}/analytics/endpoints/logs.all`, logParams)
    evidence.logs = redact(logs)
  }

  const outputPath = path.resolve(process.cwd(), args.out)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(`Wrote sanitized Supabase Signal Engine security evidence to ${path.relative(process.cwd(), outputPath)}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
