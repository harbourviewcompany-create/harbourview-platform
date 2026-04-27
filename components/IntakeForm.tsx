'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { intakeSchema, type IntakeFormData } from '@/lib/validation'
import { VISITOR_TYPES, OBJECTIVES, PREFERRED_NEXT_STEPS } from '@/lib/constants'
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
  letterSpacing: '0.02em',
}

const errorStyle: React.CSSProperties = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '12px',
  color: '#e88',
  marginTop: '5px',
}

const fieldStyle: React.CSSProperties = {
  marginBottom: '20px',
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" style={errorStyle}>
      {message}
    </p>
  )
}

export function IntakeForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const formStartedRef = useRef(false)
  const renderTimestampRef = useRef<number>(Date.now())

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<IntakeFormData>({
    resolver: zodResolver(intakeSchema),
  })

  const visitorType = watch('visitorType')
  const preferredNextStep = watch('preferredNextStep')

  const handleFormFocus = () => {
    if (!formStartedRef.current) {
      formStartedRef.current = true
      trackEvent('form_start', { form: 'intake' })
    }
  }

  useEffect(() => {
    if (visitorType) {
      trackEvent('intake_type_selected', { type: visitorType })
    }
  }, [visitorType])

  useEffect(() => {
    if (preferredNextStep) {
      trackEvent('preferred_next_step_selected', { step: preferredNextStep })
    }
  }, [preferredNextStep])

  const onSubmit = async (data: IntakeFormData) => {
    setSubmitting(true)
    setServerError(null)
    trackEvent('form_submit', { form: 'intake' })

    try {
      const payload = {
        ...data,
        _ts: renderTimestampRef.current,
      }

      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        const msg = json?.error || 'Submission failed. Please try again.'
        setServerError(msg)
        trackEvent('form_error', { form: 'intake', error: msg })
        setSubmitting(false)
        return
      }

      router.push('/thank-you?type=intake')
    } catch {
      const msg = 'A network error occurred. Please try again.'
      setServerError(msg)
      trackEvent('form_error', { form: 'intake', error: msg })
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onFocus={handleFormFocus}
      noValidate
      style={{ position: 'relative' }}
    >
      {/* Honeypot */}
      <div className="hp-field" aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" {...register('_hp')} />
      </div>

      {/* Required fields grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 24px' }}>
        {/* Name */}
        <div style={fieldStyle}>
          <label htmlFor="name" style={labelStyle}>
            Full Name <span style={{ color: '#C6A55A' }}>*</span>
          </label>
          <input id="name" type="text" autoComplete="name" style={inputStyle} {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>

        {/* Email */}
        <div style={fieldStyle}>
          <label htmlFor="email" style={labelStyle}>
            Email Address <span style={{ color: '#C6A55A' }}>*</span>
          </label>
          <input id="email" type="email" autoComplete="email" style={inputStyle} {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>

        {/* Company */}
        <div style={fieldStyle}>
          <label htmlFor="company" style={labelStyle}>
            Company / Organization <span style={{ color: '#C6A55A' }}>*</span>
          </label>
          <input id="company" type="text" autoComplete="organization" style={inputStyle} {...register('company')} />
          <FieldError message={errors.company?.message} />
        </div>

        {/* Role */}
        <div style={fieldStyle}>
          <label htmlFor="role" style={labelStyle}>
            Your Role / Title <span style={{ color: '#C6A55A' }}>*</span>
          </label>
          <input id="role" type="text" autoComplete="organization-title" style={inputStyle} {...register('role')} />
          <FieldError message={errors.role?.message} />
        </div>

        {/* Visitor Type */}
        <div style={fieldStyle}>
          <label htmlFor="visitorType" style={labelStyle}>
            Organization Type <span style={{ color: '#C6A55A' }}>*</span>
          </label>
          <select
            id="visitorType"
            style={{ ...inputStyle, cursor: 'pointer' }}
            {...register('visitorType')}
          >
            <option value="">Select type…</option>
            {VISITOR_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <FieldError message={errors.visitorType?.message} />
        </div>

        {/* Objective */}
        <div style={fieldStyle}>
          <label htmlFor="objective" style={labelStyle}>
            Primary Objective <span style={{ color: '#C6A55A' }}>*</span>
          </label>
          <select
            id="objective"
            style={{ ...inputStyle, cursor: 'pointer' }}
            {...register('objective')}
          >
            <option value="">Select objective…</option>
            {OBJECTIVES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <FieldError message={errors.objective?.message} />
        </div>
      </div>

      {/* Target market - full width */}
      <div style={fieldStyle}>
        <label htmlFor="targetMarket" style={labelStyle}>
          Target Market or Region <span style={{ color: '#C6A55A' }}>*</span>
        </label>
        <input
          id="targetMarket"
          type="text"
          placeholder="e.g. Germany, EU, Southeast Asia, domestic Canada…"
          style={inputStyle}
          {...register('targetMarket')}
        />
        <FieldError message={errors.targetMarket?.message} />
      </div>

      {/* Preferred Next Step */}
      <div style={fieldStyle}>
        <label htmlFor="preferredNextStep" style={labelStyle}>
          Preferred Next Step <span style={{ color: '#C6A55A' }}>*</span>
        </label>
        <select
          id="preferredNextStep"
          style={{ ...inputStyle, cursor: 'pointer' }}
          {...register('preferredNextStep')}
        >
          <option value="">Select…</option>
          {PREFERRED_NEXT_STEPS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <FieldError message={errors.preferredNextStep?.message} />
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(198,165,90,0.15)', margin: '32px 0 28px' }} />
      <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '12px', color: '#C9C2B3', opacity: 0.7, margin: '0 0 28px' }}>
        Optional — share only what is relevant.
      </p>

      {/* Optional fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 24px' }}>
        <div style={fieldStyle}>
          <label htmlFor="phone" style={labelStyle}>Phone</label>
          <input id="phone" type="tel" autoComplete="tel" style={inputStyle} {...register('phone')} />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="website" style={labelStyle}>Website</label>
          <input id="website" type="url" autoComplete="url" placeholder="https://" style={inputStyle} {...register('website')} />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="linkedin" style={labelStyle}>LinkedIn</label>
          <input id="linkedin" type="text" placeholder="linkedin.com/in/…" style={inputStyle} {...register('linkedin')} />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="timeline" style={labelStyle}>Timeline</label>
          <input id="timeline" type="text" placeholder="e.g. Q3 2025, within 60 days…" style={inputStyle} {...register('timeline')} />
        </div>
      </div>

      <div style={fieldStyle}>
        <label htmlFor="notes" style={labelStyle}>Additional Notes</label>
        <textarea
          id="notes"
          rows={4}
          placeholder="Any additional context about your inquiry…"
          style={{ ...inputStyle, resize: 'vertical' }}
          {...register('notes')}
        />
      </div>

      {/* Server error */}
      {serverError && (
        <div
          role="alert"
          style={{
            padding: '14px 18px',
            backgroundColor: 'rgba(220,50,50,0.1)',
            border: '1px solid rgba(220,50,50,0.3)',
            borderRadius: '2px',
            marginBottom: '20px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
            color: '#e88',
          }}
        >
          {serverError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '15px 32px',
          backgroundColor: submitting ? 'rgba(198,165,90,0.5)' : '#C6A55A',
          color: '#0B1A2F',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '15px',
          fontWeight: 600,
          letterSpacing: '0.04em',
          border: 'none',
          borderRadius: '2px',
          cursor: submitting ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
          minWidth: '200px',
        }}
      >
        {submitting ? 'Submitting…' : 'Submit Inquiry'}
      </button>
    </form>
  )
}
