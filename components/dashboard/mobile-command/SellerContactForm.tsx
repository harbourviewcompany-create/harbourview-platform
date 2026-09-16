'use client'

import { FormEvent, useMemo, useState } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'
import type { NormalizedListing } from './contracts'

type Props = {
  listing: NormalizedListing
  onDone?: () => void
}

function defaultMessage(listing: NormalizedListing): string {
  return [
    `Interested in: ${listing.title}`,
    'Quantity: ',
    'Need by: ',
    `Market / jurisdiction: ${listing.jurisdiction || ''}`,
    '',
    'Additional notes:',
  ].join('\n')
}

export function SellerContactForm({ listing, onDone }: Props) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')
  const [showOptional, setShowOptional] = useState(false)
  const messageDefault = useMemo(() => defaultMessage(listing), [listing])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'submitting') return
    const form = event.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') || '').trim()
    const email = String(data.get('email') || '').trim().toLowerCase()
    const company = String(data.get('company') || '').trim()
    const phone = String(data.get('phone') || '').trim()
    const body = String(data.get('message') || '').trim()

    if (!name || !email || !body) {
      setStatus('error')
      setFeedback('Name, email, and message are required.')
      return
    }

    setStatus('submitting')
    setFeedback('')

    const listingId = listing.id
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        listingId,
      )

    const result = await submitMarketplaceInquiryDirect(
      {
        listing_id: isUuid ? listingId : null,
        buyer_request_id: null,
        contact_name: name,
        contact_email: email,
        contact_company: company || null,
        contact_phone: phone || null,
        inquiry_type: 'seller_contact',
        message: [
          body,
          '',
          '--- Listing context ---',
          `Title: ${listing.title}`,
          `Category: ${listing.category}`,
          `Jurisdiction: ${listing.jurisdiction}`,
          `Listing id: ${listing.id}`,
        ].join('\n'),
        listing_title: listing.title,
      },
      'Inquiry sent. The seller will be notified through Harbourview.',
      'CONTACT',
    )

    if (result.ok) {
      // Stay on success screen; do not auto-close (so the user can read next steps).
      setStatus('success')
      setFeedback(result.message)
      form.reset()
      return
    }

    setStatus('error')
    setFeedback(result.message)
  }

  if (status === 'success') {
    return (
      <div className="cc-mkt-inquiry-success" role="status">
        <strong>Inquiry sent</strong>
        <p>
          {feedback ||
            'Harbourview will deliver your message. Contact details stay private until the seller replies.'}
        </p>
        <p className="cc-mkt-inquiry-success-next">
          What happens next: the listing owner is notified through Harbourview. You will hear back through the same channel when they respond.
        </p>
        <button type="button" className="cc-mkt-cta cc-mkt-cta--block" onClick={() => onDone?.()}>
          Back to Market
        </button>
      </div>
    )
  }

  return (
    <form className="cc-mkt-seller-form" onSubmit={handleSubmit} noValidate>
      <p className="cc-mkt-seller-form-lead">
        Send an inquiry about <strong>{listing.title}</strong>. Harbourview delivers it;
        your contact details stay private until they reply.
      </p>

      <label>
        Name
        <input name="name" required maxLength={220} autoComplete="name" placeholder="Your name" />
      </label>

      <label>
        Work email
        <input
          name="email"
          type="email"
          required
          maxLength={220}
          autoComplete="email"
          placeholder="you@company.com"
          inputMode="email"
        />
      </label>

      <label>
        Message
        <textarea
          name="message"
          required
          maxLength={2500}
          rows={6}
          defaultValue={messageDefault}
        />
      </label>

      {!showOptional ? (
        <button
          type="button"
          className="cc-mkt-inquiry-optional-toggle"
          onClick={() => setShowOptional(true)}
        >
          Add company or phone (optional)
        </button>
      ) : (
        <>
          <label>
            Company
            <input name="company" maxLength={220} autoComplete="organization" placeholder="Optional" />
          </label>
          <label>
            Phone
            <input name="phone" maxLength={80} autoComplete="tel" inputMode="tel" placeholder="Optional" />
          </label>
        </>
      )}

      {status === 'error' ? <p className="cc-mkt-seller-form-error">{feedback}</p> : null}

      <button type="submit" className="cc-mkt-cta cc-mkt-cta--block" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending…' : 'Send inquiry'}
      </button>
    </form>
  )
}
