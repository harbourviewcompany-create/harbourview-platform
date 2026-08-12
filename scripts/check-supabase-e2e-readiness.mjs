#!/usr/bin/env node

import dns from 'node:dns/promises'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

export const READINESS_RESULTS = Object.freeze({
  CONFIG_MISSING: 'CONFIG_MISSING',
  CONFIG_INVALID: 'CONFIG_INVALID',
  DNS_FAILURE: 'DNS_FAILURE',
  NETWORK_FAILURE: 'NETWORK_FAILURE',
  ANON_PROJECT_AUTH_FAILURE: 'ANON_PROJECT_AUTH_FAILURE',
  E2E_USER_AUTH_FAILURE: 'E2E_USER_AUTH_FAILURE',
  READY: 'READY',
})

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'E2E_TEST_USER_EMAIL',
  'E2E_TEST_USER_PASSWORD',
]

function safeErrorCode(error) {
  if (!error || typeof error !== 'object') return 'UNKNOWN'
  const code = 'code' in error ? String(error.code ?? '') : ''
  if (/^[A-Z0-9_-]{1,64}$/.test(code)) return code
  const name = 'name' in error ? String(error.name ?? '') : ''
  if (/^[A-Za-z0-9_-]{1,64}$/.test(name)) return name
  return 'UNKNOWN'
}

function projectRefForUrl(url) {
  if (url.hostname.endsWith('.supabase.co')) return url.hostname.split('.')[0]
  return url.hostname
}

function baseResult({ result, projectRef = 'unknown', missing = [], detail = null }) {
  return {
    result,
    projectRef,
    missing,
    detail,
    migrationLedger: 'EXTERNAL_GATE',
  }
}

export async function diagnoseSupabaseReadiness({
  env = process.env,
  lookup = dns.lookup,
  fetchImpl = globalThis.fetch,
  timeoutMs = 10_000,
} = {}) {
  const missing = REQUIRED_ENV.filter((name) => !String(env[name] ?? '').trim())
  if (missing.length > 0) {
    return baseResult({ result: READINESS_RESULTS.CONFIG_MISSING, missing })
  }

  let url
  try {
    url = new URL(env.NEXT_PUBLIC_SUPABASE_URL)
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
      throw new Error('invalid Supabase URL')
    }
  } catch {
    return baseResult({ result: READINESS_RESULTS.CONFIG_INVALID })
  }

  const projectRef = projectRefForUrl(url)

  try {
    await lookup(url.hostname)
  } catch (error) {
    return baseResult({
      result: READINESS_RESULTS.DNS_FAILURE,
      projectRef,
      detail: { stage: 'dns', errorCode: safeErrorCode(error) },
    })
  }

  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const commonHeaders = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  }

  let settingsResponse
  try {
    settingsResponse = await fetchImpl(new URL('/auth/v1/settings', url), {
      method: 'GET',
      headers: commonHeaders,
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    return baseResult({
      result: READINESS_RESULTS.NETWORK_FAILURE,
      projectRef,
      detail: { stage: 'network', errorCode: safeErrorCode(error) },
    })
  }

  if (settingsResponse.status === 401 || settingsResponse.status === 403) {
    return baseResult({
      result: READINESS_RESULTS.ANON_PROJECT_AUTH_FAILURE,
      projectRef,
      detail: { stage: 'anon_project_auth', httpStatus: settingsResponse.status },
    })
  }

  if (!settingsResponse.ok) {
    return baseResult({
      result: READINESS_RESULTS.NETWORK_FAILURE,
      projectRef,
      detail: { stage: 'service', httpStatus: settingsResponse.status },
    })
  }

  let authResponse
  try {
    authResponse = await fetchImpl(new URL('/auth/v1/token?grant_type=password', url), {
      method: 'POST',
      headers: {
        ...commonHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: env.E2E_TEST_USER_EMAIL,
        password: env.E2E_TEST_USER_PASSWORD,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    return baseResult({
      result: READINESS_RESULTS.NETWORK_FAILURE,
      projectRef,
      detail: { stage: 'e2e_user_auth_transport', errorCode: safeErrorCode(error) },
    })
  }

  if (authResponse.status === 400 || authResponse.status === 401 || authResponse.status === 403) {
    return baseResult({
      result: READINESS_RESULTS.E2E_USER_AUTH_FAILURE,
      projectRef,
      detail: { stage: 'e2e_user_auth', httpStatus: authResponse.status },
    })
  }

  if (!authResponse.ok) {
    return baseResult({
      result: READINESS_RESULTS.NETWORK_FAILURE,
      projectRef,
      detail: { stage: 'e2e_user_auth_service', httpStatus: authResponse.status },
    })
  }

  return baseResult({ result: READINESS_RESULTS.READY, projectRef })
}

export function formatReadinessLines(readiness) {
  const lines = [`SUPABASE_READINESS project_ref=${readiness.projectRef}`]

  if (readiness.missing?.length) {
    lines.push(`SUPABASE_READINESS missing=${readiness.missing.join(',')}`)
  }

  if (readiness.detail?.stage) {
    lines.push(`SUPABASE_READINESS stage=${readiness.detail.stage}`)
  }
  if (readiness.detail?.errorCode) {
    lines.push(`SUPABASE_READINESS error_code=${readiness.detail.errorCode}`)
  }
  if (Number.isInteger(readiness.detail?.httpStatus)) {
    lines.push(`SUPABASE_READINESS http_status=${readiness.detail.httpStatus}`)
  }

  lines.push('SUPABASE_READINESS migration_ledger=EXTERNAL_GATE')
  lines.push(
    'SUPABASE_READINESS migration_note=remote migration drift is evaluated separately by Supabase Preview and migration-ledger controls',
  )
  lines.push(`SUPABASE_READINESS result=${readiness.result}`)
  return lines
}

export async function runSupabaseReadinessCli(env = process.env) {
  const readiness = await diagnoseSupabaseReadiness({ env })
  for (const line of formatReadinessLines(readiness)) console.log(line)
  return readiness.result === READINESS_RESULTS.READY ? 0 : 1
}

const invokedAsCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (invokedAsCli) {
  process.exitCode = await runSupabaseReadinessCli()
}
