import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TalentApplyForm from './TalentApplyForm'

export const dynamic = 'force-dynamic'

type PublicJob = {
  id: string
  title: string
  department: string | null
  location: string | null
  description: string | null
  created_at: string
  operator_name: string | null
  operator_verification_status: string | null
}

export default async function TalentJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params
  const supabase = await createClient()
  const { data: job } = await supabase
    .from('talent_jobs_public')
    .select('id, title, department, location, description, created_at, operator_name, operator_verification_status')
    .eq('id', jobId)
    .maybeSingle()

  if (!job) notFound()

  const typedJob = job as PublicJob

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-navy text-2xl font-bold">{typedJob.title}</h1>
          {typedJob.operator_verification_status === 'verified' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
              Verified operator
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm mt-1">
          {typedJob.operator_name ?? 'Harbourview network operator'}
          {typedJob.location ? ` · ${typedJob.location}` : ''}
          {typedJob.department ? ` · ${typedJob.department}` : ''}
        </p>
        {typedJob.description && (
          <p className="text-gray-700 text-sm mt-4 whitespace-pre-line">{typedJob.description}</p>
        )}
      </div>

      <TalentApplyForm jobId={typedJob.id} />
    </main>
  )
}
