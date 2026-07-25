import { NextResponse } from 'next/server'
import { resolveLockedSupabaseUrl } from '@/lib/supabase/env'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ROUTE_ID = '/api/talent/apply'
const SAFE_ERROR = 'Application could not be sent. Please try again or contact the operator directly.'

function json(status: 'success' | 'error', message: string, httpStatus = 200, retryAfterSeconds?: number) {
  return NextResponse.json(
    { status, message },
    {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store',
        ...(retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : {}),
      },
    }
  )
}

function getRequestId(request: Request) {
  return (
    request.headers.get('x-vercel-id') ||
    request.headers.get('x-request-id') ||
    globalThis.crypto?.randomUUID?.() ||
    `talent-apply-${Date.now()}`
  )
}

function getSupabaseConfig() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!serviceRoleKey) return null
  return { url: resolveLockedSupabaseUrl(), serviceRoleKey }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const ip = getClientIp(request)

  const ipLimit = await enforceRateLimit({ route: ROUTE_ID, ip, limit: 20, windowMs: 60_000 })
  if (!ipLimit.allowed) {
    return json('error', 'Too many requests. Please try again shortly.', 429, ipLimit.retryAfterSeconds)
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return json('error', 'Invalid application payload.', 400)
  }

  // Honeypot: real applicants never fill this hidden field.
  if (typeof body.website === 'string' && body.website.trim()) {
    console.info('harbourview_talent_apply_bot_rejected', { requestId, ip })
    return json('error', 'Request rejected.', 429)
  }

  const jobId = typeof body.job_id === 'string' ? body.job_id.trim() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null
  const resumeUrl = typeof body.resume_url === 'string' && body.resume_url.trim() ? body.resume_url.trim() : null
  const coverNote = typeof body.cover_note === 'string' && body.cover_note.trim() ? body.cover_note.trim() : null

  if (!jobId || !name || !email) {
    return json('error', 'Name, email, and job are required.', 400)
  }

  const EMAIL_RE = /^[^s@]+@[^s@]+.[^s@]+$/
  if (!EMAIL_RE.test(email)) {
    return json('error', 'Enter a valid email address.', 400)
  }

  if (resumeUrl) {
    try {
      const parsed = new URL(resumeUrl)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return json('error', 'Resume link must be a valid http/https URL.', 400)
      }
    } catch {
      return json('error', 'Resume link must be a valid http/https URL.', 400)
    }
  }

  const identityLimit = await enforceRateLimit({ route: ROUTE_ID, ip, identity: email, limit: 8, windowMs: 60_000 })
  if (!identityLimit.allowed) {
    return json('error', 'Too many requests. Please try again shortly.', 429, identityLimit.retryAfterSeconds)
  }

  const supabase = getSupabaseConfig()
  if (!supabase) {
    console.info('harbourview_talent_apply_config_missing', { requestId })
    return json('error', SAFE_ERROR, 500)
  }

  // Confirm the job is real and still open before accepting an application —
  // trust nothing the client claims about job_id.
  let jobCheck: Response
  try {
    jobCheck = await fetch(
      `${supabase.url}/rest/v1/talent_jobs?id=eq.${encodeURIComponent(jobId)}&status=eq.open&select=id`,
      {
        headers: {
          apikey: supabase.serviceRoleKey,
          Authorization: `Bearer ${supabase.serviceRoleKey}`,
        },
        cache: 'no-store',
      }
    )
  } catch {
    console.info('harbourview_talent_apply_job_lookup_failed', { requestId })
    return json('error', SAFE_ERROR, 502)
  }

  if (!jobCheck.ok) {
    console.info('harbourview_talent_apply_job_lookup_error', { requestId, status: jobCheck.status })
    return json('error', SAFE_ERROR, 502)
  }

  const matches = (await jobCheck.json().catch(() => [])) as Array<{ id: string }>
  if (!Array.isArray(matches) || matches.length === 0) {
    return json('error', 'This role is no longer accepting applications.', 404)
  }

  let insertResponse: Response
  try {
    insertResponse = await fetch(`${supabase.url}/rest/v1/talent_candidates`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        apikey: supabase.serviceRoleKey,
        Authorization: `Bearer ${supabase.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        job_id: jobId,
        name,
        email,
        phone,
        resume_url: resumeUrl,
        cover_note: coverNote,
        source: 'Direct application',
        stage: 'sourced',
      }),
    })
  } catch {
    console.info('harbourview_talent_apply_insert_request_failed', { requestId })
    return json('error', SAFE_ERROR, 502)
  }

  if (!insertResponse.ok) {
    console.info('harbourview_talent_apply_insert_failed', { requestId, status: insertResponse.status })
    return json('error', SAFE_ERROR, 502)
  }

  console.info('harbourview_talent_apply_ok', { requestId, jobId })
  return json('success', 'Application received. The operator will follow up directly if there is a fit.')
}
