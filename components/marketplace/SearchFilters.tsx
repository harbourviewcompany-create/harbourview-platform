'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { FILTER_REGIONS, FILTER_LISTING_CATEGORIES, LISTING_SORT_OPTIONS } from '@/lib/marketplace/formOptions'

const selectClass =
  'rounded-full border border-white/10 bg-[#0B1A2F] px-4 py-2.5 text-sm text-[#F5F1E8] outline-none ring-[#C6A55A]/40 focus:ring-2 appearance-none cursor-pointer hover:border-[#C6A55A]/40 transition-colors'

const inputClass =
  'rounded-full border border-white/10 bg-[#0B1A2F] px-4 py-2.5 text-sm text-[#F5F1E8] placeholder-white/30 outline-none ring-[#C6A55A]/40 focus:ring-2 hover:border-[#C6A55A]/40 transition-colors w-full sm:w-64'

export function SearchFilters({
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

  const category = searchParams.get('category') ?? 'all'
  const region = searchParams.get('region') ?? 'all'
  const sort = searchParams.get('sort') ?? 'featured'
  const search = searchParams.get('q') ?? ''
  const isFiltered = category !== 'all' || region !== 'all' || sort !== 'featured' || search !== ''

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
          value={category}
          onChange={e => updateParam('category', e.target.value)}
          className={selectClass}
        >
          {FILTER_LISTING_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={region}
          onChange={e => updateParam('region', e.target.value)}
          className={selectClass}
        >
          {FILTER_REGIONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={e => updateParam('sort', e.target.value)}
          className={selectClass}
        >
          {LISTING_SORT_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
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
