import { NextResponse } from 'next/server'
import { notifyMarketplaceInquiry } from '@/lib/marketplace/notification'
import { resolveLockedSupabaseUrl } from '@/lib/supabase/env'
import { quoteSubmissionSchema } from '@/lib/marketplace/intakeValidation'
import { enforceRateLimit, getClientIp } from '@/lib/network/rateLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_MESSAGE_LENGTH = 2500
const ROUTE_ID = '/api/marketplace/quote'
const ABUSE_REJECTION_CODE = 'ABUSE_REJECTED'
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
  | 'QUOTE_RATE_LIMITED'
  | 'QUOTE_BOT_REJECTED'
  | 'QUOTE_OK'

function withCode(message: string, code: QuoteDiagnosticCode | typeof ABUSE_REJECTION_CODE) {
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isOversized(value: string, maxLength = MAX_TEXT_LENGTH) {
  return value.length > maxLength
}

function getSupabaseConfig() {
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!anonKey) return null
  return { url: resolveLockedSupabaseUrl(), anonKey }
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
  return NextResponse.json(
    {
      ok: true,
      route: '/api/marketplace/quote',
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
    logQuoteDiagnostic('QUOTE_RATE_LIMITED', { ip, retryAfterSeconds: ipLimit.retryAfterSeconds })
    return json('error', withCode('Too many requests. Please try again shortly.', ABUSE_REJECTION_CODE), 429, ipLimit.retryAfterSeconds)
  }

  try {
    let body: Record<string, unknown>

    try {
      body = await request.json()
    } catch {
      return json('error', withCode('Invalid quote request payload.', 'QUOTE_VALIDATION_REQUIRED_FIELDS'), 400)
    }

    const parsed = quoteSubmissionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        status: 'error',
        message: withCode('Invalid payload.', 'QUOTE_VALIDATION_REQUIRED_FIELDS'),
        errors: parsed.error.flatten(),
      }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }

    const listingTitle = parsed.data.listingTitle
    if (parsed.data.hp_field?.trim()) {
      logQuoteDiagnostic('QUOTE_BOT_REJECTED', { reason: 'honeypot', ip })
      return json('error', withCode('Request rejected.', ABUSE_REJECTION_CODE), 429)
    }

    const expectedToken = process.env.MARKETPLACE_FORM_CHALLENGE_TOKEN
    if (expectedToken && parsed.data.challenge_token !== expectedToken) {
      logQuoteDiagnostic('QUOTE_BOT_REJECTED', { reason: 'challenge', ip })
      return json('error', withCode('Request rejected.', ABUSE_REJECTION_CODE), 429)
    }

    const name = parsed.data.name
    const email = parsed.data.email
    const phone = parsed.data.phone
    const company = parsed.data.company
    const buyerType = parsed.data.buyerType
    const targetMarket = parsed.data.targetMarket
    const volume = parsed.data.volume
    const timeline = parsed.data.timeline
    const budget = parsed.data.budget
    const supplierPreference = parsed.data.supplierPreference
    const requirements = parsed.data.requirements

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

    const identityLimit = await enforceRateLimit({ route: ROUTE_ID, ip, identity: parsed.data.email, limit: 8, windowMs: 60_000 })
    if (!identityLimit.allowed) {
      logQuoteDiagnostic('QUOTE_RATE_LIMITED', { ip, retryAfterSeconds: identityLimit.retryAfterSeconds, hasEmail: true })
      return json('error', withCode('Too many requests. Please try again shortly.', ABUSE_REJECTION_CODE), 429, identityLimit.retryAfterSeconds)
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

    const payload = {
      listing_id: null,
      buyer_request_id: null,
      contact_name: name,
      contact_email: email,
      contact_company: company,
      contact_phone: phone || null,
      inquiry_type: 'quote_routing',
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

    await notifyMarketplaceInquiry({
      ...payload,
      id: null,
      created_at: new Date().toISOString(),
      priority: 'medium',
    }).catch((error) => {
      console.info('harbourview_marketplace_quote_notification_failed', {
        errorName: error instanceof Error ? error.name : 'unknown',
      })
    })

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
