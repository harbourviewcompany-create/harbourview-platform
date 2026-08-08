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
      { label: 'Orgs', href: '/admin/orgs' },
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
      { label: 'Stripe webhook health', href: '/admin/stripe-health' },
    ],
  },
  {
    label: 'Governance & Expansion',
    items: [
      { label: 'Governance', href: '/admin/governance' },
      { label: 'Global expansion', href: '/admin/global-expansion' },
      // /admin/regulatory-pathways DOES exist (app/admin/(protected)/regulatory-pathways/page.tsx,
      // admin-auth-gated via requireAdminAuth) -- it 404'd for whoever audited this
      // nav only because it was on a checkout/branch that predated the commit adding
      // it on main. It surfaces regulatory_pathways/pathway_format_rules/operator_licences
      // data for fulfilling "Request Country Intelligence" submissions. This is a
      // different page and different dataset from app/intelligence/regulatory-pathways
      // (which renders jurisdiction_playbooks data and is intentionally public, not
      // admin-gated) -- that page does not belong in this admin nav at all, which is
      // exactly what its own prior comment here flagged as suspicious.
      { label: 'Regulatory pathways', href: '/admin/regulatory-pathways' },
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
