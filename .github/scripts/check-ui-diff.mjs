import { execFileSync } from 'node:child_process';

const files = ['src/App.tsx', 'src/components/Header.tsx'];
const threshold = 20;

const base = process.env.GITHUB_BASE_SHA;
const head = process.env.GITHUB_SHA || 'HEAD';
if (!base) {
  console.log('UI diff budget skipped: GITHUB_BASE_SHA is not set.');
  process.exit(0);
}

const message = execFileSync('git', ['log', '-1', '--format=%B', head], { encoding: 'utf8' });
if (message.includes('[refactor-approved]')) {
  console.log('UI diff budget bypassed by [refactor-approved].');
  process.exit(0);
}

const diff = execFileSync('git', ['diff', '--numstat', `${base}...${head}`, '--', ...files], { encoding: 'utf8' });
const violations = [];
for (const line of diff.trim().split('\n')) {
  if (!line) continue;
  const [additions, deletions, file] = line.split('\t');
  const deleted = Number(deletions);
  if (Number.isFinite(deleted) && deleted > threshold) {
    violations.push(`${file}: ${deleted} deleted lines (limit ${threshold})`);
  }
}

if (violations.length > 0) {
  console.error('UI diff budget exceeded. Use [refactor-approved] only for an intentional large refactor.');
  for (const violation of violations) console.error(` - ${violation}`);
  process.exit(1);
}

console.log('UI diff budget passed.');
