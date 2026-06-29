import type { Metadata } from 'next'
import { getCountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'
import type { CountryIntelProfile } from '@/lib/dashboard/dashboardLiveData'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Jurisdiction Comparison | Harbourview',
  description: 'Compare regulatory status, market access, and compliance requirements across multiple jurisdictions side by side.',
}

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_TONE: Record<string, string> = {
  open: '#4caf7d',
  permitted: '#4caf7d',
  legal: '#4caf7d',
  conditional: '#d4a84b',
  restricted: '#e57373',
  prohibited: '#e57373',
  illegal: '#e57373',
  emerging: '#64b5f6',
  research_only: '#64b5f6',
  unknown: 'rgba(245,240,232,.3)',
}

function statusColor(val: string | null | undefined): string {
  if (!val) return 'rgba(245,240,232,.3)'
  const key = val.toLowerCase().replace(/\s+/g, '_')
  for (const [k, c] of Object.entries(STATUS_TONE)) {
    if (key.includes(k)) return c
  }
  return 'rgba(245,240,232,.5)'
}

function StatusBadge({ value }: { value: string | null | undefined }) {
  const color = statusColor(value)
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
      background: `${color}18`, color, border: `1px solid ${color}40`,
      textTransform: 'uppercase',
    }}>
      {value ?? '—'}
    </span>
  )
}

function ScoreDot({ score }: { score: number | null | undefined }) {
  const s = score ?? 0
  const color = s >= 7 ? '#4caf7d' : s >= 4 ? '#d4a84b' : '#e57373'
  return (
    <span style={{ fontWeight: 700, color, fontSize: 18 }}>
      {score != null ? `${score}/10` : '—'}
    </span>
  )
}

const COMPARE_FIELDS: { key: keyof CountryIntelProfile; label: string; render: (v: CountryIntelProfile) => React.ReactNode }[] = [
  { key: 'opportunity_score',      label: 'Opportunity score',   render: p => <ScoreDot score={p.opportunity_score} /> },
  { key: 'market_access_status',   label: 'Market access',       render: p => <StatusBadge value={p.market_access_status} /> },
  { key: 'import_status',          label: 'Import',              render: p => <StatusBadge value={p.import_status} /> },
  { key: 'export_status',          label: 'Export',              render: p => <StatusBadge value={p.export_status} /> },
  { key: 'medical_status',         label: 'Medical programme',   render: p => <StatusBadge value={p.medical_status} /> },
  { key: 'adult_use_status',       label: 'Adult-use',           render: p => <StatusBadge value={p.adult_use_status} /> },
  { key: 'data_completeness',      label: 'Data completeness',   render: p => <StatusBadge value={p.data_completeness} /> },
  { key: 'regulator_label',        label: 'Regulator',           render: p => <span style={{ fontSize: 12, color: 'rgba(245,240,232,.75)' }}>{p.regulator_label ?? '—'}</span> },
  { key: 'briefing_regulatory_body', label: 'Regulatory body',  render: p => <span style={{ fontSize: 12, color: 'rgba(245,240,232,.75)' }}>{p.briefing_regulatory_body ?? '—'}</span> },
  { key: 'briefing_program_status', label: 'Programme status',   render: p => <span style={{ fontSize: 12, color: 'rgba(245,240,232,.75)', lineHeight: 1.5, display: 'block' }}>{p.briefing_program_status ?? '—'}</span> },
  { key: 'briefing_regulatory_outlook', label: 'Regulatory outlook', render: p => <span style={{ fontSize: 12, color: 'rgba(245,240,232,.65)', lineHeight: 1.55, display: 'block' }}>{p.briefing_regulatory_outlook ?? '—'}</span> },
  { key: 'commercial_pathway_summary', label: 'Commercial pathway', render: p => <span style={{ fontSize: 12, color: 'rgba(245,240,232,.65)', lineHeight: 1.55, display: 'block' }}>{p.commercial_pathway_summary ?? '—'}</span> },
  { key: 'recentChanges',           label: 'Recent changes',     render: p => {
    const changes = p.recentChanges ?? []
    if (changes.length === 0) return <span style={{ fontSize: 11, color: 'rgba(245,240,232,.35)' }}>No changes recorded</span>
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {changes.slice(0, 3).map(c => {
          const days = Math.floor((Date.now() - new Date(c.changed_at).getTime()) / 86400000)
          return (
            <div key={c.id} style={{ fontSize: 11, color: 'rgba(245,240,232,.65)', lineHeight: 1.4 }}>
              <span style={{ fontWeight: 700, color: '#d4a84b' }}>{c.field_name.replace(/_/g, ' ')}</span>
              {' '}→ {c.new_value ?? '—'}
              <span style={{ color: 'rgba(245,240,232,.4)', marginLeft: 6 }}>{days}d ago</span>
            </div>
          )
        })}
      </div>
    )
  }},
]

