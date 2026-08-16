import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const approved = new Map([
  ['checkout', '3d3c42e5aac5ba805825da76410c181273ba90b1'],
  ['setup-node', '820762786026740c76f36085b0efc47a31fe5020'],
])

const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
const pattern = /actions\/(checkout|setup-node)@([A-Za-z0-9._/-]+)/g
const inventory = []
const violations = []

for (const file of tracked) {
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  const lines = text.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    for (const match of lines[index].matchAll(pattern)) {
      const [, action, ref] = match
      const expected = approved.get(action)
      const record = { file, line: index + 1, action, ref, expected }
      inventory.push(record)
      if (ref !== expected) violations.push(record)
    }
  }
}

const counts = Object.fromEntries(
  [...approved.keys()].map((action) => [
    action,
    inventory.filter((record) => record.action === action).length,
  ]),
)

console.log(`First-party action reference inventory: ${inventory.length} total`)
for (const [action, count] of Object.entries(counts)) {
  console.log(`- actions/${action}: ${count}`)
}
for (const record of inventory) {
  console.log(`${record.file}:${record.line} actions/${record.action}@${record.ref}`)
}

if (violations.length) {
  console.error(`HOLD: ${violations.length} unapproved checkout/setup-node reference(s) remain.`)
  for (const record of violations) {
    console.error(`${record.file}:${record.line} actions/${record.action}@${record.ref}; expected ${record.expected}`)
  }
  process.exit(1)
}

console.log('GO: every tracked actions/checkout and actions/setup-node reference uses the reviewed immutable Node 24-hosted pin.')
