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

/**
 * Source of truth for the top-level admin layout nav (/admin/* outside Hub SPA).
 * Hub Control Surface has its own NAV in HubPanel — keep Clinical group aligned.
 */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Hub (Control Surface)', href: '/admin/hub' }],
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
      { label: 'Agents', href: '/admin/agents' },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { label: 'Clinical review queue', href: '/admin/clinical-review' },
      { label: 'Claim map & framework gaps', href: '/admin/clinical-review/claim-map' },
      { label: 'Genetics review', href: '/admin/genetics/review' },
      { label: 'Genetics routing', href: '/admin/routing/genetics' },
      { label: 'Agent evidence actions', href: '/admin/agents/evidence-actions' },
    ],
  },
  {
    label: 'Enterprise & Partners',
    items: [
      { label: 'Enterprise', href: '/admin/enterprise' },
      { label: 'Partners', href: '/admin/partners' },
      { label: 'Prop. Intelligence', href: '/admin/proprietary-intelligence' },
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
