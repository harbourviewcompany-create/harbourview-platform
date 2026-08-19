import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'
import { formatTradeDate, getTradeSpec } from '@/lib/marketplace/tradingMarketplace'
import { getTradingListingBySlug } from '@/lib/server/tradingListingsQuery'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const listing = await getTradingListingBySlug(slug).catch(() => null)
  if (!listing) return { title: 'Trade dossier | Harbourview Exchange' }
  return {
    title: `${listing.title} | Harbourview Exchange`,
    description: listing.description?.slice(0, 160) || 'Reviewed commercial trade dossier on Harbourview Exchange.',
  }
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="border-b border-white/8 py-3 last:border-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-white/72">{value}</dd>
    </div>
  )
}

export default async function TradingListingDetailPage({ params }: Props) {
  const { slug } = await params
  const listing = await getTradingListingBySlug(slug).catch(() => null)
  if (!listing) notFound()

  const spec = getTradeSpec(listing.high_level_specs)
  const isService = listing.category === 'services'
  const quoteHref = `/marketplace/quote?listing=${encodeURIComponent(listing.title)}`
  const published = formatTradeDate(spec.publishedAt ?? listing.created_at)
  const updated = formatTradeDate(spec.updatedAt)

  return (
    <>
      <PublicHero
        eyebrow={isService ? 'Reviewed commercial service' : 'Reviewed wholesale lot'}
        title={listing.title}
        actions={[
          { label: isService ? 'Request Service Introduction' : 'Request Quote', href: quoteHref },
          ...(!isService && spec.sampleAvailable ? [{ label: 'Request Sample', href: `${quoteHref}&intent=sample`, variant: 'secondary' as const }] : []),
          { label: 'Trading Board', href: '/marketplace/trading', variant: 'secondary' },
        ]}
      >
        <p>{listing.description}</p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/58">
          {spec.reference ? <span className="rounded-full border border-white/10 px-3 py-1 font-mono">{spec.reference}</span> : null}
          {spec.availabilityStatus ? <span className="rounded-full border border-gold/25 bg-gold/8 px-3 py-1 text-gold">{spec.availabilityStatus}</span> : null}
          {spec.activityStatus ? <span className="rounded-full border border-white/10 px-3 py-1">{spec.activityStatus}</span> : null}
        </div>
      </PublicHero>

      {spec.images.length > 0 ? (
        <PublicSection tone="dark">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {spec.images.slice(0, 6).map((image) => (
              <div
                key={image.url}
                className="min-h-64 rounded-2xl border border-white/10 bg-cover bg-center shadow-[0_18px_50px_rgba(0,0,0,.25)]"
                role="img"
                aria-label={image.alt}
                style={{ backgroundImage: `url(${JSON.stringify(image.url).slice(1, -1)})` }}
              />
            ))}
          </div>
        </PublicSection>
      ) : null}

      <PublicSection tone="navy">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="space-y-6">
            <PublicCard className="p-7">
              <SectionHeader
                eyebrow={isService ? 'Commercial operating profile' : 'Lot specifications'}
                title={isService ? 'Capacity, process and service terms.' : 'Stock, origin, logistics and tested composition.'}
                className="mb-5"
              />
              <dl className="grid gap-x-8 sm:grid-cols-2">
                <DetailRow label={isService ? 'Service category' : 'Inventory form'} value={isService ? spec.serviceCategory ?? listing.product_type : spec.inventoryForm ?? listing.product_type} />
                <DetailRow label={isService ? 'Service location' : 'Stock location'} value={spec.stockLocation ?? listing.location_country ?? listing.location_region} />
                {!isService ? <DetailRow label="Available quantity" value={spec.stockQuantity} /> : null}
                {!isService ? <DetailRow label="Origin / production country" value={spec.originCountry} /> : null}
                {!isService ? <DetailRow label="Cultivation / production method" value={spec.cultivationMethod} /> : null}
                {!isService ? <DetailRow label="Harvest / production date" value={formatTradeDate(spec.harvestDate)} /> : null}
                {!isService ? <DetailRow label="Minimum order" value={spec.minimumOrderQuantity} /> : null}
                {!isService ? <DetailRow label="Packaging" value={spec.packaging} /> : null}
                {!isService ? <DetailRow label="Incoterms" value={spec.incoterms} /> : null}
                {!isService ? <DetailRow label="Shipping territories" value={spec.shippingTerritories.join(', ')} /> : null}
                {isService ? <DetailRow label="Capacity" value={spec.serviceCapacity} /> : null}
                {isService ? <DetailRow label="Turnaround" value={spec.turnaroundTime} /> : null}
                {isService ? <DetailRow label="Minimum batch" value={spec.minimumBatch} /> : null}
                {isService ? <DetailRow label="Process" value={spec.process} /> : null}
                {isService ? <DetailRow label="Jurisdictions served" value={spec.jurisdictionsServed.join(', ')} /> : null}
                <DetailRow label="Certifications / public documentation" value={spec.certifications.join(', ')} />
                <DetailRow label="Published" value={published} />
                <DetailRow label="Last updated" value={updated} />
              </dl>
            </PublicCard>

            {!isService && spec.cannabinoids.length > 0 ? (
              <PublicCard className="p-7">
                <SectionHeader eyebrow="Analytical profile" title="Published cannabinoid results." className="mb-5" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {spec.cannabinoids.map((item) => (
                    <div key={`${item.name}-${item.value}`} className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/35">{item.name}</p>
                      <p className="mt-2 text-xl font-semibold text-[#f5f1e8]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </PublicCard>
            ) : null}

            {spec.priceTiers.length > 0 ? (
              <PublicCard className="overflow-hidden">
                <div className="p-7 pb-4">
                  <SectionHeader eyebrow="Volume economics" title="Published quantity pricing." className="mb-0" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[540px] border-collapse text-sm">
                    <thead className="bg-white/[0.035] text-left text-[10px] uppercase tracking-[0.16em] text-white/34">
                      <tr><th className="px-7 py-3">Quantity</th><th className="px-7 py-3">Price</th><th className="px-7 py-3">Basis</th></tr>
                    </thead>
                    <tbody>
                      {spec.priceTiers.map((tier, index) => (
                        <tr key={`${tier.label}-${index}`} className="border-t border-white/8">
                          <td className="px-7 py-4 font-medium text-white/75">{tier.label}</td>
                          <td className="px-7 py-4 text-[#f5f1e8]">{tier.price != null ? `${tier.currency ?? listing.price_currency ?? ''} ${tier.price.toLocaleString()}`.trim() : 'On request'}</td>
                          <td className="px-7 py-4 text-white/45">{tier.unit ? `per ${tier.unit}` : 'published tier'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </PublicCard>
            ) : null}

            {spec.documents.length > 0 ? (
              <PublicCard className="p-7">
                <SectionHeader eyebrow="Public documents" title="Operator-approved analytical and commercial documents." className="mb-5" />
                <div className="space-y-3">
                  {spec.documents.map((document) => (
                    <a
                      key={document.url}
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm transition hover:border-gold/30"
                    >
                      <span>
                        <span className="font-medium text-white/78">{document.label}</span>
                        <span className="mt-1 block text-xs text-white/35">{[document.documentType, document.status].filter(Boolean).join(' · ') || 'Public reviewed document'}</span>
                      </span>
                      <span className="text-gold">Open ↗</span>
                    </a>
                  ))}
                </div>
              </PublicCard>
            ) : null}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <PublicCard className="p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Commercial routing</p>
              <h2 className="mt-3 text-xl font-semibold text-[#f5f1e8]">Move from public diligence to a qualified introduction.</h2>
              <p className="mt-3 text-sm leading-7 text-white/55">
                Harbourview reviews buyer/supplier fit, jurisdiction, authority, documentation and transaction context before releasing private counterparty details.
              </p>
              <div className="mt-6 grid gap-3">
                <Link href={quoteHref} className="btn-marketplace justify-center">{isService ? 'Request service introduction' : 'Request quote'}</Link>
                {!isService && spec.sampleAvailable ? <Link href={`${quoteHref}&intent=sample`} className="btn-outline justify-center">Request sample</Link> : null}
                <Link href="/marketplace/sell?type=wanted" className="btn-outline justify-center">Post a buyer requirement</Link>
              </div>
            </PublicCard>

            <PublicCard className="p-6 text-sm leading-7 text-white/52">
              <p className="font-semibold text-white/72">Publication boundary</p>
              <p className="mt-2">Only fields expressly approved for public marketplace use are rendered here. Seller identity, private provenance, licence evidence, internal review notes and restricted transaction documents remain outside the public dossier.</p>
            </PublicCard>
          </aside>
        </div>
      </PublicSection>
    </>
  )
}
