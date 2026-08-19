'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ORG_TYPES, ORG_TYPE_LABELS, type OrgType } from '@/lib/hv/orgTypes'

function safeInternalPath(value: string | null, fallback = '/organization') {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback
}

export default function OrganizationCreateForm() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [authState, setAuthState] = useState<'checking' | 'authenticated'>('checking')
  const [legalName, setLegalName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [orgType, setOrgType] = useState<OrgType>('supplier')
  const [country, setCountry] = useState((searchParams.get('country') ?? '').slice(0, 2).toUpperCase())
  const [region, setRegion] = useState('')
  const [error, setError] = useState('')
  const [fieldHint, setFieldHint] = useState('')
  const [loading, setLoading] = useState(false)

  const returnTo = useMemo(() => safeInternalPath(searchParams.get('returnTo')), [searchParams])
  const currentPath = useMemo(() => {
    const query = searchParams.toString()
    return `${pathname}${query ? `?${query}` : ''}`
  }, [pathname, searchParams])

  useEffect(() => {
    let cancelled = false
    fetch('/api/org/me', { cache: 'no-store', credentials: 'same-origin' })
      .then(response => {
        if (cancelled) return
        if (response.status === 401) {
          router.replace(`/login?mode=signup&next=${encodeURIComponent(currentPath)}`)
          return
        }
        setAuthState('authenticated')
      })
      .catch(() => {
        if (!cancelled) setAuthState('authenticated')
      })
    return () => {
      cancelled = true
    }
  }, [currentPath, router])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setFieldHint('')

    const legal = legalName.trim()
    const iso = country.trim().toUpperCase()
    if (!legal) {
      setFieldHint('Enter the legal name of the organization.')
      return
    }
    if (iso.length !== 2) {
      setFieldHint('Country code must be exactly 2 letters (e.g. BR, CA, GB).')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/org/create', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          legal_name: legal,
          trade_name: tradeName.trim() || undefined,
          org_type: orgType,
          jurisdiction_country: iso,
          jurisdiction_region: region.trim() || undefined,
        }),
      })
      const payload = await response.json().catch(() => ({}))

      if (response.status === 401) {
        router.replace(`/login?mode=signup&next=${encodeURIComponent(currentPath)}`)
        return
      }
      if (!response.ok) {
        const msg =
          typeof payload?.error === 'string'
            ? payload.error
            : 'Organization could not be created.'
        setError(payload?.detail ? `${msg} (${payload.detail})` : msg)
        return
      }

      const orgId = payload?.data?.org_id as string | undefined
      const dest = new URL(returnTo, window.location.origin)
      if (orgId) dest.searchParams.set('created', orgId)
      dest.searchParams.set('bound', '1')
      router.replace(`${dest.pathname}${dest.search}`)
      router.refresh()
    } catch {
      setError('Organization could not be created. Check your connection and retry.')
    } finally {
      setLoading(false)
    }
  }

  if (authState === 'checking') {
    return (
      <main className="min-h-screen bg-[#020814] px-5 py-16 text-[#F5F1E8]">
        <div className="mx-auto max-w-xl text-sm text-white/50">Checking your Harbourview account…</div>
      </main>
    )
  }

  const canSubmit = legalName.trim().length > 0 && country.trim().length === 2 && !loading

  return (
    <main className="min-h-screen bg-[#020814] px-5 py-10 text-[#F5F1E8]">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <Link href={returnTo} className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C6A55A]">
            ← Back
          </Link>
          <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#C6A55A]">
            Harbourview organization
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Create organization</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            Creates an organization on your account: membership (admin), operating context, and an organization
            passport profile you can complete with licences and evidence.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-white/10 bg-[#07111F] p-6">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-white/60">
              Legal name <span className="text-[#C6A55A]">required</span>
            </span>
            <input
              value={legalName}
              onChange={e => setLegalName(e.target.value)}
              required
              autoComplete="organization"
              placeholder="Registered legal entity name"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-[#C6A55A]/50"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-white/60">
              Trade name <span className="font-normal text-white/30">optional</span>
            </span>
            <input
              value={tradeName}
              onChange={e => setTradeName(e.target.value)}
              placeholder="Brand or trading name"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-[#C6A55A]/50"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-white/60">Organization type</span>
            <select
              value={orgType}
              onChange={e => setOrgType(e.target.value as OrgType)}
              className="w-full rounded-xl border border-white/10 bg-[#0B1A2F] px-4 py-3 outline-none focus:border-[#C6A55A]/50"
            >
              {ORG_TYPES.map(type => (
                <option key={type} value={type}>
                  {ORG_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-white/60">
                Country code <span className="text-[#C6A55A]">required</span>
              </span>
              <input
                value={country}
                onChange={e => setCountry(e.target.value.toUpperCase().slice(0, 2))}
                required
                minLength={2}
                maxLength={2}
                placeholder="BR"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 uppercase outline-none focus:border-[#C6A55A]/50"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-white/60">
                Province/state <span className="font-normal text-white/30">optional</span>
              </span>
              <input
                value={region}
                onChange={e => setRegion(e.target.value)}
                placeholder="SP"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-[#C6A55A]/50"
              />
            </label>
          </div>

          {fieldHint ? (
            <p role="status" className="rounded-xl border border-amber-500/25 bg-amber-900/20 px-4 py-3 text-sm text-amber-100">
              {fieldHint}
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="rounded-xl border border-red-500/20 bg-red-900/20 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-[#C6A55A] px-5 py-3 text-sm font-semibold text-[#07111F] disabled:opacity-50"
          >
            {loading ? 'Creating organization…' : 'Create organization'}
          </button>

          <p className="text-center text-[11px] leading-relaxed text-white/35">
            You become admin. The organization stays on your profile and can be switched from Organizations.
          </p>
        </form>
      </div>
    </main>
  )
}
