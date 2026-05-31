'use client'

import { useRef, useState, useTransition } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'

type FormState = { status: 'idle' | 'success' | 'error'; message: string }

const labelClass = 'mb-2 block text-sm font-semibold text-[#f4f1eb]'
const fieldClass =
  'w-full rounded-sm border border-gold/14 bg-[#020814] px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/32 focus:border-gold/55 focus:ring-2 focus:ring-gold/15'
const errorClass = 'mt-1 text-xs text-red-300'

const professionalCategories = [
  'Physician / Specialist',
  'General Practitioner',
  'Pharmacist',
  'Nurse Practitioner / Advanced Practice Nurse',
  'Researcher / Academic',
  'Healthcare Administrator',
  'Regulatory Professional',
  'Other Healthcare Professional',
]

const formatInterests = [
  'Flower / Dried Herb',
  'Oil / Tincture',
  'Capsule / Softgel',
  'Topical',
  'Inhaler / Vaporiser',
  'Extract / Concentrate',
  'Other / Multiple',
]

function buildMessage(fields: {
  organization: string
  professionalCategory: string
  country: string
  topic: string
  countriesOfInterest: string
  formatsOfInterest: string
  details: string
}) {
  return [
    'Harbourview clinical education support request',
    '',
    `Organisation: ${fields.organization || 'Not provided'}`,
    `Professional category: ${fields.professionalCategory || 'Not specified'}`,
    `Country: ${fields.country || 'Not specified'}`,
    `Topic of interest: ${fields.topic || 'Not specified'}`,
    `Countries of interest: ${fields.countriesOfInterest || 'Not specified'}`,
    `Formats of interest: ${fields.formatsOfInterest || 'Not specified'}`,
    '',
    'Details:',
    fields.details,
    '',
    'Harbourview action requested:',
    'Review education request, assess professional category fit, and determine appropriate clinical education handling.',
  ].join('\n')
}

export default function ClinicalEducationRequestForm() {
  const [state, setState] = useState<FormState>({ status: 'idle', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function validate(data: FormData) {
    const errs: Record<string, string> = {}
    if (!data.get('name')?.toString().trim()) errs.name = 'Name is required.'
    if (!data.get('email')?.toString().trim()) errs.email = 'Email is required.'
    if (!data.get('topic')?.toString().trim()) errs.topic = 'Please specify a topic of interest.'
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
    const organization = data.get('organization')?.toString().trim() || ''
    const professionalCategory = data.get('professionalCategory')?.toString().trim() || ''
    const country = data.get('country')?.toString().trim() || ''
    const topic = data.get('topic')!.toString().trim()
    const countriesOfInterest = data.get('countriesOfInterest')?.toString().trim() || ''
    const formatsOfInterest = data.get('formatsOfInterest')?.toString().trim() || ''
    const details = data.get('details')?.toString().trim() || topic

    startTransition(async () => {
      const result = await submitMarketplaceInquiryDirect(
        {
          listing_id: null,
          buyer_request_id: null,
          contact_name: name,
          contact_email: email,
          contact_company: organization || null,
          contact_phone: null,
          inquiry_type: 'clinical_education_request',
          message: buildMessage({
            organization,
            professionalCategory,
            country,
            topic,
            countriesOfInterest,
            formatsOfInterest,
            details,
          }),
          status: 'received',
        },
        'Education request received. Harbourview will review your request and follow up with appropriate professional education.',
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
          <label className={labelClass} htmlFor="cer-name">Name <span className="text-red-400">*</span></label>
          <input id="cer-name" name="name" type="text" autoComplete="name" className={fieldClass} placeholder="Your name" />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="cer-email">Email <span className="text-red-400">*</span></label>
          <input id="cer-email" name="email" type="email" autoComplete="email" className={fieldClass} placeholder="you@organisation.com" />
          {errors.email && <p className={errorClass}>{errors.email}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="cer-org">Organisation</label>
          <input id="cer-org" name="organization" type="text" autoComplete="organization" className={fieldClass} placeholder="Hospital, clinic, university…" />
        </div>
        <div>
          <label className={labelClass} htmlFor="cer-country">Country</label>
          <input id="cer-country" name="country" type="text" className={fieldClass} placeholder="Your country" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="cer-category">Professional Category</label>
          <select id="cer-category" name="professionalCategory" className={fieldClass}>
            <option value="">Select category</option>
            {professionalCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="cer-formats">Formats of Interest</label>
          <select id="cer-formats" name="formatsOfInterest" className={fieldClass}>
            <option value="">Select format</option>
            {formatInterests.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="cer-topic">Topic of Interest <span className="text-red-400">*</span></label>
        <input
          id="cer-topic"
          name="topic"
          type="text"
          className={fieldClass}
          placeholder="e.g. Product format education, country readiness, dispensing protocols"
        />
        {errors.topic && <p className={errorClass}>{errors.topic}</p>}
      </div>

      <div>
        <label className={labelClass} htmlFor="cer-countries">Countries of Interest</label>
        <input id="cer-countries" name="countriesOfInterest" type="text" className={fieldClass} placeholder="e.g. Germany, UK, Australia" />
      </div>

      <div>
        <label className={labelClass} htmlFor="cer-details">Additional Details</label>
        <textarea
          id="cer-details"
          name="details"
          rows={4}
          className={fieldClass}
          placeholder="Any additional context about your education request, professional context or specific questions."
        />
      </div>

      {state.status === 'error' && (
        <p className="rounded bg-red-900/30 px-4 py-3 text-sm text-red-300">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-gold px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-[#d6b76d] disabled:opacity-50"
      >
        {isPending ? 'Submitting…' : 'Submit Education Request'}
      </button>
    </form>
  )
}
