import { NextResponse } from 'next/server'
import { notifyMarketplaceInquiry } from '@/lib/marketplace/notification'
import { resolveLockedSupabaseUrl } from '@/lib/supabase/env'
import { listingSubmissionSchema } from '@/lib/marketplace/intakeValidation'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'
import { validateListingSubmission, withListingSubmissionCode } from '@/lib/marketplace/listingSubmissionValidation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ROUTE_ID = '/api/marketplace/listing-submission'
const ABUSE_REJECTION_CODE = 'ABUSE_REJECTED'

type ListingSubmissionDiagnosticCode =
  | 'LISTING_SUBMISSION_VALIDATION_REQUIRED_FIELDS'
  | 'LISTING_SUBMISSION_VALIDATION_EMAIL'
  | 'LISTING_SUBMISSION_VALIDATION_FIELD_LENGTH'
  | 'LISTING_SUBMISSION_VALIDATION_MESSAGE_LENGTH'
  | 'LISTING_SUBMISSION_VALIDATION_TYPE'
  | 'LISTING_SUBMISSION_CONFIG_MISSING'
  | 'LISTING_SUBMISSION_SUPABASE_REQUEST_FAILED'
  | 'LISTING_SUBMISSION_SUPABASE_INSERT_FAILED'
  | 'LISTING_SUBMISSION_INTERNAL_ERROR'
  | 'LISTING_SUBMISSION_RATE_LIMITED'
  | 'LISTING_SUBMISSION_BOT_REJECTED'
  | 'LISTING_SUBMISSION_OK'

function withCode(message: string, code: ListingSubmissionDiagnosticCode | typeof ABUSE_REJECTION_CODE) {
  return `${message} [${code}]`
}

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

function getSupabaseConfig() {
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!anonKey) return null
  return { url: resolveLockedSupabaseUrl(), anonKey }
}

