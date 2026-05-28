import type { DashboardSectionSlug } from './contracts'

export const dashboardStorageKeys = {
  lastSelectedCountry: 'harbourview.dashboard.lastSelectedCountry',
  recentlyViewedCountries: 'harbourview.dashboard.recentlyViewedCountries',
  preferredDashboardSection: 'harbourview.dashboard.preferredDashboardSection',
} as const

export function persistDashboardSelection(slug: string, section?: DashboardSectionSlug) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(dashboardStorageKeys.lastSelectedCountry, slug)
  if (section) window.localStorage.setItem(dashboardStorageKeys.preferredDashboardSection, section)
  const previous = JSON.parse(window.localStorage.getItem(dashboardStorageKeys.recentlyViewedCountries) ?? '[]') as string[]
  const next = [slug, ...previous.filter((item) => item !== slug)].slice(0, 8)
  window.localStorage.setItem(dashboardStorageKeys.recentlyViewedCountries, JSON.stringify(next))
}
