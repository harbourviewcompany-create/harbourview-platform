'use client'

import { useEffect, useRef, useState } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'
import { createClient } from '@/lib/supabase/client'

interface Props {
  open: boolean
  onClose: () => void
}

type State = { status: 'idle' | 'submitting' | 'success' | 'error'; message: string }

function buildMessage(f: Record<string, string>) {
  return [
    'Genetics program submission (Command Centre)',
    '',
    `Breeder / company: ${f.breeder}`,
    `Country: ${f.country || 'N/A'}`,
    `Email: ${f.email}`,
    `Website: ${f.website || 'N/A'}`,
    `Program type: ${f.programType || 'N/A'}`,
    `Target markets: ${f.targetMarkets || 'N/A'}`,
    '',
    'Program description:',
    f.programDescription || 'N/A',
    '',
    'Public disclosure preferences:',
    f.publicInfo || 'N/A',
    '',
    'Private / controlled information:',
    f.privateInfo || 'N/A',
    '',
    'Commercial context:',
    f.commercialContext || 'N/A',
  ].join('\n')
}

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--hv-text-primary)',
}

function inp() {
  return 'w-full rounded-lg px-3 py-2 text-[12px] outline-none resize-none'
}

export function GeneticsProgramModal({ open, onClose }: Props) {
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

    const breeder = g('breeder')
    const emailVal = g('email') || email
    if (!breeder || !emailVal) {
      setState({ status: 'error', message: 'Breeder/company name and email are required.' })
      return
    }

    const fields = {
      breeder, email: emailVal, country: g('country'), website: g('website'),
      programType: g('programType'), targetMarkets: g('targetMarkets'),
      programDescription: g('programDescription'), publicInfo: g('publicInfo'),
      privateInfo: g('privateInfo'), commercialContext: g('commercialContext'),
    }

    setState({ status: 'submitting', message: '' })
    submitMarketplaceInquiryDirect(
      {
        listing_id: null, buyer_request_id: null,
        contact_name: breeder,
        contact_email: emailVal.toLowerCase(),
        contact_company: null,
        contact_phone: null,
        inquiry_type: 'genetics_program_submission',
        message: buildMessage(fields),
      },
      'Program submission received. Harbourview will review materials before any profile or commercial pathway is made public.',
      'GENETICS',
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
          <p className="mb-1 text-[9px] uppercase tracking-[0.18em]" style={{ color: 'var(--hv-champagne-400)' }}>Genetics · Program onboarding</p>
          <h2 className="font-serif text-[22px] leading-tight" style={{ color: 'var(--hv-text-primary)' }}>
            Submit a genetics program
          </h2>
        </div>

        <div className="p-5">
          {state.status === 'success' ? (
            <div className="rounded-xl p-5 text-center text-[12px]" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: 'rgba(187,247,208,0.9)' }}>
              {state.message}
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
              <p className="text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>Program identity</p>
              <div className="grid grid-cols-2 gap-2">
                <input name="breeder" className={inp()} style={inputStyle} placeholder="Breeder / company / lab *" />
                <input name="country" className={inp()} style={inputStyle} placeholder="Country or region" />
                <input name="email" type="email" className={inp()} style={inputStyle} placeholder="Email *" defaultValue={email} key={email} />
                <input name="website" className={inp()} style={inputStyle} placeholder="Website or portfolio" />
              </div>

              <p className="mt-1 text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>Program structure</p>
              <div className="grid grid-cols-2 gap-2">
                <select name="programType" className={inp()} style={inputStyle}>
                  <option value="">Program type</option>
                  <option>Breeder profile</option>
                  <option>Seed company</option>
                  <option>Tissue-culture laboratory</option>
                  <option>Licensing opportunity</option>
                  <option>Research collaboration</option>
                </select>
                <input name="targetMarkets" className={inp()} style={inputStyle} placeholder="Target markets" />
              </div>
              <textarea name="programDescription" rows={3} className={inp()} style={inputStyle} placeholder="Program description, drops, partnerships, commercial positioning…" />

              <p className="mt-1 text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>Disclosure preferences</p>
              <textarea name="publicInfo" rows={2} className={inp()} style={inputStyle} placeholder="What can be shown publicly?" />
              <textarea name="privateInfo" rows={2} className={inp()} style={inputStyle} placeholder="What must remain private or controlled?" />

              <p className="mt-1 text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>Commercial context</p>
              <textarea name="commercialContext" rows={3} className={inp()} style={inputStyle} placeholder="Target operators, licensing goals, market-access objectives…" />

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
