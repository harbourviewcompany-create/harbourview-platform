import type { Metadata } from 'next'
import Link from 'next/link'
import { suppliers } from '@/lib/fixtures/suppliers'
import SupplierCard from '@/components/SupplierCard'

export const metadata: Metadata = {
  title: 'Supplier Discovery | Harbourview Network',
  description:
    'Supplier discovery for regulated cannabis and adjacent supply-chain participants. Supplier introductions are routed through Harbourview review.',
}

export default function SupplierDirectoryPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Supplier Discovery</h1>
          <p className="text-gray-300 max-w-2xl">
            Supplier and service-provider profiles for regulated cannabis and adjacent
            supply-chain participants. Public profiles are commercial summaries only.
            Request introductions through Harbourview review rather than direct public contact.
            To submit your business,{' '}
            <Link href="/intake" className="text-gold underline hover:text-gold-light">
              submit via Intake
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          <div className="mb-8 rounded-lg border border-gold/30 bg-gold-pale p-6">
            <h2 className="text-navy font-semibold text-lg mb-2">Controlled supplier introductions</h2>
            <p className="text-gray-600 text-sm max-w-3xl">
              Supplier profiles do not imply verified availability, licensing, exclusivity,
              pricing or transaction readiness. Harbourview reviews introduction requests
              before routing and may request additional context before any counterparty contact.
            </p>
          </div>

          {suppliers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-4">No supplier profiles listed yet.</p>
              <Link href="/intake" className="btn-primary">
                Submit Supplier Profile
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </div>
          )}

          <div className="mt-12 border-t pt-8">
            <p className="text-gray-500 text-sm">
              Want to be considered for supplier discovery?{' '}
              <Link href="/intake" className="text-navy underline hover:text-gold">
                Submit your company via Intake
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
