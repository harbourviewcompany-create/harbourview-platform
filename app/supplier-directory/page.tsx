import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { flagEmoji } from '@/lib/utils/flagEmoji'

export const metadata: Metadata = {
  title: 'Supplier Directory — Verified Cannabis Operators | Harbourview',
  description:
    'Verified directory of cannabis producers, distributors, equipment vendors, labs and service providers operating in regulated markets. Profiles are individually reviewed before publication.',
  openGraph: {
    title: 'Supplier Directory | Harbourview',
    description:
      'Verified suppliers and operators across regulated cannabis markets. Reviewed profiles only — contact details stay private.',
  },
}

export const dynamic = 'force-dynamic'

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
  supplier_directory: 'Supplier directory',
  business_opportunities: 'Business opportunities',
  distressed_inventory: 'Distressed inventory',
  distressed_businesses: 'Distressed businesses',
  used_surplus: 'Used / surplus',
  new_products: 'New products',
  wanted_requests: 'Wanted requests',
}

function businessTypeLabel(supplier: PublicSupplier): string {
  const raw = supplier.capabilities?.business_type
  if (raw) return raw.replace(/_/g, ' ')
  return SELLER_TYPE_LABEL[supplier.seller_type] ?? supplier.seller_type
}

async function getApprovedSuppliers(): Promise<PublicSupplier[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return []

  const svc = createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: SUPABASE_DB_SCHEMA },
  })

  // Public-safe columns only — never select contact_email, contact_name, contact_phone.
  // RLS on supplier_profiles is approved-only for anon/authenticated.
  const { data } = await svc
    .from('supplier_profiles')
    .select('id, company_name, seller_type, region, categories, description, capabilities')
    .eq('status', 'approved')
    .order('company_name', { ascending: true })

  return (data ?? []) as PublicSupplier[]
}

