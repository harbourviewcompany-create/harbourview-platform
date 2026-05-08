import fetch from 'node-fetch'

const base = process.env.HARBOURVIEW_PUBLIC_BASE_URL || 'http://localhost:3000'

const urls = ['/signals']

const forbidden = ['deal flow','buyer demand','supplier']

let failed = false

for (const url of urls) {
  const res = await fetch(base + url)
  const text = await res.text()

  for (const f of forbidden) {
    if (text.toLowerCase().includes(f)) {
      console.error('Forbidden string found:', f, 'in', url)
      failed = true
    }
  }
}

if (failed) process.exit(1)
console.log('Signals leakage test passed')
