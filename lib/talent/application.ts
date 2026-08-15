import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'
import { createSupabaseServiceClient, getAuthenticatedUser } from '@/lib/supabase/server'

const SAFE_ERROR = 'Application could not be sent. Please try again or contact the operator directly.'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(status: 'success' | 'error', message: string, httpStatus = 200, retryAfterSeconds?: number) {
  return NextResponse.json({ status, message }, {
    status: httpStatus,
    headers: { 'Cache-Control': 'no-store', ...(retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : {}) },
  })
}

function optionalText(value: unknown, max: number) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null
}

export async function handleTalentApplication(request: Request, routeId: string) {
  const requestId = request.headers.get('x-vercel-id') || request.headers.get('x-request-id') || crypto.randomUUID()
  const ip = getClientIp(request)
  const ipLimit = await enforceRateLimit({ route: routeId, ip, limit: 20, windowMs: 60_000 })
  if (!ipLimit.allowed) return json('error', 'Too many requests. Please try again shortly.', 429, ipLimit.retryAfterSeconds)

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return json('error', 'Invalid application payload.', 400) }
  if (typeof body.website === 'string' && body.website.trim()) {
    console.info('harbourview_talent_apply_bot_rejected', { requestId })
    return json('error', 'Request rejected.', 429)
  }

  const jobId = optionalText(body.job_id ?? body.jobId, 36) ?? ''
  const name = optionalText(body.name, 160) ?? ''
  const email = (optionalText(body.email, 320) ?? '').toLowerCase()
  const phone = optionalText(body.phone, 80)
  const resumeUrl = optionalText(body.resume_url ?? body.resumeUrl, 2000)
  const coverNote = optionalText(body.cover_note ?? body.coverNote, 8000)
  if (!/^[0-9a-f-]{36}$/i.test(jobId) || !name || !EMAIL_RE.test(email)) return json('error', 'Name, email, and a valid job are required.', 400)
  if (resumeUrl) {
    try {
      const parsed = new URL(resumeUrl)
      if (!['http:', 'https:'].includes(parsed.protocol)) return json('error', 'Resume link must be a valid http/https URL.', 400)
    } catch { return json('error', 'Resume link must be a valid http/https URL.', 400) }
  }

  const identityLimit = await enforceRateLimit({ route: routeId, ip, identity: email, limit: 8, windowMs: 60_000 })
  if (!identityLimit.allowed) return json('error', 'Too many requests. Please try again shortly.', 429, identityLimit.retryAfterSeconds)

  const user = await getAuthenticatedUser()
  const idempotencyHeader = request.headers.get('idempotency-key')?.trim()
  const idempotencyKey = idempotencyHeader?.slice(0, 160) || createHash('sha256').update(`talent-application:v1:${jobId}:${email}`).digest('hex')
  const supabase = await createSupabaseServiceClient()
  const { data, error } = await supabase.rpc('talent_submit_application_v2', {
    p_job_id: jobId,
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_resume_url: resumeUrl,
    p_cover_note: coverNote,
    p_idempotency_key: idempotencyKey,
    p_consent_policy_version: 'talent-applications-v1',
    p_applicant_user_id: user?.id ?? null,
  })

  if (error) {
    const closed = error.message?.includes('JOB_NOT_ACCEPTING_APPLICATIONS')
    console.info('harbourview_talent_apply_failed', { requestId, jobId, code: error.code ?? 'unknown', closed })
    return json('error', closed ? 'This role is no longer accepting applications.' : SAFE_ERROR, closed ? 404 : 502)
  }

  console.info('harbourview_talent_apply_ok', { requestId, jobId, applicationId: data })
  return json('success', 'Application received. The operator will follow up directly if there is a fit.')
}
