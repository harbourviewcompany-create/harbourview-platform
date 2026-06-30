import Link from 'next/link'
import {
  geneticsFilterOptions,
  type GeneticsFilterSearchParams,
} from '@/lib/marketplace/genetics/publicProjection'

function createFilterHref(
  current: GeneticsFilterSearchParams,
  updates: Partial<GeneticsFilterSearchParams>,
) {
  const params = new URLSearchParams()

  const next = {
    ...current,
    ...updates,
  }

  for (const [key, value] of Object.entries(next)) {
    if (value && value.trim().length > 0) {
      params.set(key, value)
    }
  }

  const query = params.toString()
  return query ? `/marketplace/genetics?${query}` : '/marketplace/genetics'
}

function FilterGroup({
  label,
  activeValue,
  current,
  queryKey,
  values,
}: {
  label: string
  activeValue?: string
  current: GeneticsFilterSearchParams
  queryKey: keyof GeneticsFilterSearchParams
  values: readonly string[]
}) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold/70">
        {label}
      </p>

      <div className="flex flex-wrap gap-2">
        <Link
          href={createFilterHref(current, { [queryKey]: '' })}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            !activeValue
              ? 'border-gold/30 bg-gold/10 text-gold-light'
              : 'border-gold/10 text-white/52 hover:border-gold/25 hover:text-gold-light'
          }`}
        >
          All
        </Link>

        {values.map((value) => {
          const isActive = activeValue?.toLowerCase() === value.toLowerCase()

          return (
            <Link
              key={value}
              href={createFilterHref(current, { [queryKey]: value })}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                isActive
                  ? 'border-gold/30 bg-gold/10 text-gold-light'
                  : 'border-gold/10 text-white/52 hover:border-gold/25 hover:text-gold-light'
              }`}
            >
              {value}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function GeneticsSearchFilters({
  searchParams,
}: {
  searchParams: GeneticsFilterSearchParams
}) {
  return (
    <div className="rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(8,18,30,0.96)_0%,rgba(4,10,18,0.98)_100%)] p-6">
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/70">
            Genetics Filters
          </p>
          <h3 className="text-xl font-semibold text-[#f4f1eb]">
            Browse approved genetics opportunities.
          </h3>
        </div>

        <Link
          href="/dashboard?page=genetics"
          className="text-sm text-gold/80 hover:text-gold-light"
        >
          Reset filters
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FilterGroup
          label="Program Type"
          activeValue={searchParams.type}
          current={searchParams}
          queryKey="type"
          values={geneticsFilterOptions.types}
        />

        <FilterGroup
          label="Commercial Pathway"
          activeValue={searchParams.pathway}
          current={searchParams}
          queryKey="pathway"
          values={geneticsFilterOptions.pathways}
        />

        <FilterGroup
          label="Region"
          activeValue={searchParams.region}
          current={searchParams}
          queryKey="region"
          values={geneticsFilterOptions.regions}
        />

        <FilterGroup
          label="Access Level"
          activeValue={searchParams.access}
          current={searchParams}
          queryKey="access"
          values={geneticsFilterOptions.accessLevels}
        />
      </div>
    </div>
  )
}
