import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_DB_SCHEMA } from '@/lib/supabase/env'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'Deal Rooms — Private Negotiations | Harbourview Exchange',
  description: 'Secure private deal rooms for cannabis B2B negotiations. Initiate from any marketplace listing.',
}

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  active:       'Active',
  negotiating:  'In negotiation',
  agreed:       'Terms agreed',
  closed:       'Closed',
  cancelled:    'Cancelled',
}

const STATUS_COLOR: Record<string, string> = {
  active:       '#4caf82',
  negotiating:  '#5b9bd5',
  agreed:       '#d4a84b',
  closed:       'rgba(245,240,232,.25)',
  cancelled:    '#e05555',
}

async function getUserDealRooms() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return { rooms: [], userId: null }

  const cookieStore = await cookies()
  const svc = createClient(url, anonKey, {
    auth: { persistSession: false },
    db: { schema: SUPABASE_DB_SCHEMA },
    global: {
      headers: { Cookie: cookieStore.toString() },
    },
  })

  const { data: { user } } = await svc.auth.getUser()
  if (!user) return { rooms: [], userId: null }

  const { data } = await svc
    .from('deal_rooms')
    .select('id, title, listing_ref, status, created_at, updated_at')
    .or(`initiator_id.eq.${user.id},counterparty_id.eq.${user.id}`)
    .order('updated_at', { ascending: false })

  return { rooms: data ?? [], userId: user.id }
}

