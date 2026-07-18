'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ORG_TYPES, ORG_TYPE_LABELS } from '@/lib/hv/orgTypes'

type CountryOption = { iso2: string; name: string }
type FormState = { status: 'idle' | 'error'; message: string }

const fieldClass =
  'rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#C6A55A]/60'
const labelClass = 'text-xs uppercase tracking-[0.24em] text-[#C6A55A]'

export default function CreateOrgForm({ countryOptions }: { countryOptions: CountryOption[] }) {
  const [state, setState] = useState<FormState>({ status: 'idle', message: '' })
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const legal_name = (fd.get('legal_name') as string)?.trim() || ''
    const trade_name = (fd.get('trade_name') as string)?.trim() || ''
    const org_type = (fd.get('org_type') as string)?.trim() || ''
    const jurisdiction_country = (fd.get('jurisdiction_country') as string)?.trim() || ''
    const jurisdiction_region = (fd.get('jurisdiction_region') as string)?.trim() || ''

    if (!legal_name) {
      setState({ status: 'error', message: 'Legal name is required.' })
      return
    }
    if (!org_type) {
      setState({ status: 'error', message: 'Select an organization type.' })
      return
    }
    if (jurisdiction_country.length !== 2) {
      setState({ status: 'error', message: 'Select a jurisdiction country.' })
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/org/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            legal_name,
            trade_name: trade_name || undefined,
            org_type,
            jurisdiction_country,
            jurisdiction_region: jurisdiction_region || undefined,
          }),
        })
        const json = await res.json()

        if (!res.ok) {
          const message =
            json?.error === 'USER_ALREADY_HAS_ORG'
              ? 'You already belong to an organization.'
              : json?.error === 'SLUG_CONFLICT'
              ? 'An organization with a very similar name already exists — try a more specific legal name.'
              : json?.error === 'Too many requests. Please try again shortly.'
              ? json.error
              : 'Could not create your organization. Please try again.'
          setState({ status: 'error', message })
          return
        }

        toast.success('Organization created. Passport verification starts now.')
        router.push('/dashboard?org_created=1')
        router.refresh()
      } catch {
        setState({ status: 'error', message: 'Network error — please try again.' })
      }
    })
  }

  return (
    <main className="min-h-screen bg-[#05070A] px-6 py-20 text-[#F5F1E8]">
      <div className="mx-auto max-w-6xl">
        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <aside className="rounded-[2rem] border border-[#C6A55A]/20 bg-[#0B1A2F]/60 p-8">
            <div className={labelClass}>Organization onboarding</div>
            <h1 className="mt-5 text-5xl font-semibold leading-tight">
              Create your Harbourview organization.
            </h1>
            <p className="mt-6 text-sm leading-7 text-[#F5F1E8]/68">
              Every counterparty on Harbourview — supplier, buyer, broker, lab, or financial
              partner — operates through a verified organization. Creating one starts your
              Passport: the credential Harbourview uses to signal trust across the platform.
            </p>

            <div className="mt-8 space-y-4 text-sm text-[#F5F1E8]/65">
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[#C6A55A]">Unverified by default</div>
                <p className="mt-1 text-xs leading-5">
                  Your organization is created privately and unverified. Nothing is public until
                  you choose to submit it for review.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[#C6A55A]">One organization per account</div>
                <p className="mt-1 text-xs leading-5">
                  Each user account owns exactly one organization at creation. Team members can
                  be invited to an existing organization afterward.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[#C6A55A]">Passport verification</div>
                <p className="mt-1 text-xs leading-5">
                  Licenses, facilities, and evidence you add afterward feed your Passport score —
                  Harbourview's trust signal for counterparties evaluating you.
                </p>
              </div>
            </div>
          </aside>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl"
          >
            <div className="border-b border-white/10 pb-8">
              <div className={labelClass}>Organization identity</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  name="legal_name"
                  className={fieldClass}
                  placeholder="Legal name *"
                  required
                />
                <input name="trade_name" className={fieldClass} placeholder="Trade name (if different)" />
              </div>
            </div>

            <div className="border-b border-white/10 py-8">
              <div className={labelClass}>Organization type</div>
              <div className="mt-5 grid gap-4">
                <select name="org_type" className={fieldClass} required defaultValue="">
                  <option value="" disabled>
                    Select organization type *
                  </option>
                  {ORG_TYPES.map(t => (
                    <option key={t} value={t}>
                      {ORG_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="py-8">
              <div className={labelClass}>Jurisdiction</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <select name="jurisdiction_country" className={fieldClass} required defaultValue="">
                  <option value="" disabled>
                    Country of registration *
                  </option>
                  {countryOptions.map(c => (
                    <option key={c.iso2} value={c.iso2}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  name="jurisdiction_region"
                  className={fieldClass}
                  placeholder="State / province / region (optional)"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#C6A55A]/8 p-5 text-xs leading-6 text-[#F5F1E8]/65">
              Creating an organization does not make it public or verified. Verification, license
              submission, and public listing are separate steps you control afterward.
            </div>

            {state.status === 'error' && (
              <p className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
                {state.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="mt-8 rounded-full bg-[#C6A55A] px-6 py-4 text-sm font-semibold text-[#0B1A2F] disabled:opacity-60"
            >
              {isPending ? 'Creating\u2026' : 'Create Organization'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
