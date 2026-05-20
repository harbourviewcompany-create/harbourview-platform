import { NextResponse } from 'next/server'
import { ZodIssue } from 'zod'
import { notifyMarketplaceInquiry } from '@/lib/marketplace/notification'
import { resolveLockedSupabaseUrl } from '@/lib/supabase/env'
import { quoteSubmissionSchema } from '@/lib/marketplace/intakeValidation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_MESSAGE_LENGTH = 2500
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

function mapValidationIssueToCode(issue: ZodIssue): QuoteDiagnosticCode {
  if (issue.path.includes('email')) return 'QUOTE_VALIDATION_EMAIL'
  if (issue.path.includes('buyerType')) return 'QUOTE_VALIDATION_BUYER_TYPE'
  if (issue.path.includes('timeline')) return 'QUOTE_VALIDATION_TIMELINE'
  if (issue.code === 'too_big') return 'QUOTE_VALIDATION_FIELD_LENGTH'
  return 'QUOTE_VALIDATION_REQUIRED_FIELDS'
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

    const parsed = quoteSubmissionSchema.safeParse(body)
    if (!parsed.success) {
      const code = mapValidationIssueToCode(parsed.error.issues[0])
      logQuoteDiagnostic(code, {
        issueCode: parsed.error.issues[0]?.code ?? null,
        issuePath: parsed.error.issues[0]?.path?.join('.') ?? null,
      })
      return NextResponse.json({
        status: 'error',
        message: withCode('Invalid payload.', code),
        errors: parsed.error.flatten(),
      }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
    }

    const listingTitle = parsed.data.listingTitle
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
