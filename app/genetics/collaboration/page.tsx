import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicCollaborationProjects } from '@/lib/genetics/demoData'

export const metadata: Metadata = { title: 'Genetics Collaboration | Harbourview' }

export default function GeneticsCollaborationPage() {
  const projects = getPublicCollaborationProjects()
  return (
    <main className="min-h-screen bg-[#081423] px-6 py-12 text-[#F5F1E8] md:px-10">
      <section className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#C6A55A]">Genetics collaboration</p>
          <h1 className="mt-2 text-3xl font-semibold">Structured collaboration projects</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#F5F1E8]/65">Research, verification, trial, licensing-discussion, and tissue-culture projects are routed through reviewed access workflows, not open forum posts or plant-material checkout.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <article key={project.id} className="rounded-2xl border border-white/10 bg-[#0B1A2F] p-6">
              <p className="text-xs uppercase tracking-[0.14em] text-[#C6A55A]">{project.projectType.replace(/_/g, ' ')} · {project.status.replace(/_/g, ' ')}</p>
              <h2 className="mt-3 text-xl font-semibold">{project.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#F5F1E8]/65">{project.publicSummary}</p>
              {project.evidenceNeeded && <p className="mt-3 text-xs text-amber-200/80">{project.evidenceNeeded}</p>}
              <Link href="/contact" className="mt-5 inline-flex rounded-full border border-[#C6A55A]/40 px-4 py-2 text-sm text-[#C6A55A]">Start collaboration</Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
