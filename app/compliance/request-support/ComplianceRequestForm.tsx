'use client'

import { useRef, useState, useTransition } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'

type FormState = { status: 'idle' | 'success' | 'error'; message: string }

const labelClass = 'mb-2 block text-sm font-semibold text-[#f4f1eb]'
const fieldClass =
  'w-full rounded-sm border border-gold/14 bg-[#020814] px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/32 focus:border-gold/55 focus:ring-2 focus:ring-gold/15'
const errorClass = 'mt-1 text-xs text-red-300'

const supportTypes = [
  'GMP / GACP / GDP Readiness',
  'Import & Export Documentation Review',
  'Supplier Qualification',
  'Regulatory Pathway Assessment',
  'Quality System Gap Analysis',
  'Pharmacovigilance & Safety',
  'General Compliance Enquiry',
]

function buildMessage(fields: {
  supportType: string
  targetCountries: string
  details: string
}) {
  return [
    'Harbourview compliance support request',
    '',
    `Support type: ${fields.supportType || 'General Compliance Enquiry'}`,
    `Target countries: ${fields.targetCountries || 'Not specified'}`,
    '',
    'Details:',
    fields.details,
    '',
    'Harbourview action requested:',
    'Review the compliance support request, assess specialist routing and determine appropriate handling.',
  ].join('\n')
}

export default function ComplianceRequestForm() {
  const [state, setState] = useState<FormState>({ status: 'idle', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function validate(data: FormData) {
    const errs: Record<string, string> = {}
    if (!data.get('name')?.toString().trim()) errs.name = 'Name is required.'
    if (!data.get('email')?.toString().trim()) errs.email = 'Email is required.'
    if (!data.get('details')?.toString().trim()) errs.details = 'Please describe the support you need.'
    return errs
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const errs = validate(data)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})

    const name = data.get('name')!.toString().trim()
    const email = data.get('email')!.toString().trim().toLowerCase()
    const company = data.get('company')?.toString().trim() || null
    const supportType = data.get('supportType')?.toString().trim() || ''
    const targetCountries = data.get('targetCountries')?.toString().trim() || ''
    const details = data.get('details')!.toString().trim()

    startTransition(async () => {
      const result = await submitMarketplaceInquiryDirect(
        {
          listing_id: null,
          buyer_request_id: null,
          contact_name: name,
          contact_email: email,
          contact_company: company,
          contact_phone: null,
          inquiry_type: 'compliance_support',
          message: buildMessage({ supportType, targetCountries, details }),
          },
        'Request received. Harbourview will review your compliance support request before follow-up.',
        'CONTACT',
      )
      setState({ status: result.ok ? 'success' : 'error', message: result.message })
      if (result.ok) formRef.current?.reset()
    })
  }

  if (state.status === 'success') {
    return (
      <div className="rounded-sm border border-gold/10 bg-[#071425] p-8 text-center sm:p-10">
        <p className="mb-4 text-4xl text-gold">&#10003;</p>
        <h2 className="mb-2 text-xl font-bold text-white">Request Received</h2>
        <p className="mx-auto max-w-md text-sm leading-7 text-white/58">{state.message}</p>
        <button
          onClick={() => setState({ status: 'idle', message: '' })}
          className="mt-6 rounded-full border border-gold/40 px-5 py-2 text-sm font-semibold text-gold hover:bg-gold hover:text-navy transition-colors"
        >
          Submit another request
        </button>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="rounded-sm border border-gold/10 bg-[#071425] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.26)] sm:p-7 space-y-5">
      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <input name="hp" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="cr-name">Name <span className="text-red-400">*</span></label>
          <input id="cr-name" name="name" type="text" autoComplete="name" className={fieldClass} placeholder="Your name" />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="cr-email">Email <span className="text-red-400">*</span></label>
          <input id="cr-email" name="email" type="email" autoComplete="email" className={fieldClass} placeholder="you@company.com" />
          {errors.email && <p className={errorClass}>{errors.email}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="cr-company">Company</label>
          <input id="cr-company" name="company" type="text" autoComplete="organization" className={fieldClass} placeholder="Organisation (optional)" />
        </div>
        <div>
          <label className={labelClass} htmlFor="cr-countries">Target Countries</label>
          <input id="cr-countries" name="targetCountries" type="text" className={fieldClass} placeholder="e.g. Germany, UK, Portugal" />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="cr-type">Support Needed</label>
        <select id="cr-type" name="supportType" className={fieldClass}>
          <option value="">Select a category</option>
          {supportTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="cr-details">Details <span className="text-red-400">*</span></label>
        <textarea
          id="cr-details"
          name="details"
          rows={5}
          className={fieldClass}
          placeholder="Describe the compliance support you need. Include context about your role, product category, and applicable markets where relevant."
        />
        {errors.details && <p className={errorClass}>{errors.details}</p>}
      </div>

      {state.status === 'error' && (
        <p className="rounded bg-red-900/30 px-4 py-3 text-sm text-red-300">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-[#d6b76d] disabled:opacity-50"
      >
        {isPending ? 'Submitting…' : 'Submit Compliance Support Request'}
      </button>
    </form>
  )
}
