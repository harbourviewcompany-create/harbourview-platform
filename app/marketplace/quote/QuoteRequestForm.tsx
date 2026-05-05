'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
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
    'Harbourview buyer inquiry',
    '',
    `Listing of interest: ${fields.listingTitle || 'N/A'}`,
    `Buyer type: ${fields.buyerType}`,
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
    'Review buyer inquiry, assess fit, and coordinate introduction or transaction follow-up where appropriate.',
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
    if (!readFormString(data, 'buyerType')) errs.buyerType = 'Buyer type is required.'
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
        'Buyer inquiry received. Harbourview will review it before coordinating an introduction or transaction follow-up. [QUOTE_OK]',
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
      <div className="card p-8 text-center">
        <p className="text-gold text-4xl mb-4">✓</p>
        <h2 className="text-navy font-bold text-xl mb-2">Buyer Inquiry Received</h2>
        <p data-testid="quote-diagnostic-message" className="text-gray-500 text-sm mb-6">{state.message}</p>
        <button onClick={() => window.location.reload()} className="btn-outline text-sm">
          Submit another inquiry
        </button>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="card p-6 space-y-5">
        <h2 className="text-navy font-semibold text-lg border-b pb-3">What are you looking to buy?</h2>

        <div>
          <label htmlFor="listingTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Listing of interest
          </label>
          <input
            id="listingTitle"
            name="listingTitle"
            type="text"
            defaultValue={listingTitle}
            placeholder="Listing title or category"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="volume" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity / Order Size <span className="text-red-500">*</span>
            </label>
            <input id="volume" name="volume" type="text" placeholder="e.g. 10,000 units or one lot" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            {errors.volume && <p className="text-red-500 text-xs mt-1">{errors.volume}</p>}
          </div>
          <div>
            <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-1">
              Timeline <span className="text-red-500">*</span>
            </label>
            <select id="timeline" name="timeline" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white">
              <option value="">Select timeline</option>
              <option value="ASAP">ASAP</option>
              <option value="Within 30 days">Within 30 days</option>
              <option value="30–90 days">30–90 days</option>
              <option value="Future planning">Future planning</option>
            </select>
            {errors.timeline && <p className="text-red-500 text-xs mt-1">{errors.timeline}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">Budget / Target Price</label>
            <input id="budget" name="budget" type="text" placeholder="Optional — share if comfortable" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
          </div>
          <div>
            <label htmlFor="intendedUse" className="block text-sm font-medium text-gray-700 mb-1">Intended Use</label>
            <input id="intendedUse" name="intendedUse" type="text" placeholder="e.g. licensed cultivation, processing, retail" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
          </div>
        </div>

        <div>
          <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">Requirements or compliance notes</label>
          <textarea id="requirements" name="requirements" rows={4} placeholder="Specs, certifications, compliance requirements, packaging, delivery or condition requirements." className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none" />
        </div>
      </div>

      <div className="card p-6 space-y-5">
        <h2 className="text-navy font-semibold text-lg border-b pb-3">Buyer Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <input id="name" name="name" type="text" autoComplete="name" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input id="email" name="email" type="email" autoComplete="email" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input id="phone" name="phone" type="text" autoComplete="tel" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
          </div>
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Company <span className="text-red-500">*</span></label>
            <input id="company" name="company" type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="buyerType" className="block text-sm font-medium text-gray-700 mb-1">Buyer Type <span className="text-red-500">*</span></label>
            <select id="buyerType" name="buyerType" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white">
              <option value="">Select buyer type</option>
              <option value="Licensed Producer / Operator">Licensed Producer / Operator</option>
              <option value="Brand">Brand</option>
              <option value="Distributor">Distributor</option>
              <option value="Retailer">Retailer</option>
              <option value="Startup / New Operator">Startup / New Operator</option>
              <option value="Other">Other</option>
            </select>
            {errors.buyerType && <p className="text-red-500 text-xs mt-1">{errors.buyerType}</p>}
          </div>
          <div>
            <label htmlFor="targetMarket" className="block text-sm font-medium text-gray-700 mb-1">Location / Target Market <span className="text-red-500">*</span></label>
            <input id="targetMarket" name="targetMarket" type="text" placeholder="e.g. Canada, Germany, California" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            {errors.targetMarket && <p className="text-red-500 text-xs mt-1">{errors.targetMarket}</p>}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Seller contact details are not public. Harbourview reviews buyer inquiries before coordinating introductions or transaction follow-up. Your contact details are kept confidential.
      </p>

      {state.status === 'error' && (
        <p data-testid="quote-diagnostic-message" className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full py-3 text-base disabled:opacity-60">
        {isPending ? 'Submitting…' : 'Submit Buyer Inquiry'}
      </button>
    </form>
  )
}
