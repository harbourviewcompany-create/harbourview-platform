'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ORG_TYPES, ORG_TYPE_LABELS, type OrgType } from '@/lib/hv/orgTypes'

function safeInternalPath(value: string | null, fallback = '/dashboard') {
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
  const [loading, setLoading] = useState(false)

  const returnTo = useMemo(() => safeInternalPath(searchParams.get('returnTo')), [searchParams])
  const currentPath = useMemo(() => {
    const query = searchParams.toString()
    return `${pathname}${query ? `?${query}` : ''}`
  }, [pathname, searchParams])

  useEffect(() => {
    let cancelled = false
    fetch('/api/org/me', { cache: 'no-store' })
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
    return () => { cancelled = true }
  }, [currentPath, router])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/org/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          legal_name: legalName,
          trade_name: tradeName,
          org_type: orgType,
          jurisdiction_country: country,
          jurisdiction_region: region,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (response.status === 401) {
        router.replace(`/login?mode=signup&next=${encodeURIComponent(currentPath)}`)
        return
      }
      if (!response.ok) {
        setError(payload?.error ?? 'Organization could not be created.')
        return
      }
      router.replace(returnTo)
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

  return (
    <main className="min-h-screen bg-[#020814] px-5 py-10 text-[#F5F1E8]">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <Link href={returnTo} className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C6A55A]">← Back</Link>
          <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#C6A55A]">Harbourview organization</p>
          <h1 className="mt-2 text-3xl font-semibold">Create organization</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">Create the operating entity you will use for marketplace activity, evidence, licences and reviewed workflows. You can belong to more than one organization.</p>
        </div>

        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-white/10 bg-[#07111F] p-6">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-white/60">Legal name</span>
            <input value={legalName} onChange={e => setLegalName(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-[#C6A55A]/50" />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-white/60">Trade name <span className="font-normal text-white/30">optional</span></span>
            <input value={tradeName} onChange={e => setTradeName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-[#C6A55A]/50" />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-white/60">Organization type</span>
            <select value={orgType} onChange={e => setOrgType(e.target.value as OrgType)} className="w-full rounded-xl border border-white/10 bg-[#0B1A2F] px-4 py-3 outline-none focus:border-[#C6A55A]/50">
              {ORG_TYPES.map(type => <option key={type} value={type}>{ORG_TYPE_LABELS[type]}</option>)}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-white/60">Country code</span>
              <input value={country} onChange={e => setCountry(e.target.value.toUpperCase().slice(0, 2))} required minLength={2} maxLength={2} placeholder="CA" className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 uppercase outline-none focus:border-[#C6A55A]/50" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-white/60">Province/state <span className="font-normal text-white/30">optional</span></span>
              <input value={region} onChange={e => setRegion(e.target.value)} placeholder="Ontario" className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-[#C6A55A]/50" />
            </label>
          </div>

          {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-900/20 px-4 py-3 text-sm text-red-300">{error}</p>}

          <button disabled={loading || legalName.trim().length === 0 || country.length !== 2} className="w-full rounded-xl bg-[#C6A55A] px-5 py-3 text-sm font-semibold text-[#07111F] disabled:opacity-50">
            {loading ? 'Creating organization…' : 'Create organization'}
          </button>
        </form>
      </div>
    </main>
  )
}
