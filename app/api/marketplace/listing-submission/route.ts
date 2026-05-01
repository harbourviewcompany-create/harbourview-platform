import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_MESSAGE_LENGTH = 3500
const MAX_TEXT_LENGTH = 220

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

function withCode(message: string, code: ListingSubmissionDiagnosticCode) {
  return `${message} [${code}]`
}

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

function readField(body: Record<string, unknown>, key: string) {
  const value = body[key]
  return typeof value === 'string' ? value.trim() : ''
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isOversized(value: string, maxLength = MAX_TEXT_LENGTH) {
  return value.length > maxLength
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !anonKey) return null
  return { url: url.replace(/\/$/, ''), anonKey }
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

function buildSubmissionMessage(fields: {
  listingType: string
  title: string
  price: string
  location: string
  description: string
}) {
  return [
    'Harbourview marketplace listing submission',
    '',
    `Listing type: ${fields.listingType}`,
    `Title: ${fields.title}`,
    `Price / budget: ${fields.price || 'N/A'}`,
    `Location: ${fields.location || 'N/A'}`,
    '',
    'Description:',
    fields.description,
    '',
    'Harbourview action requested:',
    'Review listing fit, verify required details, and determine whether the opportunity should be published, routed, or declined.',
  ].join('\n')
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
        withCode('Invalid listing submission payload.', 'LISTING_SUBMISSION_VALIDATION_REQUIRED_FIELDS'),
        400
      )
    }

    const name = readField(body, 'name')
    const email = readField(body, 'email').toLowerCase()
    const company = readField(body, 'company')
    const listingType = readField(body, 'listingType')
    const title = readField(body, 'title')
    const price = readField(body, 'price')
    const location = readField(body, 'location')
    const description = readField(body, 'description')

    if (!name || !email || !listingType || !title || !description) {
      logListingSubmissionDiagnostic('LISTING_SUBMISSION_VALIDATION_REQUIRED_FIELDS', {
        hasName: Boolean(name),
        hasEmail: Boolean(email),
        hasListingType: Boolean(listingType),
        hasTitle: Boolean(title),
        hasDescription: Boolean(description),
      })
      return json(
        'error',
        withCode('Please complete all required listing submission fields.', 'LISTING_SUBMISSION_VALIDATION_REQUIRED_FIELDS'),
        400
      )
    }

    if (!isValidEmail(email)) {
      logListingSubmissionDiagnostic('LISTING_SUBMISSION_VALIDATION_EMAIL')
      return json('error', withCode('Please use a valid business email address.', 'LISTING_SUBMISSION_VALIDATION_EMAIL'), 400)
    }

    if (!VALID_LISTING_TYPES.has(listingType)) {
      logListingSubmissionDiagnostic('LISTING_SUBMISSION_VALIDATION_TYPE')
      return json('error', withCode('Please select a valid listing type.', 'LISTING_SUBMISSION_VALIDATION_TYPE'), 400)
    }

    const textFields = [name, email, company, listingType, title, price, location]
    if (textFields.some((field) => isOversized(field))) {
      logListingSubmissionDiagnostic('LISTING_SUBMISSION_VALIDATION_FIELD_LENGTH')
      return json(
        'error',
        withCode('One or more fields is longer than allowed.', 'LISTING_SUBMISSION_VALIDATION_FIELD_LENGTH'),
        400
      )
    }

    const message = buildSubmissionMessage({ listingType, title, price, location, description })

    if (message.length > MAX_MESSAGE_LENGTH) {
      logListingSubmissionDiagnostic('LISTING_SUBMISSION_VALIDATION_MESSAGE_LENGTH', { messageLength: message.length })
      return json(
        'error',
        withCode('Please keep the listing submission under 3,500 characters.', 'LISTING_SUBMISSION_VALIDATION_MESSAGE_LENGTH'),
        400
      )
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
        withCode('Listing capture is not configured yet. Please contact Harbourview directly.', 'LISTING_SUBMISSION_CONFIG_MISSING'),
        500
      )
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
        body: JSON.stringify({
          listing_id: null,
          buyer_request_id: null,
          contact_name: name,
          contact_email: email,
          contact_company: company || null,
          contact_phone: null,
          inquiry_type: listingType === 'Wanted Request' ? 'wanted_request_submission' : 'listing_submission',
          message,
          status: 'received',
        }),
      })
    } catch (error) {
      logListingSubmissionDiagnostic('LISTING_SUBMISSION_SUPABASE_REQUEST_FAILED', {
        errorName: error instanceof Error ? error.name : 'unknown',
      })
      return json(
        'error',
        withCode('The listing submission service could not be reached. Please try again or contact Harbourview directly.', 'LISTING_SUBMISSION_SUPABASE_REQUEST_FAILED'),
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
        withCode('The listing submission could not be saved. Please try again or contact Harbourview directly.', 'LISTING_SUBMISSION_SUPABASE_INSERT_FAILED'),
        502
      )
    }

    logListingSubmissionDiagnostic('LISTING_SUBMISSION_OK', {
      inquiryType: listingType === 'Wanted Request' ? 'wanted_request_submission' : 'listing_submission',
      listingType,
    })

    return json(
      'success',
      withCode('Listing submission received. Harbourview will review it before publication or counterparty routing.', 'LISTING_SUBMISSION_OK')
    )
  } catch (error) {
    logListingSubmissionDiagnostic('LISTING_SUBMISSION_INTERNAL_ERROR', {
      errorName: error instanceof Error ? error.name : 'unknown',
    })
    return json(
      'error',
      withCode('The listing submission could not be completed because of a server error. Please contact Harbourview directly.', 'LISTING_SUBMISSION_INTERNAL_ERROR'),
      500
    )
  }
}
