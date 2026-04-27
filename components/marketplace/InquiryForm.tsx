'use client'

import { useState } from 'react'
import { BUYER_TYPES } from '@/lib/marketplace/categories'

interface InquiryFormProps {
  listingId?: string
  buyerRequestId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const GOLD = '#C6A55A'
const MUTED = '#C9C2B3'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(198,165,90,0.2)',
  borderRadius: '2px',
  color: '#F5F1E8',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  color: GOLD,
  marginBottom: '6px',
}

export function InquiryForm({ listingId, buyerRequestId, onSuccess, onCancel }: InquiryFormProps) {
  const [form, setForm] = useState({
    inquirer_name: '',
    inquirer_email: '',
    inquirer_company: '',
    inquirer_type: '',
    message: '',
    _hp: '',
    _ts: 0,
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/marketplace/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          _ts: Date.now(),
          listing_id: listingId,
          buyer_request_id: buyerRequestId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data?.error || 'Submission failed. Please try again.')
        setStatus('error')
        return
      }

      setStatus('success')
      onSuccess?.()
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', color: GOLD, marginBottom: '12px' }}>
          Inquiry Received
        </p>
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', color: MUTED, lineHeight: '1.6' }}>
          Harbourview has received your inquiry. We will review it and respond to you directly.
          Counterparty details will only be shared following our screening process.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: MUTED, lineHeight: '1.6', margin: 0 }}>
        All inquiries are received by Harbourview first. Your details and counterparty details
        are not shared until Harbourview has reviewed both sides.
      </p>

      {/* Honeypot — hidden */}
      <input
        type="text"
        value={form._hp}
        onChange={(e) => handleChange('_hp', e.target.value)}
        style={{ display: 'none' }}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div>
        <label style={labelStyle}>Your Name *</label>
        <input style={inputStyle} value={form.inquirer_name} onChange={(e) => handleChange('inquirer_name', e.target.value)} placeholder="Full name" />
      </div>

      <div>
        <label style={labelStyle}>Email *</label>
        <input style={inputStyle} type="email" value={form.inquirer_email} onChange={(e) => handleChange('inquirer_email', e.target.value)} placeholder="you@company.com" />
      </div>

      <div>
        <label style={labelStyle}>Company</label>
        <input style={inputStyle} value={form.inquirer_company} onChange={(e) => handleChange('inquirer_company', e.target.value)} placeholder="Company name" />
      </div>

      <div>
        <label style={labelStyle}>Your Organization Type *</label>
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={form.inquirer_type}
          onChange={(e) => handleChange('inquirer_type', e.target.value)}
        >
          <option value="">Select type</option>
          {BUYER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Message *</label>
        <textarea
          style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
          value={form.message}
          onChange={(e) => handleChange('message', e.target.value)}
          placeholder="Brief description of your interest or requirement"
        />
      </div>

      {errorMsg && (
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', color: '#E07070', margin: 0 }}>
          {errorMsg}
        </p>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleSubmit}
          disabled={status === 'submitting'}
          style={{
            padding: '11px 24px',
            backgroundColor: GOLD,
            color: '#0B1A2F',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            borderRadius: '2px',
            cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
            opacity: status === 'submitting' ? 0.7 : 1,
          }}
        >
          {status === 'submitting' ? 'Submitting…' : 'Submit Inquiry'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{ padding: '11px 20px', backgroundColor: 'transparent', border: '1px solid rgba(198,165,90,0.25)', color: MUTED, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', cursor: 'pointer', borderRadius: '2px' }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
