import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getApprovedSupplierProfiles, SELLER_TYPE_LABELS } from '@/lib/server/supplierProfilesQuery'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const suppliers = await getApprovedSupplierProfiles()
  const supplier = suppliers.find(s => s.profile_slug === slug)

  if (!supplier) {
    return { title: 'Supplier Not Found | Harbourview' }
  }

  return {
    title: `${supplier.company_name} | Supplier Directory | Harbourview`,
    description: supplier.description_public?.slice(0, 160) || `Verified supplier profile for ${supplier.company_name} in regulated cannabis markets.`,
  }
}

export default async function SupplierDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const suppliers = await getApprovedSupplierProfiles()
  const supplier = suppliers.find(s => s.profile_slug === slug)

  if (!supplier) {
    notFound()
  }

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
                VERIFIED SUPPLIER
              </div>
              <h1 className="text-4xl font-serif tracking-tight">{supplier.company_name}</h1>
            </div>
            <div className="text-right text-sm text-white/50">
              {supplier.hq_country && <div>HQ: {supplier.hq_country}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              {supplier.description_public && (
                <div>
                  <h3 className="text-sm font-semibold tracking-[0.5px] text-white/60 mb-3">ABOUT</h3>
                  <p className="text-[15px] leading-relaxed whitespace-pre-line text-white/90">{supplier.description_public}</p>
                </div>
              )}

              {supplier.services_offered?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold tracking-[0.5px] text-white/60 mb-3">SERVICES OFFERED</h3>
                  <div className="flex flex-wrap gap-2">
                    {supplier.services_offered.map((s, i) => (
                      <span key={i} className="px-3 py-1 text-sm bg-white/5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold tracking-[0.5px] text-white/60 mb-3">BUSINESS TYPE</h3>
                <div className="text-lg">{SELLER_TYPE_LABELS[supplier.seller_type] || supplier.seller_type}</div>
              </div>

              {supplier.regions_served?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold tracking-[0.5px] text-white/60 mb-3">MARKETS SERVED</h3>
                  <div className="flex flex-wrap gap-2">
                    {supplier.regions_served.map((r, i) => (
                      <span key={i} className="px-3 py-1 text-sm bg-white/5 rounded-full">{r}</span>
                    ))}
                  </div>
                </div>
              )}

              {supplier.website && (
                <div>
                  <h3 className="text-sm font-semibold tracking-[0.5px] text-white/60 mb-3">WEBSITE</h3>
                  <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-[#d4a84b] hover:underline break-all">
                    {supplier.website}
                  </a>
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
        </div>
      </div>
    </main>
  )
}
