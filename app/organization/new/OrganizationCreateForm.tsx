'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ORG_TYPES, ORG_TYPE_LABELS, type OrgType } from '@/lib/hv/orgTypes'
import { countryOptions } from '@/config/globe/country-role-profiles'
import { canadaProvinceProfiles } from '@/data/globe/canada-province-profiles'
import { usStateProfiles } from '@/data/globe/us-state-profiles'

function safeInternalPath(value: string | null, fallback = '/organization') {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback
}

const typeDescriptions: Partial<Record<OrgType, string>> = {
  supplier: 'Supply, source or produce goods for counterparties.',
  buyer: 'Source products, services or market access from suppliers.',
  broker: 'Connect counterparties and coordinate commercial opportunities.',
  lab: 'Operate testing, QA or analytical services.',
  pharmacy: 'Operate a pharmacy or dispensing pathway.',
  clinic: 'Operate clinical or healthcare services.',
  equipment: 'Provide equipment or technical infrastructure.',
  service: 'Provide professional or operational services.',
  financial: 'Provide finance, investment or capital services.',
  distributor: 'Operate wholesale or distribution activities.',
  exporter: 'Operate cross-border export activities.',
  importer: 'Operate cross-border import activities.',
}

export default function OrganizationCreateForm() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [authState, setAuthState] = useState<'checking' | 'authenticated'>('checking')
  const [legalName, setLegalName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [orgType, setOrgType] = useState<OrgType>('supplier')
  const [country, setCountry] = useState((searchParams.get('country') ?? '').split('-')[0].slice(0, 2).toUpperCase())
  const [region, setRegion] = useState('')
  const [error, setError] = useState('')
  const [fieldHint, setFieldHint] = useState('')
  const [loading, setLoading] = useState(false)

  const returnTo = useMemo(() => safeInternalPath(searchParams.get('returnTo')), [searchParams])
  const currentPath = useMemo(() => {
    const query = searchParams.toString()
    return `${pathname}${query ? `?${query}` : ''}`
  }, [pathname, searchParams])

  const regionOptions = useMemo(() => {
    if (country === 'CA') return canadaProvinceProfiles.map((p) => ({ value: p.abbreviation, label: p.name }))
    if (country === 'US') return usStateProfiles.map((s) => ({ value: s.abbreviation, label: s.name }))
    return []
  }, [country])

  const selectedCountryName = countryOptions.find((item) => item.iso2 === country)?.name ?? country
  const selectedRegionName = regionOptions.find((item) => item.value === region)?.label ?? region
  const selectedTypeDescription = typeDescriptions[orgType]

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
      .catch(() => { if (!cancelled) setAuthState('authenticated') })
    return () => { cancelled = true }
  }, [currentPath, router])

  function selectCountry(value: string) {
    setCountry(value)
    setRegion('')
  }

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
      setFieldHint('Choose a country.')
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
        setError(typeof payload?.error === 'string' ? payload.error : 'Organization could not be created.')
        return
      }

      const orgId = payload?.data?.org_id as string | undefined
      const dest = new URL(returnTo, window.location.origin)
      if (orgId) dest.searchParams.set('created', orgId)
      dest.searchParams.set('bound', '1')
      window.location.replace(`${dest.pathname}${dest.search}`)
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

  const canSubmit = legalName.trim().length > 0 && country.length === 2 && !loading

  return (
    <main className="min-h-screen bg-[#020814] px-5 py-8 text-[#F5F1E8] sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link href={returnTo} className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C6A55A]">← Back</Link>

        <header className="mb-7 mt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#C6A55A]">Harbourview organization</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Create your operating organization</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
            Your organization becomes the operating identity behind Harbourview — the context used for market access,
            counterparties and your organization passport.
          </p>
        </header>

        <div className="mb-5 grid gap-2 sm:grid-cols-3">
          {[
            ['01', 'Operating context', 'Where you operate'],
            ['02', 'Organization passport', 'Your business identity'],
            ['03', 'Market access', 'Licences & evidence'],
          ].map(([number, title, detail]) => (
            <div key={number} className="rounded-2xl border border-white/8 bg-white/[0.025] p-3">
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#C6A55A]/75">{number}</div>
              <div className="mt-1 text-xs font-semibold text-white/80">{title}</div>
              <div className="mt-0.5 text-[10px] text-white/35">{detail}</div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-6 rounded-[24px] border border-white/10 bg-[#07111F] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)] sm:p-7">
          <section className="grid gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C6A55A]/78">01 · Organization identity</p>
              <p className="mt-1 text-xs text-white/35">Use the registered legal entity name. A trading name is optional.</p>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-white/65">Legal name <span className="text-[#C6A55A]">required</span></span>
              <input value={legalName} onChange={e => setLegalName(e.target.value)} required autoComplete="organization"
                placeholder="Registered legal entity name"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 outline-none transition focus:border-[#C6A55A]/50 focus:bg-white/[0.06]" />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-white/65">Trade name <span className="font-normal text-white/30">optional</span></span>
              <input value={tradeName} onChange={e => setTradeName(e.target.value)} autoComplete="organization"
                placeholder="Brand or trading name"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 outline-none transition focus:border-[#C6A55A]/50 focus:bg-white/[0.06]" />
            </label>
          </section>

          <section className="grid gap-4 border-t border-white/8 pt-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C6A55A]/78">02 · Operating context</p>
              <p className="mt-1 text-xs text-white/35">Choose the jurisdiction where this organization operates.</p>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-white/65">Country <span className="text-[#C6A55A]">required</span></span>
              <select value={country} onChange={e => selectCountry(e.target.value)} required
                className="w-full rounded-xl border border-white/10 bg-[#0B1A2F] px-4 py-3.5 outline-none transition focus:border-[#C6A55A]/50">
                <option value="" disabled>Select country</option>
                {countryOptions.map(item => <option key={item.iso2} value={item.iso2}>{item.name} ({item.iso2})</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-white/65">Province / state <span className="font-normal text-white/30">optional</span></span>
              {regionOptions.length > 0 ? (
                <select value={region} onChange={e => setRegion(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0B1A2F] px-4 py-3.5 outline-none transition focus:border-[#C6A55A]/50">
                  <option value="">Select province / state</option>
                  {regionOptions.map(item => <option key={item.value} value={item.value}>{item.label} ({item.value})</option>)}
                </select>
              ) : (
                <input value={region} onChange={e => setRegion(e.target.value)} placeholder="Province, state or region"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 outline-none transition focus:border-[#C6A55A]/50" />
              )}
            </label>

            {country ? (
              <div className="rounded-xl border border-[#C6A55A]/12 bg-[#C6A55A]/[0.035] px-4 py-3 text-xs text-white/55">
                Operating context: <span className="font-semibold text-white/75">{selectedCountryName}</span>
                {selectedRegionName ? <span> · {selectedRegionName}</span> : null}
              </div>
            ) : null}
          </section>

          <section className="grid gap-4 border-t border-white/8 pt-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C6A55A]/78">03 · Organization role</p>
              <p className="mt-1 text-xs text-white/35">This shapes the operating context Harbourview uses for your organization.</p>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-white/65">Organization type</span>
              <select value={orgType} onChange={e => setOrgType(e.target.value as OrgType)}
                className="w-full rounded-xl border border-white/10 bg-[#0B1A2F] px-4 py-3.5 outline-none transition focus:border-[#C6A55A]/50">
                {ORG_TYPES.map(type => <option key={type} value={type}>{ORG_TYPE_LABELS[type]}</option>)}
              </select>
            </label>

            {selectedTypeDescription ? (
              <p className="rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3 text-xs leading-5 text-white/45">{selectedTypeDescription}</p>
            ) : null}
          </section>

          {fieldHint ? <p role="status" className="rounded-xl border border-amber-500/25 bg-amber-900/20 px-4 py-3 text-sm text-amber-100">{fieldHint}</p> : null}
          {error ? <p role="alert" className="rounded-xl border border-red-500/20 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</p> : null}

          <button type="submit" disabled={!canSubmit}
            className="w-full rounded-full bg-[#C6A55A] px-5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#07111F] transition hover:brightness-105 disabled:opacity-45">
            {loading ? 'Creating organization…' : 'Create organization'}
          </button>

          <p className="text-center text-[11px] leading-relaxed text-white/32">
            You become an administrator. After creation, Harbourview creates your operating context and organization passport automatically.
          </p>
        </form>
      </div>
    </main>
  )
}
