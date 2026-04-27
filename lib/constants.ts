export const HARBOURVIEW_EMAIL = 'harborviewcompany@gmail.com'
export const HARBOURVIEW_PHONE = '1-613-485-1620'
export const HARBOURVIEW_LINKEDIN = 'linkedin.com/in/wtylercampbell'
export const HARBOURVIEW_LINKEDIN_URL = 'https://www.linkedin.com/in/wtylercampbell'
export const HARBOURVIEW_WEBSITE = 'harbourview.io'

export const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || ''

export const VISITOR_TYPES = [
  'Operator',
  'Cultivator',
  'Genetics company',
  'Brand',
  'Processor',
  'Manufacturer',
  'Importer',
  'Exporter',
  'Distributor',
  'Wholesaler',
  'Investor',
  'Clinician',
  'Physician',
  'Pharmacist',
  'Consultant',
  'Service provider',
  'Strategic partner',
  'Other',
] as const

export const OBJECTIVES = [
  'Find buyers',
  'Find sellers',
  'Enter a new market',
  'Understand a market',
  'Assess an opportunity',
  'Review import/export readiness',
  'Find partners',
  'Find investors',
  'Explore clinical or pharmacy pathways',
  'Review documents or compliance readiness',
  'Discuss a commercial mandate',
  'Other',
] as const

export const PREFERRED_NEXT_STEPS = [
  'Send details by email',
  'Book a call',
  'Complete a deeper intake',
  'Not sure yet',
] as const

export const NAV_LINKS = [
  { label: 'What We Do', href: '/what-we-do' },
  { label: 'Market Access', href: '/market-access' },
  { label: 'Intelligence', href: '/commercial-intelligence' },
  { label: 'Introductions', href: '/strategic-introductions' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Intake', href: '/intake' },
  { label: 'Contact', href: '/contact' },
]

export const FOOTER_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'What We Do', href: '/what-we-do' },
  { label: 'Market Access', href: '/market-access' },
  { label: 'Commercial Intelligence', href: '/commercial-intelligence' },
  { label: 'Strategic Introductions', href: '/strategic-introductions' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Submit a Listing', href: '/marketplace/submit-listing' },
  { label: 'Post a Wanted Request', href: '/marketplace/submit-wanted' },
  { label: 'Supplier Directory', href: '/marketplace/supplier-directory' },
  { label: 'Intake', href: '/intake' },
  { label: 'Contact', href: '/contact' },
]

export const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
]
