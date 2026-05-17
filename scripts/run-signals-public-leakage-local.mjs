#!/usr/bin/env node

import { spawn } from 'node:child_process';

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || 'http://127.0.0.1:3000';
const START_TIMEOUT_MS = 120000;
const SIGNALS_PATH = '/signals';
const baseUrl = new URL(BASE_URL);
const port = baseUrl.port || (baseUrl.protocol === 'https:' ? '443' : '80');

function run(cmd, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function waitForServer(baseUrl) {
  const start = Date.now();
  while (Date.now() - start < START_TIMEOUT_MS) {
    try {
      const res = await fetch(`${baseUrl}${SIGNALS_PATH}`, { method: 'GET' });
      if (res.ok) return;
    } catch {
      // retry until timeout
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timed out waiting for local server at ${baseUrl}`);
}

const startEnv = { ...process.env, PORT: port };
let server;

try {
  await run('npm', ['run', 'build']);
  server = spawn('npm', ['run', 'start', '--', '--port', port], { stdio: 'inherit', env: startEnv });
  await waitForServer(baseUrl.origin);
  await run('node', ['scripts/test-signals-public-leakage.mjs'], {
    ...process.env,
    HARBOURVIEW_PUBLIC_BASE_URL: baseUrl.origin,
  });
  console.log('Signals leakage local workflow passed.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (server && !server.killed) {
    server.kill('SIGTERM');
    await new Promise((resolve) => server.once('exit', resolve));
  }
}
