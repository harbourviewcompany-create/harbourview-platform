'use client'

import { useState } from 'react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

const listingTypes = [
  'New Product',
  'Used / Surplus Equipment',
  'Cannabis Inventory',
  'Wanted Request',
  'Service',
  'Business Opportunity',
  'Supplier Directory Listing',
]

export default function IntakeForm() {
  const [state, setState] = useState<FormState>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(data: FormData) {
    const errs: Record<string, string> = {}
    if (!data.get('name')) errs.name = 'Name is required.'
    if (!data.get('email')) errs.email = 'Email is required.'
    if (!data.get('listingType')) errs.listingType = 'Please select a listing type.'
    if (!data.get('title')) errs.title = 'Listing title is required.'
    if (!data.get('description')) errs.description = 'Description is required.'
    return errs
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const errs = validate(data)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setState('submitting')

    // Build a mailto link and open it — no backend required in v1
    const subject = encodeURIComponent(`Intake Submission: ${data.get('title')}`)
    const body = encodeURIComponent(
      [
        `Name: ${data.get('name')}`,
        `Email: ${data.get('email')}`,
        `Company: ${data.get('company') || 'N/A'}`,
        `Listing Type: ${data.get('listingType')}`,
        `Title: ${data.get('title')}`,
        `Price / Budget: ${data.get('price') || 'N/A'}`,
        `Location: ${data.get('location') || 'N/A'}`,
        '',
        'Description:',
        `${data.get('description')}`,
      ].join('\n')
    )
    window.location.href = `mailto:harbourviewcompany@gmail.com?subject=${subject}&body=${body}`
    setState('success')
  }

  if (state === 'success') {
    return (
      <div className="card p-8 text-center">
        <p className="text-gold text-4xl mb-4">✓</p>
        <h2 className="text-navy font-bold text-xl mb-2">Submission Prepared</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your email client has been opened with your listing details pre-filled.
          Send the email to complete your submission. We review all listings before
          publication.
        </p>
        <button
          onClick={() => setState('idle')}
          className="btn-outline text-sm"
        >
          Submit another listing
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="card p-6 space-y-5">
        <h2 className="text-navy font-semibold text-lg border-b pb-3">
          Contact Details
        </h2>

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
      </div>

      <div className="card p-6 space-y-5">
        <h2 className="text-navy font-semibold text-lg border-b pb-3">
          Listing Details
        </h2>

        <div>
          <label htmlFor="listingType" className="block text-sm font-medium text-gray-700 mb-1">
            Listing Type <span className="text-red-500">*</span>
          </label>
          <select
            id="listingType"
            name="listingType"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white"
          >
            <option value="">— Select a type —</option>
            {listingTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.listingType && <p className="text-red-500 text-xs mt-1">{errors.listingType}</p>}
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Listing Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="e.g. 10L CO₂ Extraction System — Used"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Asking Price / Budget
            </label>
            <input
              id="price"
              name="price"
              type="text"
              placeholder="e.g. $25,000 or POA"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="e.g. Denver, CO"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            placeholder="Provide a clear description of what you are listing, its condition, and any relevant specifications."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Submissions are reviewed before publication. We will contact you if we need
        additional information.
      </p>

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="btn-primary w-full py-3 text-base disabled:opacity-60"
      >
        {state === 'submitting' ? 'Preparing…' : 'Submit Listing'}
      </button>
    </form>
  )
}
