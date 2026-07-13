'use client'

import { useEffect, useRef, useState } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'
import { createClient } from '@/lib/supabase/client'

interface Props {
  open: boolean
  onClose: () => void
  profileName?: string
}

type State = { status: 'idle' | 'submitting' | 'success' | 'error'; message: string }

function buildMessage(f: Record<string, string>) {
  return [
    'Genetics access request (Command Centre)',
    '',
    `Applicant: ${f.name}`,
    `Company: ${f.company || 'N/A'}`,
    `Country: ${f.country || 'N/A'}`,
    `Operator type: ${f.operatorType || 'N/A'}`,
    `Licence status: ${f.licenceStatus || 'N/A'}`,
    `Target market: ${f.targetMarket || 'N/A'}`,
    `Timeline: ${f.timeline || 'N/A'}`,
    '',
    `Profile or drop of interest: ${f.profileOfInterest || 'N/A'}`,
    '',
    'Request detail:',
    f.requestDetail || 'N/A',
    '',
    'Confidentiality notes:',
    f.confidentialityNotes || 'N/A',
  ].join('\n')
}

function inp(extra?: string) {
  return `w-full rounded-lg px-3 py-2 text-[12px] outline-none resize-none${extra ? ` ${extra}` : ''}`
}

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--hv-text-primary)',
}

export function GeneticsRequestModal({ open, onClose, profileName }: Props) {
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
    if (!name || !emailVal) {
      setState({ status: 'error', message: 'Name and email are required.' })
      return
    }

    const fields = {
      name, company: g('company'), country: g('country'),
      operatorType: g('operatorType'), licenceStatus: g('licenceStatus'),
      targetMarket: g('targetMarket'), timeline: g('timeline'),
      profileOfInterest: g('profileOfInterest'),
      requestDetail: g('requestDetail'), confidentialityNotes: g('confidentialityNotes'),
    }

    setState({ status: 'submitting', message: '' })
    submitMarketplaceInquiryDirect(
      {
        listing_id: null, buyer_request_id: null,
        contact_name: name,
        contact_email: emailVal.toLowerCase(),
        contact_company: fields.company || null,
        contact_phone: null,
        inquiry_type: 'genetics_access_request',
        message: buildMessage(fields),
      },
      'Access request received. Harbourview will review it before any genetics holder is contacted.',
      'GENETICS',
    ).then(result => {
      setState({ status: result.ok ? 'success' : 'error', message: result.message })
      if (result.ok) {
        fetch('/api/genetics/access-request', {
          method: 'POST', cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company: fields.company, email: emailVal, country: fields.country, operatorType: fields.operatorType, licenceStatus: fields.licenceStatus, targetMarket: fields.targetMarket, timeline: fields.timeline, profileOfInterest: fields.profileOfInterest, requestDetail: fields.requestDetail }),
        }).catch(() => {})
      }
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
          <p className="mb-1 text-[9px] uppercase tracking-[0.18em]" style={{ color: 'var(--hv-champagne-400)' }}>Genetics · Private access request</p>
          <h2 className="font-serif text-[22px] leading-tight" style={{ color: 'var(--hv-text-primary)' }}>
            {profileName ? `Request access — ${profileName}` : 'Request genetics access'}
          </h2>
        </div>

        <div className="p-5">
          {state.status === 'success' ? (
            <div className="rounded-xl p-5 text-center text-[12px]" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: 'rgba(187,247,208,0.9)' }}>
              {state.message}
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
              <p className="text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>Applicant</p>
              <div className="grid grid-cols-2 gap-2">
                <input name="name" className={inp()} style={inputStyle} placeholder="Full name *" />
                <input name="email" type="email" className={inp()} style={inputStyle} placeholder="Email *" defaultValue={email} key={email} />
                <input name="company" className={inp()} style={inputStyle} placeholder="Company" />
                <input name="country" className={inp()} style={inputStyle} placeholder="Country" />
              </div>

              <p className="mt-1 text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>Commercial context</p>
              <div className="grid grid-cols-2 gap-2">
                <select name="operatorType" className={inp()} style={inputStyle}>
                  <option value="">Operator type</option>
                  <option>Licensed producer</option>
                  <option>Importer / distributor</option>
                  <option>Tissue-culture lab</option>
                  <option>Research organization</option>
                  <option>Brand / commercialization partner</option>
                </select>
                <select name="licenceStatus" className={inp()} style={inputStyle}>
                  <option value="">Licence status</option>
                  <option>Licensed</option>
                  <option>Licence pending</option>
                  <option>Research / institutional status</option>
                  <option>Exploratory only</option>
                </select>
                <input name="targetMarket" className={inp()} style={inputStyle} placeholder="Target market" />
                <input name="timeline" className={inp()} style={inputStyle} placeholder="Timeline" />
              </div>

              <p className="mt-1 text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--hv-champagne-400)' }}>Request detail</p>
              <input name="profileOfInterest" className={inp()} style={inputStyle} placeholder="Profile or drop of interest" defaultValue={profileName ?? ''} />
              <textarea name="requestDetail" rows={3} className={inp()} style={inputStyle} placeholder="Intended use, scale, and commercial pathway…" />
              <textarea name="confidentialityNotes" rows={2} className={inp()} style={inputStyle} placeholder="Confidentiality notes Harbourview should observe…" />

              {state.status === 'error' && (
                <p className="text-[11px]" style={{ color: 'rgba(248,113,113,0.85)' }}>{state.message}</p>
              )}

              <div className="mt-1 flex gap-2">
                <button type="submit" disabled={state.status === 'submitting'} className="flex-1 rounded-xl py-2.5 text-center text-[12px] transition-all disabled:opacity-60" style={{ border: '1px solid rgba(198,165,90,0.3)', background: 'rgba(198,165,90,0.1)', color: 'var(--hv-champagne-300)' }}>
                  {state.status === 'submitting' ? 'Submitting…' : 'Submit for Harbourview review →'}
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
