'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Button,
  Field,
  FormErrorSummary,
  FormSection,
  SelectField,
  TextareaField,
} from '@/components/design-system/Institutional'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'

type FormErrors = Record<string, string>
type QuoteState = { status: 'idle' | 'success' | 'error'; message: string }

const initialState: QuoteState = { status: 'idle', message: '' }

function buildBuyerInquiryMessage(fields: {
  listingTitle: string
  buyerType: string
  targetMarket: string
  volume: string
  timeline: string
  budget: string
  intendedUse: string
  requirements: string
}) {
  return [
    'Harbourview routed inquiry',
    '',
    `Listing or category of interest: ${fields.listingTitle || 'N/A'}`,
    `Buyer / participant type: ${fields.buyerType}`,
    `Location / target market: ${fields.targetMarket}`,
    `Quantity / order size: ${fields.volume}`,
    `Timeline: ${fields.timeline}`,
    `Budget / target price: ${fields.budget || 'N/A'}`,
    `Intended use: ${fields.intendedUse || 'N/A'}`,
    '',
    'Requirements or compliance notes:',
    fields.requirements || 'N/A',
    '',
    'Harbourview action requested:',
    'Review inquiry, assess fit, and coordinate routed introduction or transaction follow-up where appropriate.',
  ].join('\n')
}

function readFormString(data: FormData, key: string) {
  const value = data.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export default function QuoteRequestForm() {
  const searchParams = useSearchParams()
  const listingTitle = searchParams.get('listing') || ''
  const [state, setState] = useState<QuoteState>(initialState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset()
      setErrors({})
    }
  }, [state.status])

  function validate(data: FormData) {
    const errs: FormErrors = {}
    if (!readFormString(data, 'name')) errs.name = 'Name is required.'
    if (!readFormString(data, 'email')) errs.email = 'Email is required.'
    if (!readFormString(data, 'company')) errs.company = 'Company is required.'
    if (!readFormString(data, 'buyerType')) errs.buyerType = 'Participant type is required.'
    if (!readFormString(data, 'targetMarket')) errs.targetMarket = 'Location or target market is required.'
    if (!readFormString(data, 'volume')) errs.volume = 'Quantity or order size is required.'
    if (!readFormString(data, 'timeline')) errs.timeline = 'Timeline is required.'
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

    startTransition(async () => {
      const listingTitleValue = readFormString(data, 'listingTitle')
      const name = readFormString(data, 'name')
      const email = readFormString(data, 'email').toLowerCase()
      const phone = readFormString(data, 'phone')
      const company = readFormString(data, 'company')
      const buyerType = readFormString(data, 'buyerType')
      const targetMarket = readFormString(data, 'targetMarket')
      const volume = readFormString(data, 'volume')
      const timeline = readFormString(data, 'timeline')
      const budget = readFormString(data, 'budget')
      const intendedUse = readFormString(data, 'intendedUse')
      const requirements = readFormString(data, 'requirements')

      const result = await submitMarketplaceInquiryDirect(
        {
          listing_id: null,
          buyer_request_id: null,
          contact_name: name,
          contact_email: email,
          contact_company: company,
          contact_phone: phone || null,
          inquiry_type: 'quote_routing',
          message: buildBuyerInquiryMessage({
            listingTitle: listingTitleValue,
            buyerType,
            targetMarket,
            volume,
            timeline,
            budget,
            intendedUse,
            requirements,
          }),
          status: 'received',
        },
        'Inquiry received. Harbourview will review it before coordinating any routed introduction or transaction follow-up. [QUOTE_OK]',
        'QUOTE'
      )

      setState({
        status: result.ok ? 'success' : 'error',
        message: result.message,
      })
    })
  }

  if (state.status === 'success') {
    return (
      <div className="rounded-[1.75rem] border border-[#d7caa9]/55 bg-[#fbf7ed] p-8 text-center text-[#061527]">
        <p className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#a9873c]/35 text-2xl text-[#8f7130]">✓</p>
        <h2 className="mt-5 font-serif text-2xl tracking-[-0.03em]">Inquiry received for review</h2>
        <p data-testid="quote-diagnostic-message" className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#435066]">{state.message}</p>
        <Button type="button" variant="secondary" className="mt-6 border-[#a9873c]/45 text-[#8f7130] hover:bg-[#c7a65c]/10" onClick={() => window.location.reload()}>
          Submit another inquiry
        </Button>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
      <FormErrorSummary errors={errors} />

      <FormSection
        eyebrow="Inquiry"
        title="Commercial routing context"
        note="Describe the public summary, category or demand brief of interest. Keep sensitive documents, raw evidence and private counterparty details out of this form unless requested later."
      >
        <Field id="listingTitle" name="listingTitle" type="text" defaultValue={listingTitle} label="Listing, request or category of interest" placeholder="Listing title, wanted request, supplier, country or category" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="volume" name="volume" type="text" label="Quantity / order size" required error={errors.volume} placeholder="e.g. 10,000 units, one lot, service scope" />
          <SelectField id="timeline" name="timeline" label="Timeline" required error={errors.timeline}>
            <option value="">Select timeline</option>
            <option value="ASAP">ASAP</option>
            <option value="Within 30 days">Within 30 days</option>
            <option value="30–90 days">30–90 days</option>
            <option value="Future planning">Future planning</option>
          </SelectField>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="budget" name="budget" type="text" label="Budget / target price" placeholder="Optional — share if comfortable" />
          <Field id="intendedUse" name="intendedUse" type="text" label="Intended use" placeholder="Licensed cultivation, processing, export, retail" />
        </div>
        <TextareaField id="requirements" name="requirements" rows={5} label="Requirements or compliance notes" placeholder="Specs, certifications, licence context, delivery, condition or documentation requirements." />
      </FormSection>

      <FormSection
        eyebrow="Participant"
        title="Qualified contact details"
        note="Contact details are not public. They are used to qualify the inquiry before any introduction or transaction follow-up."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="name" name="name" type="text" autoComplete="name" label="Full name" required error={errors.name} />
          <Field id="email" name="email" type="email" autoComplete="email" label="Email" required error={errors.email} />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="phone" name="phone" type="text" autoComplete="tel" label="Phone" />
          <Field id="company" name="company" type="text" label="Company" required error={errors.company} />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SelectField id="buyerType" name="buyerType" label="Participant type" required error={errors.buyerType}>
            <option value="">Select participant type</option>
            <option value="Licensed Producer / Operator">Licensed Producer / Operator</option>
            <option value="Supplier">Supplier</option>
            <option value="Brand">Brand</option>
            <option value="Distributor">Distributor</option>
            <option value="Retailer">Retailer</option>
            <option value="Investor / Advisor">Investor / Advisor</option>
            <option value="Startup / New Operator">Startup / New Operator</option>
            <option value="Other">Other</option>
          </SelectField>
          <Field id="targetMarket" name="targetMarket" type="text" label="Location / target market" required error={errors.targetMarket} placeholder="e.g. Canada, Germany, California" />
        </div>
      </FormSection>

      <p className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-xs leading-6 text-white/54">
        Contact details are not public. Harbourview reviews inquiries before routing. Submission does not guarantee introduction, availability, transaction terms or legal/regulatory outcome.
      </p>

      {state.status === 'error' ? (
        <p data-testid="quote-diagnostic-message" role="alert" className="rounded-2xl border border-[#9f2f2f]/30 bg-[#fff4f0] px-4 py-3 text-sm text-[#7f2626]">{state.message}</p>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-full disabled:opacity-60">
        {isPending ? 'Submitting…' : 'Submit Routed Inquiry'}
      </Button>
    </form>
  )
}
