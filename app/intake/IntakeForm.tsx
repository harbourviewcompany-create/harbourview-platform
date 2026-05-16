'use client'

import { useState } from 'react'
import {
  Button,
  Field,
  FormErrorSummary,
  FormSection,
  SelectField,
  TextareaField,
} from '@/components/design-system/Institutional'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

type IntakeFormProps = {
  initialListingType?: string
  defaultListingType?: string
  submitLabel?: string
}

const listingTypes = [
  'New Product',
  'Used / Surplus Equipment',
  'Cannabis Inventory',
  'Wanted Request',
  'Service',
  'Business Opportunity',
  'Featured Network Opportunity',
]

const listingTypeAliases: Record<string, string> = {
  wanted: 'Wanted Request',
  listing: 'Featured Network Opportunity',
}

const initialMessage = ''

function readFormString(data: FormData, key: string) {
  const value = data.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function buildSubmissionMessage(fields: {
  listingType: string
  title: string
  price: string
  location: string
  description: string
}) {
  return [
    'Harbourview marketplace listing submission',
    '',
    `Listing type: ${fields.listingType}`,
    `Title: ${fields.title}`,
    `Price / budget: ${fields.price || 'N/A'}`,
    `Location: ${fields.location || 'N/A'}`,
    '',
    'Description:',
    fields.description,
    '',
    'Harbourview action requested:',
    'Review listing fit, verify required details, and determine whether the opportunity should be published, routed, or declined.',
  ].join('\n')
}

export default function IntakeForm({ initialListingType, defaultListingType: defaultListingTypeProp, submitLabel = 'Submit for Review' }: IntakeFormProps) {
  const [state, setState] = useState<FormState>('idle')
  const [message, setMessage] = useState(initialMessage)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const requestedType = defaultListingTypeProp || initialListingType || ''
  const normalizedRequestedType = listingTypeAliases[requestedType] || requestedType
  const defaultListingType = normalizedRequestedType && listingTypes.includes(normalizedRequestedType) ? normalizedRequestedType : ''
  const isWantedRequest = defaultListingType === 'Wanted Request'

  function validate(data: FormData) {
    const errs: Record<string, string> = {}
    if (!readFormString(data, 'name')) errs.name = 'Name is required.'
    if (!readFormString(data, 'email')) errs.email = 'Email is required.'
    if (!readFormString(data, 'listingType')) errs.listingType = 'Please select a submission type.'
    if (!readFormString(data, 'title')) errs.title = 'A short opportunity or request title is required.'
    if (!readFormString(data, 'description')) errs.description = 'A public-safe review summary is required.'
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
    setMessage('')

    const name = readFormString(data, 'name')
    const email = readFormString(data, 'email').toLowerCase()
    const company = readFormString(data, 'company')
    const listingType = readFormString(data, 'listingType')
    const title = readFormString(data, 'title')
    const price = readFormString(data, 'price')
    const location = readFormString(data, 'location')
    const description = readFormString(data, 'description')

    const result = await submitMarketplaceInquiryDirect(
      {
        listing_id: null,
        buyer_request_id: null,
        contact_name: name,
        contact_email: email,
        contact_company: company || null,
        contact_phone: null,
        inquiry_type: listingType === 'Wanted Request' ? 'wanted_request_submission' : 'listing_submission',
        message: buildSubmissionMessage({ listingType, title, price, location, description }),
        status: 'received',
      },
      'Listing submission received. Harbourview will review it before publication or counterparty routing. [LISTING_SUBMISSION_OK]',
      'LISTING_SUBMISSION'
    )

    if (result.ok) {
      setState('success')
      setMessage(result.message)
      form.reset()
      return
    }

    setState('error')
    setMessage(result.message)
  }

  if (state === 'success') {
    return (
      <div className="rounded-[1.75rem] border border-[#d7caa9]/55 bg-[#fbf7ed] p-8 text-center text-[#061527]">
        <p className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#a9873c]/35 text-2xl text-[#8f7130]">✓</p>
        <h2 className="mt-5 font-serif text-2xl tracking-[-0.03em]">Submission received for review</h2>
        <p data-testid="listing-submission-diagnostic-message" className="mt-3 text-sm leading-7 text-[#435066]">
          {message}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-6 border-[#a9873c]/45 text-[#8f7130] hover:bg-[#c7a65c]/10"
          onClick={() => {
            setState('idle')
            setMessage('')
          }}
        >
          Submit another request
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <FormErrorSummary errors={errors} />

      <FormSection
        eyebrow="Contact"
        title="Responsible contact"
        note="Contact details are used for review and follow-up. They are not displayed on public marketplace or intelligence routes."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="name" name="name" type="text" autoComplete="name" label="Full name" required error={errors.name} />
          <Field id="email" name="email" type="email" autoComplete="email" label="Email address" required error={errors.email} />
        </div>
        <Field id="company" name="company" type="text" label="Company / organisation" hint="Optional at first review, but useful for qualification." />
      </FormSection>

      <FormSection
        eyebrow="Opportunity"
        title="Public-safe review summary"
        note="Do not include highly sensitive counterparty details, raw source evidence, exclusivity terms or private documents in this public-route submission."
      >
        <SelectField id="listingType" name="listingType" defaultValue={defaultListingType} label="Submission type" required error={errors.listingType}>
          <option value="">— Select a type —</option>
          {listingTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </SelectField>

        <Field
          id="title"
          name="title"
          type="text"
          label={isWantedRequest ? 'Wanted request title' : 'Opportunity title'}
          required
          error={errors.title}
          placeholder={isWantedRequest ? 'e.g. Wanted: compliant packaging supplier for Canadian operator' : 'e.g. EU-GMP distribution pathway requiring review'}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="price" name="price" type="text" label="Asking price / budget" placeholder={isWantedRequest ? 'Budget range or private review' : 'Public-safe range or POA'} />
          <Field id="location" name="location" type="text" label="Market / location" placeholder="e.g. Germany, Canada, LATAM, multi-market" />
        </div>

        <TextareaField
          id="description"
          name="description"
          rows={6}
          label="Review summary"
          required
          error={errors.description}
          placeholder={isWantedRequest ? 'Describe the requirement, expected volume, timing, market, budget range and compliance constraints without exposing private counterparties.' : 'Summarize the opportunity, relevant market, commercial class, timing and what Harbourview should review before any public or counterparty routing.'}
        />
      </FormSection>

      {state === 'error' ? (
        <p data-testid="listing-submission-diagnostic-message" role="alert" className="rounded-2xl border border-[#9f2f2f]/30 bg-[#fff4f0] px-4 py-3 text-sm text-[#7f2626]">
          {message}
        </p>
      ) : null}

      <p className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs leading-6 text-white/54">
        Submissions are reviewed before publication or routing. Contact details, private evidence and sensitive commercial context are not public.
      </p>

      <Button type="submit" disabled={state === 'submitting'} className="w-full disabled:opacity-60">
        {state === 'submitting' ? 'Submitting…' : submitLabel}
      </Button>
    </form>
  )
}
