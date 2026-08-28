'use client'

import { FormEvent, useState } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'
import type { NormalizedListing } from './contracts'

type Props = {
  listing: NormalizedListing
  onDone?: () => void
}

export function SellerContactForm({ listing, onDone }: Props) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

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
      setMessage('Name, email and message are required.')
      return
    }

    setStatus('submitting')
    setMessage('')

    const listingId = listing.id
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listingId)

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
      setStatus('success')
      setMessage(result.message)
      form.reset()
      onDone?.()
      return
    }

    setStatus('error')
    setMessage(result.message)
  }

  if (status === 'success') {
    return (
      <div className="hvm2-workspace-context">
        <strong>Inquiry sent</strong>
        <p>{message}</p>
      </div>
    )
  }

  return (
    <form className="cc-mkt-seller-form" onSubmit={handleSubmit}>
      <p className="cc-mkt-seller-form-lead">
        Message the seller about <strong>{listing.title}</strong>. Harbourview delivers your inquiry; contact details stay private until they reply.
      </p>
      <label>
        Name
        <input name="name" required maxLength={220} autoComplete="name" />
      </label>
      <label>
        Work email
        <input name="email" type="email" required maxLength={220} autoComplete="email" />
      </label>
      <label>
        Company
        <input name="company" maxLength={220} autoComplete="organization" />
      </label>
      <label>
        Phone optional
        <input name="phone" maxLength={80} autoComplete="tel" />
      </label>
      <label>
        Message
        <textarea name="message" required maxLength={2500} rows={5} placeholder="Quantity, timing, destination market…" />
      </label>
      {status === 'error' ? <p className="cc-mkt-seller-form-error">{message}</p> : null}
      <button type="submit" className="cc-mkt-cta cc-mkt-cta--block" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending…' : 'Contact seller'}
      </button>
    </form>
  )
}
