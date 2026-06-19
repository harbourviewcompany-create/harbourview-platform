import { requireAdminAuth } from '@/lib/auth/adminGuard'
import { FixtureBanner } from '@/components/admin/FixtureBanner'
import { listAccessProducts } from '@/lib/monetization/admin'

export const dynamic = 'force-dynamic'

const REVENUE_COLOURS: Record<string, string> = {
  high: 'border-emerald-400/40 text-emerald-300',
  medium: 'border-amber-400/40 text-amber-300',
  low: 'border-white/20 text-white/50',
}

const STATUS_COLOURS: Record<string, string> = {
  active: 'border-emerald-400/40 text-emerald-300',
  in_development: 'border-amber-400/40 text-amber-300',
  planned: 'border-sky-400/40 text-sky-300',
}

function Pill({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${cls}`}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}

export default async function AccessProductsPage() {
  await requireAdminAuth()
  const result = await listAccessProducts()
  const products = result.ok ? result.data : []
  const isFixture = result.ok && result.source === 'fixture'

  return (
    <section className="space-y-8">
      <FixtureBanner isFixture={isFixture} />

      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Monetization</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#F5F1E8]">Access Products</h2>
        <p className="mt-2 text-sm text-[#F5F1E8]/60">
          All monetization access products available on the Harbourview platform.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">
                {product.product_type.replace(/_/g, ' ')}
              </p>
              <h3 className="mt-1 font-semibold text-[#F5F1E8]">{product.name}</h3>
            </div>

            <p className="text-sm text-[#F5F1E8]/65">{product.description}</p>

            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-[#F5F1E8]">
                {product.price_usd != null
                  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(product.price_usd)
                  : 'Custom'}
              </span>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#F5F1E8]/40 mb-1">Delivery</p>
              <p className="text-xs text-[#F5F1E8]/60">{product.delivery_workflow}</p>
            </div>

            {product.eligibility_criteria.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#F5F1E8]/40 mb-1">Eligibility</p>
                <ul className="space-y-0.5">
                  {product.eligibility_criteria.map((criterion, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-[#F5F1E8]/60">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#C6A55A]/60" />
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Pill label={product.revenue_potential} cls={REVENUE_COLOURS[product.revenue_potential] ?? 'border-white/20 text-white/50'} />
              <Pill label={product.status} cls={STATUS_COLOURS[product.status] ?? 'border-white/20 text-white/50'} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
