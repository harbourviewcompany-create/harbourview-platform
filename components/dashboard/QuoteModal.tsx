'use client'

import { useEffect, useRef, useState } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'
import { createClient } from '@/lib/supabase/client'

interface Props {
  open: boolean
  onClose: () => void
  listingTitle?: string
  zIndex?: number
}

type State = { status: 'idle' | 'submitting' | 'success' | 'error'; message: string }

function buildMessage(f: Record<string, string>) {
  return [
    'Harbourview routed inquiry (Command Centre)',
    '',
    `Listing or category of interest: ${f.listingTitle || 'N/A'}`,
    `Buyer / participant type: ${f.buyerType}`,
    `Location / target market: ${f.targetMarket}`,
    `Quantity / order size: ${f.volume}`,
    `Timeline: ${f.timeline}`,
    `Budget / target price: ${f.budget || 'N/A'}`,
    `Intended use: ${f.intendedUse || 'N/A'}`,
    '',
    'Requirements or compliance notes:',
    f.requirements || 'N/A',
    '',
    'Harbourview action requested:',
    'Review inquiry, assess fit, and coordinate routed introduction or transaction follow-up where appropriate.',
  ].join('\n')
}

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--hv-text-primary)',
}

const selectStyle = {
  ...{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--hv-text-primary)' },
}

function inp() {
  return 'w-full rounded-lg px-3 py-2 text-[12px] outline-none resize-none'
}

export function QuoteModal({ open, onClose, listingTitle, zIndex = 200 }: Props) {
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
    const company = g('company')
    const buyerType = g('buyerType')
    const targetMarket = g('targetMarket')
    const volume = g('volume')
    const timeline = g('timeline')

    if (!name || !emailVal || !company || !buyerType || !targetMarket || !volume || !timeline) {
      setState({ status: 'error', message: 'Please fill all required fields.' })
      return
    }

    const fields = {
      listingTitle: listingTitle || g('listingTitle'),
      buyerType, targetMarket, volume, timeline,
      budget: g('budget'), intendedUse: g('intendedUse'), requirements: g('requirements'),
    }

    setState({ status: 'submitting', message: '' })
    submitMarketplaceInquiryDirect(
      {
        listing_id: null, buyer_request_id: null,
        contact_name: name,
        contact_email: emailVal.toLowerCase(),
        contact_company: company,
        contact_phone: g('phone') || null,
        inquiry_type: 'quote_routing',
        message: buildMessage(fields),
      },
      'Inquiry received. Harbourview will review it before coordinating any routed introduction or transaction follow-up.',
      'QUOTE',
    ).then(result => {
      setState({ status: result.ok ? 'success' : 'error', message: result.message })
    })
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: 'rgba(3,7,13,0.9)', zIndex }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-[620px] max-h-[680px] overflow-y-auto rounded-2xl mx-4"
        style={{ background: 'var(--hv-bg-900, #06101B)', border: '1px solid rgba(198,165,90,0.22)' }}
      >
        <div
          className="sticky top-0 px-5 py-5"
          style={{ background: 'var(--hv-bg-900)', borderBottom: '1px solid rgba(198,165,90,0.18)' }}
        >
          <button onClick={onClose} className="float-right text-lg transition-opacity hover:opacity-60" style={{ color: 'rgba(243,240,234,0.4)' }} aria-label="Close">✕</button>
          <p className="mb-1 text-[9px] uppercase tracking-[0.18em]" style={{ color: 'var(--hv-champagne-400)' }}>Marketplace · Routed inquiry</p>
          <h2 className="font-serif text-[22px] leading-tight" style={{ color: 'var(--hv-text-primary)' }}>
            {listingTitle ? `Request access — ${listingTitle}` : 'Submit a routed inquiry'}
          </h2>
        </div>

        <div className="p-5">
          {state.status === 'success' ? (
            <div className="rounded-xl p-5 text-center text-[12px]" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: 'rgba(187,247,208,0.9)' }}>
              {state.message}
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
              {!listingTitle && (
                <input name="listingTitle" className={inp()} style={inputStyle} placeholder="Listing or category of interest" />
              )}

              <p className="text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>What you need</p>
              <div className="grid grid-cols-2 gap-2">
                <select name="buyerType" className={inp()} style={selectStyle}>
                  <option value="">Participant type *</option>
                  <option>Licensed Producer / Operator</option>
                  <option>Supplier</option>
                  <option>Brand</option>
                  <option>Distributor</option>
                  <option>Retailer</option>
                  <option>Investor / Advisor</option>
                  <option>Startup / New Operator</option>
                  <option>Other</option>
                </select>
                <input name="targetMarket" className={inp()} style={inputStyle} placeholder="Location / target market *" />
                <input name="volume" className={inp()} style={inputStyle} placeholder="Quantity / order size *" />
                <select name="timeline" className={inp()} style={selectStyle}>
                  <option value="">Timeline *</option>
                  <option>ASAP</option>
                  <option>Within 30 days</option>
                  <option>30–90 days</option>
                  <option>Future planning</option>
                </select>
                <input name="budget" className={inp()} style={inputStyle} placeholder="Budget / target price" />
                <input name="intendedUse" className={inp()} style={inputStyle} placeholder="Intended use" />
              </div>
              <textarea name="requirements" rows={3} className={inp()} style={inputStyle} placeholder="Requirements, certifications, compliance notes…" />

              <p className="mt-1 text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>Your details</p>
              <div className="grid grid-cols-2 gap-2">
                <input name="name" className={inp()} style={inputStyle} placeholder="Full name *" />
                <input name="email" type="email" className={inp()} style={inputStyle} placeholder="Email *" defaultValue={email} key={email} />
                <input name="company" className={inp()} style={inputStyle} placeholder="Company *" />
                <input name="phone" className={inp()} style={inputStyle} placeholder="Phone" />
              </div>

              {state.status === 'error' && (
                <p className="text-[11px]" style={{ color: 'rgba(248,113,113,0.85)' }}>{state.message}</p>
              )}

              <div className="mt-1 flex gap-2">
                <button type="submit" disabled={state.status === 'submitting'} className="flex-1 rounded-xl py-2.5 text-center text-[12px] transition-all disabled:opacity-60" style={{ border: '1px solid rgba(198,165,90,0.3)', background: 'rgba(198,165,90,0.1)', color: 'var(--hv-champagne-300)' }}>
                  {state.status === 'submitting' ? 'Submitting…' : 'Submit routed inquiry →'}
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
