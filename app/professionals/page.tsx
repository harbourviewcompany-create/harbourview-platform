import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { flagEmoji } from '@/lib/utils/flagEmoji'
import { guardIsrQuery } from '@/lib/isr/isrQueryGuard'

export const metadata: Metadata = {
  title: 'Clinical Professionals Directory — Cannabis Medicine | Harbourview',
  description:
    'Verified directory of cannabis medicine professionals: doctors, pharmacists, researchers, and clinical specialists across regulated markets. Join the Harbourview professional network.',
  openGraph: {
    title: 'Cannabis Clinical Professionals | Harbourview',
    description:
      'Verified directory of cannabis medicine clinicians and researchers in regulated markets worldwide.',
  },
}

// ISR: directory data
export const revalidate = 3600

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

async function getVerifiedProfessionals(): Promise<Professional[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  const svc = createClient(url, key, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })
  const { data, error } = await svc
    .from('hv_professionals')
    .select('id, profile_slug, full_name, title, credential_type, specialties, countries, languages, bio_public, institution, institution_country, accepts_referrals, consultation_available, clinical_focus')
    .eq('status', 'active')
    .eq('verification_status', 'verified')
    .order('full_name', { ascending: true })
  guardIsrQuery(error, 'professionals: hv_professionals')

  return (data ?? []) as Professional[]
}

