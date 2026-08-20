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
 * while still letting each `slug` be rendered once and then cached for the
 * window above — this route reads through a keyed client, not a cookie-bound one.
 */
export async function generateStaticParams() {
  return []
}

type Professional = {
  id: string
  profile_slug: string
  full_name: string
  title: string | null
  credential_type: string
  specialties: string[]
  countries: string[]
  languages: string[]
  bio_public: string | null
  institution: string | null
  institution_country: string | null
  accepts_referrals: boolean
  consultation_available: boolean
  clinical_focus: string[] | null
}

const CREDENTIAL_LABEL: Record<string, string> = {
  physician:           'Physician',
  pharmacist:          'Pharmacist',
  nurse_practitioner:  'Nurse Practitioner',
  researcher:          'Clinical Researcher',
  pharmacologist:      'Pharmacologist',
  lawyer:              'Regulatory Lawyer',
  consultant:          'Consultant',
  regulator:           'Regulatory Specialist',
  educator:            'Educator',
  other:               'Professional',
}

async function getProfessional(slug: string): Promise<Professional | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  const svc = createClient(url, key, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })
  const { data, error } = await svc
    .from('hv_professionals')
    .select('id, profile_slug, full_name, title, credential_type, specialties, countries, languages, bio_public, institution, institution_country, accepts_referrals, consultation_available, clinical_focus')
    .eq('profile_slug', slug)
    .eq('status', 'active')
    .eq('verification_status', 'verified')
    .maybeSingle()
  guardIsrQuery(error, 'professionals/[slug]: hv_professionals')

  return data as Professional | null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const pro = await getProfessional(slug)
  if (!pro) return { title: 'Professional Not Found | Harbourview' }
  const name = pro.title ? `${pro.title} ${pro.full_name}` : pro.full_name
  const credLabel = (CREDENTIAL_LABEL[pro.credential_type] ?? 'Professional').toLowerCase()
  return {
    title: `${name} — ${CREDENTIAL_LABEL[pro.credential_type] ?? 'Professional'} | Harbourview`,
    description: pro.bio_public?.slice(0, 155) ?? `Verified ${credLabel} in the Harbourview cannabis medicine professional network.`,
  }
}

