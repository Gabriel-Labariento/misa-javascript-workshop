// Zips starters/next-mini-site into the download linked from the Next.js lessons.
// Run from anywhere after changing the starter: node scripts/package_next_starter.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'web/public/downloads/next-mini-site.zip');

mkdirSync(path.dirname(output), { recursive: true });
rmSync(output, { force: true });
execFileSync(
  'zip',
  ['-r', '-q', '-X', output, 'next-mini-site', '-x', '*/node_modules/*', '*/.next/*', '*/.DS_Store', '*/next-env.d.ts'],
  { cwd: path.join(root, 'starters'), stdio: 'inherit' },
);
console.log(`Wrote ${path.relative(root, output)}`);
