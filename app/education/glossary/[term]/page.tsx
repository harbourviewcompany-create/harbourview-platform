export default async function GlossaryTermPage({ params }: { params: Promise<{ term: string }> }) {
  const { term } = await params
  return <main className="page-container py-16"><h1 className="text-3xl font-semibold">Glossary: {term}</h1></main>
}
