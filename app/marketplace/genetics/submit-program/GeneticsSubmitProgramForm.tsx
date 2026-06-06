'use client'

import { useRef, useState, useTransition } from 'react'
import { submitMarketplaceInquiryDirect } from '@/lib/marketplace/clientCapture'

type FormState = { status: 'idle' | 'success' | 'error'; message: string }

const fieldClass = 'rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#C6A55A]/60'
const labelClass = 'text-xs uppercase tracking-[0.24em] text-[#C6A55A]'

function buildGeneticsProgramMessage(fields: {
  breeder: string
  country: string
  email: string
  website: string
  programType: string
  targetMarkets: string
  programDescription: string
  publicInfo: string
  privateInfo: string
  commercialContext: string
}) {
  return [
    'Genetics program submission',
    '',
    `Breeder / company: ${fields.breeder}`,
    `Country: ${fields.country}`,
    `Email: ${fields.email}`,
    `Website: ${fields.website || 'N/A'}`,
    `Program type: ${fields.programType}`,
    `Target markets: ${fields.targetMarkets || 'N/A'}`,
    '',
    'Program description:',
    fields.programDescription || 'N/A',
    '',
    'Public disclosure preferences:',
    fields.publicInfo || 'N/A',
    '',
    'Private / controlled information:',
    fields.privateInfo || 'N/A',
    '',
    'Commercial context:',
    fields.commercialContext || 'N/A',
  ].join('\n')
}

export default function SubmitGeneticsProgramPage() {
  const [state, setState] = useState<FormState>({ status: 'idle', message: '' })
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const breeder = (fd.get('breeder') as string)?.trim() || ''
    const country = (fd.get('country') as string)?.trim() || ''
    const email = (fd.get('email') as string)?.trim().toLowerCase() || ''
    const website = (fd.get('website') as string)?.trim() || ''
    const programType = (fd.get('programType') as string)?.trim() || ''
    const targetMarkets = (fd.get('targetMarkets') as string)?.trim() || ''
    const programDescription = (fd.get('programDescription') as string)?.trim() || ''
    const publicInfo = (fd.get('publicInfo') as string)?.trim() || ''
    const privateInfo = (fd.get('privateInfo') as string)?.trim() || ''
    const commercialContext = (fd.get('commercialContext') as string)?.trim() || ''

    if (!breeder || !email) {
      setState({ status: 'error', message: 'Breeder/company name and email are required.' })
      return
    }

    startTransition(async () => {
      const result = await submitMarketplaceInquiryDirect(
        {
          listing_id: null,
          buyer_request_id: null,
          contact_name: breeder,
          contact_email: email,
          contact_company: null,
          contact_phone: null,
          inquiry_type: 'genetics_program_submission',
          message: buildGeneticsProgramMessage({
            breeder, country, email, website, programType,
            targetMarkets, programDescription, publicInfo, privateInfo, commercialContext,
          }),
          },
        'Program submission received. Harbourview will review materials before any profile or commercial pathway is made public.',
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
          <h1 className="text-3xl font-semibold">Program Submission Received</h1>
          <p className="mt-4 text-sm leading-7 text-[#F5F1E8]/68">{state.message}</p>
          <button onClick={() => { setState({ status: 'idle', message: '' }); formRef.current?.reset() }}
            className="mt-8 rounded-full border border-white/20 px-6 py-3 text-sm text-white/80 hover:border-[#C6A55A]/50">
            Submit another program
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
            <div className={labelClass}>Program onboarding</div>
            <h1 className="mt-5 text-5xl font-semibold leading-tight">
              Present a genetics program through Harbourview.
            </h1>
            <p className="mt-6 text-sm leading-7 text-[#F5F1E8]/68">
              Harbourview Genetics is designed for selected breeders, seed companies and tissue-culture groups seeking controlled international visibility without exposing sensitive information publicly.
            </p>

            <div className="mt-8 space-y-4 text-sm text-[#F5F1E8]/65">
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[#C6A55A]">Selective review</div>
                <p className="mt-1 text-xs leading-5">Programs are reviewed before publication or promotion.</p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[#C6A55A]">Public and private separation</div>
                <p className="mt-1 text-xs leading-5">Sensitive breeding information and direct contacts remain controlled.</p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <div className="text-[#C6A55A]">Commercial positioning</div>
                <p className="mt-1 text-xs leading-5">Profiles are framed as curated commercial opportunities, not public directories.</p>
              </div>
            </div>
          </aside>

          <form ref={formRef} onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
            <div className="hidden" aria-hidden="true">
              <label htmlFor="website2">Website2</label>
              <input id="website2" name="website2" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="border-b border-white/10 pb-8">
              <div className={labelClass}>Program identity</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input name="breeder" className={fieldClass} placeholder="Breeder / company / laboratory *" required />
                <input name="country" className={fieldClass} placeholder="Country or region" />
                <input name="email" type="email" className={fieldClass} placeholder="Email *" required />
                <input name="website" className={fieldClass} placeholder="Website or portfolio link" />
              </div>
            </div>

            <div className="border-b border-white/10 py-8">
              <div className={labelClass}>Program structure</div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <select name="programType" className={fieldClass}>
                  <option value="">Program type</option>
                  <option>Breeder profile</option>
                  <option>Seed company</option>
                  <option>Tissue-culture laboratory</option>
                  <option>Licensing opportunity</option>
                  <option>Research collaboration</option>
                </select>
                <input name="targetMarkets" className={fieldClass} placeholder="Target markets" />
              </div>
              <div className="mt-4 grid gap-4">
                <textarea name="programDescription" className={`${fieldClass} min-h-[180px]`} placeholder="Describe the genetics program, current drops, collaboration opportunities or commercial positioning." />
              </div>
            </div>

            <div className="border-b border-white/10 py-8">
              <div className={labelClass}>Disclosure preferences</div>
              <div className="mt-5 grid gap-4">
                <textarea name="publicInfo" className={`${fieldClass} min-h-[140px]`} placeholder="What information can be shown publicly?" />
                <textarea name="privateInfo" className={`${fieldClass} min-h-[140px]`} placeholder="What information must remain private or controlled through Harbourview?" />
              </div>
            </div>

            <div className="py-8">
              <div className={labelClass}>Commercial context</div>
              <div className="mt-5 grid gap-4">
                <textarea name="commercialContext" className={`${fieldClass} min-h-[160px]`} placeholder="Describe target operators, desired partnerships, licensing goals or market-access objectives." />
              </div>
            </div>

            <div className="rounded-2xl border border-[#C6A55A]/25 bg-[#C6A55A]/8 p-5 text-xs leading-6 text-[#F5F1E8]/65">
              Submission does not guarantee publication or introduction. Harbourview reviews all materials before any profile, drop or commercial pathway discussion is made public.
            </div>

            {state.status === 'error' && (
              <p className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">{state.message}</p>
            )}

            <button type="submit" disabled={isPending}
              className="mt-8 rounded-full bg-[#C6A55A] px-6 py-4 text-sm font-semibold text-[#0B1A2F] disabled:opacity-60">
              {isPending ? 'Submitting\u2026' : 'Submit Program for Review'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
