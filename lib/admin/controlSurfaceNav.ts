/**
 * Single source of truth for Admin Control Surface navigation.
 * Used by AdminControlShell (layout) and documented for HubPanel parity.
 */
export type ControlNavItem = {
  id: string
  label: string
  href: string
  icon: string
  /** Optional badge source key resolved by the shell if provided */
  badgeKey?: 'unreviewed_signals' | 'staging_pending' | 'inquiry_pending' | 'intake_pending'
}

export type ControlNavGroup = {
  label: string
  items: ControlNavItem[]
}

export const CONTROL_SURFACE_NAV: ControlNavGroup[] = [
  {
    label: 'Platform',
    items: [
      { id: 'overview', label: 'Overview', href: '/admin/hub', icon: '⬡' },
      { id: 'actions', label: 'Actions', href: '/admin/hub?section=actions', icon: '▶' },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { id: 'inquiries', label: 'Inquiries', href: '/admin/inquiries', icon: '✉', badgeKey: 'inquiry_pending' },
      { id: 'candidates', label: 'Candidates', href: '/admin/candidates', icon: '◈' },
      { id: 'intake', label: 'Intake Queue', href: '/admin/hub?section=intake', icon: '↓', badgeKey: 'intake_pending' },
      { id: 'deal', label: 'Deal Board', href: '/admin/deal-dashboard', icon: '⇄' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'signals', label: 'Signals', href: '/admin/hub?section=signals', icon: '◉', badgeKey: 'unreviewed_signals' },
      { id: 'staging', label: 'Staging Queue', href: '/admin/hub?section=staging', icon: '□', badgeKey: 'staging_pending' },
      { id: 'intel', label: 'Intel / Agents', href: '/admin/hub?section=intel', icon: '◆' },
      { id: 'agents', label: 'Agent Console', href: '/admin/agents', icon: '⚙' },
      { id: 'ia', label: 'IA Automation', href: '/admin/intelligence-automation', icon: '⚡' },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { id: 'clinical', label: 'Clinical Home', href: '/admin/hub?section=clinical', icon: '✚' },
      { id: 'clinreview', label: 'Evidence Queue', href: '/admin/clinical-review', icon: '◎' },
      { id: 'claimmap', label: 'Claim Map', href: '/admin/clinical-review/claim-map', icon: '▦' },
      { id: 'genetics', label: 'Genetics Review', href: '/admin/genetics/review', icon: '🧬' },
    ],
  },
  {
    label: 'Data',
    items: [
      { id: 'sources', label: 'Sources', href: '/admin/hub?section=sources', icon: '○' },
      { id: 'countries', label: 'Countries', href: '/admin/hub?section=countries', icon: '◎' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'users', label: 'Users', href: '/admin/hub?section=users', icon: '◷' },
      { id: 'feed', label: 'Public Feed', href: '/admin/hub?section=feed', icon: '⊕' },
      { id: 'stripe', label: 'Stripe', href: '/admin/hub?section=stripe', icon: '$' },
      { id: 'governance', label: 'Governance', href: '/admin/governance', icon: '⚖' },
    ],
  },
]

export function matchControlNav(pathname: string, search: string): string | null {
  const q = search.startsWith('?') ? search : `?${search}`
  const section = new URLSearchParams(q).get('section')
  if (pathname.startsWith('/admin/hub')) {
    return section || 'overview'
  }
  for (const g of CONTROL_SURFACE_NAV) {
    for (const item of g.items) {
      if (item.href.includes('?')) continue
      if (pathname === item.href || pathname.startsWith(item.href + '/')) {
        return item.id
      }
    }
  }
  // prefix matches for nested clinical etc.
  if (pathname.startsWith('/admin/clinical-review/claim-map')) return 'claimmap'
  if (pathname.startsWith('/admin/clinical-review')) return 'clinreview'
  if (pathname.startsWith('/admin/agents')) return 'agents'
  if (pathname.startsWith('/admin/genetics')) return 'genetics'
  if (pathname.startsWith('/admin/inquiries')) return 'inquiries'
  if (pathname.startsWith('/admin/candidates')) return 'candidates'
  if (pathname.startsWith('/admin/deal-dashboard')) return 'deal'
  if (pathname.startsWith('/admin/intelligence-automation')) return 'ia'
  if (pathname.startsWith('/admin/governance')) return 'governance'
  return null
}
