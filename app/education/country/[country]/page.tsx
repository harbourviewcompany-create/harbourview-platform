export default async function EducationCountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params
  return <main className="page-container py-16"><h1 className="text-3xl font-semibold">Country brief: {country}</h1></main>
}
