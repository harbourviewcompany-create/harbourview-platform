'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { contactSchema, type ContactFormData } from '@/lib/validation'
import { trackEvent } from '@/lib/analytics'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(198,165,90,0.25)',
  borderRadius: '2px',
  color: '#F5F1E8',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '15px',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '13px',
  fontWeight: 500,
  color: '#C9C2B3',
  marginBottom: '6px',
}

const fieldStyle: React.CSSProperties = { marginBottom: '20px' }

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p role="alert" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: '#e88', marginTop: '5px' }}>{message}</p>
}

export function ContactForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // eslint-disable-next-line react-hooks/purity
  const renderTimestampRef = useRef<number>(Date.now())

  const { register, handleSubmit, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    setSubmitting(true)
    setServerError(null)
    trackEvent('contact_form_submit')

    try {
      const payload = { ...data, _ts: renderTimestampRef.current }
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        const msg = json?.error || 'Submission failed. Please try again.'
        setServerError(msg)
        trackEvent('form_error', { form: 'contact', error: msg })
        setSubmitting(false)
        return
      }

      router.push('/thank-you?type=contact')
    } catch {
      const msg = 'A network error occurred. Please try again.'
      setServerError(msg)
      setSubmitting(false)
    }
  }

  return (
    // eslint-disable-next-line react-hooks/refs
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ position: 'relative' }}>
      {/* Honeypot */}
      <div className="hp-field" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" {...register('_hp')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 24px' }}>
        <div style={fieldStyle}>
          <label htmlFor="c-name" style={labelStyle}>Full Name <span style={{ color: '#C6A55A' }}>*</span></label>
          <input id="c-name" type="text" autoComplete="name" style={inputStyle} {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="c-email" style={labelStyle}>Email Address <span style={{ color: '#C6A55A' }}>*</span></label>
          <input id="c-email" type="email" autoComplete="email" style={inputStyle} {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="c-company" style={labelStyle}>Company <span style={{ color: '#C6A55A' }}>*</span></label>
          <input id="c-company" type="text" autoComplete="organization" style={inputStyle} {...register('company')} />
          <FieldError message={errors.company?.message} />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="c-phone" style={labelStyle}>Phone</label>
          <input id="c-phone" type="tel" autoComplete="tel" style={inputStyle} {...register('phone')} />
        </div>
      </div>

      <div style={fieldStyle}>
        <label htmlFor="c-message" style={labelStyle}>Message <span style={{ color: '#C6A55A' }}>*</span></label>
        <textarea
          id="c-message"
          rows={5}
          placeholder="Describe your inquiry…"
          style={{ ...inputStyle, resize: 'vertical' }}
          {...register('message')}
        />
        <FieldError message={errors.message?.message} />
      </div>

      {serverError && (
        <div role="alert" style={{ padding: '14px 18px', backgroundColor: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.3)', borderRadius: '2px', marginBottom: '20px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', color: '#e88' }}>
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{ padding: '15px 32px', backgroundColor: submitting ? 'rgba(198,165,90,0.5)' : '#C6A55A', color: '#0B1A2F', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '15px', fontWeight: 600, letterSpacing: '0.04em', border: 'none', borderRadius: '2px', cursor: submitting ? 'not-allowed' : 'pointer', minWidth: '200px' }}
      >
        {submitting ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
