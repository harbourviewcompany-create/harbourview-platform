'use client'

import Link from 'next/link'
import { useState } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

type IntakeContext = { country: string; role: string; module: string } | null

const discussionTypes = [
  'Acquisition or Investment Opportunity',
  'Sell-Side Advisory',
  'Buy-Side Advisory',
  'Counterparty Introduction',
  'Strategic Partnership',
  'Market Intelligence Request',
  'General Enquiry',
]

const labelClass = 'mb-2 block text-sm font-semibold text-[#f4f1eb]'
const fieldClass =
  'w-full rounded-sm border border-gold/14 bg-[#020814] px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/32 focus:border-gold/55 focus:ring-2 focus:ring-gold/15'
const errorClass = 'mt-2 text-xs text-red-300'

function buildIntakeMessage(fields: {
  discussionType: string
  message: string
}) {
  return [
    'Harbourview confidential intake',
    '',
    `Purpose of Discussion: ${fields.discussionType || 'General Enquiry'}`,
    '',
    'Details:',
    fields.message,
  ].join('\n')
}

function defaultMessage(context: IntakeContext) {
  if (!context) return ''
  const parts = [`Requesting the \"${context.module}\" briefing`]
  if (context.country) parts.push(`for ${context.country}`)
  if (context.role) parts.push(`(${context.role})`)
  return `${parts.join(' ')}.\n\n`
}

export default function ConfidentialIntakeForm({
  initialContext = null,
}: {
  initialContext?: IntakeContext
}) {
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(data: FormData) {
    const errs: Record<string, string> = {}
    if (!data.get('name')) errs.name = 'Name is required.'
    if (!data.get('email')) errs.email = 'Email is required.'
    if (!data.get('message')) errs.message = 'Please describe the nature of your enquiry.'
    return errs
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const errs = validate(data)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setState('submitting')
    setErrorMessage('')

    const name = (data.get('name') as string).trim()
    const email = (data.get('email') as string).trim().toLowerCase()
    const company = ((data.get('company') as string) || '').trim() || null
    const discussionType = ((data.get('discussionType') as string) || '').trim()
    const message = (data.get('message') as string).trim()

    const result = await submitMarketplaceInquiryDirect(
      {
        listing_id: null,
        buyer_request_id: null,
        contact_name: name,
        contact_email: email,
        contact_company: company,
        contact_phone: null,
        inquiry_type: 'sourcing_mandate',
        message: buildIntakeMessage({ discussionType, message }),
      },
      'Confidential intake received. Harbourview will review it and respond directly. [CAPTURE_OK]',
      'CONFIDENTIAL_INTAKE'
    )

    if (result.ok) {
      setState('success')
      form.reset()
      return
    }

    setState('error')
    setErrorMessage(result.message)
  }

  if (state === 'success') {
    return (
      <div className="rounded-sm border border-gold/12 bg-[#020814] p-8 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-gold">Received</p>
        <h2 className="mb-2 font-serif text-2xl tracking-[-0.03em] text-[#f5f1e8]">Intake received</h2>
        <p className="text-sm leading-7 text-white/58">
          Your enquiry has been submitted securely to Harbourview. We review all
          intake requests and respond directly. All submissions are handled in
          confidence.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {initialContext && (
        <div className="rounded-sm border border-gold/20 bg-gold/[0.06] px-4 py-3 text-xs leading-6 text-gold/85">
          Carried over from Education: <strong>{initialContext.module}</strong>
          {initialContext.country ? ` · ${initialContext.country}` : ''}
          {initialContext.role ? ` · ${initialContext.role}` : ''}
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Full Name <span className="text-red-300">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            className={fieldClass}
          />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email Address <span className="text-red-300">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={fieldClass}
          />
          {errors.email && <p className={errorClass}>{errors.email}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="company" className={labelClass}>
          Company / Organisation
        </label>
        <input
          id="company"
          name="company"
          type="text"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="discussionType" className={labelClass}>
          Purpose of Discussion
        </label>
        <select
          id="discussionType"
          name="discussionType"
          defaultValue={initialContext ? 'Market Intelligence Request' : ''}
          className={fieldClass}
        >
          <option value="">Select if applicable</option>
          {discussionTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Details <span className="text-red-300">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          defaultValue={defaultMessage(initialContext)}
          placeholder="Describe the nature of your enquiry. All submissions are handled in confidence."
          className={`${fieldClass} resize-none`}
        />
        {errors.message && <p className={errorClass}>{errors.message}</p>}
      </div>

      <p className="text-xs leading-6 text-white/42">
        All submissions are reviewed and handled in confidence. We do not share
        intake details without explicit consent.
      </p>

      {state === 'error' && (
        <p className="rounded-sm border border-red-300/25 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-100">
          {errorMessage}{' '}
          <Link href="/contact" className="font-semibold underline">
            Contact Harbourview
          </Link>{' '}
          if the issue persists.
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="btn-marketplace w-full justify-center py-3 text-base disabled:opacity-60"
      >
        {state === 'submitting' ? 'Submitting...' : 'Submit Intake'}
      </button>
    </form>
  )
}
