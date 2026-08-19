'use client'

import { useActionState } from 'react'
import {
  submitCpdCertificateInterest,
  type CpdInterestState,
} from '@/app/actions/submitCpdCertificateInterest'
import { CPD_MODULES } from '@/lib/education/cpdCatalog'

const INITIAL: CpdInterestState = { status: 'idle', message: '' }

export function CpdCertificateInterestForm() {
  const [state, formAction, pending] = useActionState(submitCpdCertificateInterest, INITIAL)

  if (state.status === 'success') {
    return (
      <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 p-6 text-center">
        <p className="text-emerald-400">✓</p>
        <p className="mt-2 text-sm text-zinc-300">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Full name *
          <input
            name="contact_name"
            required
            maxLength={200}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Work email *
          <input
            name="contact_email"
            type="email"
            required
            maxLength={200}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Organisation
          <input
            name="contact_company"
            maxLength={200}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Module *
          <select
            name="module_slug"
            required
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="">Select…</option>
            {CPD_MODULES.filter((m) => m.certificateEligible).map((m) => (
              <option key={m.id} value={m.slug}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400 sm:col-span-2">
          Professional body / jurisdiction context
          <input
            name="professional_body"
            maxLength={200}
            placeholder="e.g. pharmacy board, compliance officer role, country"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400 sm:col-span-2">
          Notes
          <textarea
            name="message"
            rows={3}
            maxLength={1500}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          />
        </label>
      </div>
      <label className="flex gap-2 text-xs text-zinc-400">
        <input type="checkbox" name="consent" required className="mt-0.5" />
        I confirm this request is for legitimate professional development in regulated markets.
      </label>
      {state.status === 'error' && (
        <p className="text-sm text-red-400">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
      >
        {pending ? 'Submitting…' : 'Submit certificate interest'}
      </button>
    </form>
  )
}
