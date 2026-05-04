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

export async function submitMarketplaceInquiryDirect(
  payload: MarketplaceInquiryInsert,
  successMessage: string,
  diagnosticPrefix: 'QUOTE' | 'LISTING_SUBMISSION'
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
