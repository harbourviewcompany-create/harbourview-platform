import type { Metadata } from 'next'
import { publicProcessingInputListings } from '@/lib/marketplace/processingInputsPublic'
import { ProcessingInputCard } from '@/components/marketplace/ProcessingInputCard'

export const metadata: Metadata = {
  title: 'Processing Inputs | Harbourview',
  description: 'Public-safe processing input opportunities routed through Harbourview review.',
}

export default function ProcessingInputsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 text-[#F5F1E8]">
      <h1 className="text-3xl font-semibold">Processing Inputs</h1>
      <p className="mt-3 max-w-3xl text-sm text-[#F5F1E8]/70">
        Public summaries only. Contact details, source evidence and internal review notes are excluded
        from this route.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {publicProcessingInputListings.map((listing) => (
          <ProcessingInputCard key={listing.id} listing={listing} />
        ))}
      </div>
    </main>
  )
}
