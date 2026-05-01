import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_MESSAGE_LENGTH = 2500
const MAX_TEXT_LENGTH = 180

const VALID_BUYER_TYPES = new Set([
  'Licensed Producer / Operator',
  'Brand',
  'Distributor',
  'Retailer',
  'Startup / New Operator',
  'Other',
])

const VALID_TIMELINES = new Set(['ASAP', 'Within 30 days', '30-90 days', 'Future planning'])

type QuoteDiagnosticCode =
  | 'QUOTE_VALIDATION_REQUIRED_FIELDS'
  | 'QUOTE_VALIDATION_EMAIL'
  | 'QUOTE_VALIDATION_FIELD_LENGTH'
  | 'QUOTE_VALIDATION_MESSAGE_LENGTH'
  | 'QUOTE_VALIDATION_BUYER_TYPE'
  | 'QUOTE_VALIDATION_TIMELINE'
  | 'QUOTE_CONFIG_MISSING'
  | 'QUOTE_SUPABASE_REQUEST_FAILED'
  | 'QUOTE_SUPABASE_INSERT_FAILED'
  | 'QUOTE_INTERNAL_ERROR'
  | 'QUOTE_OK'

function withCode(message: string, code: QuoteDiagnosticCode) {
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

function logQuoteDiagnostic(code: QuoteDiagnosticCode, details?: Record<string, string | number | boolean | null>) {
  console.info('harbourview_marketplace_quote_request', {
    code,
    ...details,
  })
}

function buildQuoteMessage(fields: {
  listingTitle: string
  buyerType: string
  targetMarket: string
  volume: string
  timeline: string
  budget: string
  supplierPreference: string
  requirements: string
}) {
  return [
    'Harbourview quote request',
    '',
    `Listing: ${fields.listingTitle || 'N/A'}`,
    `Buyer type: ${fields.buyerType}`,
    `Target market / jurisdiction: ${fields.targetMarket}`,
    `Volume / order size: ${fields.volume}`,
    `Timeline: ${fields.timeline}`,
    `Budget / price target: ${fields.budget || 'N/A'}`,
    `Supplier preference: ${fields.supplierPreference || 'N/A'}`,
    '',
    'Requirements:',
    fields.requirements || 'N/A',
    '',
    'Harbourview action requested:',
    'Review buyer fit, verify supplier/source availability, and advise on quote or introduction path.',
  ].join('\n')
}

export async function GET() {
  const supabase = getSupabaseConfig()

  return NextResponse.json(
    {
      ok: true,
      route: '/api/marketplace/quote',
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
      return json('error', withCode('Invalid quote request payload.', 'QUOTE_VALIDATION_REQUIRED_FIELDS'), 400)
    }

    const listingTitle = readField(body, 'listingTitle')
    const name = readField(body, 'name')
    const email = readField(body, 'email').toLowerCase()
    const phone = readField(body, 'phone')
    const company = readField(body, 'company')
    const buyerType = readField(body, 'buyerType')
    const targetMarket = readField(body, 'targetMarket')
    const volume = readField(body, 'volume')
    const timeline = readField(body, 'timeline')
    const budget = readField(body, 'budget')
    const supplierPreference = readField(body, 'supplierPreference')
    const requirements = readField(body, 'requirements')

    if (!name || !email || !company || !buyerType || !targetMarket || !volume || !timeline) {
      logQuoteDiagnostic('QUOTE_VALIDATION_REQUIRED_FIELDS', {
        hasName: Boolean(name),
        hasEmail: Boolean(email),
        hasCompany: Boolean(company),
        hasBuyerType: Boolean(buyerType),
        hasTargetMarket: Boolean(targetMarket),
        hasVolume: Boolean(volume),
        hasTimeline: Boolean(timeline),
      })
      return json('error', withCode('Please complete all required quote request fields.', 'QUOTE_VALIDATION_REQUIRED_FIELDS'), 400)
    }

    if (!isValidEmail(email)) {
      logQuoteDiagnostic('QUOTE_VALIDATION_EMAIL')
      return json('error', withCode('Please use a valid business email address.', 'QUOTE_VALIDATION_EMAIL'), 400)
    }

    if (!VALID_BUYER_TYPES.has(buyerType)) {
      logQuoteDiagnostic('QUOTE_VALIDATION_BUYER_TYPE')
      return json('error', withCode('Please select a valid buyer type.', 'QUOTE_VALIDATION_BUYER_TYPE'), 400)
    }

    if (!VALID_TIMELINES.has(timeline)) {
      logQuoteDiagnostic('QUOTE_VALIDATION_TIMELINE')
      return json('error', withCode('Please select a valid timeline.', 'QUOTE_VALIDATION_TIMELINE'), 400)
    }

    const textFields = [
      listingTitle,
      name,
      email,
      phone,
      company,
      buyerType,
      targetMarket,
      volume,
      timeline,
      budget,
      supplierPreference,
    ]

    if (textFields.some((field) => isOversized(field))) {
      logQuoteDiagnostic('QUOTE_VALIDATION_FIELD_LENGTH')
      return json('error', withCode('One or more fields is longer than allowed.', 'QUOTE_VALIDATION_FIELD_LENGTH'), 400)
    }

    const message = buildQuoteMessage({
      listingTitle,
      buyerType,
      targetMarket,
      volume,
      timeline,
      budget,
      supplierPreference,
      requirements,
    })

    if (message.length > MAX_MESSAGE_LENGTH) {
      logQuoteDiagnostic('QUOTE_VALIDATION_MESSAGE_LENGTH', { messageLength: message.length })
      return json('error', withCode('Please keep the quote request under 2,500 characters.', 'QUOTE_VALIDATION_MESSAGE_LENGTH'), 400)
    }

    const supabase = getSupabaseConfig()
    if (!supabase) {
      logQuoteDiagnostic('QUOTE_CONFIG_MISSING', {
        hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      })
      return json('error', withCode('Quote capture is not configured yet. Please contact Harbourview directly.', 'QUOTE_CONFIG_MISSING'), 500)
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
          contact_company: company,
          contact_phone: phone || null,
          inquiry_type: 'quote_routing',
          message,
          status: 'received',
        }),
      })
    } catch (error) {
      logQuoteDiagnostic('QUOTE_SUPABASE_REQUEST_FAILED', {
        errorName: error instanceof Error ? error.name : 'unknown',
      })
      return json('error', withCode('The quote request service could not be reached. Please try again or contact Harbourview directly.', 'QUOTE_SUPABASE_REQUEST_FAILED'), 502)
    }

    if (!response.ok) {
      logQuoteDiagnostic('QUOTE_SUPABASE_INSERT_FAILED', {
        status: response.status,
        statusText: response.statusText,
      })
      return json('error', withCode('The quote request could not be saved. Please try again or contact Harbourview directly.', 'QUOTE_SUPABASE_INSERT_FAILED'), 502)
    }

    logQuoteDiagnostic('QUOTE_OK', {
      inquiryType: 'quote_routing',
      hasListingTitle: Boolean(listingTitle),
    })

    return json('success', withCode('Quote request received. Harbourview will review the request before supplier introduction or quote routing.', 'QUOTE_OK'))
  } catch (error) {
    logQuoteDiagnostic('QUOTE_INTERNAL_ERROR', {
      errorName: error instanceof Error ? error.name : 'unknown',
    })
    return json('error', withCode('The quote request could not be completed because of a server error. Please contact Harbourview directly.', 'QUOTE_INTERNAL_ERROR'), 500)
  }
}
