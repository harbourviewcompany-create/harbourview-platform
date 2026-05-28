import fs from 'node:fs'
const routes = [
  'app/education/clinical/page.tsx','app/education/pharmacy/page.tsx','app/education/compliance/page.tsx','app/education/export-import/page.tsx','app/education/history/page.tsx','app/education/gmp/page.tsx','app/education/gacp/page.tsx','app/education/gdp/page.tsx','app/education/testing/page.tsx','app/education/pharmacovigilance/page.tsx','app/education/policy/page.tsx','app/education/country/[country]/page.tsx','app/education/article/[slug]/page.tsx','app/education/glossary/page.tsx','app/education/glossary/[term]/page.tsx','app/education/request/page.tsx','app/education/briefings/page.tsx','app/education/review-required/page.tsx'
]
for (const route of routes) if (!fs.existsSync(route)) throw new Error(`Missing route: ${route}`)
console.log('ok education routes present:', routes.length)