// ── page ──────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<{ countries?: string }>
}

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams
  const raw = params.countries ?? ''
  const codes = raw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, 5)

  const profiles = codes.length > 0
    ? await Promise.all(codes.map(iso2 => getCountryIntelProfile(iso2)))
    : []

  const valid = profiles.filter((p): p is CountryIntelProfile => p !== null)

  return (
    <main style={{ minHeight: '100vh', background: '#0d1117', color: '#f5f0e8', fontFamily: 'system-ui, sans-serif', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Link href="/dashboard" style={{ fontSize: 12, color: '#d4a84b', textDecoration: 'none', letterSpacing: '.06em' }}>← Dashboard</Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f5f0e8', margin: '12px 0 4px' }}>Jurisdiction Comparison</h1>
          <p style={{ fontSize: 14, color: 'rgba(245,240,232,.5)', margin: 0 }}>
            Side-by-side regulatory status across {valid.length > 0 ? valid.length : '—'} jurisdictions.
            {' '}<span style={{ color: 'rgba(245,240,232,.35)' }}>Share this URL to distribute the comparison.</span>
          </p>
        </div>

        {/* Country selector hint */}
        {valid.length === 0 && (
          <div style={{ background: 'rgba(212,168,75,.06)', border: '1px solid rgba(212,168,75,.2)', borderRadius: 8, padding: '24px', marginBottom: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#d4a84b', marginBottom: 8 }}>No jurisdictions selected</div>
            <p style={{ fontSize: 13, color: 'rgba(245,240,232,.6)', margin: 0 }}>
              Add ISO2 codes to the URL: <code style={{ background: 'rgba(245,240,232,.08)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>/compare?countries=DE,AU,CA,GB</code>
            </p>
          </div>
        )}

        {/* Comparison table */}
        {valid.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 180 }} />
                {valid.map(p => <col key={p.country_code} style={{ width: `${Math.floor((100 - 14) / valid.length)}%` }} />)}
              </colgroup>

              {/* Country headers */}
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(245,240,232,.35)', letterSpacing: '.08em', borderBottom: '1px solid rgba(245,240,232,.08)' }}>FIELD</th>
                  {valid.map(p => (
                    <th key={p.country_code} style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid rgba(245,240,232,.08)', verticalAlign: 'top' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#f5f0e8' }}>{p.country_name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(245,240,232,.4)', marginTop: 2, letterSpacing: '.06em' }}>{p.country_code} · {p.region ?? '—'}</div>
                      <div style={{ marginTop: 8 }}>
                        <Link
                          href={`/dashboard?country=${p.country_code}`}
                          style={{ fontSize: 11, color: '#d4a84b', textDecoration: 'none', fontWeight: 600 }}
                        >
                          Open in dashboard →
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Data rows */}
              <tbody>
                {COMPARE_FIELDS.map((field, i) => (
                  <tr key={field.key as string} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(245,240,232,.02)' }}>
                    <td style={{ padding: '14px 16px', fontSize: 12, fontWeight: 600, color: 'rgba(245,240,232,.5)', borderBottom: '1px solid rgba(245,240,232,.05)', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                      {field.label}
                    </td>
                    {valid.map(p => (
                      <td key={p.country_code} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(245,240,232,.05)', verticalAlign: 'top' }}>
                        {field.render(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/remove hint */}
        {valid.length > 0 && (
          <div style={{ marginTop: 32, padding: '16px', background: 'rgba(245,240,232,.03)', borderRadius: 8, border: '1px solid rgba(245,240,232,.08)' }}>
            <span style={{ fontSize: 12, color: 'rgba(245,240,232,.4)' }}>
              Add more jurisdictions: append ISO2 codes to the URL  ·  Max 5 per comparison
            </span>
          </div>
        )}

        {/* Footer disclaimer */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(245,240,232,.08)', fontSize: 11, color: 'rgba(245,240,232,.3)', lineHeight: 1.6 }}>
          Harbourview intelligence data is provided for general awareness only. Specialist legal and regulatory review is required before commercial reliance on any jurisdiction-specific compliance framework.
        </div>
      </div>
    </main>
  )
}
