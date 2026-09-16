'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'
import type { NormalizedListing } from './contracts'

type Props = {
  listing: NormalizedListing
  onDone?: () => void
}

type ProfilePrefill = {
  name: string
  email: string
  company: string
  phone: string
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

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

async function loadProfilePrefill(): Promise<ProfilePrefill> {
  const empty: ProfilePrefill = { name: '', email: '', company: '', phone: '' }
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return empty

    const meta = (user.user_metadata ?? {}) as Record<string, unknown>
    const name = pickString(
      meta.full_name,
      meta.name,
      meta.display_name,
      [meta.given_name, meta.family_name].filter(Boolean).join(' '),
      user.email?.split('@')[0],
    )
    const email = pickString(user.email, meta.email)
    const company = pickString(meta.company, meta.organization, meta.company_name, meta.org)
    const phone = pickString(meta.phone, meta.phone_number, meta.mobile)

    // Best-effort profile row (schema may vary; ignore failures).
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, display_name, company, organization, phone, email')
        .eq('id', user.id)
        .maybeSingle()

      if (profile && typeof profile === 'object') {
        const p = profile as Record<string, unknown>
        return {
          name: pickString(p.full_name, p.display_name, name),
          email: pickString(p.email, email),
          company: pickString(p.company, p.organization, company),
          phone: pickString(p.phone, phone),
        }
      }
    } catch {
      // profiles relation may not exist in api schema — auth metadata is enough
    }

    return { name, email, company, phone }
  } catch {
    return empty
  }
}

export function SellerContactForm({ listing, onDone }: Props) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')
  const [showOptional, setShowOptional] = useState(false)
  const [prefill, setPrefill] = useState<ProfilePrefill>({
    name: '',
    email: '',
    company: '',
    phone: '',
  })
  const [prefillReady, setPrefillReady] = useState(false)
  const messageDefault = useMemo(() => defaultMessage(listing), [listing])

  useEffect(() => {
    let cancelled = false
    loadProfilePrefill().then(data => {
      if (cancelled) return
      setPrefill(data)
      if (data.company || data.phone) setShowOptional(true)
      setPrefillReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

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
      setStatus('success')
      setFeedback(result.message)
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

      {prefillReady && (prefill.name || prefill.email) ? (
        <p className="cc-mkt-seller-form-prefill-hint">Filled from your Harbourview profile — edit if needed.</p>
      ) : null}

      <label>
        Name
        <input
          name="name"
          required
          maxLength={220}
          autoComplete="name"
          placeholder="Your name"
          defaultValue={prefill.name}
          key={`name-${prefillReady ? prefill.name : 'loading'}`}
        />
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
          defaultValue={prefill.email}
          key={`email-${prefillReady ? prefill.email : 'loading'}`}
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
            <input
              name="company"
              maxLength={220}
              autoComplete="organization"
              placeholder="Optional"
              defaultValue={prefill.company}
              key={`company-${prefillReady ? prefill.company : 'loading'}`}
            />
          </label>
          <label>
            Phone
            <input
              name="phone"
              maxLength={80}
              autoComplete="tel"
              inputMode="tel"
              placeholder="Optional"
              defaultValue={prefill.phone}
              key={`phone-${prefillReady ? prefill.phone : 'loading'}`}
            />
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
