'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

type FormState = 'idle' | 'submitting' | 'success'

export default function QuoteRequestForm() {
  const searchParams = useSearchParams()
  const listingTitle = searchParams.get('listing') || ''
  const [state, setState] = useState<FormState>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(data: FormData) {
    const errs: Record<string, string> = {}
    if (!data.get('name')) errs.name = 'Name is required.'
    if (!data.get('email')) errs.email = 'Email is required.'
    if (!data.get('company')) errs.company = 'Company is required.'
    if (!data.get('buyerType')) errs.buyerType = 'Buyer type is required.'
    if (!data.get('targetMarket')) errs.targetMarket = 'Target market is required.'
    if (!data.get('volume')) errs.volume = 'Volume or expected order size is required.'
    if (!data.get('timeline')) errs.timeline = 'Timeline is required.'
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
    setState('submitting')

    const subject = encodeURIComponent(`Quote Request: ${data.get('listingTitle') || 'Consumables'}`)
    const body = encodeURIComponent(
      [
        'Harbourview quote request',
        '',
        `Listing: ${data.get('listingTitle') || 'N/A'}`,
        `Name: ${data.get('name')}`,
        `Email: ${data.get('email')}`,
        `Phone: ${data.get('phone') || 'N/A'}`,
        `Company: ${data.get('company')}`,
        `Buyer type: ${data.get('buyerType')}`,
        `Target market / jurisdiction: ${data.get('targetMarket')}`,
        `Volume / order size: ${data.get('volume')}`,
        `Timeline: ${data.get('timeline')}`,
        `Budget / price target: ${data.get('budget') || 'N/A'}`,
        `Supplier preference: ${data.get('supplierPreference') || 'N/A'}`,
        '',
        'Requirements:',
        `${data.get('requirements') || 'N/A'}`,
        '',
        'Harbourview action requested:',
        'Review buyer fit, verify supplier/source availability, and advise on quote or introduction path.',
      ].join('\n')
    )

    window.location.href = `mailto:harbourviewcompany@gmail.com?subject=${subject}&body=${body}`
    setState('success')
  }

  if (state === 'success') {
    return (
      <div className="card p-8 text-center">
        <p className="text-gold text-4xl mb-4">✓</p>
        <h2 className="text-navy font-bold text-xl mb-2">Quote Request Prepared</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your email client has opened with the request details pre-filled. Send the email to complete the quote request.
        </p>
        <button onClick={() => setState('idle')} className="btn-outline text-sm">
          Submit another request
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="card p-6 space-y-5">
        <h2 className="text-navy font-semibold text-lg border-b pb-3">Quote Details</h2>

        <div>
          <label htmlFor="listingTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Listing
          </label>
          <input
            id="listingTitle"
            name="listingTitle"
            type="text"
            defaultValue={listingTitle}
            placeholder="Consumables or specific product listing"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="volume" className="block text-sm font-medium text-gray-700 mb-1">
              Volume / Order Size <span className="text-red-500">*</span>
            </label>
            <input id="volume" name="volume" type="text" placeholder="e.g. 10,000 tubes monthly" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
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
              <option value="30-90 days">30-90 days</option>
              <option value="Future planning">Future planning</option>
            </select>
            {errors.timeline && <p className="text-red-500 text-xs mt-1">{errors.timeline}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">Budget / Price Target</label>
            <input id="budget" name="budget" type="text" placeholder="Optional" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
          </div>
          <div>
            <label htmlFor="supplierPreference" className="block text-sm font-medium text-gray-700 mb-1">Supplier Preference</label>
            <input id="supplierPreference" name="supplierPreference" type="text" placeholder="Canada, US, EU, lowest cost, etc." className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
          </div>
        </div>

        <div>
          <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
          <textarea id="requirements" name="requirements" rows={4} placeholder="Size, material, certification, branding, compliance or delivery requirements." className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none" />
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
            <label htmlFor="targetMarket" className="block text-sm font-medium text-gray-700 mb-1">Target Market <span className="text-red-500">*</span></label>
            <input id="targetMarket" name="targetMarket" type="text" placeholder="e.g. Canada, Germany, California" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            {errors.targetMarket && <p className="text-red-500 text-xs mt-1">{errors.targetMarket}</p>}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Harbourview reviews quote requests before supplier introduction. Product details, pricing, availability and supplier fit are confirmed before any commercial handoff.
      </p>

      <button type="submit" disabled={state === 'submitting'} className="btn-primary w-full py-3 text-base disabled:opacity-60">
        {state === 'submitting' ? 'Preparing…' : 'Request Quote'}
      </button>
    </form>
  )
}
