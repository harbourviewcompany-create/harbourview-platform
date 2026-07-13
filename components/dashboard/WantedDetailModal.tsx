'use client'

import { useEffect, useState } from 'react'
import type { WantedListing } from '@/lib/dashboard/dashboardLiveData'
import { createClient } from '@/lib/supabase/client'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'
import { StatusBadge } from './StatusBadge'

interface Props {
  listing: WantedListing | null
  onClose: () => void
}

type FormState = 'idle' | 'submitting' | 'success' | 'error'

function buildResponseMessage(listing: WantedListing, note: string) {
  return [
    'Harbourview Command Centre — response to wanted demand',
    '',
    `Wanted listing: ${listing.title}`,
    `Listing reference: ${listing.id}`,
    `Jurisdiction: ${listing.location_region ?? listing.location_country ?? 'Not specified'}`,
    '',
    'Supplier note:',
    note || 'N/A',
  ].join('\n')
}

export function WantedDetailModal({ listing, onClose }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!listing) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [listing, onClose])

  useEffect(() => {
    setState('idle')
    setName('')
    setCompany('')
    setPhone('')
    setNote('')
    setErrorMessage('')
    setEmail('')
    if (!listing) return
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email)
    })
  }, [listing])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!listing || state === 'submitting' || state === 'success') return

    if (!name.trim() || !email.trim()) {
      setState('error')
      setErrorMessage('Name and email are required.')
      return
    }

    setState('submitting')
    const result = await submitMarketplaceInquiryDirect(
      {
        listing_id: null,
        buyer_request_id: null,
        contact_name: name.trim(),
        contact_email: email.trim().toLowerCase(),
        contact_company: company.trim(),
        contact_phone: phone.trim() || null,
        inquiry_type: 'sourcing_mandate',
        message: buildResponseMessage(listing, note.trim()),
      },
      'Response received. Harbourview will review it before coordinating any routed introduction. [WANTED_OK]',
      'QUOTE'
    )

    if (result.ok) {
      setState('success')
    } else {
      setState('error')
      setErrorMessage(result.message)
    }
  }

  if (!listing) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(3,7,13,0.9)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-[620px] max-h-[640px] overflow-y-auto rounded-2xl mx-4"
        style={{ background: 'var(--hv-bg-900, #06101B)', border: '1px solid rgba(198,165,90,0.22)' }}
      >
        <div
          className="sticky top-0 px-5 py-5"
          style={{ background: 'var(--hv-bg-900)', borderBottom: '1px solid rgba(198,165,90,0.18)' }}
        >
          <button
            onClick={onClose}
            className="float-right text-lg transition-opacity hover:opacity-60"
            style={{ color: 'rgba(243,240,234,0.4)' }}
            aria-label="Close"
          >✕</button>
          <p className="mb-1 text-[9px] uppercase tracking-[0.18em]" style={{ color: 'var(--hv-champagne-400)' }}>
            Wanted demand · Harbourview
          </p>
          <h2 className="font-serif text-[24px] leading-tight" style={{ color: 'var(--hv-text-primary)' }}>
            {listing.title}
          </h2>
        </div>

        <div className="flex flex-col gap-3.5 p-5">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Jurisdiction', value: listing.location_region ?? listing.location_country },
              { label: 'Posted',       value: new Date(listing.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
            ].map(({ label, value }) => value && (
              <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="mb-1 text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>{label}</p>
                <StatusBadge label={value} />
              </div>
            ))}
          </div>

          {listing.summary && (
            <div
              className="rounded-xl border-l-2 p-3.5 text-[12px] leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.025)', borderLeftColor: 'rgba(198,165,90,0.3)', color: 'rgba(243,240,234,0.6)' }}
            >
              {listing.summary}
            </div>
          )}

          {state === 'success' ? (
            <div
              className="rounded-xl p-4 text-center text-[12px]"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: 'rgba(187,247,208,0.9)' }}
            >
              Response received. Harbourview will review it before coordinating any routed introduction.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              <p className="text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>
                Respond to demand
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  placeholder="Full name *"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="rounded-lg px-3 py-2 text-[12px]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--hv-text-primary)' }}
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="rounded-lg px-3 py-2 text-[12px]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--hv-text-primary)' }}
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="rounded-lg px-3 py-2 text-[12px]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--hv-text-primary)' }}
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="rounded-lg px-3 py-2 text-[12px]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--hv-text-primary)' }}
                />
              </div>
              <textarea
                placeholder="How can you fulfil this demand? Specs, certifications, volume, timeline…"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                className="resize-none rounded-lg px-3 py-2 text-[12px]"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--hv-text-primary)' }}
              />

              {state === 'error' && (
                <p className="text-[11px]" style={{ color: 'rgba(248,113,113,0.85)' }}>{errorMessage}</p>
              )}

              <div className="mt-1 flex gap-2">
                <button
                  type="submit"
                  disabled={state === 'submitting'}
                  className="flex-1 rounded-xl py-2.5 text-center text-[12px] transition-all disabled:opacity-60"
                  style={{ border: '1px solid rgba(198,165,90,0.3)', background: 'rgba(198,165,90,0.1)', color: 'var(--hv-champagne-300)' }}
                >
                  {state === 'submitting' ? 'Sending…' : 'Send response →'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2.5 text-[12px] transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.45)' }}
                >
                  Close
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
