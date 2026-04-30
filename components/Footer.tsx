import Link from 'next/link'

const marketplaceLinks = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Submit Listing', href: '/marketplace/sell' },
  { label: 'Wanted Requests', href: '/marketplace/wanted' },
  { label: 'New Products', href: '/marketplace/new-products' },
  { label: 'Used & Surplus', href: '/marketplace/used-surplus' },
  { label: 'Cannabis Inventory', href: '/marketplace/cannabis-inventory' },
  { label: 'Services', href: '/marketplace/services' },
  { label: 'Business Opportunities', href: '/marketplace/business-opportunities' },
]

const companyLinks = [
  { label: 'Signals', href: '/signals' },
  { label: 'Intelligence', href: '/intelligence' },
  { label: 'Intake', href: '/intake' },
  { label: 'Supplier Directory', href: '/supplier-directory' },
  { label: 'Contact', href: '/contact' },
]

const legalLinks = [
  { label: 'Privacy Policy', href: '/legal/privacy' },
  { label: 'Terms of Use', href: '/legal/terms' },
  { label: 'Disclaimer', href: '/legal/disclaimer' },
]

export default function Footer() {
  return (
    <footer className="bg-navy text-gray-300 mt-auto">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <p className="text-gold font-bold text-lg mb-2">Harbourview</p>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Commercial intelligence, strategic introductions, and market-access
              support for serious participants in regulated markets.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">Marketplace</p>
            <ul className="space-y-2 text-sm">
              {marketplaceLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">Company</p>
            <ul className="space-y-2 text-sm">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">Legal</p>
            <ul className="space-y-2 text-sm">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-light mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Harbourview. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/legal/privacy" className="hover:text-gold transition-colors">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-gold transition-colors">Terms</Link>
            <Link href="/legal/disclaimer" className="hover:text-gold transition-colors">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
