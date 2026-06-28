import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicCountryProfile, listPublicCountryProfiles } from '@/lib/country-data/server'

export async function generateStaticParams() {
  const countries = await listPublicCountryProfiles()
  return countries.map((country) => ({ slug: country.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const country = await getPublicCountryProfile(slug)

  if (!country) {
    return { title: 'Country not found | Harbourview' }
  }

  return {
    title: `${country.public_display_name} Identity Profile | Harbourview`,
    description: `${country.public_display_name} identity-only Harbourview country profile. Regulated-market details remain review-pending.`,
  }
}

function StatusCard({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/42">{label}</p>
      <p className="mt-2 font-medium text-white">{value ?? 'review_pending'}</p>
    </div>
  )
}

export default async function CountryIdentityPage({ params }: Props) {
  const { slug } = await params
  const country = await getPublicCountryProfile(slug)

  if (!country) return notFound()

  return (
    <main className="min-h-screen bg-[#05070c] px-5 py-12 text-white md:px-10">
      <article className="mx-auto max-w-5xl">
        <nav className="mb-8 text-sm text-white/50" aria-label="Breadcrumb">
          <Link href="/countries" className="hover:text-[#c6a55a]">Countries</Link>
          <span className="mx-2 text-white/25">/</span>
          <span>{country.public_display_name}</span>
        </nav>

        <p className="text-xs uppercase tracking-[0.28em] text-[#c6a55a]">Identity-only country profile</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold md:text-6xl">{country.public_display_name}</h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-white/68">{country.public_summary}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatusCard label="Region" value={country.public_region} />
          <StatusCard label="Subregion" value={country.public_subregion} />
          <StatusCard label="Profile status" value={country.public_status_label} />
        </div>

        <section className="mt-8 rounded-3xl border border-[#c6a55a]/25 bg-[#c6a55a]/[0.06] p-5">
          <h2 className="font-serif text-2xl">Review-pending fields</h2>
          <p className="mt-2 text-sm leading-6 text-white/62">
            Harbourview has not published verified regulated-market, import/export, licensing, or market-access claims for this profile.
            These placeholders are intentionally neutral until primary-source review is complete.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <StatusCard label="Medical status" value="review_pending" />
            <StatusCard label="Retail-use status" value="review_pending" />
            <StatusCard label="Hemp status" value="review_pending" />
            <StatusCard label="Import/export" value="review_pending" />
            <StatusCard label="Licensing" value="review_pending" />
            <StatusCard label="Confidence band" value={country.confidence_band_public} />
          </div>
        </section>

        <footer className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/56">
          <p>Last identity verification: {country.last_identity_verified_at ?? 'not available'}</p>
          <p className="mt-1">Last regulated-market verification: {country.last_regulatory_verified_at ?? 'review_pending'}</p>
        </footer>
      </article>
    </main>
  )
}
