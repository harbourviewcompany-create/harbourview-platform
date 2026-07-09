// app/intelligence/regulatory-pathways/page.tsx
// Live surface: regulatory framework cross-links via live briefings + playbooks.
// Replaces the static IntelligenceModulePage wrapper.

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { getAllPlaybooks } from '@/lib/intelligence/jurisdictionPlaybooks'

export const metadata: Metadata = {
  title: 'Regulatory Pathways | Harbourview Intelligence',
  description:
    'Regulatory access pathway mapping across medical, pharmaceutical, research and adult-use frameworks in priority markets.',
}

export const dynamic = 'force-dynamic'

type Briefing = {
  country_iso2: string
  country_name: string
  legal_status: string
  market_maturity: string
  headline: string
  week_ending: string
}

async function getLatestBriefings(): Promise<Briefing[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []
  const client = createClient(url, key, { auth: { persistSession: false }, db: { schema: SUPABASE_DB_SCHEMA } })
  const { data } = await client
    .from('jurisdiction_briefings')
    .select('country_iso2, country_name, legal_status, market_maturity, headline, week_ending')
    .eq('status', 'published')
    .order('week_ending', { ascending: false })
    .limit(60)
  if (!data) return []
  const seen = new Set<string>()
  return (data as Briefing[]).filter(b => {
    if (seen.has(b.country_iso2)) return false
    seen.add(b.country_iso2)
    return true
  })
}

const FLAGS: Record<string, string> = {
  DE: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ©ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂª', GB: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§', AU: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¦ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂº', CA: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¦', NL: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±',
  PT: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹', TH: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ­', IL: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ®ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±', CO: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ´', ZA: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¿ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¦',
  MT: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ²ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¹', LU: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂº', CZ: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¿', NZ: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¿', MX: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ²ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ½',
  BR: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ·', CH: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ­', FR: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ«ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ·', ES: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ¸', PL: 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ±',
  AE: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂª', AG: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬', AR: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ·', AT: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¹', BA: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦', BB: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ§', BE: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ§ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂª',
  CL: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ±', CR: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¨ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ·', DK: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ©ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ°', DM: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ©ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ²', DO: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ©ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ´', EC: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¨', EE: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂªÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂª',
  FI: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ«ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ®', GD: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ©', GH: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ­', GR: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ·', GY: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¾', HR: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ­ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ·', HU: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ­ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂº',
  IE: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ®ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂª', IS: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ®ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¸', JM: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ²', JP: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¯ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµ', KN: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ°ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ³', KR: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ°ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ·', LB: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ§',
  LC: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¨', LI: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ®', LT: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¹', LV: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ±ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ»', MK: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ²ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ°', MU: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ²ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂº', NO: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ³ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ´',
  PA: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦', PE: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂª', PH: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ­', PR: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂµÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ·', RO: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ·ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ´', RS: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ·ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¸', SC: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¸ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¨',
  SE: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¸ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂª', SG: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¸ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¬', SI: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¸ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ®', SK: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¸ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ°', TR: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ·', TT: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¹ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¹', UA: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂºÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¦',
  US: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂºÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¸', UY: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂºÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¾', VC: 'ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ»ÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂ¨',
  BG: 'ð§ð¬', CY: 'ð¨ð¾',
}

const LEGAL_LABEL: Record<string, string> = {
  medical_only: 'Medical only', adult_use: 'Adult-use', decrim: 'Decriminalised',
  illegal: 'Prohibited', mixed: 'Mixed', transitional: 'Transitional', unknown: 'ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ',
}

const MATURITY_COLOR: Record<string, string> = {
  emerging: '#d4a84b', developing: '#5b9bd5', maturing: '#4caf82',
  mature: '#4caf82', restricted: '#e05555', unknown: 'rgba(245,240,232,.25)',
}

