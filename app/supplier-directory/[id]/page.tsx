import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import { guardIsrQuery } from '@/lib/isr/isrQueryGuard'

// ISR: directory data
export const revalidate = 3600

/**
 * Opts this dynamic segment into ISR. Exporting `revalidate` alone does not:
 * an unenumerated dynamic segment stays server-rendered per request with no
 * revalidation window. Returning no paths prerenders nothing at build time
 * while still letting each `id` be rendered once and then cached for the
 * window above — this route reads through a keyed client, not a cookie-bound one.
 */
export async function generateStaticParams() {
  return []
}

type SupplierCapabilities = {
  business_type?: string
  title?: string | null
  website?: string | null
  hq_country?: string | null
  services_offered?: string[]
  regions_served?: string[]
}

type PublicSupplier = {
  id: string
  company_name: string | null
  seller_type: string
  region: string
  categories: string[]
  description: string | null
  capabilities: SupplierCapabilities | null
}

const SELLER_TYPE_LABEL: Record<string, string> = {
  licensed_producer: 'Licensed Producer',
  distributor: 'Distributor',
  wholesaler: 'Wholesaler',
  retailer: 'Retailer',
  investor: 'Investor',
  other: 'Operator',
}

const REGION_LABEL: Record<string, string> = {
  north_america: 'North America',
  europe: 'Europe',
  asia_pacific: 'Asia Pacific',
  latin_america: 'Latin America',
  middle_east_africa: 'Middle East & Africa',
  global: 'Global',
}

const CATEGORY_LABEL: Record<string, string> = {
  cannabis_inventory: 'Cannabis inventory',
  export_ready: 'Export-ready',
  import_demand: 'Import demand',
  cultivation_equipment: 'Cultivation equipment',
  processing_equipment: 'Processing equipment',
  consumables: 'Consumables',
  packaging: 'Packaging',
  genetics: 'Genetics',
  labs_testing: 'Labs & testing',
  logistics: 'Logistics',
  professional_services: 'Professional services',
  services: 'Services',
  business_opportunities: 'Business opportunities',
  distressed_inventory: 'Distressed inventory',
  distressed_businesses: 'Distressed businesses',
  used_surplus: 'Used / surplus',
  new_products: 'New products',
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function getApprovedSupplier(id: string): Promise<PublicSupplier | null> {
  if (!isUuid(id)) return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return null

  const svc = createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: SUPABASE_DB_SCHEMA },
  })

  // Public-safe columns only — never contact_email / contact_name / contact_phone.
  const { data, error } = await svc
    .from('supplier_profiles')
    .select('id, company_name, seller_type, region, categories, description, capabilities')
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle()
  guardIsrQuery(error, 'supplier-directory/[id]: supplier_profiles')

  return data as PublicSupplier | null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supplier = await getApprovedSupplier(id)
  if (!supplier) return { title: 'Supplier Not Found | Harbourview' }
  const name = supplier.company_name?.trim() || 'Verified supplier'
  return {
    title: `${name} — Supplier Directory | Harbourview`,
    description:
      supplier.description?.slice(0, 155) ??
      `Verified supplier profile in the Harbourview regulated cannabis network.`,
  }
}

