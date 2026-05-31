import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { clinicalEducationModules } from '@/lib/fixtures/clinical-education'
import { ClinicalEducationHero, ClinicalEducationModuleDetail } from '@/components/clinical-education/ClinicalEducationComponents'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const item = clinicalEducationModules.find((m) => m.slug === slug)
  if (!item) return { title: 'Module Not Found | Harbourview Clinical Education' }
  return {
    title: `${item.title} | Harbourview Clinical Education`,
    description: item.publicSummary ?? 'Non-promotional clinical education for regulated cannabis professionals. Not medical advice.',
  }
}

export default async function ClinicalEducationModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const educationItem = clinicalEducationModules.find((item) => item.slug === slug)

  if (!educationItem) return notFound()

  return (
    <>
      <ClinicalEducationHero item={educationItem} />
      <ClinicalEducationModuleDetail item={educationItem} />
    </>
  )
}
