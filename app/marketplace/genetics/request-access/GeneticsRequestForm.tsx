'use client'

import { useRef, useState, useTransition } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'

type FormState = { status: 'idle' | 'success' | 'error'; message: string }

const fieldClass = 'rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#C6A55A]/60'
const labelClass = 'text-xs uppercase tracking-[0.24em] text-[#C6A55A]'

function buildGeneticsAccessMessage(fields: {
  name: string
  company: string
  country: string
  operatorType: string
  licenceStatus: string
  targetMarket: string
  timeline: string
  profileOfInterest: string
  requestDetail: string
  confidentialityNotes: string
}) {
  return [
    'Genetics access request',
    '',
    `Applicant: ${fields.name}`,
    `Company: ${fields.company}`,
    `Country: ${fields.country}`,
    `Operator type: ${fields.operatorType}`,
    `Licence status: ${fields.licenceStatus}`,
    `Target market: ${fields.targetMarket}`,
    `Timeline: ${fields.timeline}`,
    '',
    `Profile or drop of interest: ${fields.profileOfInterest || 'N/A'}`,
    '',
    'Request detail:',
    fields.requestDetail || 'N/A',
    '',
    'Confidentiality notes:',
    fields.confidentialityNotes || 'N/A',
  ].join('\n')
}

export default function RequestGeneticsAccessPage() {
  const [state, setState] = useState<FormState>({ status: 'idle', message: '' })
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const name = (fd.get('name') as string)?.trim() || ''
    const email = (fd.get('email') as string)?.trim().toLowerCase() || ''
    const company = (fd.get('company') as string)?.trim() || ''
    const country = (fd.get('country') as string)?.trim() || ''
    const operatorType = (fd.get('operatorType') as string)?.trim() || ''
    const licenceStatus = (fd.get('licenceStatus') as string)?.trim() || ''
    const targetMarket = (fd.get('targetMarket') as string)?.trim() || ''
    const timeline = (fd.get('timeline') as string)?.trim() || ''
    const profileOfInterest = (fd.get('profileOfInterest') as string)?.trim() || ''
    const requestDetail = (fd.get('requestDetail') as string)?.trim() || ''
    const confidentialityNotes = (fd.get('confidentialityNotes') as string)?.trim() || ''

    if (!name || !email) {
      setState({ status: 'error', message: 'Name and email are required.' })
      return
    }

    startTransition(async () => {
      const result = await submitMarketplaceInquiryDirect(
        {
          listing_id: null,
          buyer_request_id: null,
          contact_name: name,
          contact_email: email,
          contact_company: company || null,
          contact_phone: null,
          inquiry_type: 'genetics_access_request',
          message: buildGeneticsAccessMessage({
            name, company, country, operatorType, licenceStatus,
            targetMarket, timeline, profileOfInterest, requestDetail, confidentialityNotes,
          }),
          status: 'received',
        },
        'Access request received. Harbourview will review it before any genetics holder is contacted.',
        'GENETICS',
      )
      setState({ status: result.ok ? 'success' : 'error', message: result.message })
    })
  }

  if (state.status === 'success') {
    return (
      <main className="min-h-screen bg-[#05070A] px-6 py-20 text-[#F5F1E8]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[#C6A55A] text-5xl mb-4">&#10003;</p>
          <h1 className="text-3xl font-semibold">Access Request Received</h1>
          <p className="mt-4 text-sm leading-7 text-[#F5F1E8]/68">{state.message}</p>
          <button onClick={() => { setState({ status: 'idle', message: '' }); formRef.current?.reset() }}
            className="mt-8 rounded-full border border-white/20 px-6 py-3 text-sm text-white/80 hover:border-[#C6A55A]/50">
            Submit another request
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#05070A] px-6 py-20 text-[#F5F1E8]">
      <div className="mx-auto max-w-6xl">
        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <aside className="rounded-[2rem] border border-[#C6A55A]/20 bg-[#0B1A2F]/60 p-8">
            <div className={labelClass}>Private access request</div>
            <h1 className="mt-5 text-5xl font-semibold leading-tight">
              Request reviewed access to a genetics opportunity.
            </h1>
            <p className="mt-6 text-sm leading-7 text-[#F5F1E8]/68">
              Harbourview reviews each inquiry before any genetics holder, contact detail, pricing information or sensitive material is disclosed. The purpose is to understand commercial fit, seriousness and the relevant market pathway before any introduction is considered.
            </p>

            <div className="mt-8 space-y-4 text-sm text-[#F5F1E8]/65">
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[#C6A55A]">1. Submit interest</div>
                <p className="mt-1 text-xs leading-5">Provide operator context, target market and intended use.</p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[#C6A55A]">2. Harbourview review</div>
                <p className="mt-1 text-xs leading-5">We assess fit before sharing any inquiry externally.</p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[#C6A55A]">3. Controlled introduction</div>
                <p className="mt-1 text-xs leading-5">Only appropriate requests are routed for further discussion.</p>
              </div>
            </div>
          </aside>

          <form ref={formRef} onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="border-b border-white/10 pb-8">
              <div className={labelClass}>Applicant</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input name="name" className={fieldClass} placeholder="Name *" required />
                <input name="company" className={fieldClass} placeholder="Company" />
                <input name="country" className={fieldClass} placeholder="Country" />
                <input name="email" type="email" className={fieldClass} placeholder="Email *" required />
              </div>
            </div>

            <div className="border-b border-white/10 py-8">
              <div className={labelClass}>Commercial context</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <select name="operatorType" className={fieldClass}>
                  <option value="">Operator type</option>
                  <option>Licensed producer</option>
                  <option>Importer / distributor</option>
                  <option>Tissue-culture lab</option>
                  <option>Research organization</option>
                  <option>Brand / commercialization partner</option>
                </select>
                <select name="licenceStatus" className={fieldClass}>
                  <option value="">Licence status</option>
                  <option>Licensed</option>
                  <option>Licence pending</option>
                  <option>Research / institutional status</option>
                  <option>Exploratory only</option>
                </select>
                <input name="targetMarket" className={fieldClass} placeholder="Target market" />
                <input name="timeline" className={fieldClass} placeholder="Timeline or intended review window" />
              </div>
            </div>

            <div className="py-8">
              <div className={labelClass}>Request detail</div>
              <div className="mt-5 grid gap-4">
                <input name="profileOfInterest" className={fieldClass} placeholder="Profile or drop of interest" />
                <textarea name="requestDetail" className={`${fieldClass} min-h-[180px]`} placeholder="Describe the genetics access request, intended use, scale and relevant commercial pathway." />
                <textarea name="confidentialityNotes" className={`${fieldClass} min-h-[120px]`} placeholder="Confidentiality notes or information Harbourview should not share without approval." />
              </div>
            </div>

            <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#C6A55A]/8 p-5 text-xs leading-6 text-[#F5F1E8]/65">
              Submitting this request does not create a direct introduction. Harbourview reviews the request first and controls whether any inquiry, identity or context is shared with a genetics holder.
            </div>

            {state.status === 'error' && (
              <p className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">{state.message}</p>
            )}

            <button type="submit" disabled={isPending}
              className="mt-8 rounded-full bg-[#C6A55A] px-6 py-4 text-sm font-semibold text-[#0B1A2F] disabled:opacity-60">
              {isPending ? 'Submitting\u2026' : 'Submit for Harbourview Review'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