// Pathway type taxonomy
const ACCESS_MODELS = [
  { label: 'Medical prescription', markets: ['DE','GB','AU','CA','NL','PT','IL','ZA','MT','CZ','PL','AG','AR','BA','BB','CL','CR','DK','EC','GR','JM','JP','KR','LI','LT','LV','MK','NO','PE','RO','RS','SE','SI','SK','TR','UA','US','VC'], note: 'Prescription-only or authorised prescriber model.' },
  { label: 'Special access / named patient', markets: ['GB','AU','NZ','CH','FR','IE','HR'], note: 'Unlicensed import with per-patient or per-batch authorisation.' },
  { label: 'Adult-use regulated', markets: ['CA','TH','LU','DE','UY','MT'], note: 'Non-medical adult purchase permitted within licensed retail framework.' },
  { label: 'Research / clinical trial', markets: ['GB','AU','CA','DE','NL','IL','US'], note: 'Ethics-approved research or CTA/IND-equivalent framework.' },
  { label: 'Industrial hemp / CBD', markets: ['DE','NL','FR','ES','PL','CZ','IT','AT','BE','BG','HR','CY','DK','EE','FI','GR','HU','IE','LV','LT','LU','MT','PT','RO','SK','SI','SE','GB','CH','US','CA'], note: 'EU certified hemp variety, <0.3% THC; CBD Novel Food status varies.' },
  { label: 'Pharmaceutical MA pathway', markets: ['GB','DE','NL','AU','IT','ES','BE','LU','NO','DK','SE','IS','PT','PL','AT','CH','FR','IE','FI','CZ','SK','CA','NZ','GR','HR','HU','EE','LT','LV','LI','MT','RO','SI','US','BG','CY'], note: 'Full market authorisation for a specific named cannabis medicine.' },
]

