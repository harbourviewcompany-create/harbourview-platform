import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function TalentPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('talent_job_opportunities_public')
    .select('id,title,department,location_text,employment_type,workplace_type,freshness_state,last_confirmed_at,created_at,workspace_id,employer_name,employer_verification_status')
    .order('created_at', { ascending: false })
    .limit(48)

  const jobs = data ?? []

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Harbourview Talent Intelligence</p>
          <h1 className="mt-2 text-3xl font-bold text-navy">Open opportunities</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">Canonical, source-governed roles from Harbourview employers. Search and employer-side Talent discovery are also available inside Command.</p>
        </div>
        <Link className="btn-primary" href="/dashboard?section=talent&talentMode=jobs">Open Talent in Command</Link>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">Talent is temporarily unavailable.</div>}
      {!error && jobs.length === 0 && <div className="rounded border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">No publishable open roles are available right now.</div>}

      <div className="grid gap-3">
        {jobs.map(job => (
          <article key={job.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-navy"><Link href={`/talent/${job.id}`} className="hover:underline">{job.title}</Link></h2>
                <p className="mt-1 text-sm text-gray-600">{job.employer_name}{job.location_text ? ` · ${job.location_text}` : ''}</p>
              </div>
              {job.employer_verification_status === 'verified' && <span className="rounded-full border px-2 py-1 text-xs">Verified employer</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
              {job.department && <span>{job.department}</span>}
              {job.employment_type && <span>· {job.employment_type.replaceAll('_', ' ')}</span>}
              {job.workplace_type && <span>· {job.workplace_type.replaceAll('_', ' ')}</span>}
              <span>· {job.freshness_state.replaceAll('_', ' ')}</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
