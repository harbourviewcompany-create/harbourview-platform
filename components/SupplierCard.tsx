import type { Supplier } from '@/lib/fixtures/types'
import InquiryLink from './InquiryLink'

interface SupplierCardProps {
  supplier: Supplier
}

export default function SupplierCard({ supplier }: SupplierCardProps) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div>
        <h3 className="font-semibold text-navy text-base mb-1">{supplier.name}</h3>
        <p className="text-xs text-gray-400 mb-2">{supplier.location}</p>
        <p className="text-sm text-gray-600">{supplier.description}</p>
      </div>

      <div className="flex flex-wrap gap-1">
        {supplier.categories.map((cat) => (
          <span
            key={cat}
            className="text-xs bg-gold-pale text-navy-muted px-2 py-0.5 rounded-full font-medium"
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-2">
        <InquiryLink
          subject={`Supplier Inquiry: ${supplier.name}`}
          email={supplier.contactEmail}
          label="Contact Supplier"
        />
      </div>
    </div>
  )
}
