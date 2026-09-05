import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverEntry = path.join(root, 'server.ts');
const viteEntry = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const tsxEntry = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs');

function start(command, args) {
  return spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    windowsHide: false,
  });
}

const children = [
  start(process.execPath, [tsxEntry, serverEntry]),
];

let stopping = false;

const stop = (code = 0) => {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  process.exitCode = code;
};

for (const child of children) {
  child.on('error', error => {
    console.error(`Development process failed to start: ${error.message}`);
    stop(1);
  });

  child.on('exit', (code, signal) => {
    if (stopping) return;
    if (signal) {
      console.error(`Development process exited with signal ${signal}.`);
      stop(1);
      return;
    }
    if (code !== 0) {
      console.error(`Development process exited with code ${code ?? 1}.`);
      stop(code ?? 1);
    }
  });
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
