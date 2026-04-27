'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LISTING_CATEGORY_SLUGS, SELLER_TYPES, REGIONS, PRICE_RANGES } from '@/lib/marketplace/categories'

const GOLD = '#C6A55A'
const MUTED = '#C9C2B3'

const labelStyle: React.CSSProperties = { display: 'block', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: GOLD, marginBottom: '6px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(198,165,90,0.2)', borderRadius: '2px', color: '#F5F1E8', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }

export default function SubmitListingPage() {
  const [form, setForm] = useState({ category: '', product_type: '', region: '', price_range: '', specs_summary: '', seller_type: '', legal_entity_name: '', contact_name: '', contact_email: '', contact_phone: '', private_notes: '', _hp: '', _ts: 0 })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }))

  const handleSubmit = async () => {
    setStatus('submitting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/marketplace/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, _ts: Date.now() }) })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data?.error || 'Submission failed.'); setStatus('error'); return }
      setStatus('success')
    } catch { setErrorMsg('Network error. Please try again.'); setStatus('error') }
  }

  if (status === 'success') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '64px 0' }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', color: GOLD, marginBottom: '16px' }}>Listing Submitted</p>
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', color: MUTED, lineHeight: '1.7', marginBottom: '32px' }}>
          Your listing has been received and is pending Harbourview review. We will be in touch
          at the email you provided. Listings typically go live within 1–2 business days.
        </p>
        <Link href="/marketplace" style={{ display: 'inline-block', padding: '10px 22px', backgroundColor: GOLD, color: '#0B1A2F', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', fontWeight: 600, textDecoration: 'none', borderRadius: '2px' }}>Back to Marketplace</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <Link href="/marketplace" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: GOLD, textDecoration: 'none', opacity: 0.8 }}>← Marketplace</Link>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 600, color: '#F5F1E8', margin: '16px 0 8px' }}>Submit a Listing</h1>
      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', color: MUTED, lineHeight: '1.7', marginBottom: '32px' }}>
        All listings are reviewed by Harbourview before going live. Your contact details and legal entity name are never shown publicly.
      </p>

      <input type="text" value={form._hp} onChange={(e) => set('_hp', e.target.value)} style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={labelStyle}>Category *</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">Select category</option>
            {LISTING_CATEGORY_SLUGS.map((s) => <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Product / Service Type *</label>
          <input style={inputStyle} value={form.product_type} onChange={(e) => set('product_type', e.target.value)} placeholder="e.g. EU-GMP Bulk Flower, GMP Extraction Services" />
        </div>
        <div>
          <label style={labelStyle}>Region / Country of Origin *</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.region} onChange={(e) => set('region', e.target.value)}>
            <option value="">Select region</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Price Range</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.price_range} onChange={(e) => set('price_range', e.target.value)}>
            <option value="">Select (optional)</option>
            {PRICE_RANGES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Seller / Provider Type *</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.seller_type} onChange={(e) => set('seller_type', e.target.value)}>
            <option value="">Select type</option>
            {SELLER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>High-Level Specs or Description</label>
          <textarea style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} value={form.specs_summary} onChange={(e) => set('specs_summary', e.target.value)} placeholder="Key specs, certifications, volumes, or notes shown publicly (no identifying info)" />
        </div>

        <div style={{ borderTop: '1px solid rgba(198,165,90,0.12)', paddingTop: '20px' }}>
          <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: MUTED, opacity: 0.7, marginBottom: '16px' }}>
            The following fields are private — seen only by Harbourview, never shown publicly.
          </p>
        </div>

        <div>
          <label style={labelStyle}>Legal Entity Name *</label>
          <input style={inputStyle} value={form.legal_entity_name} onChange={(e) => set('legal_entity_name', e.target.value)} placeholder="Your company's registered name" />
        </div>
        <div>
          <label style={labelStyle}>Contact Name *</label>
          <input style={inputStyle} value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label style={labelStyle}>Contact Email *</label>
          <input style={inputStyle} type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} placeholder="you@company.com" />
        </div>
        <div>
          <label style={labelStyle}>Contact Phone</label>
          <input style={inputStyle} value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} placeholder="+1 613 000 0000" />
        </div>
        <div>
          <label style={labelStyle}>Private Notes for Harbourview</label>
          <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.private_notes} onChange={(e) => set('private_notes', e.target.value)} placeholder="Context, constraints, preferred buyer profile, exclusivities, etc." />
        </div>

        {errorMsg && <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#E07070' }}>{errorMsg}</p>}

        <button
          onClick={handleSubmit}
          disabled={status === 'submitting'}
          style={{ padding: '12px 28px', backgroundColor: GOLD, color: '#0B1A2F', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', fontWeight: 600, border: 'none', borderRadius: '2px', cursor: status === 'submitting' ? 'not-allowed' : 'pointer', opacity: status === 'submitting' ? 0.7 : 1 }}
        >
          {status === 'submitting' ? 'Submitting…' : 'Submit Listing for Review'}
        </button>
      </div>
    </div>
  )
}
