import type { Metadata } from 'next'
import Link from 'next/link'
import {
  filterCpdModules,
  type CpdAudience,
} from '@/lib/education/cpdCatalog'
import { CpdCertificateInterestForm } from './CpdCertificateInterestForm'

export const metadata: Metadata = {
  title: 'CPD & certificates | Education',
  description:
    'Orientation-level professional education modules with nominal learning hours. Formal CPD credit and certificates require reviewed partner accreditation — request interest here.',
}

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

export default async function CpdEducationPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const audience = (first(sp.audience) ?? 'any') as CpdAudience | 'any'
  const certificateOnly = first(sp.cert) === '1'
  const modules = filterCpdModules({ audience, certificateOnly })

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-zinc-100">
      <nav className="mb-8 text-xs text-zinc-500">
        <Link href="/education" className="text-amber-500 hover:underline">
          Education
        </Link>
        <span className="mx-2">›</span>
        <span>CPD & certificates</span>
      </nav>

      <p className="text-xs uppercase tracking-widest text-amber-500/90">Education · Professional</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">CPD & certificate pathways</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
        Nominal learning hours for planning only. Harbourview does not auto-issue accredited CPD
        certificates on this surface. Partner-accredited pathways are listed when live; until then,
        register interest for certificate review.
      </p>

      <form method="get" className="mt-8 flex flex-wrap gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Audience
          <select
            name="audience"
            defaultValue={audience}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="any">Any</option>
            <option value="operator">Operator</option>
            <option value="compliance">Compliance</option>
            <option value="clinical">Clinical</option>
            <option value="logistics">Logistics</option>
            <option value="general">General</option>
          </select>
        </label>
        <label className="flex items-end gap-2 text-sm text-zinc-300">
          <input type="checkbox" name="cert" value="1" defaultChecked={certificateOnly} className="mb-2" />
          Certificate-eligible only
        </label>
        <button
          type="submit"
          className="self-end rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950"
        >
          Filter
        </button>
      </form>

      <ul className="mt-8 space-y-4">
        {modules.map((m) => (
          <li key={m.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium">{m.title}</h2>
              <span className="text-xs text-zinc-500">
                ~{m.nominalHours} h · {m.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{m.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {m.topics.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {m.relatedHref && (
                <Link href={m.relatedHref} className="text-amber-400 hover:underline">
                  Open related track →
                </Link>
              )}
              {m.certificateEligible ? (
                <span className="text-xs text-zinc-500">Certificate interest accepted</span>
              ) : (
                <span className="text-xs text-zinc-600">Not certificate-eligible</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <section className="mt-12 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-medium">Certificate interest</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Tell us which module and professional body context you need. We review before any partner
          introduction or certificate pathway is opened.
        </p>
        <div className="mt-6">
          <CpdCertificateInterestForm />
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-zinc-600">
        <Link href="/education" className="underline">
          Education hub
        </Link>
        {' · '}
        <Link href="/dashboard?page=education" className="underline">
          Command Centre education
        </Link>
      </p>
    </main>
  )
}
