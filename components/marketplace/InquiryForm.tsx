'use client'

import { useState } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'

type InquiryFormProps = {
  listingSlug: string
  listingTitle: string
  ctaLabel: string
}

type FormState = 'idle' | 'submitting' | 'success' | 'error'

const MAX_MESSAGE_LENGTH = 2500

function readFormString(data: FormData, key: string) {
  const value = data.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function buildInquiryMessage(fields: {
  listingSlug: string
  listingTitle: string
  country: string
  inquiryType: string
  message: string
}) {
  return [
    fields.message,
    '',
    '--- Marketplace listing context ---',
    `Market: ${fields.country}`,
    `Listing: ${fields.listingTitle}`,
    `Slug: ${fields.listingSlug}`,
    `Inquiry type: ${fields.inquiryType}`,
  ].join('\n')
}

export function InquiryForm({ listingSlug, listingTitle, ctaLabel }: InquiryFormProps) {
  const [state, setState] = useState<FormState>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [messageLength, setMessageLength] = useState(0)
  const isNearLimit = messageLength >= MAX_MESSAGE_LENGTH * 0.9

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const website = readFormString(data, 'website')

    if (website) {
      setState('error')
      setStatusMessage('Inquiry could not be processed.')
      return
    }

    const name = readFormString(data, 'name')
    const email = readFormString(data, 'email').toLowerCase()
    const company = readFormString(data, 'company')
    const country = readFormString(data, 'country')
    const phone = readFormString(data, 'phone')
    const inquiryType = readFormString(data, 'inquiry_type') || 'listing_verification'
    const message = readFormString(data, 'message')
    const consent = data.get('consent') === 'on'

    if (!name || !email || !company || !country || !message || !consent) {
      setState('error')
      setStatusMessage('Please complete all required fields and confirm consent.')
      return
    }

    setState('submitting')
    setStatusMessage('')

    const result = await submitMarketplaceInquiryDirect(
      {
        listing_id: listingSlug,
        buyer_request_id: null,
        contact_name: name,
        contact_email: email,
        contact_company: company,
        contact_phone: phone || null,
        inquiry_type: inquiryType,
        message: buildInquiryMessage({ listingSlug, listingTitle, country, inquiryType, message }),
        status: 'received',
      },
      'Inquiry received. Harbourview will review the request before any introduction or seller contact. [INQUIRY_OK]',
      'QUOTE',
    )

    if (result.ok) {
      setState('success')
      setStatusMessage(result.message)
      form.reset()
      setMessageLength(0)
      return
    }

    setState('error')
    setStatusMessage(result.message)
  }

  return (
    <section id="inquiry" className="mt-8 rounded-2xl border border-[#C6A55A]/25 bg-black/20 p-5">
      <div className="max-w-3xl">
        <h2 className="text-xl font-semibold text-[#F5F1E8]">Request Harbourview review</h2>
        <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/70">
          Use this form to request verification, seller contact, quote routing or a similar equipment search. Harbourview reviews requests before any introduction is made.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2" noValidate>
        <input type="hidden" name="listing_slug" value={listingSlug} />
        <input type="hidden" name="listing_title" value={listingTitle} />

        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <label className="text-sm text-[#F5F1E8]/75">
          Name
          <input required name="name" maxLength={180} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2" />
        </label>

        <label className="text-sm text-[#F5F1E8]/75">
          Business email
          <input required type="email" name="email" maxLength={180} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2" />
        </label>

        <label className="text-sm text-[#F5F1E8]/75">
          Company
          <input required name="company" maxLength={180} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2" />
        </label>

        <label className="text-sm text-[#F5F1E8]/75">
          Country / market
          <input required name="country" maxLength={180} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2" />
        </label>

        <label className="text-sm text-[#F5F1E8]/75">
          Phone optional
          <input name="phone" maxLength={180} className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2" />
        </label>

        <label className="text-sm text-[#F5F1E8]/75">
          Request type
          <select name="inquiry_type" defaultValue="listing_verification" className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2">
            <option value="listing_verification">Verify this listing</option>
            <option value="seller_contact">Request seller contact</option>
            <option value="quote_routing">Request quote path</option>
            <option value="similar_equipment">Request similar equipment</option>
            <option value="sourcing_mandate">Discuss sourcing mandate</option>
          </select>
        </label>

        <label className="text-sm text-[#F5F1E8]/75 md:col-span-2">
          Message
          <textarea
            required
            name="message"
            maxLength={MAX_MESSAGE_LENGTH}
            rows={5}
            onChange={(event) => setMessageLength(event.currentTarget.value.length)}
            placeholder="Describe what you need verified, sourced or introduced. Include location, timing, quantity, budget range or equipment requirements where relevant."
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 placeholder:text-[#F5F1E8]/35 focus:ring-2"
          />
          <span className={isNearLimit ? 'mt-2 block text-xs text-[#D8BC73]' : 'mt-2 block text-xs text-[#F5F1E8]/45'}>
            {messageLength}/{MAX_MESSAGE_LENGTH} characters
          </span>
        </label>

        <label className="flex gap-3 text-sm leading-6 text-[#F5F1E8]/70 md:col-span-2">
          <input type="checkbox" name="consent" required className="mt-1 h-4 w-4" />
          I consent to Harbourview reviewing this inquiry and contacting me about Network, sourcing or intelligence services.
        </label>

        <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center">
          <button type="submit" disabled={state === 'submitting'} className="rounded-full bg-[#C6A55A] px-5 py-3 text-center text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73] disabled:cursor-not-allowed disabled:opacity-60">
            {state === 'submitting' ? 'Submitting...' : ctaLabel}
          </button>
          {statusMessage ? (
            <p data-testid="inquiry-diagnostic-message" className={state === 'success' ? 'text-sm text-[#D8BC73]' : 'text-sm text-red-200'}>{statusMessage}</p>
          ) : null}
        </div>
      </form>
    </section>
  )
}
