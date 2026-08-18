export type AdminNavStatus = 'live' | 'in_progress'

export type AdminNavItem = {
  label: string
  href: string
  status?: AdminNavStatus
  description?: string
}

export type AdminNavGroup = {
  label: string
  items: AdminNavItem[]
}

/**
 * Canonical admin navigation. Route existence is intentionally broader than
 * the primary navigation: specialist routes remain addressable even when they
 * sit in the More group. Keep this file as the single shell/navigation source
 * of truth; /admin/hub retains its legacy internal nav only until parity exit.
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: 'Command',
    items: [
      { label: 'Command Center', href: '/admin', description: 'Action-first operational overview' },
      { label: 'Work Queue', href: '/admin/work', description: 'Normalized review and exception queue' },
      { label: 'Signals', href: '/admin/signals', description: 'Engine and regulatory signal review' },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { label: 'Inquiries', href: '/admin/inquiries' },
      { label: 'Candidates', href: '/admin/candidates' },
      { label: 'Listings', href: '/admin/listings' },
      { label: 'Intake queue', href: '/admin/marketplace/intake-queue' },
      { label: 'Deal dashboard', href: '/admin/deal-dashboard' },
      { label: 'Applications', href: '/admin/applications' },
      { label: 'Counterparties', href: '/admin/counterparties' },
      { label: 'Organizations', href: '/admin/orgs' },
      { label: 'Members', href: '/admin/members' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Sources', href: '/admin/sources' },
      { label: 'Automation', href: '/admin/intelligence-automation' },
      { label: 'Briefings', href: '/admin/intelligence/briefings' },
      { label: 'Health Canada', href: '/admin/intelligence/health-canada' },
      { label: 'Agents', href: '/admin/agents' },
      { label: 'Prop. Intelligence', href: '/admin/proprietary-intelligence' },
      { label: 'Clinical evidence', href: '/clinical/review' },
      { label: 'Genetics routing', href: '/admin/routing/genetics' },
      { label: 'Genetics review', href: '/admin/genetics/review' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Pipeline health', href: '/admin/pipeline-health' },
      { label: 'Stripe health', href: '/admin/stripe-health' },
      { label: 'Stripe setup (legacy)', href: '/admin/stripe-setup' },
    ],
  },
  {
    label: 'More',
    items: [
      { label: 'Enterprise', href: '/admin/enterprise' },
      { label: 'Partners', href: '/admin/partners' },
      { label: 'Monetization', href: '/admin/monetization' },
      { label: 'Reports', href: '/admin/reports' },
      { label: 'Governance', href: '/admin/governance' },
      { label: 'Global expansion', href: '/admin/global-expansion' },
      { label: 'Regulatory pathways', href: '/admin/regulatory-pathways' },
      { label: 'Education', href: '/admin/education', status: 'in_progress' },
      { label: 'Network review', href: '/admin/network', status: 'in_progress' },
      { label: 'Regulatory signals legacy', href: '/admin/regulatory-signals', status: 'in_progress' },
      { label: 'Legacy Hub parity', href: '/admin/hub' },
    ],
  },
]

export const ADMIN_PRIMARY_HREFS = new Set(
  ADMIN_NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href)),
)