export default async function ProfessionalsDirectoryPage() {
  const professionals = await getVerifiedProfessionals()
  const hasProfiles = professionals.length > 0

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', fontFamily: 'inherit' }}>
      <style>{CSS}</style>

      <div className="pro-wrap">
        <header className="pro-header">
          <div className="pro-eyebrow">Clinical Professional Network</div>
          <h1 className="pro-title">Cannabis Medicine Professionals</h1>
          <p className="pro-sub">
            Harbourview connects verified cannabis medicine clinicians, pharmacists, researchers,
            and regulatory specialists across the world&apos;s active regulated markets.
            All profiles are individually verified by the Harbourview team.
          </p>
          <div className="pro-header-actions">
            <Link href="/professionals/apply" className="pro-cta-primary">Join the Directory →</Link>
            <Link href="/contact" className="pro-cta-secondary">Request Introduction</Link>
          </div>
          <div className="pro-trust-note">
            Non-promotional. No medical advice, prescribing guidance, or investment recommendations are provided.
            Professional directory is for peer connection and commercial coordination only.
          </div>
        </header>

        {hasProfiles ? (
          <div className="pro-grid">
            {professionals.map(pro => (
              <Link
                key={pro.id}
                href={`/professionals/${pro.profile_slug}`}
                className="pro-card"
              >
                <div className="pro-card-top">
                  <div className="pro-avatar">
                    {pro.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="pro-card-meta">
                    <h2 className="pro-name">
                      {pro.title ? `${pro.title} ` : ''}{pro.full_name}
                    </h2>
                    <p className="pro-credential">{CREDENTIAL_LABEL[pro.credential_type] ?? pro.credential_type}</p>
                    {pro.institution && (
                      <p className="pro-institution">{pro.institution}</p>
                    )}
                  </div>
                </div>

                {pro.countries.length > 0 && (
                  <div className="pro-countries">
                    {pro.countries.slice(0, 5).map(iso2 => (
                      <span key={iso2} className="pro-flag-chip">
                        {flagEmoji(iso2)} {iso2}
                      </span>
                    ))}
                    {pro.countries.length > 5 && (
                      <span className="pro-flag-chip pro-flag-chip--more">+{pro.countries.length - 5}</span>
                    )}
                  </div>
                )}

                {pro.specialties.length > 0 && (
                  <div className="pro-specialties">
                    {pro.specialties.slice(0, 3).map(s => (
                      <span key={s} className="pro-specialty-chip">{s.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                )}

                {pro.bio_public && (
                  <p className="pro-bio">{pro.bio_public}</p>
                )}

                <div className="pro-card-footer">
                  <div className="pro-badges">
                    {pro.accepts_referrals && (
                      <span className="pro-badge pro-badge--green">Accepts referrals</span>
                    )}
                    {pro.consultation_available && (
                      <span className="pro-badge pro-badge--blue">Consultation available</span>
                    )}
                  </div>
                  <span className="pro-verified-badge">✓ Verified</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="pro-empty">
            <div className="pro-empty-inner">
              <div className="pro-empty-icon">⬡</div>
              <h2 className="pro-empty-title">Directory launching soon</h2>
              <p className="pro-empty-body">
                Harbourview is building the first verified directory of cannabis medicine professionals
                across regulated global markets. We are currently onboarding clinicians, pharmacists,
                researchers, and regulatory specialists.
              </p>
              <p className="pro-empty-body">
                Verified profiles will include your clinical focus, markets of practice, languages,
                and institutional affiliation — no promotional content, no advertising.
              </p>
              <div className="pro-empty-actions">
                <Link href="/professionals/apply" className="pro-cta-primary">Apply to Join →</Link>
                <Link href="/contact" className="pro-cta-secondary">Ask a question</Link>
              </div>
            </div>

            <div className="pro-pathway-grid">
              {[
                {
                  icon: '⚕',
                  title: 'Doctors & Clinicians',
                  body: 'Specialists prescribing or researching cannabis medicine: oncology, pain, neurology, palliative care, psychiatry, and general practice.',
                },
                {
                  icon: '⚗',
                  title: 'Pharmacists',
                  body: 'Cannabis-specialised pharmacists in hospital, clinical, compounding, and community settings across regulated markets.',
                },
                {
                  icon: '◎',
                  title: 'Researchers & Scientists',
                  body: 'Clinical researchers, pharmacologists, and scientists publishing or consulting on cannabinoid medicine.',
                },
                {
                  icon: '⊞',
                  title: 'Regulatory Specialists',
                  body: 'Professionals navigating cannabis licensing, pharmaceutical compliance, GMP, and import/export authorisations.',
                },
              ].map(card => (
                <div key={card.title} className="pro-pathway-card">
                  <div className="pro-pathway-icon">{card.icon}</div>
                  <h3 className="pro-pathway-title">{card.title}</h3>
                  <p className="pro-pathway-body">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="pro-footnote">
          <p>
            Harbourview professional profiles are non-promotional. No medical advice, legal advice, prescribing guidance,
            or investment recommendations are provided. Professional listings are for peer connection and commercial
            coordination in regulated cannabis markets only.
          </p>
          <div className="pro-footnote-links">
            <Link href="/markets">Market Briefings →</Link>
            <Link href="/dashboard?page=signals">Entry Playbooks →</Link>
            <Link href="/marketplace">Exchange →</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const CSS = `
.pro-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}
.pro-header { margin-bottom: 48px; }
.pro-eyebrow {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .28em;
  text-transform: uppercase;
  color: rgba(212,168,75,.7);
  margin-bottom: 12px;
}
.pro-title {
  font-family: 'Georgia', serif;
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 400;
  color: #f5f0e8;
  letter-spacing: -.01em;
  margin: 0 0 16px;
}
.pro-sub {
  font-size: 14px;
  color: rgba(245,240,232,.55);
  max-width: 680px;
  line-height: 1.7;
  margin: 0 0 24px;
}
.pro-header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.pro-cta-primary {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  background: #d4a84b;
  color: #050c18;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: 4px;
  transition: opacity .15s;
}
.pro-cta-primary:hover { opacity: .85; }
.pro-cta-secondary {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  border: 1px solid rgba(245,240,232,.15);
  color: rgba(245,240,232,.7);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: 4px;
  transition: border-color .15s, color .15s;
}
.pro-cta-secondary:hover { border-color: rgba(245,240,232,.35); color: #f5f0e8; }
.pro-trust-note {
  font-size: 11px;
  color: rgba(245,240,232,.25);
  max-width: 560px;
  line-height: 1.6;
}

.pro-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
.pro-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.07);
  background: rgba(255,255,255,.02);
  text-decoration: none;
  color: inherit;
  transition: border-color .15s, background .15s, transform .12s;
}
.pro-card:hover {
  border-color: rgba(212,168,75,.2);
  background: rgba(255,255,255,.035);
  transform: translateY(-1px);
}
.pro-card-top {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.pro-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(212,168,75,.12);
  border: 1px solid rgba(212,168,75,.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #d4a84b;
  flex-shrink: 0;
  letter-spacing: .04em;
}
.pro-card-meta { flex: 1; min-width: 0; }
.pro-name {
  font-size: 15px;
  font-weight: 600;
  color: #f5f0e8;
  margin: 0 0 3px;
  line-height: 1.3;
}
.pro-credential {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: #d4a84b;
  font-weight: 600;
  margin: 0 0 2px;
}
.pro-institution {
  font-size: 11px;
  color: rgba(245,240,232,.35);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pro-countries {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.pro-flag-chip {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255,255,255,.05);
  color: rgba(245,240,232,.5);
}
.pro-flag-chip--more {
  color: rgba(245,240,232,.3);
  background: transparent;
  border: 1px solid rgba(255,255,255,.07);
}
.pro-specialties {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.pro-specialty-chip {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(212,168,75,.07);
  border: 1px solid rgba(212,168,75,.12);
  color: rgba(212,168,75,.6);
  text-transform: capitalize;
}
.pro-bio {
  font-size: 12px;
  line-height: 1.6;
  color: rgba(245,240,232,.5);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pro-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,.05);
}
.pro-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.pro-badge {
  font-size: 9px;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
}
.pro-badge--green {
  background: rgba(76,175,130,.1);
  color: #4caf82;
  border: 1px solid rgba(76,175,130,.2);
}
.pro-badge--blue {
  background: rgba(91,155,213,.1);
  color: #5b9bd5;
  border: 1px solid rgba(91,155,213,.2);
}
.pro-verified-badge {
  font-size: 9px;
  color: #4caf82;
  font-weight: 600;
  letter-spacing: .06em;
}

/* Empty state */
.pro-empty { display: flex; flex-direction: column; gap: 48px; }
.pro-empty-inner {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
  padding: 64px 24px;
  border-radius: 16px;
  border: 1px solid rgba(212,168,75,.12);
  background: rgba(212,168,75,.03);
}
.pro-empty-icon {
  font-size: 36px;
  color: rgba(212,168,75,.4);
  margin-bottom: 20px;
}
.pro-empty-title {
  font-family: 'Georgia', serif;
  font-size: 24px;
  font-weight: 400;
  color: #f5f0e8;
  margin: 0 0 16px;
}
.pro-empty-body {
  font-size: 14px;
  line-height: 1.7;
  color: rgba(245,240,232,.5);
  margin: 0 0 12px;
}
.pro-empty-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 28px;
}
.pro-pathway-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.pro-pathway-card {
  padding: 24px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.06);
  background: rgba(255,255,255,.015);
}
.pro-pathway-icon {
  font-size: 20px;
  color: rgba(212,168,75,.5);
  margin-bottom: 12px;
}
.pro-pathway-title {
  font-size: 14px;
  font-weight: 600;
  color: #f5f0e8;
  margin: 0 0 8px;
}
.pro-pathway-body {
  font-size: 12px;
  line-height: 1.65;
  color: rgba(245,240,232,.4);
  margin: 0;
}

.pro-footnote {
  margin-top: 64px;
  padding-top: 24px;
  border-top: 1px solid rgba(255,255,255,.06);
}
.pro-footnote p {
  font-size: 11px;
  line-height: 1.7;
  color: rgba(245,240,232,.3);
  max-width: 640px;
  margin: 0 0 16px;
}
.pro-footnote-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.pro-footnote-links a {
  font-size: 11px;
  color: #d4a84b;
  text-decoration: none;
}
.pro-footnote-links a:hover { opacity: .7; }
`
