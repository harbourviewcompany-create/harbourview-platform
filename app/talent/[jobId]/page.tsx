import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TalentApplyForm from './TalentApplyForm'

export const dynamic = 'force-dynamic'

export default async function TalentJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) notFound()

  const supabase = await createClient()
  const { data: job, error } = await supabase
    .from('talent_job_opportunities_public')
    .select('id,title,department,description,location_text,employment_type,workplace_type,application_method,application_url,freshness_state,last_confirmed_at,published_at,workspace_id,employer_name,employer_verification_status')
    .eq('id', jobId)
    .maybeSingle()

  if (error || !job) notFound()

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/talent" className="text-sm text-gray-500 hover:underline">← All opportunities</Link>
      <article className="card mt-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{job.department || 'Talent opportunity'}</p>
            <h1 className="mt-2 text-3xl font-bold text-navy">{job.title}</h1>
            <p className="mt-2 text-gray-600">{job.employer_name}{job.location_text ? ` · ${job.location_text}` : ''}</p>
          </div>
          {job.employer_verification_status === 'verified' && <span className="rounded-full border px-3 py-1 text-xs">Verified employer</span>}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs text-gray-500">
          {job.employment_type && <span className="rounded border px-2 py-1">{job.employment_type.replaceAll('_', ' ')}</span>}
          {job.workplace_type && <span className="rounded border px-2 py-1">{job.workplace_type.replaceAll('_', ' ')}</span>}
          <span className="rounded border px-2 py-1">{job.freshness_state.replaceAll('_', ' ')}</span>
        </div>

        {job.description && <div className="prose prose-sm mt-7 max-w-none whitespace-pre-wrap text-gray-700">{job.description}</div>}
      </article>

      <div className="mt-6">
        {job.application_method === 'harbourview_direct' ? (
          <TalentApplyForm jobId={job.id} />
        ) : job.application_url ? (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-navy">Apply externally</h2>
            <p className="mt-2 text-sm text-gray-600">This role uses the employer or source application workflow. Harbourview does not represent it as a direct application.</p>
            <a className="btn-primary mt-4 inline-flex" href={job.application_url} target="_blank" rel="noreferrer">Open application source</a>
          </div>
        ) : (
          <div className="card p-6 text-sm text-gray-600">This role does not currently expose an application method.</div>
        )}
      </div>
    </main>
  )
}
