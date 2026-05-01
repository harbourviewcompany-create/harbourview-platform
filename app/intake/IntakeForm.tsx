'use client'

import { useState } from 'react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'
type ApiResponse = { status?: 'success' | 'error'; message?: string }

const listingTypes = [
  'New Product',
  'Used / Surplus Equipment',
  'Cannabis Inventory',
  'Wanted Request',
  'Service',
  'Business Opportunity',
  'Supplier Directory Listing',
]

const initialMessage = ''

export default function IntakeForm() {
  const [state, setState] = useState<FormState>('idle')
  const [message, setMessage] = useState(initialMessage)
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

  function formDataToPayload(data: FormData) {
    return Object.fromEntries(
      Array.from(data.entries()).map(([key, value]) => [key, typeof value === 'string' ? value : ''])
    )
  }

  async function readApiResponse(response: Response): Promise<ApiResponse> {
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      return (await response.json()) as ApiResponse
    }

    const text = await response.text()
    return {
      status: 'error',
      message: `Listing submission returned a non-JSON response (${response.status}). ${text.slice(0, 120)} [LISTING_SUBMISSION_NON_JSON_RESPONSE]`,
    }
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

    try {
      const response = await fetch('/api/marketplace/listing-submission', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataToPayload(data)),
      })
      const result = await readApiResponse(response)

      if (result.status === 'success') {
        setState('success')
        setMessage(result.message || 'Listing submission received. [LISTING_SUBMISSION_OK]')
        form.reset()
        return
      }

      setState('error')
      setMessage(
        result.message ||
          `Listing submission could not be completed. API status: ${response.status}. [LISTING_SUBMISSION_API_EMPTY_RESPONSE]`
      )
    } catch (error) {
      const detail = error instanceof Error ? error.name : 'UnknownError'
      setState('error')
      setMessage(
        `Listing submission could not be completed before receiving an API response. ${detail}. [LISTING_SUBMISSION_NETWORK_ERROR]`
      )
    }
  }

  if (state === 'success') {
    return (
      <div className="card p-8 text-center">
        <p className="text-gold text-4xl mb-4">✓</p>
        <h2 className="text-navy font-bold text-xl mb-2">Submission Received</h2>
        <p data-testid="listing-submission-diagnostic-message" className="text-gray-500 text-sm mb-6">
          {message}
        </p>
        <button
          onClick={() => {
            setState('idle')
            setMessage('')
          }}
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

      {state === 'error' && (
        <p data-testid="listing-submission-diagnostic-message" className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="btn-primary w-full py-3 text-base disabled:opacity-60"
      >
        {state === 'submitting' ? 'Submitting…' : 'Submit Listing'}
      </button>
    </form>
  )
}