export default async function SupplierProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supplier = await getApprovedSupplier(id)
  if (!supplier) return notFound()

  const name = supplier.company_name?.trim() || 'Verified supplier'
  const initials = name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const typeLabel =
    supplier.capabilities?.business_type?.replace(/_/g, ' ') ??
    SELLER_TYPE_LABEL[supplier.seller_type] ??
    supplier.seller_type
  const regions = supplier.capabilities?.regions_served ?? []
  const services = supplier.capabilities?.services_offered ?? []
  const publicCategories = (supplier.categories ?? []).filter((c) => c !== 'supplier_directory')
  const website = supplier.capabilities?.website?.trim() || null
  const safeWebsite =
    website && /^https?:\/\//i.test(website) ? website : website ? `https://${website}` : null

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', fontFamily: 'inherit' }}>
      <style>{CSS}</style>

      <div className="sp-wrap">
        <Link href="/supplier-directory" className="sp-back">
          ← Supplier Directory
        </Link>

        <div className="sp-card">
          <div className="sp-header">
            <div className="sp-avatar">{initials}</div>
            <div className="sp-header-meta">
              <div className="sp-verified">✓ Verified by Harbourview</div>
              <h1 className="sp-name">{name}</h1>
              <p className="sp-type">{typeLabel}</p>
              <p className="sp-region">
                {REGION_LABEL[supplier.region] ?? supplier.region.replace(/_/g, ' ')}
                {supplier.capabilities?.hq_country
                  ? ` · HQ ${flagEmoji(supplier.capabilities.hq_country)} ${supplier.capabilities.hq_country}`
                  : ''}
              </p>
            </div>
          </div>

          {supplier.description && (
            <section className="sp-section">
              <h2 className="sp-section-title">About</h2>
              <p className="sp-bio">{supplier.description}</p>
            </section>
          )}

          {regions.length > 0 && (
            <section className="sp-section">
              <h2 className="sp-section-title">Markets served</h2>
              <div className="sp-chips">
                {regions.map((iso2) => (
                  <span key={iso2} className="sp-chip">
                    {flagEmoji(iso2)} {iso2}
                  </span>
                ))}
              </div>
            </section>
          )}

          {publicCategories.length > 0 && (
            <section className="sp-section">
              <h2 className="sp-section-title">Categories</h2>
              <div className="sp-chips">
                {publicCategories.map((c) => (
                  <span key={c} className="sp-chip sp-chip--gold">
                    {CATEGORY_LABEL[c] ?? c.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </section>
          )}

          {services.length > 0 && (
            <section className="sp-section">
              <h2 className="sp-section-title">Services offered</h2>
              <div className="sp-chips">
                {services.map((svc) => (
                  <span key={svc} className="sp-chip">
                    {svc}
                  </span>
                ))}
              </div>
            </section>
          )}

          {safeWebsite && (
            <section className="sp-section">
              <h2 className="sp-section-title">Website</h2>
              <a
                href={safeWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="sp-website"
              >
                {website}
              </a>
            </section>
          )}

          <div className="sp-cta-row">
            <Link href="/contact" className="sp-cta-primary">
              Request introduction via Harbourview
            </Link>
            <Link href="/supplier-directory/apply" className="sp-cta-secondary">
              List your company
            </Link>
          </div>

          <p className="sp-disclaimer">
            This profile is non-promotional and disclosure-safe. Harbourview does not publish supplier
            contact emails or phone numbers. Introductions are routed through reviewed workflows only.
          </p>
        </div>

        <footer className="sp-footnote">
          <div className="sp-footnote-links">
            <Link href="/supplier-directory">All suppliers →</Link>
            <Link href="/marketplace">Marketplace →</Link>
            <Link href="/professionals">Professionals →</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const CSS = `
.sp-wrap { max-width: 780px; margin: 0 auto; padding: 48px 24px 80px; }
.sp-back { display: inline-block; font-size: 11px; color: #d4a84b; text-decoration: none; letter-spacing: .08em; margin-bottom: 32px; }
.sp-back:hover { opacity: .7; }

.sp-card { border-radius: 16px; border: 1px solid rgba(255,255,255,.07); background: rgba(255,255,255,.02); overflow: hidden; }

.sp-header { display: flex; gap: 20px; align-items: flex-start; padding: 32px 32px 28px; border-bottom: 1px solid rgba(255,255,255,.06); flex-wrap: wrap; }
.sp-avatar { width: 64px; height: 64px; border-radius: 50%; background: rgba(212,168,75,.12); border: 1px solid rgba(212,168,75,.2); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: #d4a84b; flex-shrink: 0; letter-spacing: .04em; }
.sp-header-meta { flex: 1; min-width: 200px; }
.sp-verified { font-size: 10px; color: #4caf82; font-weight: 600; letter-spacing: .08em; margin-bottom: 8px; }
.sp-name { font-size: clamp(20px, 3vw, 26px); font-weight: 600; color: #f5f0e8; margin: 0 0 4px; line-height: 1.2; }
.sp-type { font-size: 11px; text-transform: uppercase; letter-spacing: .14em; color: #d4a84b; font-weight: 600; margin: 0 0 4px; }
.sp-region { font-size: 12px; color: rgba(245,240,232,.4); margin: 0; }

.sp-section { padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,.05); }
.sp-section-title { font-size: 10px; text-transform: uppercase; letter-spacing: .2em; color: rgba(245,240,232,.35); font-weight: 600; margin: 0 0 12px; }
.sp-bio { font-size: 14px; line-height: 1.75; color: rgba(245,240,232,.7); margin: 0; white-space: pre-wrap; }
.sp-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.sp-chip { font-size: 11px; padding: 4px 12px; border-radius: 6px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); color: rgba(245,240,232,.6); text-transform: capitalize; }
.sp-chip--gold { background: rgba(212,168,75,.07); border: 1px solid rgba(212,168,75,.15); color: rgba(212,168,75,.7); }
.sp-website { font-size: 13px; color: #d4a84b; text-decoration: none; word-break: break-all; }
.sp-website:hover { opacity: .8; }

.sp-cta-row { display: flex; gap: 12px; flex-wrap: wrap; padding: 28px 32px 16px; }
.sp-cta-primary { display: inline-flex; align-items: center; padding: 11px 22px; background: #d4a84b; color: #050c18; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; text-decoration: none; border-radius: 4px; transition: opacity .15s; }
.sp-cta-primary:hover { opacity: .85; }
.sp-cta-secondary { display: inline-flex; align-items: center; padding: 11px 22px; border: 1px solid rgba(245,240,232,.15); color: rgba(245,240,232,.7); font-size: 12px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; text-decoration: none; border-radius: 4px; transition: border-color .15s, color .15s; }
.sp-cta-secondary:hover { border-color: rgba(245,240,232,.35); color: #f5f0e8; }

.sp-disclaimer { font-size: 10px; color: rgba(245,240,232,.2); line-height: 1.6; padding: 0 32px 28px; margin: 0; }

.sp-footnote { margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,.06); }
.sp-footnote-links { display: flex; flex-wrap: wrap; gap: 16px; }
.sp-footnote-links a { font-size: 11px; color: #d4a84b; text-decoration: none; }
.sp-footnote-links a:hover { opacity: .7; }
`