function logListingSubmissionDiagnostic(
  code: ListingSubmissionDiagnosticCode,
  details?: Record<string, string | number | boolean | null>
) {
  console.info('harbourview_marketplace_listing_submission', {
    code,
    ...details,
  })
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      route: '/api/marketplace/listing-submission',
      method: 'GET',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const ipLimit = await enforceRateLimit({ route: ROUTE_ID, ip, limit: 20, windowMs: 60_000 })
  if (!ipLimit.allowed) {
    logListingSubmissionDiagnostic('LISTING_SUBMISSION_RATE_LIMITED', { ip, retryAfterSeconds: ipLimit.retryAfterSeconds })
    return json('error', withCode('Too many requests. Please try again shortly.', ABUSE_REJECTION_CODE), 429, ipLimit.retryAfterSeconds)
  }

  try {
    let body: Record<string, unknown>

    try {
      body = await request.json()
    } catch {
      return json(
        'error',
        withListingSubmissionCode('Invalid listing submission payload.', 'LISTING_SUBMISSION_VALIDATION_REQUIRED_FIELDS'),
        400
      )
    }

    const parsed = listingSubmissionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        status: 'error',
        message: withListingSubmissionCode('Invalid payload.', 'LISTING_SUBMISSION_VALIDATION_REQUIRED_FIELDS'),
        errors: parsed.error.flatten(),
      }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }

    if (parsed.data.hp_field?.trim()) {
      logListingSubmissionDiagnostic('LISTING_SUBMISSION_BOT_REJECTED', { reason: 'honeypot', ip })
      return json('error', withCode('Request rejected.', ABUSE_REJECTION_CODE), 429)
    }

    const expectedToken = process.env.MARKETPLACE_FORM_CHALLENGE_TOKEN
    if (expectedToken && parsed.data.challenge_token !== expectedToken) {
      logListingSubmissionDiagnostic('LISTING_SUBMISSION_BOT_REJECTED', { reason: 'challenge', ip })
      return json('error', withCode('Request rejected.', ABUSE_REJECTION_CODE), 429)
    }

    const name = parsed.data.name
    const email = parsed.data.email
    const company = parsed.data.company
    const listingType = parsed.data.listingType
    const validation = validateListingSubmission(parsed.data)
    if (!validation.ok) {
      logListingSubmissionDiagnostic((validation as any).code)
      return json('error', validation.message, 400)
    }

    const message = validation.message

    const identityLimit = await enforceRateLimit({ route: ROUTE_ID, ip, identity: parsed.data.email, limit: 8, windowMs: 60_000 })
    if (!identityLimit.allowed) {
      logListingSubmissionDiagnostic('LISTING_SUBMISSION_RATE_LIMITED', { ip, retryAfterSeconds: identityLimit.retryAfterSeconds, hasEmail: true })
      return json('error', withCode('Too many requests. Please try again shortly.', ABUSE_REJECTION_CODE), 429, identityLimit.retryAfterSeconds)
    }

    const supabase = getSupabaseConfig()
    if (!supabase) {
      logListingSubmissionDiagnostic('LISTING_SUBMISSION_CONFIG_MISSING', {
        hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      })
      return json(
        'error',
        withListingSubmissionCode('Listing capture is not configured yet. Please contact Harbourview directly.', 'LISTING_SUBMISSION_CONFIG_MISSING'),
        500
      )
    }

    const payload = {
      listing_id: null,
      buyer_request_id: null,
      contact_name: name,
      contact_email: email,
      contact_company: company || null,
      contact_phone: null,
      inquiry_type: listingType === 'Wanted Request' ? 'wanted_request_submission' : 'listing_submission',
      message,
      status: 'received',
    }

    let response: Response

    try {
      response = await fetch(`${supabase.url}/rest/v1/marketplace_inquiries`, {
        method: 'POST',
        headers: {
          apikey: supabase.anonKey,
          Authorization: `Bearer ${supabase.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
      })
    } catch (error) {
      logListingSubmissionDiagnostic('LISTING_SUBMISSION_SUPABASE_REQUEST_FAILED', {
        errorName: error instanceof Error ? error.name : 'unknown',
      })
      return json(
        'error',
        withListingSubmissionCode('The listing submission service could not be reached. Please try again or contact Harbourview directly.', 'LISTING_SUBMISSION_SUPABASE_REQUEST_FAILED'),
        502
      )
    }

    if (!response.ok) {
      logListingSubmissionDiagnostic('LISTING_SUBMISSION_SUPABASE_INSERT_FAILED', {
        status: response.status,
        statusText: response.statusText,
      })
      return json(
        'error',
        withListingSubmissionCode('The listing submission could not be saved. Please try again or contact Harbourview directly.', 'LISTING_SUBMISSION_SUPABASE_INSERT_FAILED'),
        502
      )
    }

    await notifyMarketplaceInquiry({
      ...payload,
      id: null,
      created_at: new Date().toISOString(),
      priority: 'medium',
    }).catch((error) => {
      console.info('harbourview_marketplace_listing_notification_failed', {
        errorName: error instanceof Error ? error.name : 'unknown',
      })
    })

    logListingSubmissionDiagnostic('LISTING_SUBMISSION_OK', {
      inquiryType: listingType === 'Wanted Request' ? 'wanted_request_submission' : 'listing_submission',
      listingType,
    })

    return json(
      'success',
      withListingSubmissionCode('Listing submission received. Harbourview will review it before publication or counterparty routing.', 'LISTING_SUBMISSION_OK')
    )
  } catch (error) {
    logListingSubmissionDiagnostic('LISTING_SUBMISSION_INTERNAL_ERROR', {
      errorName: error instanceof Error ? error.name : 'unknown',
    })
    return json(
      'error',
      withListingSubmissionCode('The listing submission could not be completed because of a server error. Please contact Harbourview directly.', 'LISTING_SUBMISSION_INTERNAL_ERROR'),
      500
    )
  }
}
