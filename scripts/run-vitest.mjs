#!/usr/bin/env node
/**
 * Cross-platform launcher for the Vitest runs that need an environment
 * variable set.
 *
 * `npm test` deliberately takes no env prefix — it runs on the windows-latest
 * runner in `wbcc-windows-verification.yml`, where npm executes scripts through
 * `cmd.exe` and a POSIX `VAR=1 cmd` prefix is parsed as an unknown command. The
 * same is true for any contributor on Windows, which made `npm run test:full`
 * unusable there — the one escape hatch for running the quarantined suites.
 *
 * A wrapper is used rather than `cross-env` because adding a dependency would
 * change `package-lock.json`, and CI asserts the lockfile is unmutated.
 *
 * Usage: node scripts/run-vitest.mjs --quarantined [extra vitest args...]
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const runQuarantined = args.includes('--quarantined')
const vitestArgs = args.filter((arg) => arg !== '--quarantined')

const child = spawn(
  process.execPath,
  // fileURLToPath, not .pathname: on Windows .pathname yields '/C:/...' which
  // Node cannot execute. This wrapper exists for Windows portability, so getting
  // this wrong would defeat its purpose.
  [fileURLToPath(new URL('../node_modules/vitest/vitest.mjs', import.meta.url)), 'run', ...vitestArgs],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...(runQuarantined ? { HARBOURVIEW_RUN_QUARANTINED: '1' } : {}),
    },
  },
)

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 1)
})
child.on('error', (err) => {
  console.error('[run-vitest] failed to start vitest:', err.message)
  process.exit(1)
})
