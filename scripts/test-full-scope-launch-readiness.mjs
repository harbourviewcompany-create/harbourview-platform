import { spawnSync } from 'node:child_process'

const checks = [
  ['test:full-scope:script-uniqueness', 'npm', ['run', 'test:full-scope:script-uniqueness']],
  ['test:full-scope:routes', 'npm', ['run', 'test:full-scope:routes']],
  ['test:full-scope:content', 'npm', ['run', 'test:full-scope:content']],
  ['test:full-scope:education', 'npm', ['run', 'test:full-scope:education']],
  ['test:full-scope:compliance', 'npm', ['run', 'test:full-scope:compliance']],
  ['test:full-scope:marketplace', 'npm', ['run', 'test:full-scope:marketplace']],
  ['test:full-scope:fallbacks', 'npm', ['run', 'test:full-scope:fallbacks']],
]

const results = []

for (const [name, command, args] of checks) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  results.push({ name, status: result.status })
  if (result.status !== 0) {
    console.error(JSON.stringify({ ok: false, failed: name, results }, null, 2))
    process.exit(result.status || 1)
  }
}

console.log(JSON.stringify({ ok: true, checks: results.map((result) => result.name) }, null, 2))
