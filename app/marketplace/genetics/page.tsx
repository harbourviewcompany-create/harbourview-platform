import Link from 'next/link'
import { geneticsProfiles } from '@/lib/marketplace/geneticsShowcaseReset'

export default function GeneticsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-white/10 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-[#C6A55A]">
              Genetics, Seeds & Tissue Culture
            </div>
            <h1 className="mt-4 text-5xl font-semibold leading-tight">
              Controlled international showcase for cannabis genetics and commercial access pathways.
            </h1>
            <p className="mt-6 text-lg text-gray-300">
              Harbourview Genetics helps breeders, seed companies and tissue-culture labs present selected opportunities to qualified international operators while keeping introductions and sensitive information controlled.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/marketplace/genetics/request-access" className="rounded-full border border-[#C6A55A] px-5 py-3 text-sm text-[#C6A55A]">
                Request Genetics Access
              </Link>
              <Link href="/marketplace/genetics/submit-program" className="rounded-full border border-white/20 px-5 py-3 text-sm">
                Submit Genetics Program
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {geneticsProfiles.map((profile) => (
              <article key={profile.slug} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-xs uppercase tracking-wide text-[#C6A55A]">
                  {profile.profileType}
                </div>
                <h2 className="mt-3 text-2xl font-semibold">{profile.name}</h2>
                <div className="mt-2 text-sm text-gray-400">{profile.region}</div>
                <p className="mt-4 text-sm text-gray-300">{profile.positioning}</p>

                <div className="mt-6 flex flex-wrap gap-2 text-xs text-gray-300">
                  {profile.focus.map((item) => (
                    <span key={item} className="rounded-full border border-white/10 px-3 py-1">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-8">
                  <Link href={`/marketplace/genetics/${profile.slug}`} className="text-sm text-[#C6A55A]">
                    View Profile
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-2xl font-semibold">Public and private field rules</h3>
              <p className="mt-4 text-sm text-gray-300">
                Public profiles may show approved branding, drops and positioning. Direct contact details, private pricing, sensitive breeding information and negotiation materials remain controlled through Harbourview.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Monetization options</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                <li>Featured Genetics Profile</li>
                <li>Current Drop Spotlight</li>
                <li>Country Pathway Promotion</li>
                <li>Private Introduction Support</li>
                <li>Launch Visibility Campaigns</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
