import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Talent | Harbourview',
  description: "Open roles at cannabis operators verified by Harbourview's market-intelligence network.",
}

export const dynamic = 'force-dynamic'

type PublicJob = {
  id: string
  title: string
  department: string | null
  location: string | null
  created_at: string
  operator_name: string | null
  operator_verification_status: string | null
}

export default async function TalentPage() {
  const supabase = await createClient()
  const { data: jobs, error } = await supabase
    .from('talent_jobs_public')
    .select('id, title, department, location, created_at, operator_name, operator_verification_status')
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <p className="text-gold text-xs font-semibold uppercase tracking-wide mb-2">Harbourview Talent</p>
      <h1 className="text-navy text-3xl font-bold mb-3">
        Open roles at operators Harbourview has already vetted.
      </h1>
      <p className="text-gray-600 mb-10 max-w-2xl">
        Every posting here comes from a licensed operator in our market-intelligence network. Verified
        badges reflect Harbourview&apos;s own diligence, not a self-reported claim.
      </p>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Roles couldn&apos;t be loaded right now. Please try again shortly.
        </p>
      )}

      {!error && (!jobs || jobs.length === 0) && (
        <p className="card p-8 text-center text-gray-500 text-sm">
          No open roles right now — check back soon.
        </p>
      )}

      <div className="space-y-3">
        {(jobs as PublicJob[] | null ?? []).map((job) => (
          <Link key={job.id} href={`/talent/${job.id}`} className="card block p-5 hover:border-navy transition">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-navy font-semibold text-lg">{job.title}</h2>
                  {job.operator_verification_status === 'verified' && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                      Verified operator
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-1">{job.operator_name ?? 'Harbourview network operator'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              {job.location && <span>{job.location}</span>}
              {job.department && <span>{job.department}</span>}
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
