import Link from 'next/link'
import { countries } from '@/lib/dashboard/countries'
export default function NotFound() { return <div className="p-6 text-white"><h2>Country not found</h2><input aria-label="Country search" className="text-black" placeholder="Search country"/><div>{countries.map(c => <div key={c.slug}><Link href={`/dashboard/country/${c.slug}`}>{c.displayName}</Link></div>)}</div><Link href="/">Return to globe</Link></div> }
