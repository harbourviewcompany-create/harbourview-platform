#!/usr/bin/env node
/**
 * Harbourview Production Spine — setup.mjs
 *
 * Local setup helper only. This script intentionally does NOT contain secrets.
 * Required secrets must be supplied through environment variables or .env.local.
 *
 * Usage:
 *   node setup.mjs --pat=<your-supabase-personal-access-token> \
 *                  --admin-password=<choose-any-password> \
 *                  --analyst-password=<choose-any-password>
 *
 * Required env:
 *   SUPABASE_SERVICE_ROLE_KEY=<rotated service role key>
 *
 * Get a Supabase PAT at: https://supabase.com/dashboard/account/tokens
 * Run from the project root, same folder as package.json.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { spawn, execSync } from "child_process";
import { createInterface } from "readline";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────────────

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "tpfvhhrwzsofhdcfdenc";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`;
const MGMT_API = "https://api.supabase.com";

const ADMIN_UUID = process.env.TEST_ADMIN_USER_ID || "9866753f-1a8d-495c-8ab8-d0d1eebfce04";
const ANALYST_UUID = process.env.TEST_ANALYST_USER_ID || "31e6281c-aec9-4c6d-a9c3-4852b1c057d5";

const APP_PORT = Number(process.env.PORT || 3000);
const APP_URL = process.env.APP_URL || `http://localhost:${APP_PORT}`;

// ─── Env loading ──────────────────────────────────────────────────────────────

function loadDotEnvLocal() {
  const envPath = resolve(__dirname, ".env.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnvLocal();

// ─── Arg parsing ─────────────────────────────────────────────────────────────

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    args[key] = rest.join("=");
  }
  return args;
}

async function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.includes("replace-with")) {
    throw new Error(`${name} is required. Put it in .env.local or export it before running setup.mjs.`);
  }
  return value;
}

// ─── Logging ─────────────────────────────────────────────────────────────────

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  grey: "\x1b[90m",
};

function log(msg) { console.log(`${C.cyan}▸${C.reset} ${msg}`); }
function ok(msg) { console.log(`${C.green}✓${C.reset} ${msg}`); }
function fail(msg) { console.log(`${C.red}✗${C.reset} ${msg}`); }
function warn(msg) { console.log(`${C.yellow}⚠${C.reset} ${msg}`); }
function header(msg) { console.log(`\n${C.bold}${msg}${C.reset}`); }
function grey(msg) { console.log(`${C.grey}  ${msg}${C.reset}`); }

// ─── Step 1: Apply migrations ─────────────────────────────────────────────────

async function applyMigrations(pat) {
  header("Step 1 — Applying migrations");

  const sqlPath = resolve(__dirname, "migrations/APPLY_ALL.sql");
  if (!existsSync(sqlPath)) {
    throw new Error(`migrations/APPLY_ALL.sql not found at ${sqlPath}`);
  }

  const sql = readFileSync(sqlPath, "utf8");
  log(`Loaded APPLY_ALL.sql (${(sql.length / 1024).toFixed(0)} KB)`);
  log("Posting to Supabase management API...");

  const res = await fetch(`${MGMT_API}/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pat}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = body?.message || body?.error || JSON.stringify(body);
    if (msg.includes("already exists") || res.status === 409) {
      warn("Some objects already exist — migrations may have been partially applied.");
      warn("If this is a fresh project, drop and re-create it, then re-run.");
      warn(`Raw error: ${msg}`);
    } else {
      throw new Error(`Migration failed (HTTP ${res.status}): ${msg}`);
    }
  } else {
    ok("All migrations applied successfully");
  }

  log("Running seed verification query...");
  const verifyRes = await fetch(`${MGMT_API}/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pat}`,
    },
    body: JSON.stringify({
      query: `
        select s.review_status, count(se.id) as evidence_count,
               d.status as dossier_status, pe.api_token
        from signals s
        left join signal_evidence se on se.signal_id = s.id
        left join dossier_items di on di.signal_id = s.id
        left join dossiers d on d.id = di.dossier_id
        left join publish_events pe
          on pe.dossier_id = d.id and pe.status = 'completed'
        where s.id = '00000000-0000-0000-0000-000000000040'
        group by s.review_status, d.status, pe.api_token;
      `,
    }),
  });

  const verifyBody = await verifyRes.json().catch(() => ({}));
  if (verifyRes.ok && Array.isArray(verifyBody) && verifyBody.length > 0) {
    const row = verifyBody[0];
    if (row.review_status === "approved" && row.dossier_status === "published") {
      ok(`Seed verified: review_status=${row.review_status}, dossier_status=${row.dossier_status}, evidence_count=${row.evidence_count}`);
    } else {
      warn(`Seed check returned unexpected values: ${JSON.stringify(row)}`);
    }
  } else {
    warn("Seed verification returned no rows — check that seed migrations applied cleanly");
  }
}

// ─── Step 2: Set auth user passwords ─────────────────────────────────────────

async function setUserPasswords(serviceRoleKey, adminPassword, analystPassword) {
  header("Step 2 — Setting auth user passwords");

  const users = [
    { id: ADMIN_UUID, email: process.env.TEST_ADMIN_EMAIL || "admin@harbourview.io", password: adminPassword, label: "admin" },
    { id: ANALYST_UUID, email: process.env.TEST_ANALYST_EMAIL || "analyst@harbourview.io", password: analystPassword, label: "analyst" },
  ];

  for (const user of users) {
    log(`Setting password for ${user.email}...`);

    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ password: user.password }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        `Failed to set ${user.label} password (HTTP ${res.status}): ${body?.message || JSON.stringify(body)}`
      );
    }

    ok(`Password set for ${user.email}`);
  }
}

// ─── Step 3: Write .env.local ─────────────────────────────────────────────────

function upsertEnvValue(content, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(content)) return content.replace(pattern, line);
  return `${content.replace(/\s*$/, "")}\n${line}\n`;
}

function writeEnvLocal(adminPassword, analystPassword) {
  header("Step 3 — Writing .env.local");

  const envPath = resolve(__dirname, ".env.local");
  const examplePath = resolve(__dirname, ".env.example");

  let content = "";
  if (existsSync(envPath)) {
    content = readFileSync(envPath, "utf8");
  } else if (existsSync(examplePath)) {
    content = readFileSync(examplePath, "utf8");
  }

  content = upsertEnvValue(content, "TEST_ADMIN_PASSWORD", adminPassword);
  content = upsertEnvValue(content, "TEST_ANALYST_PASSWORD", analystPassword);

  writeFileSync(envPath, content, "utf8");
  ok(".env.local updated with test passwords");
}

// ─── Step 4: npm install ──────────────────────────────────────────────────────

function npmInstall() {
  header("Step 4 — npm install");
  log("Installing dependencies...");

  execSync("npm install", {
    cwd: __dirname,
    stdio: "inherit",
  });

  ok("Dependencies installed");
}

// ─── Step 5: Start dev server ─────────────────────────────────────────────────

function startDevServer() {
  header("Step 5 — Starting dev server");
  log(`Starting Next.js on ${APP_URL}...`);

  const devServer = spawn("npm", ["run", "dev"], {
    cwd: __dirname,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: String(APP_PORT) },
  });

  devServer.stdout.on("data", (d) => {
    const line = d.toString().trim();
    if (line) grey(line);
  });
  devServer.stderr.on("data", (d) => {
    const line = d.toString().trim();
    if (line) grey(line);
  });

  return devServer;
}

async function waitForDevServer(maxWaitMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(APP_URL);
      if (res.status < 500) {
        ok(`Dev server ready at ${APP_URL}`);
        return;
      }
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Dev server did not start within ${maxWaitMs / 1000}s`);
}

// ─── Step 6: Run tests ────────────────────────────────────────────────────────

async function runTests() {
  header("Step 6 — Running test suite");
  log("Running npm test (vitest)...");

  return new Promise((resolve) => {
    const test = spawn("npm", ["test"], {
      cwd: __dirname,
      stdio: "inherit",
      env: { ...process.env },
    });

    test.on("close", (code) => {
      resolve(code);
    });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${C.bold}Harbourview Production Spine — Setup${C.reset}`);
  console.log(`Project: ${PROJECT_REF}\n`);

  const args = parseArgs();

  let pat = args.pat;
  if (!pat) {
    console.log("A Supabase Personal Access Token is needed to apply migrations.");
    console.log("Get one at: https://supabase.com/dashboard/account/tokens\n");
    pat = await prompt("Paste your PAT: ");
  }
  if (!pat) throw new Error("PAT is required");

  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  let adminPassword = args["admin-password"] || process.env.TEST_ADMIN_PASSWORD;
  let analystPassword = args["analyst-password"] || process.env.TEST_ANALYST_PASSWORD;

  if (!adminPassword) {
    adminPassword = await prompt("Choose a password for admin user: ");
  }
  if (!analystPassword) {
    analystPassword = await prompt("Choose a password for analyst user: ");
  }
  if (!adminPassword || !analystPassword) {
    throw new Error("Both passwords are required");
  }

  for (const [label, pw] of [["admin", adminPassword], ["analyst", analystPassword]]) {
    if (pw.length < 8) throw new Error(`${label} password must be at least 8 characters`);
  }

  let devServer;

  try {
    await applyMigrations(pat);
    await setUserPasswords(serviceRoleKey, adminPassword, analystPassword);
    writeEnvLocal(adminPassword, analystPassword);
    npmInstall();

    devServer = startDevServer();
    await waitForDevServer();

    const exitCode = await runTests();

    if (exitCode === 0) {
      console.log(`\n${C.bold}${C.green}✓ All tests passed. Production Spine is running.${C.reset}\n`);
    } else {
      console.log(`\n${C.bold}${C.red}✗ Tests failed (exit code ${exitCode}). Paste the output above for a fix.${C.reset}\n`);
      process.exitCode = 1;
    }
  } catch (err) {
    fail(err.message);
    process.exitCode = 1;
  } finally {
    if (devServer) {
      log("Stopping dev server...");
      devServer.kill("SIGTERM");
    }
  }
}

main();
