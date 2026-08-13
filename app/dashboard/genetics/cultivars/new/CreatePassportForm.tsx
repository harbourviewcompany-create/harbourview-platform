'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPassport, type CreatePassportState } from '@/app/actions/genetics/createPassport'

const INITIAL: CreatePassportState = { status: 'idle', message: '' }

export function CreatePassportForm() {
  const router = useRouter()
  const [state, action, isPending] = useActionState(createPassport, INITIAL)

  useEffect(() => {
    if (state.status === 'success' && state.passportId) {
      router.push(`/dashboard/genetics/cultivars/${state.passportId}`)
    }
  }, [state, router])

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="display_name" className="block text-xs uppercase tracking-[0.14em] text-[#C6A55A] mb-1.5">
          Display Name <span className="text-red-400">*</span>
        </label>
        <input
          id="display_name"
          name="display_name"
          required
          maxLength={200}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-[#F5F1E8] placeholder-white/30 focus:border-[#C6A55A]/60 focus:outline-none"
          placeholder="e.g. Blue Dream — HV.24"
        />
      </div>

      <div>
        <label htmlFor="public_summary" className="block text-xs uppercase tracking-[0.14em] text-[#C6A55A] mb-1.5">
          Public Summary <span className="text-red-400">*</span>
        </label>
        <textarea
          id="public_summary"
          name="public_summary"
          required
          maxLength={1200}
          rows={5}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-[#F5F1E8] placeholder-white/30 focus:border-[#C6A55A]/60 focus:outline-none resize-none"
          placeholder="Describe the cultivar's known properties, provenance, and public claims…"
        />
        <p className="mt-1 text-[11px] text-[#F5F1E8]/40">Max 1,200 characters. All claims require evidence and admin review before public display.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cultivar_category" className="block text-xs uppercase tracking-[0.14em] text-[#C6A55A] mb-1.5">
            Cultivar Category <span className="text-red-400">*</span>
          </label>
          <select
            id="cultivar_category"
            name="cultivar_category"
            defaultValue="unknown"
            className="w-full rounded-xl border border-white/15 bg-[#0B1A2F] px-4 py-2.5 text-sm text-[#F5F1E8] focus:border-[#C6A55A]/60 focus:outline-none"
          >
            <option value="cannabis">Cannabis</option>
            <option value="hemp">Hemp</option>
            <option value="cbd">CBD</option>
            <option value="medical">Medical</option>
            <option value="adult_use">Adult Use</option>
            <option value="research">Research</option>
            <option value="pharmaceutical">Pharmaceutical</option>
            <option value="industrial">Industrial</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        <div>
          <label htmlFor="cannabis_category" className="block text-xs uppercase tracking-[0.14em] text-[#C6A55A] mb-1.5">
            Cannabis Category
          </label>
          <select
            id="cannabis_category"
            name="cannabis_category"
            defaultValue=""
            className="w-full rounded-xl border border-white/15 bg-[#0B1A2F] px-4 py-2.5 text-sm text-[#F5F1E8] focus:border-[#C6A55A]/60 focus:outline-none"
          >
            <option value="">— select if applicable —</option>
            <option value="thc_dominant">THC Dominant</option>
            <option value="cbd_dominant">CBD Dominant</option>
            <option value="balanced">Balanced</option>
            <option value="minor_cannabinoid">Minor Cannabinoid</option>
            <option value="industrial_hemp">Industrial Hemp</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="origin_country_code" className="block text-xs uppercase tracking-[0.14em] text-[#C6A55A] mb-1.5">
          Origin Country Code
        </label>
        <input
          id="origin_country_code"
          name="origin_country_code"
          maxLength={2}
          className="w-40 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm uppercase text-[#F5F1E8] placeholder-white/30 focus:border-[#C6A55A]/60 focus:outline-none"
          placeholder="US"
        />
        <p className="mt-1 text-[11px] text-[#F5F1E8]/40">2-letter ISO code (e.g. US, CA, AU). Optional.</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_public"
          name="is_public"
          className="h-4 w-4 rounded border-white/20 bg-white/10 accent-[#C6A55A]"
        />
        <label htmlFor="is_public" className="text-sm text-[#F5F1E8]/75 cursor-pointer">
          Make passport publicly visible immediately
        </label>
      </div>
      <p className="text-[11px] text-[#F5F1E8]/40 -mt-3">
        Passports default to private (draft). Public display requires claim review approval from admin.
      </p>

      {state.status === 'error' && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400">
          {state.message}
        </p>
      )}
      {state.status === 'success' && (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-400">
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-[#C6A55A] px-6 py-2.5 text-sm font-medium text-[#081423] disabled:opacity-60"
        >
          {isPending ? 'Creating…' : 'Create passport'}
        </button>
        <a
          href="/dashboard?page=genetics"
          className="rounded-full border border-white/15 px-6 py-2.5 text-sm text-[#F5F1E8]/65 hover:border-white/30"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
