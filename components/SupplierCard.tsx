import type { Supplier } from '@/lib/fixtures/types'
import InquiryLink from './InquiryLink'

interface SupplierCardProps {
  supplier: Supplier
}

export default function SupplierCard({ supplier }: SupplierCardProps) {
  return (
    <article className="card p-5 flex h-full flex-col gap-4">
      <div>
        <h3 className="font-semibold text-navy text-base mb-1">{supplier.name}</h3>
        <p className="text-xs text-gray-400 mb-2">{supplier.location}</p>
        <p className="text-sm text-gray-600">{supplier.description}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {supplier.categories.map((cat) => (
          <span
            key={cat}
            className="text-xs bg-gold-pale text-navy-muted px-2 py-0.5 rounded-full font-medium"
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="mt-auto border-t border-gray-100 pt-4">
        <InquiryLink
          subject={`Harbourview Supplier Inquiry: ${supplier.name}`}
          email={supplier.contactEmail}
          label="Request Supplier Intro"
          listingTitle={supplier.name}
        />
      </div>
    </article>
  )
}
