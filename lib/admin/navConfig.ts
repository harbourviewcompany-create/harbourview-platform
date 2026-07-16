export type AdminNavStatus = 'live' | 'in_progress';

export type AdminNavItem = {
  label: string;
  href: string;
  status?: AdminNavStatus; // defaults to 'live'
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

// Source of truth for the top-level admin nav. Grouped by function so the
// nav scales past a flat list. Deeper sub-routes (e.g. /admin/agents/queues,
// /admin/enterprise/deal-rooms) are assumed reachable via each section's own
// internal navigation once inside it -- this was NOT individually verified
// for every section in this pass. If a section has no internal sub-nav,
// its child routes are still effectively orphaned and need follow-up.
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Hub', href: '/admin/hub' }],
  },
  {
    label: 'Marketplace',
    items: [
      { label: 'Members', href: '/admin/members' },
      { label: 'Inquiries', href: '/admin/inquiries' },
      { label: 'Listings', href: '/admin/listings' },
      { label: 'Deal dashboard', href: '/admin/deal-dashboard' },
      { label: 'Applications', href: '/admin/applications' },
      { label: 'Counterparties', href: '/admin/counterparties' },
      { label: 'Intake queue', href: '/admin/marketplace/intake-queue' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Intelligence automation', href: '/admin/intelligence-automation' },
      { label: 'Sources', href: '/admin/sources' },
      { label: 'Candidates', href: '/admin/candidates' },
      { label: 'Signals', href: '/admin/signals' },
      { label: 'Briefings', href: '/admin/intelligence/briefings' },
      { label: 'Health Canada', href: '/admin/intelligence/health-canada' },
      { label: 'Genetics routing', href: '/admin/routing/genetics' },
      { label: 'Genetics review', href: '/admin/genetics/review' },
    ],
  },
  {
    label: 'Enterprise & Partners',
    items: [
      { label: 'Enterprise', href: '/admin/enterprise' },
      { label: 'Partners', href: '/admin/partners' },
      { label: 'Prop. Intelligence', href: '/admin/proprietary-intelligence' },
      { label: 'Agents', href: '/admin/agents' },
    ],
  },
  {
    label: 'Monetization & Reports',
    items: [
      { label: 'Monetization', href: '/admin/monetization' },
      { label: 'Reports', href: '/admin/reports' },
      { label: 'Stripe setup', href: '/admin/stripe-setup' },
    ],
  },
  {
    label: 'Governance & Expansion',
    items: [
      { label: 'Governance', href: '/admin/governance' },
      { label: 'Global expansion', href: '/admin/global-expansion' },
      // This page lives at app/intelligence/regulatory-pathways, NOT under
      // app/admin/(protected)/ -- it is not admin-auth-gated. The previous
      // link pointed at /admin/regulatory-pathways, which 404s (no such
      // page exists). Corrected here. Flagging for product review: an admin
      // nav routing a user out of the authenticated admin area to a public
      // route is probably not intentional and should be revisited.
      { label: 'Regulatory pathways', href: '/intelligence/regulatory-pathways' },
    ],
  },
  {
    label: 'Unbuilt / in progress',
    items: [
      { label: 'Education (shell only, no live data)', href: '/admin/education', status: 'in_progress' },
      { label: 'Network review (shell only, no live data)', href: '/admin/network', status: 'in_progress' },
      { label: 'Regulatory signals (pipeline never built)', href: '/admin/regulatory-signals', status: 'in_progress' },
    ],
  },
];
