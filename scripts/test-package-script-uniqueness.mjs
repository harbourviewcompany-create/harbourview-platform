import fs from 'node:fs'

const raw = fs.readFileSync('package.json', 'utf8')
const scriptMatches = [...raw.matchAll(/^    "([^"]+)":/gm)].map((match) => match[1])
const duplicates = scriptMatches.filter((name, index) => scriptMatches.indexOf(name) !== index)

const pkg = JSON.parse(raw)
const requiredScripts = [
  'test:full-scope:script-uniqueness',
  'test:full-scope:routes',
  'test:full-scope:content',
  'test:full-scope:education',
  'test:full-scope:compliance',
  'test:full-scope:marketplace',
  'test:full-scope:fallbacks',
  'test:full-scope-launch-readiness',
]

const missing = requiredScripts.filter((name) => !pkg.scripts?.[name])

if (duplicates.length || missing.length) {
  console.error(JSON.stringify({ duplicates, missing }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, scripts: Object.keys(pkg.scripts).length }, null, 2))
