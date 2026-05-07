import Link from 'next/link'
import { geneticsProfiles } from '@/lib/marketplace/geneticsShowcaseReset'

const signals = [
  'Genetics IP',
  'Current Drops',
  'Territory Rights',
  'Tissue Culture',
  'Clean Stock',
  'Licensing Windows',
  'Qualified Access',
]

export default function GeneticsPage() {
  const drops = geneticsProfiles.flatMap((profile) =>
    profile.drops.map((drop) => ({ ...drop, profileName: profile.name, profileSlug: profile.slug, region: profile.region }))
  )

  return (
    <main className="min-h-screen bg-[#05070A] text-[#F5F1E8]">
      <section className="relative overflow-hidden border-b border-[#C6A55A]/20 px-6 py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(198,165,90,0.16),transparent_34%),linear-gradient(135deg,rgba(11,26,47,0.95),rgba(5,7,10,1))]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="text-xs uppercase tracking-[0.34em] text-[#C6A55A]">
              Harbourview Genetics
            </div>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.98] md:text-7xl">
              A curated access room for serious cannabis genetics.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#F5F1E8]/72">
              Selected breeders, seed companies and tissue-culture labs can present genetics programs, current drops and collaboration openings to qualified international operators without exposing private contacts, pricing or sensitive breeding information.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/marketplace/genetics/request-access" className="rounded-full bg-[#C6A55A] px-6 py-3 text-sm font-semibold text-[#0B1A2F]">
                Request Genetics Access
              </Link>
              <Link href="/marketplace/genetics/submit-program" className="rounded-full border border-[#C6A55A]/60 px-6 py-3 text-sm text-[#C6A55A]">
                Submit Genetics Program
              </Link>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-[#C6A55A]/25 bg-black/30 p-7 shadow-2xl backdrop-blur">
            <div className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Curated launch</div>
            <div className="mt-5 space-y-5 text-sm text-[#F5F1E8]/72">
              <p>Initial participation is selective. Harbourview reviews each profile, drop and access request before publication or introduction.</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-white/10 p-3">
                  <div className="text-2xl text-[#C6A55A]">3</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-[#F5F1E8]/55">Profiles</div>
                </div>
                <div className="rounded-2xl border border-white/10 p-3">
                  <div className="text-2xl text-[#C6A55A]">3</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-[#F5F1E8]/55">Drops</div>
                </div>
                <div className="rounded-2xl border border-white/10 p-3">
                  <div className="text-2xl text-[#C6A55A]">0</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-[#F5F1E8]/55">Public contacts</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#081423] px-6 py-5">
        <div className="mx-auto flex max-w-7xl gap-4 overflow-x-auto text-xs uppercase tracking-[0.24em] text-[#C6A55A]">
          {signals.map((signal) => (
            <span key={signal} className="shrink-0 border-r border-[#C6A55A]/25 pr-4 last:border-r-0">
              {signal}
            </span>
          ))}
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-[#C6A55A]">Approved profiles</div>
            <h2 className="mt-3 text-4xl font-semibold">Profiles that feel like commercial IP, not vendor listings.</h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {geneticsProfiles.map((profile) => (
              <article key={profile.slug} className="group rounded-[2rem] border border-[#C6A55A]/18 bg-[#0B1A2F]/70 p-7 transition hover:border-[#C6A55A]/60">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-xs uppercase tracking-wide text-[#C6A55A]">{profile.profileType}</div>
                  <div className="text-xs text-[#F5F1E8]/45">{profile.region}</div>
                </div>
                <h3 className="mt-5 text-3xl font-semibold text-[#C6A55A]">{profile.name}</h3>
                <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/70">{profile.positioning}</p>
                <div className="mt-7 flex flex-wrap gap-2 text-xs text-[#F5F1E8]/70">
                  {profile.focus.slice(0, 4).map((item) => (
                    <span key={item} className="rounded-full border border-white/10 px-3 py-1">{item}</span>
                  ))}
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                  <span className="text-xs text-[#F5F1E8]/50">{profile.drops.length} current drop</span>
                  <Link href={`/marketplace/genetics/${profile.slug}`} className="text-sm text-[#C6A55A]">
                    Enter profile
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#081423] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-[#C6A55A]">Current drops</div>
            <h2 className="mt-3 text-4xl font-semibold">Selected commercial openings, not commodity inventory.</h2>
            <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/65">Drops are framed as licensing windows, territory discussions, clean-stock programs or collaboration opportunities. Harbourview reviews access before any private information is released.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {drops.map((drop) => (
              <article key={`${drop.profileSlug}-${drop.id}`} className="rounded-[2rem] border border-white/10 bg-black/30 p-6">
                <div className="text-xs uppercase tracking-wide text-[#C6A55A]">{drop.type}</div>
                <h3 className="mt-4 text-2xl font-semibold">{drop.name}</h3>
                <p className="mt-3 text-sm leading-6 text-[#F5F1E8]/65">{drop.thesis}</p>
                <div className="mt-6 space-y-2 text-xs text-[#F5F1E8]/55">
                  <div>Program: {drop.profileName}</div>
                  <div>Markets: {drop.targetMarkets.join(', ')}</div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2 text-xs">
                  {drop.signals.map((signal) => <span key={signal} className="rounded-full border border-[#C6A55A]/20 px-3 py-1 text-[#C6A55A]">{signal}</span>)}
                </div>
                <Link href="/marketplace/genetics/request-access" className="mt-7 inline-flex text-sm text-[#C6A55A]">{drop.cta}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[#C6A55A]">Why participate</div>
            <h2 className="mt-3 text-4xl font-semibold">Visibility without losing control.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              'Present genetics to serious international operators without publishing private contacts.',
              'Promote drops, licensing windows and territory opportunities with premium positioning.',
              'Use Harbourview as a review layer before introductions or sensitive materials are shared.',
              'Test international interest before committing to a public launch or broad campaign.',
            ].map((copy) => (
              <div key={copy} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm leading-6 text-[#F5F1E8]/70">{copy}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#C6A55A]/20 bg-[#0B1A2F]/60 p-8">
          <div className="grid gap-10 lg:grid-cols-3">
            <div>
              <h3 className="text-2xl font-semibold">Access rules</h3>
              <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/65">Public profiles may show approved branding, positioning and drops. Private contacts, pricing, sensitive breeding information and negotiation materials remain controlled.</p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Review process</h3>
              <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/65">Harbourview reviews submissions and inquiries manually before publication, routing or introduction.</p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Commercial packages</h3>
              <p className="mt-4 text-sm leading-6 text-[#F5F1E8]/65">Featured profiles, drop spotlights, country-specific promotion and private introduction support can be offered during rollout.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
