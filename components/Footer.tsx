import Link from 'next/link'

const platformLinks = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Signals', href: '/signals' },
  { label: 'Intelligence', href: '/intelligence' },
  { label: 'Intake', href: '/intake' },
]

const networkLinks = [
  { label: 'Browse Listings', href: '/marketplace' },
  { label: 'Wanted Requests', href: '/marketplace/wanted' },
  { label: 'Submit Opportunity', href: '/marketplace/sell' },
  { label: 'Services', href: '/marketplace/services' },
]

const companyLinks = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Terms', href: '/legal/terms' },
  { label: 'Disclaimer', href: '/legal/disclaimer' },
]

export default function Footer() {
  return (
    <footer className="bg-navy text-gray-300 mt-auto border-t border-navy-light">
      <div className="page-container py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div>
            <p className="text-gold font-bold text-xl mb-4">Harbourview</p>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              Commercial intelligence, strategic introductions, and market-access support
              for serious participants in regulated markets.
            </p>
          </div>

          <div>
            <p className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
              Platform
            </p>
            <ul className="space-y-3 text-sm">
              {platformLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
              Harbourview Network
            </p>
            <ul className="space-y-3 text-sm">
              {networkLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white font-semibold text-sm uppercase tracking-widest mb-4">
              Company
            </p>
            <ul className="space-y-3 text-sm">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-gold transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-light mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Harbourview. All rights reserved.</p>
          <p className="text-center sm:text-right max-w-md leading-relaxed">
            Harbourview supports confidential commercial engagement through controlled intake,
            reviewed pathways, and source-backed intelligence across regulated markets.
          </p>
        </div>
      </div>
    </footer>
  )
}
