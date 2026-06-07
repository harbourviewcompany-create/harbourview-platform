'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'

const REGIONS = [
  { value: 'all', label: 'All regions' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia_pacific', label: 'Asia Pacific' },
  { value: 'north_america', label: 'North America' },
  { value: 'latin_america', label: 'Latin America' },
  { value: 'global', label: 'Global' },
]

const PRODUCT_TYPES = [
  { value: 'all', label: 'All products' },
  { value: 'pre-roll cones', label: 'Pre-roll cones' },
  { value: 'pouches', label: 'Pouches' },
  { value: 'jars', label: 'Jars' },
  { value: 'labels', label: 'Labels' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'lab', label: 'Lab & QA' },
  { value: 'extraction', label: 'Extraction' },
]

const selectClass =
  'rounded-full border border-white/10 bg-[#0B1A2F] px-4 py-2.5 text-sm text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2 appearance-none cursor-pointer hover:border-[#C6A55A]/40 transition-colors'

const inputClass =
  'rounded-full border border-white/10 bg-[#0B1A2F] px-4 py-2.5 text-sm text-[#F5F1E8] placeholder-white/30 outline-none ring-[#C6A55A]/40 focus:ring-2 hover:border-[#C6A55A]/40 transition-colors w-full sm:w-64'

export function ConsumablesFilterBar({
  totalCount,
  filteredCount,
}: {
  totalCount: number
  filteredCount: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (!value || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [router, pathname, searchParams],
  )

  const region = searchParams.get('region') ?? 'all'
  const productType = searchParams.get('type') ?? 'all'
  const search = searchParams.get('q') ?? ''
  const isFiltered = region !== 'all' || productType !== 'all' || search !== ''

  return (
    <div className={`mb-8 transition-opacity ${isPending ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search listings..."
          defaultValue={search}
          className={inputClass}
          onChange={e => updateParam('q', e.target.value)}
        />
        <select
          value={region}
          onChange={e => updateParam('region', e.target.value)}
          className={selectClass}
        >
          {REGIONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          value={productType}
          onChange={e => updateParam('type', e.target.value)}
          className={selectClass}
        >
          {PRODUCT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {isFiltered && (
          <button
            onClick={() => {
              startTransition(() => {
                router.replace(pathname, { scroll: false })
              })
            }}
            className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
          >
            Clear
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-white/35">
        {isFiltered
          ? `${filteredCount} of ${totalCount} listings`
          : `${totalCount} listings`}
        {isPending && ' — updating...'}
      </p>
    </div>
  )
}
