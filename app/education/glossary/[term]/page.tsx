import { EducationRouteShell } from '@/components/clinical-education/EducationRouteShell'

export default async function Page({ params }: { params: Promise<{ term: string }> }) {
  const { term } = await params
  return <EducationRouteShell title={`Glossary Term: ${term}`} description="Controlled professional terminology with related module links." />
}
