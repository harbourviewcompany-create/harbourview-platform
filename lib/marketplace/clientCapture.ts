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
  listing_title?: string | null
}

const SAFE_LISTING_CAPTURE_ERROR = 'Listing submission could not be saved. Please try again or contact Harbourview directly.'
const SAFE_INQUIRY_CAPTURE_ERROR = 'Inquiry could not be saved. Please try again or contact Harbourview directly.'

export async function submitMarketplaceInquiryDirect(
  payload: MarketplaceInquiryInsert,
  successMessage: string,
  diagnosticPrefix: 'QUOTE' | 'LISTING_SUBMISSION' | 'CONFIDENTIAL_INTAKE' | 'GENETICS' | 'CONTACT'
): Promise<CaptureResult> {
  let response: Response

  try {
    response = await fetch('/api/marketplace/capture', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...payload, success_message: successMessage }),
    })
  } catch {
    return {
      ok: false,
      message: diagnosticPrefix === 'LISTING_SUBMISSION' ? SAFE_LISTING_CAPTURE_ERROR : SAFE_INQUIRY_CAPTURE_ERROR,
    }
  }

  if (!response.ok) {
    let body: { message?: unknown } | null = null
    try {
      body = await response.json()
    } catch {
      body = null
    }

    return {
      ok: false,
      message:
        typeof body?.message === 'string' && body.message.trim()
          ? body.message
          : diagnosticPrefix === 'LISTING_SUBMISSION'
            ? SAFE_LISTING_CAPTURE_ERROR
            : SAFE_INQUIRY_CAPTURE_ERROR,
    }
  }

  return {
    ok: true,
    message: successMessage,
  }
}