export default async function RegulatoryPathwaysPage() {
  const [briefings, playbooks] = await Promise.all([getLatestBriefings(), getAllPlaybooks()])

  const briefingMap = new Map(briefings.map(b => [b.country_iso2, b]))

  const byStatus: Record<string, Briefing[]> = {}
  briefings.forEach(b => {
    if (!byStatus[b.legal_status]) byStatus[b.legal_status] = []
    byStatus[b.legal_status].push(b)
  })

  const statusOrder = ['adult_use', 'medical_only', 'transitional', 'decrim', 'illegal', 'mixed', 'unknown']

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', fontFamily: 'inherit' }}>
      <style>{CSS}</style>
      <div className="rp-wrap">

        <nav className="rp-nav">
          <Link href="/intelligence" className="rp-link">Intelligence</Link>
          <span className="rp-sep">ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂº</span>
          <span className="rp-cur">Regulatory Pathways</span>
        </nav>

        <header className="rp-header">
          <p className="rp-eyebrow">Intelligence / Regulatory</p>
          <h1 className="rp-title">Regulatory pathway mapping for cannabis market access.</h1>
          <p className="rp-sub">
            Orientation-level access model structures, licensing frameworks, and competent authority
            roles across medical, pharmaceutical, research and adult-use markets.
            {briefings.length > 0 && ` Live data from ${briefings.length} jurisdictions.`}
          </p>
        </header>

        {/* Access model taxonomy */}
        <section className="rp-section">
          <h2 className="rp-section-title">Access Model Taxonomy</h2>
          <p className="rp-section-sub">The six primary regulatory access models across tracked markets. Most jurisdictions use more than one.</p>
          <div className="rp-models">
            {ACCESS_MODELS.map(model => (
              <div key={model.label} className="rp-model-card">
                <h3 className="rp-model-title">{model.label}</h3>
                <p className="rp-model-note">{model.note}</p>
                <div className="rp-model-markets">
                  {model.markets.map(iso2 => {
                    const briefing = briefingMap.get(iso2)
                    return (
                      <Link
                        key={iso2}
                        href={`/intelligence/playbooks/${iso2.toLowerCase()}`}
                        className="rp-model-chip"
                      >
                        {FLAGS[iso2] ?? 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ'} {iso2}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live market status by legal framework */}
        {briefings.length > 0 && (
          <section className="rp-section">
            <h2 className="rp-section-title">Live Market Status by Framework</h2>
            <p className="rp-section-sub">Current legal framework across {briefings.length} jurisdictions from Harbourview&apos;s weekly intelligence synthesis.</p>
            <div className="rp-framework-groups">
              {statusOrder.filter(s => byStatus[s]?.length > 0).map(status => (
                <div key={status} className="rp-framework-group">
                  <p className="rp-fw-label">{LEGAL_LABEL[status]}</p>
                  <div className="rp-fw-markets">
                    {(byStatus[status] ?? []).slice(0, 20).map(b => {
                      const color = MATURITY_COLOR[b.market_maturity] ?? MATURITY_COLOR.unknown
                      const pb = playbooks.find(p => p.country_iso2 === b.country_iso2)
                      return (
                        <Link
                          key={b.country_iso2}
                          href={pb ? `/intelligence/playbooks/${b.country_iso2.toLowerCase()}` : `/intelligence/country/${b.country_iso2.toLowerCase()}`}
                          className="rp-fw-chip"
                          style={{ borderColor: `${color}30`, color: 'rgba(245,240,232,.65)' }}
                          title={b.headline}
                        >
                          {FLAGS[b.country_iso2] ?? 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ'} {b.country_name ?? b.country_iso2}
                          <span className="rp-fw-mat" style={{ color }}>ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ· {b.market_maturity}</span>
                        </Link>
                      )
                    })}
                    {(byStatus[status] ?? []).length > 20 && (
                      <span className="rp-fw-more">+{(byStatus[status] ?? []).length - 20} more</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Playbooks with licensing detail */}
        {playbooks.length > 0 && (
          <section className="rp-section">
            <h2 className="rp-section-title">Jurisdiction Licensing Sequences</h2>
            <p className="rp-section-sub">Step-by-step licensing sequences for {playbooks.length} priority markets ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ named regulators, pathway steps, and typical timelines.</p>
            <div className="rp-playbooks">
              {playbooks.map(pb => (
                <Link key={pb.country_iso2} href={`/intelligence/playbooks/${pb.country_iso2.toLowerCase()}`} className="rp-pb">
                  <span className="rp-pb-flag">{FLAGS[pb.country_iso2] ?? 'ÃÂÃÂÃÂÃÂ°ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ'}</span>
                  <div className="rp-pb-meta">
                    <span className="rp-pb-name">{pb.country_name}</span>
                    <span className="rp-pb-detail">{pb.steps.length} steps ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ· {pb.typical_timeline_months}mo ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ· {pb.key_regulators.length} regulator{pb.key_regulators.length !== 1 ? 's' : ''}</span>
                  </div>
                  <span className="rp-pb-arr">ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="rp-cta">
          <p className="rp-cta-eyebrow">Private pathway analysis</p>
          <h2 className="rp-cta-title">Specific pathway questions go through private intake</h2>
          <p className="rp-cta-body">
            Questions involving named products, active submissions, licence applications, or specific
            regulatory engagements are handled through Harbourview&apos;s confidential intake ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ not this
            public surface. Harbourview does not provide legal advice.
          </p>
          <div className="rp-cta-actions">
            <Link href="/intake" className="rp-gold">Start Confidential Intake ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ</Link>
            <Link href="/intelligence/licensing-pathways" className="rp-ghost">Licensing Pathways</Link>
          </div>
        </section>

        <footer className="rp-footnote">
          <p>Regulatory pathway summaries are orientation-level only. They do not confirm eligibility, authorisation scope or route viability. Verify requirements with qualified local legal advisors and the relevant competent authority.</p>
          <div className="rp-f-links">
            <Link href="/intelligence/playbooks">Market Playbooks ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ</Link>
            <Link href="/intelligence/licensing-pathways">Licensing Pathways ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ</Link>
            <Link href="/markets">Market Briefings ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const CSS = `
.rp-wrap{max-width:1000px;margin:0 auto;padding:48px 24px 80px}
.rp-nav{display:flex;align-items:center;gap:8px;margin-bottom:40px}
.rp-link{font-size:11px;letter-spacing:.08em;color:#d4a84b;text-decoration:none}
.rp-link:hover{opacity:.7}
.rp-sep{color:rgba(245,240,232,.2);font-size:11px}
.rp-cur{font-size:11px;color:rgba(245,240,232,.4)}
.rp-header{margin-bottom:36px}
.rp-eyebrow{font-size:10px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:rgba(212,168,75,.7);margin-bottom:10px}
.rp-title{font-family:Georgia,serif;font-size:clamp(24px,3.5vw,40px);font-weight:400;color:#f5f0e8;letter-spacing:-.01em;margin:0 0 14px;max-width:700px}
.rp-sub{font-size:14px;color:rgba(245,240,232,.55);max-width:620px;line-height:1.7;margin:0}
.rp-section{margin-bottom:44px}
.rp-section-title{font-family:Georgia,serif;font-size:20px;font-weight:400;color:#f5f0e8;margin:0 0 6px}
.rp-section-sub{font-size:13px;color:rgba(245,240,232,.4);max-width:560px;line-height:1.6;margin:0 0 20px}
.rp-models{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.rp-model-card{padding:18px 20px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.rp-model-title{font-size:13px;font-weight:600;color:rgba(245,240,232,.85);margin:0 0 5px}
.rp-model-note{font-size:12px;color:rgba(245,240,232,.4);margin:0 0 10px;line-height:1.5}
.rp-model-markets{display:flex;flex-wrap:wrap;gap:6px}
.rp-model-chip{padding:2px 8px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);font-size:10px;color:rgba(245,240,232,.5);text-decoration:none;font-family:'JetBrains Mono',ui-monospace,monospace;transition:border-color .15s}
.rp-model-chip:hover{border-color:rgba(212,168,75,.4);color:#d4a84b}
.rp-framework-groups{display:flex;flex-direction:column;gap:20px}
.rp-framework-group{}
.rp-fw-label{font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:rgba(212,168,75,.5);margin-bottom:8px}
.rp-fw-markets{display:flex;flex-wrap:wrap;gap:8px}
.rp-fw-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:20px;border:1px solid;background:rgba(255,255,255,.02);font-size:12px;text-decoration:none;transition:background .15s}
.rp-fw-chip:hover{background:rgba(255,255,255,.05)}
.rp-fw-mat{font-size:10px;font-family:'JetBrains Mono',ui-monospace,monospace}
.rp-fw-more{font-size:11px;color:rgba(245,240,232,.25);align-self:center}
.rp-playbooks{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.rp-pb{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02);text-decoration:none;transition:border-color .15s}
.rp-pb:hover{border-color:rgba(212,168,75,.3)}
.rp-pb-flag{font-size:16px;flex-shrink:0}
.rp-pb-meta{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.rp-pb-name{font-size:13px;font-weight:600;color:rgba(245,240,232,.8)}
.rp-pb-detail{font-size:10px;color:rgba(245,240,232,.3);font-family:'JetBrains Mono',ui-monospace,monospace}
.rp-pb-arr{color:rgba(212,168,75,.4);font-size:12px}
.rp-cta{padding:32px;border-radius:16px;border:1px solid rgba(212,168,75,.12);background:rgba(212,168,75,.03);margin-bottom:48px}
.rp-cta-eyebrow{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(212,168,75,.6);margin-bottom:8px}
.rp-cta-title{font-family:Georgia,serif;font-size:22px;font-weight:400;color:#f5f0e8;margin:0 0 10px}
.rp-cta-body{font-size:13px;line-height:1.7;color:rgba(245,240,232,.5);margin:0 0 18px;max-width:520px}
.rp-cta-actions{display:flex;gap:10px;flex-wrap:wrap}
.rp-gold{display:inline-flex;align-items:center;padding:10px 20px;background:#d4a84b;color:#050c18;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px;transition:opacity .15s}
.rp-gold:hover{opacity:.85}
.rp-ghost{display:inline-flex;align-items:center;padding:10px 20px;border:1px solid rgba(245,240,232,.15);color:rgba(245,240,232,.6);font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:4px}
.rp-ghost:hover{border-color:rgba(245,240,232,.35);color:#f5f0e8}
.rp-footnote{padding-top:24px;border-top:1px solid rgba(255,255,255,.06)}
.rp-footnote p{font-size:11px;line-height:1.7;color:rgba(245,240,232,.25);max-width:600px;margin:0 0 14px}
.rp-f-links{display:flex;flex-wrap:wrap;gap:16px}
.rp-f-links a{font-size:11px;color:#d4a84b;text-decoration:none}
.rp-f-links a:hover{opacity:.7}
`
