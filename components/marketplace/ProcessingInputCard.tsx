import type { PublicProcessingInputProjection } from '@/lib/scrapers/types'

export function ProcessingInputCard({ listing }: { listing: PublicProcessingInputProjection }) {
  return (
    <article className="rounded-2xl border border-[#C6A55A]/25 bg-[#0B1A2F]/80 p-5 shadow-lg shadow-black/20">
      <p className="text-xs uppercase tracking-[0.18em] text-[#C6A55A]">{listing.category} inputs</p>
      <h2 className="mt-2 text-xl font-semibold leading-tight text-[#F5F1E8]">{listing.title}</h2>
      <p className="mt-3 text-sm text-[#F5F1E8]/68">{listing.summary}</p>
      <div className="mt-4 space-y-1 text-sm text-[#F5F1E8]/68">
        <p><span className="text-[#C6A55A]">Pricing:</span> {listing.pricingModel}</p>
        <p><span className="text-[#C6A55A]">Region:</span> {listing.region}</p>
      </div>
    </article>
  )
}
