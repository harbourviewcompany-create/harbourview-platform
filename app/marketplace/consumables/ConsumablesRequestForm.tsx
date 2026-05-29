'use client'

import { useState } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

const productCategories = [
  'Pre-roll cones',
  'Pouches',
  'Jars',
  'Labels',
  'Boxes',
  'Closures',
  'Production tools',
  'Bulk sourcing program',
]

const labelClass = 'mb-2 block text-sm font-semibold text-[#f4f1eb]'
const fieldClass =
  'w-full rounded-sm border border-gold/15 bg-[#020814] px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-gold/50 focus:ring-2 focus:ring-gold/15'
const errorClass = 'mt-2 text-xs text-red-300'

function readFormString(data: FormData, key: string) {
  const value = data.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function buildConsumablesMessage(fields: {
  productCategory: string
  quantity: string
  targetMarket: string
  company: string
  phone: string
  details: string
}) {
  return [
    'Harbourview consumables request',
    '',
    `Product category: ${fields.productCategory}`,
    `Quantity / MOQ target: ${fields.quantity || 'N/A'}`,
    `Target market: ${fields.targetMarket || 'N/A'}`,
    `Company: ${fields.company || 'N/A'}`,
    `Phone: ${fields.phone || 'N/A'}`,
    '',
    'Request details:',
    fields.details || 'N/A',
    '',
    'Harbourview action requested:',
    'Review fit, clarify specifications, and route only if the request is commercially appropriate.',
  ].join('\n')
}

export default function ConsumablesRequestForm() {
  const [state, setState] = useState<FormState>('idle')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(data: FormData) {
    const errs: Record<string, string> = {}
    if (!readFormString(data, 'productCategory')) errs.productCategory = 'Product category is required.'
    if (!readFormString(data, 'name')) errs.name = 'Name is required.'
    if (!readFormString(data, 'email')) errs.email = 'Email is required.'
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
    const phone = readFormString(data, 'phone')
    const productCategory = readFormString(data, 'productCategory')
    const quantity = readFormString(data, 'quantity')
    const targetMarket = readFormString(data, 'targetMarket')
    const details = readFormString(data, 'details')

    const result = await submitMarketplaceInquiryDirect(
      {
        listing_id: null,
        buyer_request_id: null,
        contact_name: name,
        contact_email: email,
        contact_company: company || null,
        contact_phone: phone || null,
        inquiry_type: 'quote_request',
        message: buildConsumablesMessage({ productCategory, quantity, targetMarket, company, phone, details }),
        status: 'received',
      },
      'Consumables request received. Harbourview will review it before response or supplier routing. [CONSUMABLES_REQUEST_OK]',
      'QUOTE'
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
      <div className="rounded-sm border border-gold/15 bg-[#071425] p-8 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-gold">Received</p>
        <h2 className="mb-2 font-serif text-2xl tracking-[-0.03em] text-[#f5f1e8]">Consumables request received</h2>
        <p data-testid="consumables-request-diagnostic-message" className="text-sm leading-7 text-white/60">
          {message}
        </p>
        <button
          type="button"
          onClick={() => {
            setState('idle')
            setMessage('')
          }}
          className="btn-intelligence mt-6 text-sm"
        >
          Submit another request
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-sm border border-gold/10 bg-[#071425] p-6" noValidate>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/75">Buyer request intake</p>
      <h2 className="mb-3 font-serif text-3xl tracking-[-0.035em] text-[#f5f1e8]">Request consumables sourcing.</h2>
      <p className="mb-6 text-sm leading-7 text-white/60">
        Use this form for category, volume, target market and timing requirements. Harbourview reviews requests before response or routing.
      </p>

      <div className="space-y-5">
        <div>
          <label htmlFor="productCategory" className={labelClass}>
            Product category <span className="text-red-300">*</span>
          </label>
          <select id="productCategory" name="productCategory" className={fieldClass} defaultValue="">
            <option value="">Select category</option>
            {productCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          {errors.productCategory && <p className={errorClass}>{errors.productCategory}</p>}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="quantity" className={labelClass}>Quantity / MOQ target</label>
            <input id="quantity" name="quantity" className={fieldClass} placeholder="Example: 50,000 units" />
          </div>
          <div>
            <label htmlFor="targetMarket" className={labelClass}>Target market</label>
            <input id="targetMarket" name="targetMarket" className={fieldClass} placeholder="Example: Canada, Germany, UK" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelClass}>
              Buyer name <span className="text-red-300">*</span>
            </label>
            <input id="name" name="name" autoComplete="name" className={fieldClass} />
            {errors.name && <p className={errorClass}>{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email <span className="text-red-300">*</span>
            </label>
            <input id="email" name="email" type="email" autoComplete="email" className={fieldClass} />
            {errors.email && <p className={errorClass}>{errors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="company" className={labelClass}>Company / Organisation</label>
            <input id="company" name="company" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>Phone</label>
            <input id="phone" name="phone" className={fieldClass} />
          </div>
        </div>

        <div>
          <label htmlFor="details" className={labelClass}>Request details</label>
          <textarea
            id="details"
            name="details"
            rows={5}
            className={`${fieldClass} resize-none`}
            placeholder="Describe specs, timing, format, print requirements, documentation constraints, preferred materials and target price."
          />
        </div>

        <p className="text-xs leading-6 text-white/40">
          Public page submissions are captured through the controlled marketplace intake route. Contact details and request details are not public.
        </p>

        {state === 'error' && (
          <p data-testid="consumables-request-diagnostic-message" className="rounded-sm border border-red-300/25 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-100">
            {message}
          </p>
        )}

        <button type="submit" disabled={state === 'submitting'} className="btn-marketplace w-full justify-center py-3 text-base disabled:opacity-60">
          {state === 'submitting' ? 'Submitting...' : 'Prepare request'}
        </button>
      </div>
    </form>
  )
}
