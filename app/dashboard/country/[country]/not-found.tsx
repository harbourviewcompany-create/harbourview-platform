import Link from 'next/link'

export default function CountryNotFound() {
  return <div className='p-6 space-y-3'>
    <h1 className='text-2xl font-semibold'>Country not found</h1>
    <input aria-label='Search countries' placeholder='Search country' className='border p-2'/>
    <p><Link href='/dashboard'>Browse by region from dashboard directory</Link></p>
    <p><Link href='/'>Return to globe</Link></p>
  </div>
}
