import Link from 'next/link'
import { getCategoryImage, type MarketplaceListing, type WantedRequestRecord } from '@/lib/marketplace-data'

type CardRecord = MarketplaceListing | WantedRequestRecord

function isWanted(record: CardRecord): record is WantedRequestRecord {
  return 'requiredQuantityCapacity' in record
}

export default function MarketplaceCard({ record, href }: { record: CardRecord; href: string }) {
  const image = getCategoryImage(record.category, record.subcategory, !isWanted(record) ? record.image : undefined)
  const meta = isWanted(record)
    ? `${record.location} · ${record.timing}`
    : `${record.location} · ${record.condition} · ${record.availability}`

  return (
    <article className="card flex h-full flex-col overflow-hidden">
      {image ? (
        <div className="h-44 overflow-hidden bg-gold-pale">
          <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="h-44 bg-gradient-to-br from-gold-pale via-white to-gray-100" aria-hidden="true" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold">
          {isWanted(record) ? 'Wanted request' : record.listingType}
        </p>
        <h3 className="text-base font-semibold leading-snug text-navy">{record.title}</h3>
        <p className="mt-1 text-xs text-gray-400">{meta}</p>
        <p className="mt-4 line-clamp-4 text-sm text-gray-600">{record.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {record.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-auto border-t border-gray-100 pt-4">
          <Link href={href} className="btn-primary inline-flex text-sm">
            {isWanted(record) ? 'Respond to Wanted Request' : 'Request Introduction'}
          </Link>
        </div>
      </div>
    </article>
  )
}
