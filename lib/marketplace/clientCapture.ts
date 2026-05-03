const LOCKED_SUPABASE_URL = 'https://zvxdgdkukjrrwamdpqrg.supabase.co'
const EXPECTED_SUPABASE_HOST = 'zvxdgdkukjrrwamdpqrg.supabase.co'
const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_URL = resolveSupabaseUrl(rawSupabaseUrl)
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

type CaptureResult = {
  ok: boolean
  message: string
}

type MarketplaceInquiryInsert = {
  listing_id: string | null
  buyer_request_id: string | null
  contact_name: string
  contact_email: string
  contact_company: string | null
  contact_phone: string | null
  inquiry_type: string
  message: string
  status: 'received'
}

function isExpectedSupabaseUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.hostname === EXPECTED_SUPABASE_HOST
  } catch {
    return false
  }
}

function resolveSupabaseUrl(url: string) {
  const normalized = url.trim().replace(/\/$/, '')
  if (normalized && isExpectedSupabaseUrl(normalized)) return normalized
  return LOCKED_SUPABASE_URL
}

export async function submitMarketplaceInquiryDirect(
  payload: MarketplaceInquiryInsert,
  successMessage: string,
  diagnosticPrefix: 'QUOTE' | 'LISTING_SUBMISSION'
): Promise<CaptureResult> {
  if (!SUPABASE_URL || !isExpectedSupabaseUrl(SUPABASE_URL)) {
    return {
      ok: false,
      message: `${successMessage.replace(/received\..*$/i, 'could not be completed.')} Invalid Supabase project configuration. [${diagnosticPrefix}_SUPABASE_CLIENT_CONFIG_INVALID]`,
    }
  }

  if (!SUPABASE_ANON_KEY) {
    return {
      ok: false,
      message: `${successMessage.replace(/received\..*$/i, 'could not be completed.')} Missing public Supabase key. [${diagnosticPrefix}_SUPABASE_CLIENT_KEY_MISSING]`,
    }
  }

  let response: Response

  try {
    response = await fetch(`${SUPABASE_URL}/rest/v1/marketplace_inquiries`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    const detail = error instanceof Error ? error.name : 'UnknownError'
    return {
      ok: false,
      message: `${successMessage.replace(/received\..*$/i, 'could not be completed.')} Browser could not reach Supabase. ${detail}. [${diagnosticPrefix}_SUPABASE_DIRECT_REQUEST_FAILED]`,
    }
  }

  if (!response.ok) {
    let detail = ''
    try {
      detail = await response.text()
    } catch {
      detail = ''
    }

    return {
      ok: false,
      message: `${successMessage.replace(/received\..*$/i, 'could not be saved.')} Supabase returned ${response.status}. ${detail.slice(0, 120)} [${diagnosticPrefix}_SUPABASE_DIRECT_INSERT_FAILED]`,
    }
  }

  return {
    ok: true,
    message: successMessage,
  }
}
