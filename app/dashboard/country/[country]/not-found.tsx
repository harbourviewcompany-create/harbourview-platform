import Link from 'next/link'

export default function NotFound() {
  return <div><h2>Country not found</h2><input aria-label="search countries" placeholder="Search countries"/><div><Link href="/markets">Browse by region</Link> · <Link href="/">Return to globe</Link></div></div>
}
