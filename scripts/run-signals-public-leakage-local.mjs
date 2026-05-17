#!/usr/bin/env node

import { spawn } from 'node:child_process';

const BASE_URL = process.env.HARBOURVIEW_PUBLIC_BASE_URL || 'http://127.0.0.1:3000';
const START_TIMEOUT_MS = 120000;

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
      const res = await fetch(`${baseUrl}/signals`, { method: 'GET' });
      if (res.ok) return;
    } catch {
      // retry until timeout
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timed out waiting for local server at ${baseUrl}`);
}

const startEnv = { ...process.env, PORT: '3000' };
let server;

try {
  await run('npm', ['run', 'build']);
  server = spawn('npm', ['run', 'start'], { stdio: 'inherit', env: startEnv });
  await waitForServer(BASE_URL);
  await run('node', ['scripts/test-signals-public-leakage.mjs'], {
    ...process.env,
    HARBOURVIEW_PUBLIC_BASE_URL: BASE_URL,
  });
  console.log('Signals leakage local workflow passed.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (server && !server.killed) {
    server.kill('SIGTERM');
  }
}
