import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const services = [
  ['hub', 'apps/studio-hub', 5179],
  ['op1', 'apps/op1-studio', 5175],
  ['ep133', 'apps/ep133-studio', 5177],
];
const children = [];
let shuttingDown = false;

function stopAll(signal = 'SIGTERM') {
  if (shuttingDown) return;
  shuttingDown = true;
  children.forEach((child) => child.kill(signal));
}

process.on('SIGINT', () => stopAll('SIGINT'));
process.on('SIGTERM', () => stopAll('SIGTERM'));

for (const [name, workspace, port] of services) {
  const child = spawn(npmCommand, ['run', 'dev', '-w', workspace, '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    stdio: 'inherit',
    shell: false,
  });
  children.push(child);
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    console.error(`[${name}] service arrêté (${signal ?? `code ${code ?? 'inconnu'}`})`);
    stopAll();
    process.exitCode = code ?? 1;
  });
}

