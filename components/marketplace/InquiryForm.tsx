'use client'

import { useState } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'

type InquiryFormProps = {
  listingSlug: string
  listingTitle: string
  ctaLabel: string
}

type InquiryState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

const MAX_MESSAGE_LENGTH = 2500
const initialState: InquiryState = { status: 'idle', message: '' }

function readFormString(data: FormData, key: string) {
  const value = data.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function buildMessageWithListingContext(fields: {
  message: string
  country: string
  listingSlug: string
  listingTitle: string
}) {
  return [
    fields.message,
    '',
    '--- Marketplace listing context ---',
    `Market: ${fields.country}`,
    `Listing: ${fields.listingTitle}`,
    `Slug: ${fields.listingSlug}`,
  ].join('\n')
}

export function InquiryForm({ listingSlug, listingTitle, ctaLabel }: InquiryFormProps) {
  const [state, setState] = useState<InquiryState>(initialState)
  const [isPending, setIsPending] = useState(false)
  const [messageLength, setMessageLength] = useState(0)
  const isNearLimit = messageLength >= MAX_MESSAGE_LENGTH * 0.9

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    if (readFormString(data, 'website')) {
      setState({ status: 'error', message: 'Inquiry could not be processed. [INQUIRY_VALIDATION_SPAM_TRAP]' })
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

    if (!name || !email || !company || !country || !message) {
      setState({ status: 'error', message: 'Please complete name, email, company, country and message. [INQUIRY_VALIDATION_REQUIRED_FIELDS]' })
      return
    }

    if (!consent) {
      setState({ status: 'error', message: 'Please confirm consent before submitting the inquiry. [INQUIRY_VALIDATION_CONSENT]' })
      return
    }

    setIsPending(true)
    setState(initialState)

    const result = await submitMarketplaceInquiryDirect(
      {
        listing_id: null,
        buyer_request_id: null,
        contact_name: name,
        contact_email: email,
        contact_company: company,
        contact_phone: phone || null,
        inquiry_type: inquiryType,
        message: buildMessageWithListingContext({ message, country, listingSlug, listingTitle }),
        status: 'received',
      },
      'Inquiry received. Harbourview will review the request before any introduction or seller contact. [INQUIRY_OK]',
      'QUOTE',
    )

    setIsPending(false)

    if (result.ok) {
      setState({ status: 'success', message: result.message })
      form.reset()
      setMessageLength(0)
      return
    }

    setState({ status: 'error', message: result.message })
  }

  return (
    <section id="inquiry" className="mt-8 rounded-2xl border border-[#C6A55A]/25 bg-black/20 p-5">
      <div className="max-w-3xl">
        <h2 className="text-xl font-semibold text-[#F5F1E8]">Request Harbourview review</h2>
        <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/70">
          Use this form to request verification, seller contact, quote routing or a similar equipment search. Harbourview reviews requests before any introduction is made.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
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
          <button type="submit" disabled={isPending} className="rounded-full bg-[#C6A55A] px-5 py-3 text-center text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73] disabled:cursor-not-allowed disabled:opacity-60">
            {isPending ? 'Submitting...' : ctaLabel}
          </button>
          {state.message ? (
            <p data-testid="inquiry-diagnostic-message" className={state.status === 'success' ? 'text-sm text-[#D8BC73]' : 'text-sm text-red-200'}>{state.message}</p>
          ) : null}
        </div>
      </form>
    </section>
  )
}
