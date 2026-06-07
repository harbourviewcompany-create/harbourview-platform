'use client'

import { useState, useTransition } from 'react'

type Props = {
  listingTitle: string
  listingSlug: string
}

const inputClass =
  'mt-2 w-full rounded-xl border border-white/10 bg-[#081423] px-4 py-3 text-[#F5F1E8] placeholder-white/25 outline-none ring-[#C6A55A]/40 focus:ring-2 text-sm'
const labelClass = 'block text-sm text-[#F5F1E8]/70'

export function ProofOfAvailabilityForm({ listingTitle, listingSlug }: Props) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const contactName = fd.get('contact_name') as string
    const contactEmail = fd.get('contact_email') as string
    const company = fd.get('company') as string
    const volume = fd.get('volume') as string
    const deliveryCountry = fd.get('delivery_country') as string
    const timing = fd.get('timing') as string
    const documentation = fd.get('documentation') as string
    const notes = fd.get('notes') as string

    const message = [
      `Proof of availability request for: ${listingTitle}`,
      `Listing: ${listingSlug}`,
      `---`,
      `Volume required: ${volume || 'Not specified'}`,
      `Delivery destination: ${deliveryCountry || 'Not specified'}`,
      `Required timing: ${timing || 'Not specified'}`,
      `Documentation required: ${documentation || 'None specified'}`,
      `Additional notes: ${notes || 'None'}`,
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
            inquiry_type: 'quote_routing',
            message,
          }),
        })
        if (res.ok) {
          setDone(true)
          setOpen(false)
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
      <div className="mt-6 rounded-2xl border border-[#C6A55A]/30 bg-[#0B1A2F] p-6">
        <p className="font-semibold text-[#F5F1E8]">Request received</p>
        <p className="mt-1 text-sm leading-6 text-white/55">
          Harbourview will verify availability with the supplier and respond within 2 business days.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-full border border-[#C6A55A]/40 px-6 py-3 text-sm font-medium text-[#C6A55A] transition hover:bg-[#C6A55A]/10"
        >
          Request proof of availability
        </button>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#F5F1E8]">Proof of availability</h3>
              <p className="mt-1 text-xs text-white/45">
                Harbourview verifies with the supplier before routing to you.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/30 transition hover:text-white/60"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              Your name *
              <input required name="contact_name" placeholder="Full name" className={inputClass} />
            </label>
            <label className={labelClass}>
              Email *
              <input required type="email" name="contact_email" placeholder="you@company.com" className={inputClass} />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              Company / licence holder
              <input name="company" placeholder="Legal entity name" className={inputClass} />
            </label>
            <label className={labelClass}>
              Volume required
              <input name="volume" placeholder="e.g. 100,000 units" className={inputClass} />
            </label>
            <label className={labelClass}>
              Delivery country
              <input name="delivery_country" placeholder="e.g. Germany, Australia" className={inputClass} />
            </label>
            <label className={labelClass}>
              Required timing
              <input name="timing" placeholder="e.g. Q3 2026, within 60 days" className={inputClass} />
            </label>
            <label className={labelClass}>
              Documentation needed
              <input name="documentation" placeholder="e.g. COA, COO, GMP cert" className={inputClass} />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              Additional notes
              <textarea name="notes" rows={3} placeholder="Specific requirements, alternatives considered, budget context..." className={inputClass} />
            </label>
            {error && <p className="text-sm text-red-400 md:col-span-2">{error}</p>}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-[#C6A55A] px-6 py-3 text-sm font-medium text-[#081423] transition hover:bg-[#D8BC73] disabled:opacity-60"
              >
                {isPending ? 'Submitting...' : 'Submit request'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