export default async function SupplierDirectoryPage() {
  const suppliers = await getApprovedSuppliers()
  const hasProfiles = suppliers.length > 0

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', fontFamily: 'inherit' }}>
      <style>{CSS}</style>

      <div className="sd-wrap">
        <header className="sd-header">
          <div className="sd-eyebrow">Supplier Directory</div>
          <h1 className="sd-title">Verified cannabis operators</h1>
          <p className="sd-sub">
            Harbourview lists reviewed producers, distributors, equipment vendors, labs and service
            providers operating in regulated markets. Contact details stay private — introductions
            move through controlled Harbourview workflows.
          </p>
          <div className="sd-header-actions">
            <Link href="/supplier-directory/apply" className="sd-cta-primary">
              List your company →
            </Link>
            <Link href="/contact" className="sd-cta-secondary">
              Request introduction
            </Link>
          </div>
          <div className="sd-trust-note">
            Non-promotional. No open contact exposure. Every published profile is individually reviewed.
          </div>
        </header>

        {hasProfiles ? (
          <div className="sd-grid">
            {suppliers.map((s) => {
              const name = s.company_name?.trim() || 'Verified supplier'
              const initials = name
                .split(/\s+/)
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
              const regions = s.capabilities?.regions_served ?? []
              const services = s.capabilities?.services_offered ?? []
              const publicCategories = (s.categories ?? []).filter((c) => c !== 'supplier_directory')

              return (
                <Link key={s.id} href={`/supplier-directory/${s.id}`} className="sd-card">
                  <div className="sd-card-top">
                    <div className="sd-avatar">{initials}</div>
                    <div className="sd-card-meta">
                      <h2 className="sd-name">{name}</h2>
                      <p className="sd-type">{businessTypeLabel(s)}</p>
                      <p className="sd-region">
                        {REGION_LABEL[s.region] ?? s.region.replace(/_/g, ' ')}
                        {s.capabilities?.hq_country
                          ? ` · HQ ${flagEmoji(s.capabilities.hq_country)} ${s.capabilities.hq_country}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  {regions.length > 0 && (
                    <div className="sd-chips">
                      {regions.slice(0, 5).map((iso2) => (
                        <span key={iso2} className="sd-chip">
                          {flagEmoji(iso2)} {iso2}
                        </span>
                      ))}
                      {regions.length > 5 && (
                        <span className="sd-chip sd-chip--more">+{regions.length - 5}</span>
                      )}
                    </div>
                  )}

                  {publicCategories.length > 0 && (
                    <div className="sd-chips">
                      {publicCategories.slice(0, 3).map((c) => (
                        <span key={c} className="sd-chip sd-chip--gold">
                          {CATEGORY_LABEL[c] ?? c.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {services.length > 0 && (
                    <div className="sd-chips">
                      {services.slice(0, 3).map((svc) => (
                        <span key={svc} className="sd-chip">
                          {svc}
                        </span>
                      ))}
                    </div>
                  )}

                  {s.description && <p className="sd-bio">{s.description}</p>}

                  <div className="sd-card-footer">
                    <span className="sd-verified">✓ Verified</span>
                    <span className="sd-view">View profile →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="sd-empty">
            <div className="sd-empty-inner">
              <div className="sd-empty-icon">⬡</div>
              <h2 className="sd-empty-title">Directory building</h2>
              <p className="sd-empty-body">
                Harbourview is onboarding verified suppliers across regulated markets. Approved
                company profiles appear here after individual review — never as an open contact list.
              </p>
              <p className="sd-empty-body">
                If you operate as a producer, distributor, equipment vendor, lab or service provider,
                you can apply for a reviewed listing now.
              </p>
              <div className="sd-empty-actions">
                <Link href="/supplier-directory/apply" className="sd-cta-primary">
                  Apply to list →
                </Link>
                <Link href="/contact" className="sd-cta-secondary">
                  Ask a question
                </Link>
              </div>
            </div>

            <div className="sd-pathway-grid">
              {[
                {
                  icon: '◎',
                  title: 'Producers & processors',
                  body: 'Licensed cultivators and processors with export-ready or domestic supply capacity in regulated jurisdictions.',
                },
                {
                  icon: '⇄',
                  title: 'Distributors & importers',
                  body: 'Market-access partners, wholesalers and import-licensed operators routing product through reviewed pathways.',
                },
                {
                  icon: '⚙',
                  title: 'Equipment & consumables',
                  body: 'Cultivation, processing, packaging and lab equipment vendors serving licensed facilities.',
                },
                {
                  icon: '⊞',
                  title: 'Labs & professional services',
                  body: 'Testing labs, compliance support, logistics and professional services for regulated operators.',
                },
              ].map((card) => (
                <div key={card.title} className="sd-pathway-card">
                  <div className="sd-pathway-icon">{card.icon}</div>
                  <h3 className="sd-pathway-title">{card.title}</h3>
                  <p className="sd-pathway-body">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="sd-footnote">
          <p>
            Harbourview supplier profiles are non-promotional and disclosure-safe. Contact emails,
            phone numbers and internal review fields are never published. Introductions are routed
            through Harbourview after qualification — not through open directories.
          </p>
          <div className="sd-footnote-links">
            <Link href="/marketplace">Marketplace →</Link>
            <Link href="/professionals">Professionals →</Link>
            <Link href="/markets">Markets →</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const CSS = `
.sd-wrap { max-width: 1200px; margin: 0 auto; padding: 48px 24px 80px; }
.sd-header { margin-bottom: 48px; }
.sd-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: .28em; text-transform: uppercase; color: rgba(212,168,75,.7); margin-bottom: 12px; }
.sd-title { font-family: Georgia, serif; font-size: clamp(28px, 4vw, 44px); font-weight: 400; color: #f5f0e8; letter-spacing: -.01em; margin: 0 0 16px; }
.sd-sub { font-size: 14px; color: rgba(245,240,232,.55); max-width: 680px; line-height: 1.7; margin: 0 0 24px; }
.sd-header-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.sd-cta-primary { display: inline-flex; align-items: center; padding: 10px 20px; background: #d4a84b; color: #050c18; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; text-decoration: none; border-radius: 4px; transition: opacity .15s; }
.sd-cta-primary:hover { opacity: .85; }
.sd-cta-secondary { display: inline-flex; align-items: center; padding: 10px 20px; border: 1px solid rgba(245,240,232,.15); color: rgba(245,240,232,.7); font-size: 12px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; text-decoration: none; border-radius: 4px; transition: border-color .15s, color .15s; }
.sd-cta-secondary:hover { border-color: rgba(245,240,232,.35); color: #f5f0e8; }
.sd-trust-note { font-size: 11px; color: rgba(245,240,232,.25); max-width: 560px; line-height: 1.6; }

.sd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.sd-card { display: flex; flex-direction: column; gap: 12px; padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,.07); background: rgba(255,255,255,.02); text-decoration: none; color: inherit; transition: border-color .15s, background .15s, transform .12s; }
.sd-card:hover { border-color: rgba(212,168,75,.2); background: rgba(255,255,255,.035); transform: translateY(-1px); }
.sd-card-top { display: flex; gap: 14px; align-items: flex-start; }
.sd-avatar { width: 44px; height: 44px; border-radius: 50%; background: rgba(212,168,75,.12); border: 1px solid rgba(212,168,75,.2); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #d4a84b; flex-shrink: 0; letter-spacing: .04em; }
.sd-card-meta { flex: 1; min-width: 0; }
.sd-name { font-size: 15px; font-weight: 600; color: #f5f0e8; margin: 0 0 3px; line-height: 1.3; }
.sd-type { font-size: 10px; text-transform: uppercase; letter-spacing: .12em; color: #d4a84b; font-weight: 600; margin: 0 0 2px; }
.sd-region { font-size: 11px; color: rgba(245,240,232,.35); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sd-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.sd-chip { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,.05); color: rgba(245,240,232,.5); text-transform: capitalize; }
.sd-chip--gold { background: rgba(212,168,75,.07); border: 1px solid rgba(212,168,75,.12); color: rgba(212,168,75,.6); }
.sd-chip--more { color: rgba(245,240,232,.3); background: transparent; border: 1px solid rgba(255,255,255,.07); }
.sd-bio { font-size: 12px; line-height: 1.6; color: rgba(245,240,232,.5); margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.sd-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.05); }
.sd-verified { font-size: 9px; color: #4caf82; font-weight: 600; letter-spacing: .06em; }
.sd-view { font-size: 10px; color: rgba(212,168,75,.7); letter-spacing: .06em; }

.sd-empty { display: flex; flex-direction: column; gap: 48px; }
.sd-empty-inner { max-width: 640px; margin: 0 auto; text-align: center; padding: 64px 24px; border-radius: 16px; border: 1px solid rgba(212,168,75,.12); background: rgba(212,168,75,.03); }
.sd-empty-icon { font-size: 36px; color: rgba(212,168,75,.4); margin-bottom: 20px; }
.sd-empty-title { font-family: Georgia, serif; font-size: 24px; font-weight: 400; color: #f5f0e8; margin: 0 0 16px; }
.sd-empty-body { font-size: 14px; line-height: 1.7; color: rgba(245,240,232,.5); margin: 0 0 12px; }
.sd-empty-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 28px; }
.sd-pathway-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.sd-pathway-card { padding: 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,.06); background: rgba(255,255,255,.015); }
.sd-pathway-icon { font-size: 20px; color: rgba(212,168,75,.5); margin-bottom: 12px; }
.sd-pathway-title { font-size: 14px; font-weight: 600; color: #f5f0e8; margin: 0 0 8px; }
.sd-pathway-body { font-size: 12px; line-height: 1.65; color: rgba(245,240,232,.4); margin: 0; }

.sd-footnote { margin-top: 64px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,.06); }
.sd-footnote p { font-size: 11px; line-height: 1.7; color: rgba(245,240,232,.3); max-width: 640px; margin: 0 0 16px; }
.sd-footnote-links { display: flex; flex-wrap: wrap; gap: 16px; }
.sd-footnote-links a { font-size: 11px; color: #d4a84b; text-decoration: none; }
.sd-footnote-links a:hover { opacity: .7; }
`
