'use client'

import { useEffect, useRef, useState } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'
import { createClient } from '@/lib/supabase/client'

interface Props {
  open: boolean
  onClose: () => void
}

type State = { status: 'idle' | 'submitting' | 'success' | 'error'; message: string }

const PRODUCT_CATEGORIES = [
  'Pre-roll cones', 'Pouches', 'Jars', 'Labels',
  'Boxes', 'Closures', 'Production tools', 'Bulk sourcing program',
]

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--hv-text-primary)',
}

function inp() {
  return 'w-full rounded-lg px-3 py-2 text-[12px] outline-none resize-none'
}

function buildMessage(fields: {
  productCategory: string
  quantity: string
  targetMarket: string
  company: string
  phone: string
  details: string
}) {
  return [
    'Harbourview consumables request (Command Centre)',
    '',
    `Product category: ${fields.productCategory}`,
    `Quantity / MOQ target: ${fields.quantity || 'N/A'}`,
    `Target market: ${fields.targetMarket || 'N/A'}`,
    `Company: ${fields.company || 'N/A'}`,
    `Phone: ${fields.phone || 'N/A'}`,
    '',
    'Request details:',
    fields.details || 'N/A',
    '',
    'Harbourview action requested:',
    'Review fit, clarify specifications, and route only if commercially appropriate.',
  ].join('\n')
}

export function ConsumablesRequestModal({ open, onClose }: Props) {
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
    const productCategory = g('productCategory')

    if (!name || !emailVal || !productCategory) {
      setState({ status: 'error', message: 'Name, email and product category are required.' })
      return
    }

    const company = g('company')
    const phone = g('phone')
    const quantity = g('quantity')
    const targetMarket = g('targetMarket')
    const details = g('details')

    setState({ status: 'submitting', message: '' })
    submitMarketplaceInquiryDirect(
      {
        listing_id: null, buyer_request_id: null,
        contact_name: name,
        contact_email: emailVal.toLowerCase(),
        contact_company: company || null,
        contact_phone: phone || null,
        inquiry_type: 'quote_request',
        message: buildMessage({ productCategory, quantity, targetMarket, company, phone, details }),
      },
      'Consumables request received. Harbourview will review before response or supplier routing.',
      'QUOTE',
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
          <p className="mb-1 text-[9px] uppercase tracking-[0.18em]" style={{ color: 'var(--hv-champagne-400)' }}>Marketplace · Consumables sourcing</p>
          <h2 className="font-serif text-[22px] leading-tight" style={{ color: 'var(--hv-text-primary)' }}>
            Request consumables sourcing
          </h2>
        </div>

        <div className="p-5">
          {state.status === 'success' ? (
            <div className="rounded-xl p-5 text-center text-[12px]" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: 'rgba(187,247,208,0.9)' }}>
              {state.message}
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
              <p className="text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>What you need</p>
              <select name="productCategory" className={inp()} style={inputStyle}>
                <option value="">Product category *</option>
                {PRODUCT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input name="quantity" className={inp()} style={inputStyle} placeholder="Quantity / MOQ target" />
                <input name="targetMarket" className={inp()} style={inputStyle} placeholder="Target market" />
              </div>
              <textarea name="details" rows={4} className={inp()} style={inputStyle} placeholder="Specs, timing, format, print requirements, materials, target price…" />

              <p className="mt-1 text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>Your details</p>
              <div className="grid grid-cols-2 gap-2">
                <input name="name" className={inp()} style={inputStyle} placeholder="Full name *" />
                <input name="email" type="email" className={inp()} style={inputStyle} placeholder="Email *" defaultValue={email} key={email} />
                <input name="company" className={inp()} style={inputStyle} placeholder="Company" />
                <input name="phone" className={inp()} style={inputStyle} placeholder="Phone" />
              </div>

              <div className="rounded-lg p-3 text-[10px] leading-5" style={{ background: 'rgba(198,165,90,0.06)', border: '1px solid rgba(198,165,90,0.15)', color: 'rgba(243,240,234,0.5)' }}>
                Requests are reviewed by Harbourview before any response or supplier routing.
              </div>

              {state.status === 'error' && (
                <p className="text-[11px]" style={{ color: 'rgba(248,113,113,0.85)' }}>{state.message}</p>
              )}

              <div className="mt-1 flex gap-2">
                <button type="submit" disabled={state.status === 'submitting'} className="flex-1 rounded-xl py-2.5 text-center text-[12px] transition-all disabled:opacity-60" style={{ border: '1px solid rgba(198,165,90,0.3)', background: 'rgba(198,165,90,0.1)', color: 'var(--hv-champagne-300)' }}>
                  {state.status === 'submitting' ? 'Submitting…' : 'Prepare request →'}
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
