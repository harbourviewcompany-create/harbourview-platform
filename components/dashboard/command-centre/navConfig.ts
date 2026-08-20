/** Command Centre nav + role briefing module shortcuts */
import type { CommandPage } from './types'

export type NavItem = { id: CommandPage; label: string; icon: string }
export type NavSection = { label?: string; items: NavItem[] }

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { id: 'briefing',    label: 'Briefing Room', icon: '◎' },
      { id: 'digest',      label: 'Daily Digest',  icon: '❑' },
      { id: 'marketplace', label: 'Marketplace',   icon: '⊞' },
      { id: 'signals',     label: 'Intelligence',  icon: '≋' },
      { id: 'watchlist',   label: 'Watchlist',     icon: '◈' },
    ],
  },
  {
    label: 'Market Access',
    items: [
      { id: 'access-pathway', label: 'Access Pathway',   icon: '⬡' },
      { id: 'regulatory',     label: 'Regulatory Watch', icon: '◷' },
      { id: 'local-intel',    label: 'Local Intel',      icon: '◉' },
      { id: 'evidence',       label: 'Research',         icon: '⊟' },
    ],
  },
  {
    label: 'Trade & Commerce',
    items: [
      { id: 'prices',     label: 'Price Intel',     icon: '⊕' },
      { id: 'trade-calc', label: 'Trade Calculator', icon: '⊜' },
      { id: 'logistics',  label: 'Logistics',       icon: '⬡' },
      { id: 'banking',    label: 'Banking',         icon: '⊟' },
      { id: 'insurance',  label: 'Insurance',       icon: '⊡' },
    ],
  },
  {
    label: 'Industry',
    items: [
      { id: 'events',  label: 'Events',           icon: '◷' },
      { id: 'jobs',    label: 'Jobs Board',       icon: '◉' },
      { id: 'talent',  label: 'Talent',           icon: '◇' },
      { id: 'experts', label: 'Expert Directory', icon: '⊚' },
    ],
  },
  {
    label: 'Compliance & Legal',
    items: [
      { id: 'genetics',   label: 'Genetics',    icon: '⊕' },
      { id: 'clinical',   label: 'Clinical',    icon: '⚕' },
      { id: 'compliance', label: 'Compliance',  icon: '◫' },
      { id: 'licences',   label: 'Licences',    icon: '◨' },
      { id: 'kyb',        label: 'KYB / Verify', icon: '◫' },
      { id: 'countries',  label: 'Countries',   icon: '⊗' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { id: 'assistant',     label: 'AI Assistant',  icon: '◈' },
      { id: 'notifications', label: 'Notifications', icon: '◎' },
      { id: 'documents',     label: 'Documents',     icon: '⊡' },
      { id: 'organization',  label: 'Organization',  icon: '⊙' },
      { id: 'settings',      label: 'Settings',      icon: '⊙' },
    ],
  },
]

// Flat list — used by pageTitle lookup and mobile nav mirror
export const NAV_ITEMS_FLAT: NavItem[] = NAV_SECTIONS.flatMap(s => s.items)

