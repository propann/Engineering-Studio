import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const publicHost = process.env.STUDIO_PUBLIC_HOST;

if (!publicHost || publicHost === '0.0.0.0' || publicHost === '127.0.0.1') {
  console.error('STUDIO_PUBLIC_HOST doit être l’adresse ou le nom DNS utilisé par le navigateur (ex. 192.168.2.34).');
  process.exit(2);
}

const buildEnv = {
  ...process.env,
  VITE_OP1_URL: process.env.VITE_OP1_URL ?? `http://${publicHost}:5175/`,
  VITE_EP133_URL: process.env.VITE_EP133_URL ?? `http://${publicHost}:5177/`,
};

const workspaces = ['apps/studio-hub', 'apps/op1-studio', 'apps/ep133-studio'];

function runBuild(workspace) {
  return new Promise((resolve, reject) => {
    const child = spawn(npmCommand, ['run', 'build', '-w', workspace], {
      env: buildEnv,
      stdio: 'inherit',
      shell: false,
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${workspace} build arrêté (${signal ?? `code ${code ?? 'inconnu'}`})`));
    });
  });
}

try {
  for (const workspace of workspaces) await runBuild(workspace);
  console.log(`Build production terminé pour le Pi (${publicHost}).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
