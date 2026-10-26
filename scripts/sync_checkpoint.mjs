// Copy the tested website examples into workshop/ on the matching checkpoint branch.
// Usage (from the repository root, on the branch itself): node scripts/sync_checkpoint.mjs 05-clicks
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLES = join(ROOT, 'web', 'src', 'examples');
const WORKSHOP = join(ROOT, 'workshop');
const checkpoints = JSON.parse(readFileSync(join(ROOT, 'web', 'src', 'data', 'checkpoints.json'), 'utf8'));

const id = process.argv[2];
const checkpoint = checkpoints.find((item) => item.id === id);
if (!checkpoint) {
  console.error(`Unknown checkpoint: ${id}`);
  process.exit(1);
}

const branch = execFileSync('git', ['branch', '--show-current'], { cwd: ROOT, encoding: 'utf8' }).trim();
if (branch !== id && !process.argv.includes('--force')) {
  console.error(`Refusing to update ${id} while on branch ${branch}`);
  process.exit(1);
}

// Remove game files from other checkpoints (script.js disappears once the game uses modules).
const allGameFiles = new Set(checkpoints.flatMap((item) => item.files));
for (const file of allGameFiles) {
  if (!checkpoint.files.includes(file) && existsSync(join(WORKSHOP, file))) rmSync(join(WORKSHOP, file));
}

for (const file of checkpoint.files) {
  writeFileSync(join(WORKSHOP, file), readFileSync(join(EXAMPLES, id, `${file}.txt`), 'utf8'));
}
mkdirSync(join(WORKSHOP, 'assets'), { recursive: true });
copyFileSync(join(ROOT, 'web', 'public', 'workshop', 'assets', 'misabot.png'), join(WORKSHOP, 'assets', 'misabot.png'));

console.log(`Synced learner files for ${id}: ${checkpoint.files.join(', ')}`);
