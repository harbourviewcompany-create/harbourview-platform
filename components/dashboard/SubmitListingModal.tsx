'use client'

import { useEffect, useRef, useState } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'
import { createClient } from '@/lib/supabase/client'

interface Props {
  open: boolean
  onClose: () => void
}

type State = { status: 'idle' | 'submitting' | 'success' | 'error'; message: string }

const LISTING_TYPES = [
  'Cannabis Inventory', 'New Product', 'Used / Surplus Equipment',
  'Consumables', 'Cultivation Equipment', 'Processing Equipment',
  'Service', 'Business Opportunity', 'Genetics Program',
  'Licensing Opportunity', 'Facility / Real Estate',
  'Technology & Software', 'Investment Opportunity',
  'Wanted Request', 'Other',
]

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--hv-text-primary)',
}

function inp() {
  return 'w-full rounded-lg px-3 py-2 text-[12px] outline-none resize-none'
}

export function SubmitListingModal({ open, onClose }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, setState] = useState<State>({ status: 'idle', message: '' })
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!open) return
    setState({ status: 'idle', message: '' })
    formRef.current?.reset()
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email)
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state.status === 'submitting' || state.status === 'success') return
    const fd = new FormData(e.currentTarget)
    const g = (k: string) => ((fd.get(k) as string) || '').trim()

    const name = g('name')
    const emailVal = g('email') || email
    const title = g('title')
    const description = g('description')

    if (!name || !emailVal || !title || !description) {
      setState({ status: 'error', message: 'Name, email, title, and description are required.' })
      return
    }

    const listingType = g('listingType')
    const location = g('location')
    const price = g('price')

    const message = [
      'Marketplace listing submission (Command Centre)',
      '',
      `Listing type: ${listingType || 'N/A'}`,
      `Title: ${title}`,
      `Location / country: ${location || 'N/A'}`,
      `Price / budget: ${price || 'N/A'}`,
      '',
      'Description:',
      description,
    ].join('\n')

    const inquiryType = listingType === 'Wanted Request'
      ? 'wanted_request_submission'
      : 'listing_submission'

    setState({ status: 'submitting', message: '' })
    submitMarketplaceInquiryDirect(
      {
        listing_id: null, buyer_request_id: null,
        contact_name: name,
        contact_email: emailVal.toLowerCase(),
        contact_company: g('company') || null,
        contact_phone: null,
        inquiry_type: inquiryType,
        message,
      },
      'Submission received. Harbourview will review your listing within 2 business days.',
      'LISTING_SUBMISSION',
    ).then(result => {
      setState({ status: result.ok ? 'success' : 'error', message: result.message })
    })
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(3,7,13,0.9)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-[620px] max-h-[660px] overflow-y-auto rounded-2xl mx-4"
        style={{ background: 'var(--hv-bg-900, #06101B)', border: '1px solid rgba(198,165,90,0.22)' }}
      >
        <div
          className="sticky top-0 px-5 py-5"
          style={{ background: 'var(--hv-bg-900)', borderBottom: '1px solid rgba(198,165,90,0.18)' }}
        >
          <button onClick={onClose} className="float-right text-lg transition-opacity hover:opacity-60" style={{ color: 'rgba(243,240,234,0.4)' }} aria-label="Close">✕</button>
          <p className="mb-1 text-[9px] uppercase tracking-[0.18em]" style={{ color: 'var(--hv-champagne-400)' }}>Marketplace · Private intake</p>
          <h2 className="font-serif text-[22px] leading-tight" style={{ color: 'var(--hv-text-primary)' }}>
            Submit a listing
          </h2>
        </div>

        <div className="p-5">
          {state.status === 'success' ? (
            <div className="rounded-xl p-5 text-center text-[12px]" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: 'rgba(187,247,208,0.9)' }}>
              {state.message}
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
              <p className="text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>Listing details</p>
              <div className="grid grid-cols-2 gap-2">
                <select name="listingType" className={inp()} style={inputStyle}>
                  <option value="">Listing type</option>
                  {LISTING_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <input name="location" className={inp()} style={inputStyle} placeholder="Country / location" />
              </div>
              <input name="title" className={inp()} style={inputStyle} placeholder="Listing title *" />
              <input name="price" className={inp()} style={inputStyle} placeholder="Price / budget / range (optional)" />
              <textarea name="description" rows={4} className={inp()} style={inputStyle} placeholder="Description — specs, quantities, timelines, constraints *" />

              <p className="mt-1 text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>Contact</p>
              <div className="grid grid-cols-2 gap-2">
                <input name="name" className={inp()} style={inputStyle} placeholder="Full name *" />
                <input name="email" type="email" className={inp()} style={inputStyle} placeholder="Email *" defaultValue={email} key={email} />
                <input name="company" className={inp()} style={inputStyle} placeholder="Company (optional)" />
              </div>

              <div className="rounded-lg p-3 text-[10px] leading-5" style={{ background: 'rgba(198,165,90,0.06)', border: '1px solid rgba(198,165,90,0.15)', color: 'rgba(243,240,234,0.5)' }}>
                Submissions remain private. Harbourview reviews all listings before any routing or visibility is granted.
              </div>

              {state.status === 'error' && (
                <p className="text-[11px]" style={{ color: 'rgba(248,113,113,0.85)' }}>{state.message}</p>
              )}

              <div className="mt-1 flex gap-2">
                <button type="submit" disabled={state.status === 'submitting'} className="flex-1 rounded-xl py-2.5 text-center text-[12px] transition-all disabled:opacity-60" style={{ border: '1px solid rgba(198,165,90,0.3)', background: 'rgba(198,165,90,0.1)', color: 'var(--hv-champagne-300)' }}>
                  {state.status === 'submitting' ? 'Submitting…' : 'Submit for review →'}
                </button>
                <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-[12px] transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(243,240,234,0.45)' }}>
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
