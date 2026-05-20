import { NextResponse } from 'next/server'
import { notifyMarketplaceInquiry } from '@/lib/marketplace/notification'
import { resolveLockedSupabaseUrl } from '@/lib/supabase/env'
import { listingSubmissionSchema } from '@/lib/marketplace/intakeValidation'
import { validateListingSubmission, withListingSubmissionCode } from '@/lib/marketplace/listingSubmissionValidation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VALID_LISTING_TYPES = new Set([
  'New Product',
  'Used / Surplus Equipment',
  'Cannabis Inventory',
  'Wanted Request',
  'Service',
  'Business Opportunity',
  'Supplier Directory Listing',
])

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
  | 'LISTING_SUBMISSION_OK'

function json(status: 'success' | 'error', message: string, httpStatus = 200) {
  return NextResponse.json(
    { status, message },
    {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store',
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
  const supabase = getSupabaseConfig()

  return NextResponse.json(
    {
      ok: true,
      route: '/api/marketplace/listing-submission',
      method: 'POST',
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      configured: Boolean(supabase),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}

export async function POST(request: Request) {
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

    const name = parsed.data.name
    const email = parsed.data.email
    const company = parsed.data.company
    const listingType = parsed.data.listingType
    const title = parsed.data.title
    const price = parsed.data.price
    const location = parsed.data.location
    const description = parsed.data.description
    if (!VALID_LISTING_TYPES.has(listingType)) {
      logListingSubmissionDiagnostic('LISTING_SUBMISSION_VALIDATION_TYPE')
      return json('error', withListingSubmissionCode('Please select a valid listing type.', 'LISTING_SUBMISSION_VALIDATION_TYPE'), 400)
    }

    const validation = validateListingSubmission(parsed.data)
    if (!validation.ok) {
      logListingSubmissionDiagnostic(validation.code)
      return json('error', validation.message, 400)
    }

    const message = validation.message

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
