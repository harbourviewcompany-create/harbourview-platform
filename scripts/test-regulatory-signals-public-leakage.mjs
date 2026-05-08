const res = await fetch((process.env.HARBOURVIEW_PUBLIC_BASE_URL||'http://localhost:3000') + '/signals')
const txt = await res.text()
if (txt.includes('deal flow') || txt.includes('supplier')) {
  console.error('Leakage detected')
  process.exit(1)
}
console.log('ok')
