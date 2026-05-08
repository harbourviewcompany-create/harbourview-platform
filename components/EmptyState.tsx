import Link from 'next/link'

interface EmptyStateProps {
  category: string
}

export default function EmptyState({ category }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <p className="text-gray-400 text-4xl mb-4">—</p>
      <h3 className="text-navy font-semibold text-lg mb-2">
        No {category} listings yet
      </h3>
      <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
        Submit an opportunity through Harbourview intake for review. Publication,
        routing and introductions are not automatic.
      </p>
      <Link href="/intake" className="btn-primary">
        Submit Opportunity via Intake
      </Link>
    </div>
  )
}
