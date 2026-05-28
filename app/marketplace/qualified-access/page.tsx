import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Qualified Access | Harbourview',
  description:
    'Request reviewed commercial access to confidential cannabis marketplace listings, protected dealrooms and counterparty introductions. Harbourview review required.',
}

const accessTiers = [
  {
    tier: 'Verified industry access',
    description: 'Expanded public-safe marketplace detail, qualified request forms and structured profile capability after industry verification.',
    requirements: ['Active licensed operator, professional or institution', 'Role and jurisdiction verification', 'Harbourview review and approval'],
    available: true,
  },
  {
    tier: 'Reviewed commercial access',
    description: 'Confidential listing detail, counterparty introductions, protected dealroom documents and qualified routing for specific transactions.',
    requirements: ['Verified industry status', 'Transaction-specific qualification', 'NDA or equivalent executed with relevant parties', 'Harbourview review of commercial context'],
    available: true,
  },
  {
    tier: 'Protected dealroom access',
    description: 'Secure document exchange, structured counterparty review and controlled introduction for distressed assets, M&A and sensitive commercial transactions.',
    requirements: ['Reviewed commercial access', 'Specific asset or transaction approval', 'Party and diligence review by Harbourview', 'Legal and regulatory eligibility confirmed'],
    available: true,
  },
]

const protectedCategories = [
  { label: 'Distressed businesses', href: '/marketplace/distressed-businesses' },
  { label: 'Distressed inventory', href: '/marketplace/distressed-inventory' },
  { label: 'Business opportunities', href: '/marketplace/business-opportunities' },
  { label: 'Cannabis inventory', href: '/marketplace/cannabis-inventory' },
  { label: 'Wanted requests', href: '/marketplace/wanted' },
]

export default function QualifiedAccessPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-gold/10 bg-[#061120] py-14 text-white sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(198,165,90,0.08),transparent_30%)]" />
        <div className="page-container relative z-10">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">
            <Link href="/marketplace" className="transition-colors hover:text-gold">Exchange</Link>{' / Qualified Access'}
          </p>
          <h1 className="max-w-4xl font-serif text-[2.2rem] leading-[1.06] tracking-normal text-[#f5f1e8] sm:text-5xl lg:text-6xl">
            Reviewed commercial access to protected listings and dealrooms.
          </h1>
          <div className="mt-6 max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
            <p>
              Harbourview controls access to confidential listings, counterparty introductions and protected dealrooms.
              Public pages show only sanitised summaries. Full detail, counterparty identity and transaction materials
              are disclosed only after review and qualification.
            </p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/intake" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">Request qualified access</Link>
            <Link href="/network" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">Join Harbourview Network</Link>
          </div>
        </div>
      </section>

      <section className="bg-[#030b16] py-12 sm:py-16">
        <div className="page-container">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">Access tiers</p>
            <h2 className="font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">Three levels of reviewed access.</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {accessTiers.map((tier) => (
              <div key={tier.tier} className="flex flex-col rounded-sm border border-gold/10 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
                <div className="mb-5 h-px w-12 bg-gradient-to-r from-gold to-gold-light opacity-70" />
                <h3 className="mb-3 text-base font-semibold text-[#f5f1e8]">{tier.tier}</h3>
                <p className="mb-5 flex-1 text-sm leading-7 text-white/58">{tier.description}</p>
                <div>
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold/60">Requirements</p>
                  <ul className="space-y-2">
                    {tier.requirements.map((req) => (
                      <li key={req} className="flex items-start gap-2 text-sm text-white/52">
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold/50" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gold/10 bg-[#020814] py-10">
        <div className="page-container">
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">Protected categories</p>
          <div className="flex flex-wrap gap-3">
            {protectedCategories.map((cat) => (
              <Link key={cat.href} href={cat.href}
                className="rounded-full border border-gold/25 bg-gold/8 px-4 py-2 text-sm text-gold/80 transition-colors hover:border-gold/50 hover:text-gold">
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-gold/10 bg-[#020814] py-8">
        <div className="page-container">
          <div className="rounded-sm border border-gold/20 bg-[linear-gradient(180deg,rgba(10,20,35,0.94)_0%,rgba(5,12,22,0.98)_100%)] p-6">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/72">No automatic access</p>
            <p className="text-sm leading-7 text-white/62">
              Qualification does not guarantee access to any specific listing, counterparty or dealroom.
              Each access request is reviewed individually. Harbourview does not act as a broker, dealer or
              licenced intermediary. All commercial decisions, diligence and legal obligations remain with the relevant parties.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#030b16] py-14 sm:py-18">
        <div className="page-container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-gold/72">Request access</p>
            <h2 className="mb-6 font-serif text-3xl leading-tight tracking-[-0.035em] text-[#f5f1e8] sm:text-4xl">
              Start the qualification process.
            </h2>
            <p className="mb-8 text-sm leading-7 text-white/58">
              Submit your role, organisation and commercial context through the Harbourview intake form.
              Harbourview reviews all requests before routing. There is no automatic access to any protected listing or dealroom.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/intake" className="btn-marketplace min-h-[52px] justify-center text-center text-sm">Request qualified access</Link>
              <Link href="/trust-governance" className="btn-intelligence min-h-[52px] justify-center text-center text-sm">Verification and trust</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
