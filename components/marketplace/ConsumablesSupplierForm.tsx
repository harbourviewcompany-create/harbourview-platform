'use client'

import { useState, useTransition } from 'react'
import {
  SUPPLY_REGIONS,
  CONSUMABLES_CATEGORIES,
  CONSUMABLES_CERTIFICATIONS,
  CONSUMABLES_INCOTERMS,
} from '@/lib/marketplace/formOptions'

const PRODUCT_CATEGORIES = CONSUMABLES_CATEGORIES
const CERTIFICATIONS     = CONSUMABLES_CERTIFICATIONS
const REGIONS            = SUPPLY_REGIONS
const INCOTERMS          = CONSUMABLES_INCOTERMS

const inputClass =
  'mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] placeholder-white/25 outline-none ring-[#C6A55A]/40 focus:ring-2 text-sm'
const labelClass = 'block text-sm text-[#F5F1E8]/70'
const selectClass =
  'mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2 text-sm'

export function ConsumablesSupplierForm() {
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [certs, setCerts] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  function toggleCert(cert: string) {
    setCerts(prev =>
      prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert],
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const company = fd.get('company') as string
    const contactName = fd.get('contact_name') as string
    const contactEmail = fd.get('contact_email') as string
    const productCategory = fd.get('product_category') as string
    const description = fd.get('description') as string
    const moq = fd.get('moq') as string
    const leadTime = fd.get('lead_time') as string
    const incoterm = fd.get('incoterm') as string
    const country = fd.get('country') as string
    const region = fd.get('region') as string
    const markets = fd.get('target_markets') as string
    const priceRange = fd.get('price_range') as string

    const message = [
      `Product category: ${productCategory}`,
      `Description: ${description}`,
      `MOQ: ${moq || 'Not specified'}`,
      `Lead time: ${leadTime || 'Not specified'}`,
      `Incoterm: ${incoterm || 'Not specified'}`,
      `Origin country: ${country || 'Not specified'}`,
      `Target markets: ${markets || 'Not specified'}`,
      `Price range: ${priceRange || 'Not specified'}`,
      `Certifications: ${certs.length ? certs.join(', ') : 'None specified'}`,
    ].join('\n')

    startTransition(async () => {
      try {
        const res = await fetch('/api/marketplace/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contact_name: contactName,
            contact_email: contactEmail,
            contact_company: company,
            inquiry_type: 'listing_submission',
            message,
          }),
        })
        if (res.ok) {
          setDone(true)
        } else {
          setError('Submission failed. Please try again.')
        }
      } catch {
        setError('Network error. Please try again.')
      }
    })
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[#C6A55A]/30 bg-[#0B1A2F] p-8 text-center">
        <p className="mb-2 text-lg font-semibold text-[#F5F1E8]">Submission received</p>
        <p className="text-sm leading-7 text-white/55">
          Harbourview will review your supply for category fit, authority and commercial relevance.
          You will be contacted directly if your supply is suitable for the marketplace.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
      <label className={`${labelClass} md:col-span-2`}>
        Company / Legal entity *
        <input required name="company" placeholder="e.g. Shenzhen Packaging Co. Ltd" className={inputClass} />
      </label>

      <label className={labelClass}>
        Your name *
        <input required name="contact_name" placeholder="Full name" className={inputClass} />
      </label>

      <label className={labelClass}>
        Email *
        <input required type="email" name="contact_email" placeholder="you@company.com" className={inputClass} />
      </label>

      <label className={`${labelClass} md:col-span-2`}>
        Product category *
        <select required name="product_category" className={selectClass}>
          <option value="">Select category</option>
          {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>

      <label className={`${labelClass} md:col-span-2`}>
        Product description *
        <textarea
          required
          name="description"
          rows={4}
          placeholder="Describe the product — format, material, dimensions, available variants. Be specific."
          className={inputClass}
        />
      </label>

      <label className={labelClass}>
        Minimum order quantity (MOQ)
        <input name="moq" placeholder="e.g. 50,000 units" className={inputClass} />
      </label>

      <label className={labelClass}>
        Standard lead time
        <input name="lead_time" placeholder="e.g. 3–4 weeks FOB" className={inputClass} />
      </label>

      <label className={labelClass}>
        Origin country
        <input name="country" placeholder="e.g. China, India" className={inputClass} />
      </label>

      <label className={labelClass}>
        Supply region
        <select name="region" className={selectClass}>
          <option value="">Select region</option>
          {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </label>

      <label className={labelClass}>
        Preferred incoterm
        <select name="incoterm" className={selectClass}>
          <option value="">Select incoterm</option>
          {INCOTERMS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </label>

      <label className={labelClass}>
        Price range (optional)
        <input name="price_range" placeholder="e.g. USD $8–12 per 1,000 units" className={inputClass} />
      </label>

      <label className={`${labelClass} md:col-span-2`}>
        Target markets
        <input name="target_markets" placeholder="e.g. Germany, UK, Australia, Canada" className={inputClass} />
      </label>

      <div className="md:col-span-2">
        <p className="mb-3 text-sm text-[#F5F1E8]/70">Certifications held</p>
        <div className="flex flex-wrap gap-2">
          {CERTIFICATIONS.map(cert => (
            <button
              key={cert}
              type="button"
              onClick={() => toggleCert(cert)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                certs.includes(cert)
                  ? 'border-[#C6A55A] bg-[#C6A55A]/15 text-[#C6A55A]'
                  : 'border-white/10 text-white/45 hover:border-white/20 hover:text-white/60'
              }`}
            >
              {cert}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400 md:col-span-2">{error}</p>}

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-[#C6A55A] px-8 py-3 text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73] disabled:opacity-60"
        >
          {isPending ? 'Submitting...' : 'Submit for review'}
        </button>
        <p className="mt-3 text-xs leading-5 text-white/35">
          Submissions are reviewed by Harbourview before any public listing or buyer introduction.
          Contact details are not shared without your consent.
        </p>
      </div>
    </form>
  )
}
