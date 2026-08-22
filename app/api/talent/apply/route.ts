/**
 * POST /api/talent/apply
 * Supports authenticated profile apply OR guest apply (name + email).
 * Restores rate limiting + honeypot from the previous production route.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'

export const dynamic = 'force-dynamic'

const ROUTE_ID = '/api/talent/apply'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  const ipLimit = await enforceRateLimit({
    route: ROUTE_ID,
    ip,
    limit: 20,
    windowMs: 60_000,
  })
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      {
        status: 429,
        headers: ipLimit.retryAfterSeconds
          ? { 'Retry-After': String(ipLimit.retryAfterSeconds) }
          : undefined,
      }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid application payload.' }, { status: 400 })
  }

  // Honeypot: real applicants never fill this hidden field
  if (typeof body.website === 'string' && body.website.trim()) {
    return NextResponse.json({ error: 'Request rejected.' }, { status: 429 })
  }

  const opportunityId =
    (typeof body.opportunityId === 'string' && body.opportunityId.trim()) ||
    (typeof body.job_id === 'string' && body.job_id.trim()) ||
    ''
  const coverNote =
    typeof body.coverNote === 'string'
      ? body.coverNote.trim()
      : typeof body.cover_note === 'string'
        ? body.cover_note.trim()
        : null
  const resumeUrl =
    typeof body.resumeUrl === 'string'
      ? body.resumeUrl.trim()
      : typeof body.resume_url === 'string'
        ? body.resume_url.trim()
        : null
  const name = typeof body.name === 'string' ? body.name.trim() : null
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : null

  if (!opportunityId) {
    return NextResponse.json({ error: 'opportunityId is required' }, { status: 400 })
  }

  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  if (resumeUrl) {
    try {
      const parsed = new URL(resumeUrl)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return NextResponse.json(
          { error: 'Resume link must be a valid http/https URL.' },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Resume link must be a valid http/https URL.' },
        { status: 400 }
      )
    }
  }

  if (email) {
    const identityLimit = await enforceRateLimit({
      route: ROUTE_ID,
      ip,
      identity: email,
      limit: 8,
      windowMs: 60_000,
    })
    if (!identityLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        {
          status: 429,
          headers: identityLimit.retryAfterSeconds
            ? { 'Retry-After': String(identityLimit.retryAfterSeconds) }
            : undefined,
        }
      )
    }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Confirm opportunity is published
    const { data: opp, error: oppError } = await supabase
      .from('talent_opportunities')
      .select('id, status')
      .eq('id', opportunityId)
      .eq('status', 'published')
      .maybeSingle()

    if (oppError || !opp) {
      return NextResponse.json(
        { error: 'This role is no longer accepting applications.' },
        { status: 404 }
      )
    }

    if (!user && (!name || !email)) {
      return NextResponse.json(
        { error: 'Name and email are required when not signed in.' },
        { status: 400 }
      )
    }

    const insertPayload: Record<string, unknown> = {
      opportunity_id: opportunityId,
      user_id: user?.id ?? null,
      applicant_name: name || null,
      applicant_email: email || null,
      status: 'submitted',
      cover_note: coverNote || null,
      resume_url: resumeUrl || null,
    }

    const { data, error } = await supabase
      .from('talent_applications')
      .insert(insertPayload)
      .select('id')
      .single()

    if (error) {
      // Unique violation for logged-in re-apply
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You have already applied to this role.' },
          { status: 409 }
        )
      }
      console.error('[api/talent/apply] insert error', error)
      return NextResponse.json(
        { error: 'Application could not be sent. Please try again.' },
        { status: 500 }
      )
    }

    try {
      await supabase.rpc('increment_talent_application_count', {
        opportunity_id: opportunityId,
      })
    } catch {
      // non-fatal
    }

    return NextResponse.json({
      ok: true,
      applicationId: data.id,
      message:
        'Application received. The operator will follow up directly if there is a fit.',
    })
  } catch (err: any) {
    console.error('[api/talent/apply] error', err)
    return NextResponse.json(
      { error: err?.message ?? 'Application failed' },
      { status: 500 }
    )
  }
}
