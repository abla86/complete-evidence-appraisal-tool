import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverEntry = path.join(projectRoot, 'server.ts');
const viteEntry = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const tsxEntry = path.join(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');

const children = [
  spawn(process.execPath, [tsxEntry, serverEntry], { cwd: projectRoot, stdio: 'inherit', shell: false }),
  spawn(process.execPath, [viteEntry], { cwd: projectRoot, stdio: 'inherit', shell: false }),
];

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
}

for (const child of children) {
  child.on('error', () => stop(1));
  child.on('exit', (code, signal) => {
    if (stopping) return;
    stop(signal ? 1 : code ?? 1);
  });
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
