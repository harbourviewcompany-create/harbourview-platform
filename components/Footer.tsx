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
        <div className="border-b border-gold/10 pb-10">
          <p className="premium-wordmark text-[16px] sm:text-[18px]">HARBOURVIEW</p>

          <div className="mt-5 h-px w-14 bg-gradient-to-r from-gold to-gold-light" />

          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/58">
            Controlled commercial network access, reviewed intelligence, professional education,
            policy resources and institutional pathways for serious participants in regulated
            cannabis markets.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-9 pt-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/78">
                {group.title}
              </p>

              <ul className="space-y-3 text-sm text-white/62">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}-${link.href}`}>
                    <Link href={link.href} className="transition-colors hover:text-gold">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-gold/10 pt-6 text-xs text-white/38 sm:mt-12 sm:flex-row sm:items-end sm:justify-between">
          <p>© {new Date().getFullYear()} Harbourview. All rights reserved.</p>

          <p className="max-w-2xl leading-6 sm:text-right">
            Harbourview is intentionally not an open-contact directory. Public pages support
            discovery and context. Sensitive commercial, regulatory, documentary and counterparty
            information is handled through reviewed private workflows.
          </p>
        </div>
      </div>
    </footer>
  )
}