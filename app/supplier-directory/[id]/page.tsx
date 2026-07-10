import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getApprovedSupplierProfileById,
  CATEGORY_LABELS,
  displaySellerType,
  displayRegions,
} from '@/lib/server/supplierProfilesQuery'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supplier = await getApprovedSupplierProfileById(id)

  if (!supplier) {
    return { title: 'Supplier Not Found | Harbourview' }
  }

  return {
    title: `${supplier.company_name ?? 'Supplier'} | Supplier Directory | Harbourview`,
    description: supplier.description?.slice(0, 160) ?? undefined,
  }
}

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supplier = await getApprovedSupplierProfileById(id)

  if (!supplier) {
    return notFound()
  }

  const website = supplier.capabilities?.website
  const title = supplier.capabilities?.title

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8' }}>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/supplier-directory" className="text-[#d4a84b] text-sm hover:underline mb-8 inline-block">
          ← Back to Supplier Directory
        </Link>

        <div className="bg-[#0a1424] border border-white/10 rounded-2xl p-10">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-3">
                REVIEWED PROFILE
              </div>
              <h1 className="text-4xl font-serif tracking-tight">{supplier.company_name ?? 'Supplier'}</h1>
              {title && <p className="mt-1 text-sm text-white/50">{title}</p>}
            </div>
            <div className="text-right text-sm text-white/50">
              <div>{displayRegions(supplier)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div>
                <h3 className="text-sm font-semibold tracking-[0.5px] text-white/60 mb-3">ABOUT</h3>
                <p className="text-[15px] leading-relaxed whitespace-pre-line text-white/90">{supplier.description}</p>
              </div>

              {supplier.categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold tracking-[0.5px] text-white/60 mb-3">SUPPLY CATEGORIES</h3>
                  <div className="flex flex-wrap gap-2">
                    {supplier.categories.map((c) => (
                      <span key={c} className="px-3 py-1 text-sm bg-white/5 rounded-full">
                        {CATEGORY_LABELS[c] ?? c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {supplier.capabilities?.services_offered && supplier.capabilities.services_offered.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold tracking-[0.5px] text-white/60 mb-3">SERVICES OFFERED</h3>
                  <div className="flex flex-wrap gap-2">
                    {supplier.capabilities.services_offered.map((s) => (
                      <span key={s} className="px-3 py-1 text-sm bg-white/5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold tracking-[0.5px] text-white/60 mb-3">BUSINESS TYPE</h3>
                <div className="text-lg">{displaySellerType(supplier)}</div>
              </div>

              <div>
                <h3 className="text-sm font-semibold tracking-[0.5px] text-white/60 mb-3">REGIONS SERVED</h3>
                <div className="text-lg">{displayRegions(supplier)}</div>
              </div>

              {website && (
                <div>
                  <h3 className="text-sm font-semibold tracking-[0.5px] text-white/60 mb-3">WEBSITE</h3>
                  <div className="text-sm text-white/70 break-all">{website}</div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4">
            <Link href="/contact" className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-[#d4a84b] text-[#050c18] font-semibold hover:bg-[#e8c17a] transition-colors">
              Request Introduction
            </Link>
            <Link href="/supplier-directory" className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-white/20 hover:bg-white/5 transition-colors">
              Browse More Suppliers
            </Link>
          </div>

          <p className="mt-8 text-xs leading-5 text-white/35">
            Public supplier summary. Introduction requests are reviewed before routing. Listing does
            not imply verified availability, licensing, exclusivity, pricing or transaction readiness.
          </p>
        </div>
      </div>
    </main>
  )
}
