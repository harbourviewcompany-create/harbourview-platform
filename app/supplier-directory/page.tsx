import type { Metadata } from 'next'
import Link from 'next/link'
import { suppliers } from '@/lib/fixtures/suppliers'
import SupplierCard from '@/components/SupplierCard'

export const metadata: Metadata = {
  title: 'Supplier Directory',
  description:
    'Verified cannabis industry suppliers — equipment, packaging, genetics, testing, logistics, and compliance.',
}

export default function SupplierDirectoryPage() {
  return (
    <>
      <section className="bg-navy text-white py-14">
        <div className="page-container">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Supplier Directory</h1>
          <p className="text-gray-300 max-w-2xl">
            Cannabis industry suppliers and service providers. Browse by category or
            contact directly. To list your business,{' '}
            <Link href="/intake" className="text-gold underline hover:text-gold-light">
              submit via Intake
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="page-container">
          {suppliers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-4">No suppliers listed yet.</p>
              <Link href="/intake" className="btn-primary">
                Submit Your Business
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
              Want to be listed?{' '}
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
