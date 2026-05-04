'use client'

import { useState } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

const discussionTypes = [
  'Acquisition or Investment Opportunity',
  'Sell-Side Advisory',
  'Buy-Side Advisory',
  'Counterparty Introduction',
  'Strategic Partnership',
  'Market Intelligence Request',
  'General Enquiry',
]

function buildIntakeMessage(fields: {
  discussionType: string
  message: string
}) {
  return [
    'Harbourview confidential intake',
    '',
    `Nature of Discussion: ${fields.discussionType || 'General Enquiry'}`,
    '',
    'Details:',
    fields.message,
  ].join('\n')
}

export default function ConfidentialIntakeForm() {
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
        status: 'received',
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
      <div className="card p-8 text-center">
        <p className="text-gold text-4xl mb-4">✓</p>
        <h2 className="text-navy font-bold text-xl mb-2">Intake Received</h2>
        <p className="text-gray-500 text-sm">
          Your enquiry has been submitted securely to Harbourview. We review all
          intake requests and respond directly. All submissions are handled in
          confidence.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
          Company / Organisation
        </label>
        <input
          id="company"
          name="company"
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
        />
      </div>

      <div>
        <label htmlFor="discussionType" className="block text-sm font-medium text-gray-700 mb-1">
          Nature of Discussion
        </label>
        <select
          id="discussionType"
          name="discussionType"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white"
        >
          <option value="">— Select if applicable —</option>
          {discussionTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Details <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Describe the nature of your enquiry. All submissions are handled in confidence."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
        />
        {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
      </div>

      <p className="text-xs text-gray-400">
        All submissions are reviewed and handled in confidence. We do not share
        intake details without explicit consent.
      </p>

      {state === 'error' && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}{' '}
          <a
            href="mailto:harbourviewcompany@gmail.com"
            className="underline"
          >
            Contact Harbourview directly
          </a>{' '}
          if the issue persists.
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="btn-primary w-full py-3 text-base disabled:opacity-60"
      >
        {state === 'submitting' ? 'Submitting…' : 'Submit Intake'}
      </button>
    </form>
  )
}
