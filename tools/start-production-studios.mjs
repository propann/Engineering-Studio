import { spawn } from 'node:child_process';
import net from 'node:net';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const host = process.env.STUDIO_HOST ?? '0.0.0.0';
const services = [
  {
    name: 'hub',
    command: ['run', 'preview', '-w', 'apps/studio-hub', '--', '--host', host, '--port', '5179', '--strictPort'],
    port: 5179,
  },
  {
    name: 'op1',
    command: ['run', 'start', '-w', 'apps/op1-studio', '--', '--hostname', host, '--port', '5175'],
    port: 5175,
  },
  {
    name: 'ep133',
    command: ['run', 'preview', '-w', 'apps/ep133-studio', '--', '--host', host, '--port', '5177', '--strictPort'],
    port: 5177,
  },
];

const children = [];
let shuttingDown = false;

function portAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)));
  });
}

async function assertPortsAvailable() {
  const occupied = [];
  for (const service of services) {
    if (!(await portAvailable(service.port))) occupied.push(`${service.name}:${service.port}`);
  }
  if (occupied.length) {
    throw new Error(`Ports déjà utilisées (${occupied.join(', ')}). Arrête les anciens processus avant de relancer.`);
  }
}

function stopAll(signal = 'SIGTERM') {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill(signal);
}

process.on('SIGINT', () => stopAll('SIGINT'));
process.on('SIGTERM', () => stopAll('SIGTERM'));

try {
  await assertPortsAvailable();
  for (const service of services) {
    const child = spawn(npmCommand, service.command, { stdio: 'inherit', shell: false });
    children.push(child);
    child.once('error', (error) => {
      if (shuttingDown) return;
      console.error(`[${service.name}] impossible de démarrer: ${error.message}`);
      stopAll();
      process.exitCode = 1;
    });
    child.once('exit', (code, signal) => {
      if (shuttingDown) return;
      console.error(`[${service.name}] service arrêté (${signal ?? `code ${code ?? 'inconnu'}`})`);
      stopAll();
      process.exitCode = code ?? 1;
    });
  }
  console.log(`Services production démarrés sur ${host}: 5175 (OP-1), 5177 (EP-133), 5179 (Hub).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
