import { getGranteeAccessGrants } from '@/lib/genetics/queries'
import { EvidenceLinkButton } from './EvidenceLinkButton'

export const dynamic = 'force-dynamic'

export default async function GrantedAccessPage() {
  const entries = await getGranteeAccessGrants()

  return (
    <main className="min-h-screen bg-[#081423] px-6 py-10 text-[#F5F1E8] md:px-10">
      <section className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#C6A55A]">Genetics</p>
          <h1 className="mt-1 text-3xl font-semibold">Access granted to you</h1>
          <p className="mt-2 text-sm text-[#F5F1E8]/60">
            Evidence a genetics holder has explicitly approved you to view. Links are signed and expire in 5 minutes —
            request a fresh one each time.
          </p>
        </div>

        {entries.length === 0 && (
          <p className="text-sm text-[#F5F1E8]/55">No active access grants yet.</p>
        )}

        {entries.map(({ grant, cultivar, evidenceItems }) => (
          <article key={grant.id} className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-5">
            <h2 className="text-base font-semibold">{cultivar?.display_name ?? 'Cultivar'}</h2>
            <p className="mt-1 text-xs text-[#F5F1E8]/55">{grant.grant_scope}</p>
            <p className="mt-1 text-[11px] text-[#F5F1E8]/40">
              Expires: {grant.expires_at ? new Date(grant.expires_at).toLocaleDateString() : 'no expiry set'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {evidenceItems.length === 0 && (
                <p className="text-xs text-[#F5F1E8]/40">No evidence items match this grant&apos;s scope yet.</p>
              )}
              {evidenceItems.map((item) => (
                <EvidenceLinkButton key={item.id} evidenceItemId={item.id} grantId={grant.id} title={item.title} />
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
