import Link from 'next/link'

const platformLinks = [
  { label: 'Harbourview Network', href: '/marketplace' },
  { label: 'Intelligence', href: '/intelligence' },
  { label: 'Signals', href: '/signals' },
  { label: 'Compliance Pathways', href: '/compliance' },
  { label: 'Request Introduction', href: '/intake' },
]

const networkLinks = [
  { label: 'Explore Network', href: '/marketplace' },
  { label: 'Reviewed Listings', href: '/marketplace/listings' },
  { label: 'Wanted Requests', href: '/marketplace/wanted' },
  { label: 'Submit Opportunity', href: '/marketplace/sell' },
  { label: 'Clinical Education', href: '/network/clinical-education' },
]

const companyLinks = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Terms', href: '/legal/terms' },
]
import { footerGroups } from '@/lib/institutional/content'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gold/10 bg-[#030b16] text-gray-300">
      <div className="page-container py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:gap-12">
          <div className="max-w-sm border-b border-gold/10 pb-8 lg:border-0 lg:pb-0">
            <p className="premium-wordmark text-[16px] sm:text-[18px]">HARBOURVIEW</p>
            <div className="mt-5 h-px w-14 bg-gradient-to-r from-gold to-gold-light" />
            <p className="mt-5 text-sm leading-7 text-white/58">
              Commercial intelligence, controlled network access and market-access support for serious participants.
            </p>
          </div>

          <div>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/78">Platform</p>
            <ul className="space-y-3 text-sm text-white/62">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-gold">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/78">Network</p>
            <ul className="space-y-3 text-sm text-white/62">
              {networkLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-gold">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/78">Company</p>
            <ul className="space-y-3 text-sm text-white/62">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-gold">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-gold/10 pt-6 text-xs text-white/38 sm:mt-12 sm:flex-row sm:items-end sm:justify-between">
          <p>© {new Date().getFullYear()} Harbourview. All rights reserved.</p>
          <p className="max-w-md leading-6 sm:text-right">
            Public pages support discovery and context. Sensitive commercial information is handled through reviewed private workflows.
          </p>
        </div>
      </div>
    </footer>
  )
}