export default async function ProfessionalProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const pro = await getProfessional(slug)
  if (!pro) return notFound()

  const displayName = pro.title ? `${pro.title} ${pro.full_name}` : pro.full_name
  const credentialLabel = CREDENTIAL_LABEL[pro.credential_type] ?? pro.credential_type
  const initials = pro.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', fontFamily: 'inherit' }}>
      <style>{CSS}</style>

      <div className="pp-wrap">
        <Link href="/professionals" className="pp-back">← Professionals Directory</Link>

        <div className="pp-card">
          <div className="pp-header">
            <div className="pp-avatar">{initials}</div>
            <div className="pp-header-meta">
              <div className="pp-verified">✓ Verified by Harbourview</div>
              <h1 className="pp-name">{displayName}</h1>
              <p className="pp-credential">{credentialLabel}</p>
              {pro.institution && (
                <p className="pp-institution">
                  {pro.institution}
                  {pro.institution_country && ` · ${pro.institution_country}`}
                </p>
              )}
              <div className="pp-badges">
                {pro.accepts_referrals && (
                  <span className="pp-badge pp-badge--green">Accepts referrals</span>
                )}
                {pro.consultation_available && (
                  <span className="pp-badge pp-badge--blue">Consultation available</span>
                )}
              </div>
            </div>
          </div>

          {pro.bio_public && (
            <section className="pp-section">
              <h2 className="pp-section-title">About</h2>
              <p className="pp-bio">{pro.bio_public}</p>
            </section>
          )}

          {pro.countries.length > 0 && (
            <section className="pp-section">
              <h2 className="pp-section-title">Markets of practice</h2>
              <div className="pp-chips">
                {pro.countries.map(iso2 => (
                  <span key={iso2} className="pp-chip">
                    {flagEmoji(iso2)} {iso2}
                  </span>
                ))}
              </div>
            </section>
          )}

          {pro.specialties.length > 0 && (
            <section className="pp-section">
              <h2 className="pp-section-title">Specialties</h2>
              <div className="pp-chips">
                {pro.specialties.map(s => (
                  <span key={s} className="pp-chip pp-chip--gold">{s.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </section>
          )}

          {pro.clinical_focus && pro.clinical_focus.length > 0 && (
            <section className="pp-section">
              <h2 className="pp-section-title">Clinical focus</h2>
              <div className="pp-chips">
                {pro.clinical_focus.map(f => (
                  <span key={f} className="pp-chip">{f.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </section>
          )}

          {pro.languages.length > 0 && (
            <section className="pp-section">
              <h2 className="pp-section-title">Languages</h2>
              <div className="pp-chips">
                {pro.languages.map(l => (
                  <span key={l} className="pp-chip">{l}</span>
                ))}
              </div>
            </section>
          )}

          <div className="pp-cta-row">
            <Link href="/contact" className="pp-cta-primary">Request Introduction via Harbourview</Link>
            <Link href="/professionals/apply" className="pp-cta-secondary">Join the Directory</Link>
          </div>

          <p className="pp-disclaimer">
            This profile is non-promotional. Harbourview does not provide medical advice, legal advice, prescribing guidance,
            or investment recommendations. Professional listings are for peer connection and commercial coordination in
            regulated cannabis markets only.
          </p>
        </div>

        <footer className="pp-footnote">
          <div className="pp-footnote-links">
            <Link href="/professionals">All Professionals →</Link>
            <Link href="/markets">Market Briefings →</Link>
            <Link href="/marketplace">Exchange →</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const CSS = `
.pp-wrap { max-width: 780px; margin: 0 auto; padding: 48px 24px 80px; }
.pp-back { display: inline-block; font-size: 11px; color: #d4a84b; text-decoration: none; letter-spacing: .08em; margin-bottom: 32px; }
.pp-back:hover { opacity: .7; }

.pp-card {
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.07);
  background: rgba(255,255,255,.02);
  overflow: hidden;
}

.pp-header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 32px 32px 28px;
  border-bottom: 1px solid rgba(255,255,255,.06);
  flex-wrap: wrap;
}

.pp-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(212,168,75,.12);
  border: 1px solid rgba(212,168,75,.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #d4a84b;
  flex-shrink: 0;
  letter-spacing: .04em;
}

.pp-header-meta { flex: 1; min-width: 200px; }
.pp-verified { font-size: 10px; color: #4caf82; font-weight: 600; letter-spacing: .08em; margin-bottom: 8px; }
.pp-name { font-size: clamp(20px, 3vw, 26px); font-weight: 600; color: #f5f0e8; margin: 0 0 4px; line-height: 1.2; }
.pp-credential { font-size: 11px; text-transform: uppercase; letter-spacing: .14em; color: #d4a84b; font-weight: 600; margin: 0 0 4px; }
.pp-institution { font-size: 12px; color: rgba(245,240,232,.4); margin: 0 0 14px; }
.pp-badges { display: flex; gap: 8px; flex-wrap: wrap; }
.pp-badge { font-size: 9px; padding: 3px 9px; border-radius: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
.pp-badge--green { background: rgba(76,175,130,.1); color: #4caf82; border: 1px solid rgba(76,175,130,.2); }
.pp-badge--blue { background: rgba(91,155,213,.1); color: #5b9bd5; border: 1px solid rgba(91,155,213,.2); }

.pp-section { padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,.05); }
.pp-section-title { font-size: 10px; text-transform: uppercase; letter-spacing: .2em; color: rgba(245,240,232,.35); font-weight: 600; margin: 0 0 12px; }
.pp-bio { font-size: 14px; line-height: 1.75; color: rgba(245,240,232,.7); margin: 0; }
.pp-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.pp-chip { font-size: 11px; padding: 4px 12px; border-radius: 6px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); color: rgba(245,240,232,.6); text-transform: capitalize; }
.pp-chip--gold { background: rgba(212,168,75,.07); border: 1px solid rgba(212,168,75,.15); color: rgba(212,168,75,.7); }

.pp-cta-row { display: flex; gap: 12px; flex-wrap: wrap; padding: 28px 32px 16px; }
.pp-cta-primary { display: inline-flex; align-items: center; padding: 11px 22px; background: #d4a84b; color: #050c18; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; text-decoration: none; border-radius: 4px; transition: opacity .15s; }
.pp-cta-primary:hover { opacity: .85; }
.pp-cta-secondary { display: inline-flex; align-items: center; padding: 11px 22px; border: 1px solid rgba(245,240,232,.15); color: rgba(245,240,232,.7); font-size: 12px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; text-decoration: none; border-radius: 4px; transition: border-color .15s, color .15s; }
.pp-cta-secondary:hover { border-color: rgba(245,240,232,.35); color: #f5f0e8; }

.pp-disclaimer { font-size: 10px; color: rgba(245,240,232,.2); line-height: 1.6; padding: 0 32px 28px; margin: 0; }

.pp-footnote { margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,.06); }
.pp-footnote-links { display: flex; flex-wrap: wrap; gap: 16px; }
.pp-footnote-links a { font-size: 11px; color: #d4a84b; text-decoration: none; }
.pp-footnote-links a:hover { opacity: .7; }
`
