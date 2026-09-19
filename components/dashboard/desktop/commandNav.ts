import type { CommandPage } from '../CommandCentre'

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

// Flat list — used by pageTitle, CommandPalette, mobile nav
export const NAV_ITEMS_FLAT: NavItem[] = NAV_SECTIONS.flatMap(s => s.items)
