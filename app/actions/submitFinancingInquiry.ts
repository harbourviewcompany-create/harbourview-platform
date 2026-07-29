'use server'

import { postMarketplaceInquiry } from '@/lib/marketplace/inquirySubmission'
import { notifyMarketplaceInquiry } from '@/lib/marketplace/notification'

export type FinancingInquiryState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

function read(formData: FormData, key: string): string {
  const v = formData.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200
}

export async function submitFinancingInquiry(
  _prev: FinancingInquiryState,
  formData: FormData,
): Promise<FinancingInquiryState> {
  // Honeypot
  if (read(formData, 'website')) {
    return { status: 'error', message: 'Inquiry could not be processed.' }
  }

  const contact_name = read(formData, 'contact_name')
  const contact_email = read(formData, 'contact_email').toLowerCase()
  const contact_company = read(formData, 'contact_company')
  const contact_phone = read(formData, 'contact_phone')
  const amount = read(formData, 'amount')
  const currency_pair = read(formData, 'currency_pair')
  const purpose = read(formData, 'purpose')
  const timeline = read(formData, 'timeline')
  const markets = read(formData, 'markets')
  const deal_context = read(formData, 'deal_context')
  const message = read(formData, 'message')
  const consent = formData.get('consent') === 'on'

  if (!contact_name || !contact_email || !contact_company || !amount || !purpose || !timeline || !markets || !message) {
    return { status: 'error', message: 'Please complete all required fields.' }
  }

  if (!isEmail(contact_email)) {
    return { status: 'error', message: 'Please use a valid work email address.' }
  }

  if (!consent) {
    return { status: 'error', message: 'Please confirm authorization before submitting.' }
  }

  if (message.length > 2000) {
    return { status: 'error', message: 'Please keep additional context under 2,000 characters.' }
  }

  const structuredMessage = [
    '--- Trade financing inquiry ---',
    `Amount: ${amount}`,
    currency_pair ? `Settlement: ${currency_pair}` : null,
    `Purpose: ${purpose}`,
    `Timeline: ${timeline}`,
    `Markets: ${markets}`,
    deal_context ? `Deal context: ${deal_context}` : null,
    '',
    message,
  ]
    .filter(Boolean)
    .join('\n')

  const payload = {
    listing_id: null,
    buyer_request_id: null,
    contact_name,
    contact_email,
    contact_company,
    contact_phone: contact_phone || null,
    inquiry_type: 'trade_financing',
    message: structuredMessage,
    status: 'received' as const,
  }

  const result = await postMarketplaceInquiry(payload)

  if (!result.ok) {
    if (result.kind === 'config_missing') {
      return {
        status: 'error',
        message: 'Inquiry capture is not configured yet. Please contact Harbourview directly.',
      }
    }
    return {
      status: 'error',
      message: 'The inquiry could not be saved. Please try again or contact Harbourview directly.',
    }
  }

  await notifyMarketplaceInquiry({
    ...payload,
    id: null,
    created_at: new Date().toISOString(),
    priority: 'high',
  }).catch(() => {
    /* notification failure must not block success path */
  })

  return {
    status: 'success',
    message:
      'Financing inquiry received. Harbourview will review amount, purpose, markets and timeline before any partner introduction.',
  }
}
