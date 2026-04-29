'use client'

import { useState } from 'react'
import Link from 'next/link'
import { WhatHappensNext } from '@/components/WhatHappensNext'
import { BUYER_TYPES, REGIONS } from '@/lib/marketplace/categories'

const GOLD = '#C6A55A'
const MUTED = '#C9C2B3'

const wantedNextSteps = [
  {
    title: 'Harbourview reviews the request',
    body: 'The request is checked for product fit, region, volume, urgency, buyer type and whether the requirement can be described safely.',
  },
  {
    title: 'Buyer identity remains controlled',
    body: 'Your company and contact details are kept private unless Harbourview identifies a relevant supplier path and disclosure is appropriate.',
  },
  {
    title: 'The request guides sourcing conversations',
    body: 'If suitable, Harbourview can use the request to screen potential suppliers, surface relevant listings or clarify the requirement before moving further.',
  },
]

const labelStyle: React.CSSProperties = { display: 'block', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: GOLD, marginBottom: '6px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(198,165,90,0.2)', borderRadius: '2px', color: '#F5F1E8', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }

export default function SubmitWantedPage() {
  const [form, setForm] = useState({ product_type: '', region_interest: '', quantity_range: '', specs_requirements: '', buyer_type: '', legal_entity_name: '', contact_name: '', contact_email: '', contact_phone: '', private_notes: '', _hp: '', _ts: 0 })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }))

  const handleSubmit = async () => {
    setStatus('submitting'); setErrorMsg('')
    try {
      const res = await fetch('/api/marketplace/wanted', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, _ts: Date.now() }) })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data?.error || 'Submission failed.'); setStatus('error'); return }
      setStatus('success')
    } catch { setErrorMsg('Network error. Please try again.'); setStatus('error') }
  }

  if (status === 'success') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '64px 0' }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', color: GOLD, marginBottom: '16px' }}>Request Submitted</p>
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', color: MUTED, lineHeight: '1.7', marginBottom: '32px' }}>Your wanted request has been received and is pending Harbourview review. Harbourview will use the details provided to assess fit, clarify the requirement if needed and identify whether a relevant supplier path exists.</p>
        <Link href="/marketplace/wanted-requests" style={{ display: 'inline-block', padding: '10px 22px', backgroundColor: GOLD, color: '#0B1A2F', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', fontWeight: 600, textDecoration: 'none', borderRadius: '2px' }}>View Wanted Requests</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <Link href="/marketplace/wanted-requests" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: GOLD, textDecoration: 'none', opacity: 0.8 }}>← Wanted Requests</Link>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 600, color: '#F5F1E8', margin: '16px 0 8px' }}>Post a Wanted Request</h1>
      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', color: MUTED, lineHeight: '1.7', marginBottom: '32px' }}>
        Tell Harbourview what you are looking for. Your identity will only be disclosed to potential suppliers after Harbourview screening.
      </p>

      <WhatHappensNext
        title="Wanted requests become controlled sourcing signals."
        intro="The goal is to understand the requirement before exposing buyer identity or moving into supplier conversations."
        steps={wantedNextSteps}
      />

      <input type="text" value={form._hp} onChange={(e) => set('_hp', e.target.value)} style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={labelStyle}>What are you looking for? *</label>
          <input style={inputStyle} value={form.product_type} onChange={(e) => set('product_type', e.target.value)} placeholder="e.g. EU-GMP bulk flower, GMP extraction capacity" />
        </div>
        <div>
          <label style={labelStyle}>Target Region / Country *</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.region_interest} onChange={(e) => set('region_interest', e.target.value)}>
            <option value="">Select region</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Quantity / Volume Range</label>
          <input style={inputStyle} value={form.quantity_range} onChange={(e) => set('quantity_range', e.target.value)} placeholder="e.g. 50–200kg monthly, 1,000L per quarter" />
        </div>
        <div>
          <label style={labelStyle}>Specs or Requirements</label>
          <textarea style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} value={form.specs_requirements} onChange={(e) => set('specs_requirements', e.target.value)} placeholder="Certifications required, THC/CBD targets, formats, delivery terms, etc." />
        </div>
        <div>
          <label style={labelStyle}>Your Organization Type *</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.buyer_type} onChange={(e) => set('buyer_type', e.target.value)}>
            <option value="">Select type</option>
            {BUYER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ borderTop: '1px solid rgba(198,165,90,0.12)', paddingTop: '20px' }}>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: MUTED, opacity: 0.7, marginBottom: '16px' }}>Private — seen only by Harbourview, never shown publicly.</p>
        </div>
        <div><label style={labelStyle}>Legal Entity Name *</label><input style={inputStyle} value={form.legal_entity_name} onChange={(e) => set('legal_entity_name', e.target.value)} placeholder="Company registered name" /></div>
        <div><label style={labelStyle}>Contact Name *</label><input style={inputStyle} value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} /></div>
        <div><label style={labelStyle}>Contact Email *</label><input style={inputStyle} type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} /></div>
        <div><label style={labelStyle}>Contact Phone</label><input style={inputStyle} value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} /></div>
        <div>
          <label style={labelStyle}>Private Notes for Harbourview</label>
          <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.private_notes} onChange={(e) => set('private_notes', e.target.value)} placeholder="Budget range, urgency, preferred supplier profile, constraints" />
        </div>

        {errorMsg && <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#E07070' }}>{errorMsg}</p>}
        <button onClick={handleSubmit} disabled={status === 'submitting'} style={{ padding: '12px 28px', backgroundColor: GOLD, color: '#0B1A2F', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', fontWeight: 600, border: 'none', borderRadius: '2px', cursor: status === 'submitting' ? 'not-allowed' : 'pointer', opacity: status === 'submitting' ? 0.7 : 1 }}>
          {status === 'submitting' ? 'Submitting…' : 'Submit Wanted Request'}
        </button>
      </div>
    </div>
  )
}
