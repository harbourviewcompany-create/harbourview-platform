import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWatchlistData } from '@/lib/dashboard/dashboardLiveData'
import { getJurisdictionBriefing } from '@/app/actions/getJurisdictionBriefing'
import {
  generatePersonalBriefing,
  getSynthBriefingsForMarkets,
} from '@/lib/intelligence/personalBriefing'

export const metadata: Metadata = {
  title: 'My Briefings | Harbourview',
  description:
    'Personalized market briefings driven by your watch rules, watched jurisdictions, and weekly LLM synthesis.',
}

export const dynamic = 'force-dynamic'

const ISO2_RE = /^[A-Z]{2}$/

function extractIso2Hints(
  rules: { keywords: string[] }[],
  items: { jurisdiction: string | null }[],
): string[] {
  const found = new Set<string>()
  for (const item of items) {
    const j = item.jurisdiction?.trim().toUpperCase()
    if (j && ISO2_RE.test(j)) found.add(j)
  }
  for (const rule of rules) {
    for (const kw of rule.keywords) {
      const t = kw.trim().toUpperCase()
      if (ISO2_RE.test(t)) found.add(t)
    }
  }
  return Array.from(found).slice(0, 6)
}

export default async function MyBriefingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard/my-briefings')
  }

  const watchlist = await getWatchlistData(user.id)
  const activeRules = watchlist.rules.filter((r) => r.is_active)
  const iso2List = extractIso2Hints(activeRules, watchlist.items)
  const keywordPool = activeRules.flatMap((r) => r.keywords).slice(0, 12)
  const ruleTypes = Array.from(new Set(activeRules.map((r) => r.rule_type)))

  const [staticBriefings, synthBriefings, personal] = await Promise.all([
    Promise.all(
      iso2List.map(async (iso2) => {
        const briefing = await getJurisdictionBriefing(iso2)
        return { iso2, briefing }
      }),
    ).then((rows) => rows.filter((b) => b.briefing)),
    getSynthBriefingsForMarkets(iso2List),
    generatePersonalBriefing({
      keywords: keywordPool,
      iso2List,
      ruleTypes,
    }),
  ])

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8' }}>
      <style>{CSS}</style>
      <div className="mb-wrap">
        <header className="mb-header">
          <div className="mb-eyebrow">Intelligence · Personalized</div>
          <h1 className="mb-title">My briefings</h1>
          <p className="mb-sub">
            Assembled from your active watch rules, watched jurisdictions, published orientation
            briefings, and weekly LLM market synthesis. Interactive rule management lives in the
            Command Centre; delivery preferences use signal subscriptions.
          </p>
          <div className="mb-actions">
            <Link href="/dashboard?page=intel" className="mb-btn">
              Open watchlist / rules
            </Link>
            <Link href="/daily" className="mb-btn mb-btn--ghost">
              Daily digest
            </Link>
            <Link href="/intelligence" className="mb-btn mb-btn--ghost">
              Markets
            </Link>
          </div>
        </header>

        <section className="mb-section mb-section--personal">
          <div className="mb-personal-meta">
            <h2 className="mb-section-title">Personal synthesis</h2>
            <span className={`mb-source mb-source--${personal.source}`}>
              {personal.source === 'llm' ? 'LLM' : 'Assembled'}
            </span>
          </div>
          <p className="mb-personal-body">{personal.narrative}</p>
          {personal.marketsCovered.length > 0 && (
            <div className="mb-chips">
              {personal.marketsCovered.map((m) => (
                <span key={m} className="mb-chip mb-chip--gold">
                  {m}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="mb-section">
          <h2 className="mb-section-title">Active watch rules ({activeRules.length})</h2>
          {activeRules.length === 0 ? (
            <p className="mb-empty">
              No active rules yet. Add keyword or jurisdiction rules in the Command Centre watchlist
              to drive this briefing surface.
            </p>
          ) : (
            <ul className="mb-rule-list">
              {activeRules.map((r) => (
                <li key={r.id} className="mb-rule">
                  <span className="mb-rule-type">{r.rule_type.replace(/_/g, ' ')}</span>
                  <div className="mb-chips">
                    {r.keywords.map((k) => (
                      <span key={k} className="mb-chip">
                        {k}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {keywordPool.length > 0 && (
          <section className="mb-section">
            <h2 className="mb-section-title">Keyword focus</h2>
            <div className="mb-chips">
              {keywordPool.map((k) => (
                <span key={k} className="mb-chip mb-chip--gold">
                  {k}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="mb-section">
          <h2 className="mb-section-title">
            Weekly LLM market briefings ({synthBriefings.length})
          </h2>
          {synthBriefings.length === 0 ? (
            <p className="mb-empty">
              No published weekly synthesis for your watched ISO2 markets yet. Weekly synthesis runs
              against reviewed signals for priority jurisdictions.
            </p>
          ) : (
            <div className="mb-brief-grid">
              {synthBriefings.map(({ iso2, briefing }) => (
                <article key={`synth-${iso2}`} className="mb-brief-card mb-brief-card--synth">
                  <div className="mb-brief-iso">
                    {iso2} · week {briefing.week_ending}
                  </div>
                  <h3 className="mb-brief-title">{briefing.headline}</h3>
                  <p className="mb-brief-body">{briefing.summary.slice(0, 320)}</p>
                  {briefing.operator_implications && (
                    <p className="mb-brief-ops">{briefing.operator_implications.slice(0, 220)}</p>
                  )}
                  <div className="mb-brief-meta">
                    <span>{briefing.legal_status.replace(/_/g, ' ')}</span>
                    <span>{briefing.market_maturity}</span>
                    <span>{briefing.signal_count} signals</span>
                  </div>
                  <Link
                    href={`/intelligence/country/${iso2.toLowerCase()}`}
                    className="mb-brief-link"
                  >
                    Open market →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mb-section">
          <h2 className="mb-section-title">
            Orientation briefings ({staticBriefings.length})
          </h2>
          {staticBriefings.length === 0 ? (
            <p className="mb-empty">
              Add watched markets (ISO2) or jurisdiction keywords to your watch rules to surface
              published orientation briefings here.
            </p>
          ) : (
            <div className="mb-brief-grid">
              {staticBriefings.map(({ iso2, briefing }) => (
                <article key={iso2} className="mb-brief-card">
                  <div className="mb-brief-iso">{iso2}</div>
                  <h3 className="mb-brief-title">
                    {(briefing as { regulatory_body?: string | null })?.regulatory_body ||
                      `${iso2} jurisdiction briefing`}
                  </h3>
                  <p className="mb-brief-body">
                    {(
                      (briefing as { program_status?: string | null })?.program_status ||
                      (briefing as { market_dynamics?: string | null })?.market_dynamics ||
                      (briefing as { regulatory_outlook?: string | null })?.regulatory_outlook ||
                      'Published jurisdiction briefing available.'
                    ).slice(0, 280)}
                  </p>
                  <Link
                    href={`/intelligence/country/${iso2.toLowerCase()}`}
                    className="mb-brief-link"
                  >
                    Open market →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mb-section mb-section--note">
          <h2 className="mb-section-title">Delivery & preferences</h2>
          <ul className="mb-roadmap">
            <li>
              Email digests already run via <code>signal_subscriptions</code> + intelligence-notify
              cron (daily/weekly cadence, market filters).
            </li>
            <li>
              Configure markets, types, and frequency from your account / signals subscribe flow
              (Intel or Operator tier).
            </li>
            <li>
              Scheduled personal-briefing email (watch-rule-driven) is the next Phase 2 depth item.
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}

const CSS = `
.mb-wrap { max-width: 960px; margin: 0 auto; padding: 48px 24px 80px; }
.mb-header { margin-bottom: 36px; }
.mb-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: .28em; text-transform: uppercase; color: rgba(212,168,75,.7); margin-bottom: 12px; }
.mb-title { font-family: Georgia, serif; font-size: clamp(26px, 4vw, 36px); font-weight: 400; color: #f5f0e8; margin: 0 0 12px; }
.mb-sub { font-size: 14px; line-height: 1.7; color: rgba(245,240,232,.55); max-width: 680px; margin: 0 0 20px; }
.mb-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.mb-btn {
  display: inline-flex; align-items: center; padding: 9px 16px; border-radius: 6px;
  background: #d4a84b; color: #050c18; font-size: 11px; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase; text-decoration: none;
}
.mb-btn--ghost {
  background: transparent; border: 1px solid rgba(245,240,232,.15); color: rgba(245,240,232,.7);
}
.mb-section { margin-bottom: 32px; }
.mb-section-title {
  font-size: 10px; letter-spacing: .18em; text-transform: uppercase;
  color: rgba(245,240,232,.35); margin: 0 0 14px; font-weight: 600;
}
.mb-empty { font-size: 13px; color: rgba(245,240,232,.45); line-height: 1.6; }
.mb-rule-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.mb-rule {
  padding: 12px 14px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,.07); background: rgba(255,255,255,.02);
}
.mb-rule-type { font-size: 12px; font-weight: 600; color: #f5f0e8; text-transform: capitalize; display: block; margin-bottom: 8px; }
.mb-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.mb-chip {
  font-size: 10px; padding: 3px 9px; border-radius: 5px;
  background: rgba(91,155,213,.1); border: 1px solid rgba(91,155,213,.22); color: #5b9bd5;
}
.mb-chip--gold {
  background: rgba(212,168,75,.08); border-color: rgba(212,168,75,.22); color: rgba(212,168,75,.85);
}
.mb-brief-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.mb-brief-card {
  padding: 16px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,.07); background: rgba(255,255,255,.02);
}
.mb-brief-card--synth {
  border-color: rgba(212,168,75,.18);
  background: rgba(212,168,75,.04);
}
.mb-brief-iso { font-size: 10px; letter-spacing: .14em; color: #d4a84b; font-weight: 700; margin-bottom: 6px; }
.mb-brief-title { font-size: 14px; font-weight: 600; color: #f5f0e8; margin: 0 0 8px; }
.mb-brief-body { font-size: 12px; line-height: 1.6; color: rgba(245,240,232,.5); margin: 0 0 10px; }
.mb-brief-ops { font-size: 12px; line-height: 1.55; color: rgba(245,240,232,.62); margin: 0 0 10px; }
.mb-brief-meta {
  display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;
  font-size: 10px; letter-spacing: .04em; text-transform: uppercase;
  color: rgba(245,240,232,.35);
}
.mb-brief-link { font-size: 11px; color: #d4a84b; text-decoration: none; }
.mb-roadmap { margin: 0; padding-left: 18px; color: rgba(245,240,232,.45); font-size: 13px; line-height: 1.7; }
.mb-roadmap code { font-size: 11px; color: rgba(212,168,75,.75); }
.mb-section--note {
  padding: 18px; border-radius: 12px;
  border: 1px solid rgba(212,168,75,.12); background: rgba(212,168,75,.03);
}
.mb-section--personal {
  padding: 20px; border-radius: 14px;
  border: 1px solid rgba(212,168,75,.2); background: linear-gradient(160deg, rgba(212,168,75,.07), rgba(255,255,255,.02));
}
.mb-personal-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.mb-personal-meta .mb-section-title { margin: 0; }
.mb-personal-body {
  font-family: Georgia, serif; font-size: 15px; line-height: 1.75;
  color: rgba(245,240,232,.82); margin: 0 0 14px;
}
.mb-source {
  font-size: 9px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
  padding: 3px 8px; border-radius: 4px;
}
.mb-source--llm {
  background: rgba(212,168,75,.15); color: rgba(212,168,75,.9);
  border: 1px solid rgba(212,168,75,.28);
}
.mb-source--fallback {
  background: rgba(255,255,255,.04); color: rgba(245,240,232,.4);
  border: 1px solid rgba(255,255,255,.08);
}
`
