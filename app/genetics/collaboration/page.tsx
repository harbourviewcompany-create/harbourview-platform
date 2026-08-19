import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicCollaborationProjects } from '@/lib/genetics/queries'

export const metadata: Metadata = {
  title: 'Genetics Collaboration | Harbourview',
  description: 'Public-summary genetics collaboration and trial discussion opportunities.',
}

export const dynamic = 'force-dynamic'

export default async function GeneticsCollaborationPage() {
  const projects = await getPublicCollaborationProjects()

  return (
    <main style={{ minHeight: '100vh', background: '#050c18', color: '#f5f0e8' }}>
      <style>{CSS}</style>
      <div className="gc-wrap">
        <nav className="gc-nav">
          <Link href="/genetics">Genetics</Link>
          <span>›</span>
          <span>Collaboration</span>
        </nav>
        <h1>Collaboration projects</h1>
        <p className="gc-sub">
          Public-summary research, trial, and licensing discussion opportunities. Private terms stay
          off this surface.
        </p>
        {projects.length === 0 ? (
          <p className="gc-empty">No public collaboration projects published yet.</p>
        ) : (
          <div className="gc-list">
            {projects.map((proj) => (
              <article key={proj.id} className="gc-card">
                <h2>{proj.title}</h2>
                <p className="gc-meta">
                  {[proj.projectType, proj.status, proj.countryCode, proj.jurisdictionLabel]
                    .filter(Boolean)
                    .map((x) => String(x).replace(/_/g, ' '))
                    .join(' · ')}
                </p>
                <p className="gc-body">{proj.publicSummary}</p>
                {proj.evidenceNeeded && (
                  <p className="gc-need">Evidence needed: {proj.evidenceNeeded}</p>
                )}
                <Link href="/contact" className="gc-cta">
                  {proj.cta} →
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

const CSS = `
.gc-wrap{max-width:800px;margin:0 auto;padding:48px 24px 80px}
.gc-nav{display:flex;gap:8px;margin-bottom:24px;font-size:11px;color:rgba(245,240,232,.4)}
.gc-nav a{color:#d4a84b;text-decoration:none}
.gc-wrap h1{font-family:Georgia,serif;font-size:28px;font-weight:400;margin:0 0 8px}
.gc-sub{font-size:13px;color:rgba(245,240,232,.5);margin:0 0 24px;line-height:1.6}
.gc-empty{font-size:13px;color:rgba(245,240,232,.45)}
.gc-list{display:flex;flex-direction:column;gap:12px}
.gc-card{padding:18px;border-radius:12px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.02)}
.gc-card h2{margin:0 0 6px;font-size:15px;color:#f5f0e8}
.gc-meta{font-size:11px;color:rgba(245,240,232,.35);margin:0 0 8px;text-transform:capitalize}
.gc-body{font-size:13px;line-height:1.6;color:rgba(245,240,232,.55);margin:0 0 8px}
.gc-need{font-size:12px;color:rgba(212,168,75,.7);margin:0 0 10px}
.gc-cta{font-size:11px;color:#d4a84b;text-decoration:none}
`
