/**
 * Single source of truth for Admin Control Surface navigation.
 * Every item points at a real App Router page (no SPA section-only links).
 */
export type ControlNavItem = {
  id: string
  label: string
  href: string
  icon: string
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
      { id: 'actions', label: 'Actions', href: '/admin/actions', icon: '▶' },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { id: 'inquiries', label: 'Inquiries', href: '/admin/inquiries', icon: '✉', badgeKey: 'inquiry_pending' },
      { id: 'candidates', label: 'Candidates', href: '/admin/candidates', icon: '◈' },
      { id: 'intake', label: 'Intake Queue', href: '/admin/intake', icon: '↓', badgeKey: 'intake_pending' },
      { id: 'deal', label: 'Deal Board', href: '/admin/deal-board', icon: '⇄' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'signals', label: 'Signals', href: '/admin/signals', icon: '◉', badgeKey: 'unreviewed_signals' },
      { id: 'staging', label: 'Staging Queue', href: '/admin/staging', icon: '□', badgeKey: 'staging_pending' },
      { id: 'intel', label: 'Intel / Agents', href: '/admin/intel', icon: '◆' },
      { id: 'agents', label: 'Agent Console', href: '/admin/agents', icon: '⚙' },
      { id: 'ia', label: 'IA Automation', href: '/admin/intelligence-automation', icon: '⚡' },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { id: 'clinical', label: 'Clinical Home', href: '/admin/clinical-home', icon: '✚' },
      { id: 'clinreview', label: 'Evidence Queue', href: '/admin/clinical-review', icon: '◎' },
      { id: 'claimmap', label: 'Claim Map', href: '/admin/clinical-review/claim-map', icon: '▦' },
      { id: 'genetics', label: 'Genetics Review', href: '/admin/genetics/review', icon: '🧬' },
    ],
  },
  {
    label: 'Data',
    items: [
      { id: 'sources', label: 'Sources', href: '/admin/sources', icon: '○' },
      { id: 'countries', label: 'Countries', href: '/admin/countries', icon: '◎' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'users', label: 'Users', href: '/admin/users', icon: '◷' },
      { id: 'feed', label: 'Public Feed', href: '/admin/feed', icon: '⊕' },
      { id: 'stripe', label: 'Stripe', href: '/admin/stripe-setup', icon: '$' },
      { id: 'governance', label: 'Governance', href: '/admin/governance', icon: '⚖' },
    ],
  },
]

export function matchControlNav(pathname: string, _search: string): string | null {
  if (pathname === '/admin/hub' || pathname === '/admin') return 'overview'
  const rules: [string, string][] = [
    ['/admin/clinical-review/claim-map', 'claimmap'],
    ['/admin/clinical-review', 'clinreview'],
    ['/admin/clinical-home', 'clinical'],
    ['/admin/genetics', 'genetics'],
    ['/admin/signals', 'signals'],
    ['/admin/staging', 'staging'],
    ['/admin/intel', 'intel'],
    ['/admin/agents', 'agents'],
    ['/admin/intelligence-automation', 'ia'],
    ['/admin/sources', 'sources'],
    ['/admin/countries', 'countries'],
    ['/admin/users', 'users'],
    ['/admin/feed', 'feed'],
    ['/admin/stripe-setup', 'stripe'],
    ['/admin/actions', 'actions'],
    ['/admin/intake', 'intake'],
    ['/admin/deal-board', 'deal'],
    ['/admin/deal-dashboard', 'deal'],
    ['/admin/inquiries', 'inquiries'],
    ['/admin/candidates', 'candidates'],
    ['/admin/governance', 'governance'],
  ]
  for (const [prefix, id] of rules) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return id
  }
  return null
}
