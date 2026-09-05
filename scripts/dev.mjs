import { spawn } from 'node:child_process';

const children = [
  spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'server.ts'], { stdio: 'inherit', shell: false }),
  spawn(process.platform === 'win32' ? 'node_modules/vite/bin/vite.js' : 'node_modules/.bin/vite', [], { stdio: 'inherit', shell: false })
];

let stopping = false;
const stop = (code = 0) => {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
};
for (const child of children) child.on('exit', (code) => { if (code && !stopping) stop(code); });
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
