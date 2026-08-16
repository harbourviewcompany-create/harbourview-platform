import Link from 'next/link'
import { footerGroups } from '@/lib/institutional/content'

const publicFooterGroups = footerGroups
  .map((group) => ({
    ...group,
    links: group.links.filter((link) => {
      const label = link.label.toLowerCase()
      const href = link.href.toLowerCase()
      return !label.includes('supplier') && !href.includes('supplier')
    }),
  }))
  .filter((group) => group.links.length > 0)

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[color:var(--hv-gold)]/10 bg-[color:var(--hv-navy-deep)] text-[color:var(--hv-muted)]">
      <div className="page-container py-12 sm:py-16">
        <div className="border-b border-[color:var(--hv-gold)]/10 pb-10">
          <p className="premium-wordmark text-[16px] sm:text-[18px]">HARBOURVIEW</p>
          <div className="mt-5 h-px w-14 bg-gradient-to-r from-[color:var(--hv-gold)] to-[color:var(--hv-gold-light)]" />
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[color:var(--hv-text-secondary)]">
            Harbourview gives serious operators in regulated cannabis markets the intelligence,
            introductions, and access pathways that aren&apos;t available publicly.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-9 pt-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9">
          {publicFooterGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.26em] text-[color:var(--hv-gold)]/78">
                {group.title}
              </p>
              <ul className="space-y-3 text-sm text-white/62">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}-${link.href}`}>
                    <Link href={link.href} className="transition-colors hover:text-[color:var(--hv-gold)]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[color:var(--hv-gold)]/10 pt-6 text-xs text-white/38 sm:mt-12 sm:flex-row sm:items-end sm:justify-between">
          <p>© {new Date().getFullYear()} Harbourview. All rights reserved.</p>
          <p className="max-w-2xl leading-6 sm:text-right">
            Public pages give you enough to orient and decide. Sensitive commercial detail,
            counterparty information, and reviewed introductions move through controlled private
            workflows — not open directories.
          </p>
        </div>
      </div>
    </footer>
  )
}
