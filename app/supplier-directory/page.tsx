import Link from 'next/link'
import { FooterCta, PublicCard, PublicHero, PublicSection, SectionHeader } from '@/components/PublicUi'
import {
  getApprovedSupplierProfiles,
  SELLER_TYPE_LABELS,
  REGION_LABELS,
  CATEGORY_LABELS,
} from '@/lib/server/supplierProfilesQuery'

export const dynamic = 'force-dynamic'

export default async function SupplierDirectoryPage() {
  const profiles = await getApprovedSupplierProfiles()
  const hasProfiles = profiles.length > 0

  return (
    <main>
      <PublicHero
        eyebrow="Supplier Discovery"
        title="Reviewed supplier profiles for regulated cannabis operations."
        actions={[
          { label: 'Submit your company', href: '/supplier-directory/apply' },
          { label: 'Request an introduction', href: '/contact', variant: 'secondary' },
        ]}
      >
        Every profile listed here has been reviewed before publication. Introduction requests are routed through Harbourview, not direct contact.
      </PublicHero>

      {hasProfiles ? (
        <PublicSection tone="dark">
          <SectionHeader eyebrow="Reviewed Profiles" title="Verified Suppliers" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((p) => (
              <Link key={p.id} href={`/supplier-directory/${p.profile_slug}`} className="block">
                <PublicCard className="p-6 h-full transition hover:border-gold/30">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-gold/75">
                    {SELLER_TYPE_LABELS[p.seller_type] ?? p.seller_type}
                  </span>
                  <span className="text-[11px] text-white/40">
                    {p.regions_served?.[0] ? REGION_LABELS[p.regions_served[0]] ?? p.regions_served[0] : ''}
                  </span>
                </div>

                {p.company_name && (
                  <h3 className="mb-2 text-base font-semibold text-[#f4f1eb]">{p.company_name}</h3>
                )}

                {p.description_public && (
                  <p className="mb-4 text-sm leading-7 text-white/62 line-clamp-3">{p.description_public}</p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {p.categories?.map((c, i) => (
                    <span key={i} className="rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 text-[10px] text-gold/80">
                      {CATEGORY_LABELS[c] ?? c}
                    </span>
                  ))}
                </div>

                <p className="mt-4 text-xs leading-5 text-white/35">
                  Verified supplier. Introduction requests are reviewed before routing.
                </p>
                </PublicCard>
              </Link>
            ))}
          </div>
        </PublicSection>
      ) : (
        <PublicSection tone="dark">
          <div className="text-center py-12">
            <p className="text-white/60">No verified suppliers listed yet.</p>
            <p className="mt-2 text-sm text-white/40">Be the first to apply.</p>
          </div>
        </PublicSection>
      )}

      <FooterCta
        eyebrow="Join the directory"
        title="Get your company in front of reviewed buyers."
        actions={[
          { label: 'Submit your company', href: '/supplier-directory/apply' },
        ]}
      />
    </main>
  )
}
