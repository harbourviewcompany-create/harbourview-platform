'use client'

import { useRouter } from 'next/navigation'

export function CountrySwitcher({ countries, currentSlug, id = 'country-switcher' }: { countries: { slug: string; displayName: string; dashboardPath: string }[]; currentSlug: string; id?: string }) {
  const router = useRouter()

  return (
    <select
      id={id}
      value={currentSlug}
      onChange={(event) => {
        const next = countries.find((country) => country.slug === event.target.value)
        if (next) router.push(next.dashboardPath)
      }}
      className="mt-2 w-full rounded-xl border border-white/15 bg-[#07111f] px-3 py-3 text-sm text-white"
      aria-label="Switch dashboard country"
    >
      {countries.map((country) => <option key={country.slug} value={country.slug}>{country.displayName}</option>)}
    </select>
  )
}
