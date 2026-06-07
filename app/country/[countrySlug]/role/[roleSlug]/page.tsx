import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { CommandCenterShell } from '@/components/command-center/CommandCenterShell'
import { toCountryRoleDto } from '@/lib/roles/dto'
import { getSafeCountryRoleRedirect, resolveCountryRoleDashboard } from '@/lib/roles/country-role-resolver'
import { roleProfiles } from '@/lib/roles/role-profiles'
import { fixtureCountries } from '@/lib/dashboard/countries'

export const dynamic = 'force-static'

export function generateStaticParams() {
  const countrySlugs = fixtureCountries.slice(0, 12).map((country) => country.slug)
  return countrySlugs.flatMap((countrySlug) => roleProfiles.slice(0, 24).map((role) => ({ countrySlug, roleSlug: role.slug })))
}

export async function generateMetadata({ params }: { params: Promise<{ countrySlug: string; roleSlug: string }> }): Promise<Metadata> {
  const { countrySlug, roleSlug } = await params
  const dashboard = resolveCountryRoleDashboard(countrySlug, roleSlug)
  if (!dashboard) return { title: 'Country-role selector | Harbourview' }
  return { title: `${dashboard.country.countryName} ${dashboard.role.label} Command Center | Harbourview` }
}

export default async function CountryRoleCommandCenterPage({ params }: { params: Promise<{ countrySlug: string; roleSlug: string }> }) {
  const { countrySlug, roleSlug } = await params
  const dashboard = resolveCountryRoleDashboard(countrySlug, roleSlug, 'public_guest')
  if (!dashboard) {
    const safeHref = getSafeCountryRoleRedirect(countrySlug, roleSlug)
    if (safeHref !== `/country/${countrySlug}/role/${roleSlug}`) redirect(safeHref)
    notFound()
  }
  return <CommandCenterShell dto={toCountryRoleDto(dashboard, 'public_guest')} />
}