/** Role-specific briefing shortcuts (Doctor / Pharmacist / Clinic include Clinical) */
export const BRIEFING_ROLE_MODULES: Record<string, Array<{ page: CommandPage; icon: string; label: string; why: string }>> = {
  'Doctor':      [
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Patient prescription framework & clinical authorizations' },
    { page: 'clinical',       icon: '⚕', label: 'Clinical',           why: 'Governed evidence, authority, and prescriber workspace' },
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Track prescribing and formulary rule changes' },
    { page: 'experts',        icon: '⊛', label: 'Expert Directory',   why: 'Connect with clinical pharmacologists & peers' },
  ],
  'Pharmacist':  [
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Dispensing authorization and pharmacy permit chain' },
    { page: 'clinical',       icon: '⚕', label: 'Clinical',           why: 'Governed evidence, product, and safety workspace' },
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'Pharmacy permit renewals and compliance deadlines' },
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Formulary, scheduling, and dispensing rule updates' },
  ],
  'Budtender':   [
        { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Retail sales rules and age-verification requirements' },
    { page: 'marketplace',    icon: '◈', label: 'Marketplace',        why: 'Available SKUs, new listings, and product mix' },
  ],
  'Cultivator':  [
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'Cultivation licence renewal and compliance tracking' },
    { page: 'prices',         icon: '⊞', label: 'Price Intelligence', why: 'Wholesale benchmark pricing for your output markets' },
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Production approval and GMP certification pathway' },
  ],
  'Geneticist':  [
    { page: 'genetics',       icon: '◈', label: 'Genetics',           why: 'Cultivar passports, phenotype registry, and research' },
    { page: 'evidence',       icon: '⊛', label: 'Evidence Sources',   why: 'Peer-reviewed genetics and pharmacology literature' },
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Plant variety protection and IP filing requirements' },
  ],
  'Processor':   [
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'Processing and extraction licence compliance tracking' },
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Manufacturing authorization and GMP certification' },
    { page: 'prices',         icon: '⊞', label: 'Price Intelligence', why: 'Distillate and concentrate benchmark pricing' },
  ],
  'Lab/QA':      [
    { page: 'compliance',     icon: '◫', label: 'Compliance',         why: 'Testing standards, SOP frameworks, and lab certifications' },
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'ISO 17025 accreditation and operating licence renewals' },
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'COA format requirements and potency testing rule changes' },
  ],
  'Importer':    [
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Import permit process and customs clearance framework' },
    { page: 'trade-calc',     icon: '⊞', label: 'Landed Cost',        why: 'Model corridor economics and total landed cost' },
    { page: 'logistics',      icon: '⬡', label: 'Logistics',          why: 'Licensed narcotics freight and customs brokerage' },
  ],
  'Exporter':    [
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Export permit chain and destination market requirements' },
    { page: 'trade-calc',     icon: '⊞', label: 'Landed Cost',        why: 'Corridor economics for target destinations' },
    { page: 'logistics',      icon: '⬡', label: 'Logistics',          why: 'Export freight partners and documentation support' },
  ],
  'Distributor': [
    { page: 'marketplace',    icon: '◈', label: 'Marketplace',        why: 'Supply and demand signals across your distribution footprint' },
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'Distribution licence renewals and GDP certification' },
    { page: 'banking',        icon: '⊞', label: 'Banking',            why: 'Treasury and payment rails for multi-market distribution' },
  ],
  'Clinic Op.':  [
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Clinical authorization and patient prescription framework' },
    { page: 'clinical',       icon: '⚕', label: 'Clinical',           why: 'Governed evidence, authority, and prescriber workspace' },
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'Clinic operating licence and prescribing authority tracking' },
    { page: 'kyb',            icon: '◫', label: 'KYB Verification',   why: 'Due diligence on suppliers, labs, and clinic partners' },
  ],
  'Retail':      [
    { page: 'marketplace',    icon: '◈', label: 'Marketplace',        why: 'Product availability and wholesale sourcing' },
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Retail compliance and packaging rule changes' },
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'Retail licence renewals and inspection schedules' },
  ],
  'Broker':      [
    { page: 'marketplace',    icon: '◈', label: 'Marketplace',        why: 'Live listings and wanted demand across corridors' },
    { page: 'trade-calc',     icon: '⊞', label: 'Landed Cost',        why: 'Corridor economics for client deal structuring' },
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Permit chains that gate cross-border deals' },
  ],
  'Consultant':  [
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Reform tracking across client jurisdictions' },
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Market entry frameworks for client advisory' },
    { page: 'evidence',       icon: '⊛', label: 'Evidence Sources',   why: 'Primary sources supporting regulatory opinions' },
  ],
  'Operator':    [
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'Multi-site licence portfolio and renewal calendar' },
    { page: 'compliance',     icon: '◫', label: 'Compliance',         why: 'SOPs and standards across operating jurisdictions' },
    { page: 'marketplace',    icon: '◈', label: 'Marketplace',        why: 'Supply gaps and demand signals for capacity planning' },
  ],
  'Finance':     [
    { page: 'banking',        icon: '⊞', label: 'Banking',            why: 'Cannabis-friendly banking and payment partners' },
    { page: 'insurance',      icon: '⊡', label: 'Insurance',          why: 'Speciality lines for cultivation through retail' },
    { page: 'trade-calc',     icon: '⊞', label: 'Landed Cost',        why: 'Corridor unit economics for credit analysis' },
  ],
  'Compliance':  [
    { page: 'compliance',     icon: '◫', label: 'Compliance',         why: 'Standards, SOPs, and inspection frameworks' },
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Pending rule changes affecting controlled operations' },
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'Portfolio-wide licence expiry and renewal management' },
  ],
  'Legal':       [
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Legislative reform tracking and pending consultation alerts' },
    { page: 'compliance',     icon: '◫', label: 'Compliance',         why: 'Jurisdiction legal framework and regulatory precedents' },
    { page: 'kyb',            icon: '◈', label: 'KYB Verification',   why: 'AML and entity verification for client onboarding' },
  ],
  'Investor':    [
    { page: 'marketplace',    icon: '◈', label: 'Marketplace',        why: 'Approved listings, deal flow, and operator landscape' },
    { page: 'prices',         icon: '⊞', label: 'Price Intelligence', why: 'Wholesale benchmark pricing driving unit economics' },
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Market entry difficulty and timeline risk by jurisdiction' },
  ],
  'Regulator':   [
    { page: 'regulatory',     icon: '◷', label: 'Regulatory Watch',   why: 'Cross-jurisdictional reform tracking and comparable markets' },
    { page: 'evidence',       icon: '⊛', label: 'Evidence Sources',   why: 'Scientific evidence base informing regulatory frameworks' },
    { page: 'compliance',     icon: '◫', label: 'Compliance',         why: 'Standards and SOPs across regulated jurisdictions' },
  ],
  'Patient Ed.': [
        { page: 'experts',        icon: '⊛', label: 'Expert Directory',   why: 'Find qualified patient educators and healthcare professionals' },
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Patient access framework for your jurisdiction' },
  ],
  'GMP/QA':      [
    { page: 'compliance',     icon: '◫', label: 'Compliance',         why: 'EU-GMP, ICH Q7, and GACP compliance frameworks' },
    { page: 'licences',       icon: '⊙', label: 'Licence Tracker',    why: 'GMP certification renewals and inspection due dates' },
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'GMP-gated export corridor requirements' },
  ],
  'Logistics':   [
    { page: 'logistics',      icon: '⬡', label: 'Logistics',          why: 'Freight forwarders, customs brokers, and narcotics handlers' },
    { page: 'trade-calc',     icon: '⊞', label: 'Landed Cost',        why: 'Air freight rates, narcotics surcharges, and corridor costs' },
    { page: 'access-pathway', icon: '◎', label: 'Access Pathway',     why: 'Import/export permit chain for each corridor' },
  ],
}
