import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { clinicalEducationModules as fixtureModules } from '@/lib/fixtures/clinical-education'
import { getClinicalEducationModuleBySlug } from '@/lib/server/clinicalEducationQuery'

export const dynamic = 'force-dynamic'
import { ClinicalEducationHero, ClinicalEducationModuleDetail } from '@/components/clinical-education/ClinicalEducationComponents'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const item = (await getClinicalEducationModuleBySlug(slug)) ?? fixtureModules.find((m) => m.slug === slug)
  if (!item) return { title: 'Module Not Found | Harbourview Clinical Education' }
  return {
    title: `${item.title} | Harbourview Clinical Education`,
    description: item.publicSummary ?? 'Non-promotional clinical education for regulated cannabis professionals. Not medical advice.',
  }
}

export default async function ClinicalEducationModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const educationItem = (await getClinicalEducationModuleBySlug(slug)) ?? fixtureModules.find((item) => item.slug === slug)

  if (!educationItem) return notFound()

  return (
    <>
      <ClinicalEducationHero item={educationItem} />
      <ClinicalEducationModuleDetail item={educationItem} />
    </>
  )
}
