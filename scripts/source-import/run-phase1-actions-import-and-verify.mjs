import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('npm', ['run', 'source-import:build']);
run('npm', ['run', 'source-import:push']);
run('npx', ['tsx', 'scripts/source-import/verify-source-import-rest.ts']);