export default async function DealRoomsPage() {
  const { rooms, userId } = await getUserDealRooms()
  const isLoggedIn = !!userId

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8', fontFamily: 'inherit' }}>
      <style>{CSS}</style>

      <div className="dr-wrap">
        <header className="dr-header">
          <Link href="/dashboard?page=marketplace" className="dr-back">← Exchange</Link>
          <div className="dr-eyebrow">Private Negotiations</div>
          <h1 className="dr-title">Deal Rooms</h1>
          <p className="dr-sub">
            Secure private deal rooms for confidential B2B negotiations.
            Initiate a deal room from any marketplace listing.
          </p>
        </header>

        {!isLoggedIn ? (
          <div className="dr-auth-gate">
            <div className="dr-auth-inner">
              <div className="dr-auth-icon">◈</div>
              <h2 className="dr-auth-title">Sign in to access deal rooms</h2>
              <p className="dr-auth-body">
                Deal rooms are available to authenticated Harbourview members.
                Sign in or create an account to initiate or access private negotiations.
              </p>
              <div className="dr-auth-actions">
                <Link href="/login" className="dr-cta-primary">Sign in →</Link>
                <Link href="/contact" className="dr-cta-secondary">Request access</Link>
              </div>
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="dr-empty">
            <div className="dr-empty-inner">
              <div className="dr-empty-icon">◈</div>
              <h2 className="dr-empty-title">No active deal rooms</h2>
              <p className="dr-empty-body">
                Deal rooms are initiated from marketplace listings. Browse the exchange to find
                products, services, or opportunities, then open a deal room to start a private negotiation.
              </p>
              <div className="dr-empty-actions">
                <Link href="/dashboard?page=marketplace" className="dr-cta-primary">Browse Exchange →</Link>
                <Link href="/dashboard?page=marketplace" className="dr-cta-secondary">Reviewed Listings</Link>
              </div>
            </div>

            <div className="dr-how">
              <h3 className="dr-how-title">How deal rooms work</h3>
              <div className="dr-how-grid">
                {[
                  { step: '01', title: 'Find a listing', body: 'Browse reviewed marketplace listings for cannabis products, services, genetics, equipment, or export opportunities.' },
                  { step: '02', title: 'Open a deal room', body: 'Click "Open deal room" on any listing to initiate a private, secure negotiation channel with the counterparty.' },
                  { step: '03', title: 'Negotiate privately', body: 'Exchange terms, documents, and offers within the encrypted deal room. No details are visible to third parties.' },
                  { step: '04', title: 'Agree and close', body: 'Mark terms as agreed and close the deal room. Harbourview does not process payments — commercial execution is external.' },
                ].map(item => (
                  <div key={item.step} className="dr-how-card">
                    <span className="dr-how-step">{item.step}</span>
                    <h4 className="dr-how-card-title">{item.title}</h4>
                    <p className="dr-how-card-body">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="dr-list">
            {rooms.map((room: { id: string; title: string; listing_ref: string | null; status: string; created_at: string; updated_at: string }) => {
              const color = STATUS_COLOR[room.status] ?? STATUS_COLOR.active
              return (
                <Link key={room.id} href={`/marketplace/deals/${room.id}`} className="dr-room-card">
                  <div className="dr-room-card-accent" style={{ background: color }} />
                  <div className="dr-room-header">
                    <h2 className="dr-room-title">{room.title}</h2>
                    <span className="dr-room-status" style={{ color, borderColor: `${color}40` }}>
                      {STATUS_LABEL[room.status] ?? room.status}
                    </span>
                  </div>
                  {room.listing_ref && (
                    <p className="dr-room-ref">Re: {room.listing_ref}</p>
                  )}
                  <p className="dr-room-meta">
                    Updated {new Date(room.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </Link>
              )
            })}
          </div>
        )}

        <footer className="dr-footnote">
          <p>
            Deal rooms are private to participants only. Harbourview does not access deal room content, process payments,
            or guarantee counterparty performance. All commercial execution is the responsibility of the parties.
          </p>
          <div className="dr-footnote-links">
            <Link href="/dashboard?page=marketplace">Reviewed Listings →</Link>
            <Link href="/dashboard?page=marketplace">Wanted Requests →</Link>
            <Link href="/contact">Commercial Enquiry →</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

const CSS = `
.dr-wrap { max-width: 900px; margin: 0 auto; padding: 48px 24px 80px; }
.dr-back { display: inline-block; font-size: 11px; color: #d4a84b; text-decoration: none; letter-spacing: .08em; margin-bottom: 32px; }
.dr-back:hover { opacity: .7; }
.dr-header { margin-bottom: 40px; }
.dr-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: .28em; text-transform: uppercase; color: rgba(212,168,75,.7); margin-bottom: 12px; }
.dr-title { font-family: 'Georgia', serif; font-size: clamp(28px, 4vw, 44px); font-weight: 400; color: #f5f0e8; letter-spacing: -.01em; margin: 0 0 12px; }
.dr-sub { font-size: 14px; color: rgba(245,240,232,.5); max-width: 560px; line-height: 1.6; margin: 0; }

.dr-auth-gate, .dr-empty { display: flex; flex-direction: column; gap: 48px; }
.dr-auth-inner, .dr-empty-inner {
  max-width: 540px; margin: 0 auto; text-align: center;
  padding: 56px 24px; border-radius: 16px;
  border: 1px solid rgba(212,168,75,.12); background: rgba(212,168,75,.02);
}
.dr-auth-icon, .dr-empty-icon { font-size: 32px; color: rgba(212,168,75,.4); margin-bottom: 20px; }
.dr-auth-title, .dr-empty-title { font-family: 'Georgia', serif; font-size: 22px; font-weight: 400; color: #f5f0e8; margin: 0 0 14px; }
.dr-auth-body, .dr-empty-body { font-size: 13px; line-height: 1.7; color: rgba(245,240,232,.5); margin: 0 0 8px; }
.dr-auth-actions, .dr-empty-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 24px; }

.dr-cta-primary { display: inline-flex; align-items: center; padding: 10px 20px; background: #d4a84b; color: #050c18; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; text-decoration: none; border-radius: 4px; transition: opacity .15s; }
.dr-cta-primary:hover { opacity: .85; }
.dr-cta-secondary { display: inline-flex; align-items: center; padding: 10px 20px; border: 1px solid rgba(245,240,232,.15); color: rgba(245,240,232,.7); font-size: 12px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; text-decoration: none; border-radius: 4px; transition: border-color .15s, color .15s; }
.dr-cta-secondary:hover { border-color: rgba(245,240,232,.3); color: #f5f0e8; }

.dr-how { }
.dr-how-title { font-size: 14px; font-weight: 600; letter-spacing: .08em; color: rgba(245,240,232,.4); text-transform: uppercase; margin: 0 0 20px; }
.dr-how-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.dr-how-card { padding: 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,.06); background: rgba(255,255,255,.015); }
.dr-how-step { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 10px; color: #d4a84b; font-weight: 600; letter-spacing: .1em; }
.dr-how-card-title { font-size: 13px; font-weight: 600; color: #f5f0e8; margin: 8px 0 6px; }
.dr-how-card-body { font-size: 11px; line-height: 1.6; color: rgba(245,240,232,.4); margin: 0; }

.dr-list { display: flex; flex-direction: column; gap: 12px; }
.dr-room-card {
  position: relative;
  display: flex; flex-direction: column; gap: 6px;
  padding: 20px 20px 20px 28px;
  border-radius: 12px; border: 1px solid rgba(255,255,255,.07);
  background: rgba(255,255,255,.02);
  text-decoration: none; color: inherit;
  overflow: hidden;
  transition: border-color .15s, background .15s;
}
.dr-room-card:hover { border-color: rgba(255,255,255,.14); background: rgba(255,255,255,.04); }
.dr-room-card-accent { position: absolute; top: 0; left: 0; width: 4px; height: 100%; opacity: .6; }
.dr-room-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.dr-room-title { font-size: 15px; font-weight: 600; color: #f5f0e8; margin: 0; }
.dr-room-status { font-size: 9px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; padding: 2px 8px; border-radius: 8px; border: 1px solid; flex-shrink: 0; }
.dr-room-ref { font-size: 11px; color: rgba(245,240,232,.35); margin: 0; }
.dr-room-meta { font-size: 9px; color: rgba(245,240,232,.2); font-family: 'JetBrains Mono', ui-monospace, monospace; margin: 0; }

.dr-footnote { margin-top: 64px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,.06); }
.dr-footnote p { font-size: 11px; line-height: 1.7; color: rgba(245,240,232,.3); max-width: 640px; margin: 0 0 16px; }
.dr-footnote-links { display: flex; flex-wrap: wrap; gap: 16px; }
.dr-footnote-links a { font-size: 11px; color: #d4a84b; text-decoration: none; }
.dr-footnote-links a:hover { opacity: .7; }
`
