import fetch from 'node-fetch'

const routes = [
  '/compliance',
  '/compliance/regions/europe',
  '/compliance/country-pathways/germany'
]

const forbidden = [
  'privateContactEmail',
  'providerInternalNotes',
  'SUPABASE_SERVICE_ROLE_KEY'
]

async function run() {
  const base = process.env.HARBOURVIEW_PUBLIC_BASE_URL || 'http://localhost:3000'

  for (const route of routes) {
    const res = await fetch(base + route)
    const text = await res.text()

    for (const f of forbidden) {
      if (text.includes(f)) {
        throw new Error(`Leak detected: ${f} in ${route}`)
      }
    }
  }

  console.log('Compliance visibility test passed')
}

run()
