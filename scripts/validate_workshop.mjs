// Run focused checks against the learner checkpoint examples and lesson data.
// Usage (from the repository root): node scripts/validate_workshop.mjs
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLES = join(ROOT, 'web', 'src', 'examples');
const DOCS = join(ROOT, 'web', 'src', 'content', 'docs');
const checkpoints = JSON.parse(readFileSync(join(ROOT, 'web', 'src', 'data', 'checkpoints.json'), 'utf8'));
const problems = [];

function read(id, file) {
  return readFileSync(join(EXAMPLES, id, `${file}.txt`), 'utf8');
}

function check(condition, message) {
  if (!condition) problems.push(message);
}

function moduleSyntax(code, label) {
  const folder = mkdtempSync(join(tmpdir(), 'misa-js-'));
  const file = join(folder, 'check.mjs');
  writeFileSync(file, code);
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  rmSync(folder, { recursive: true, force: true });
  check(result.status === 0, `${label}: ${result.stderr.split('\n').find((line) => line.includes('Error')) || 'syntax error'}`);
}

function exportsOf(code) {
  const names = new Set();
  for (const match of code.matchAll(/export\s+(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/g)) names.add(match[1]);
  if (/export\s+default\b/.test(code)) names.add('default');
  return names;
}

function importsOf(code) {
  const imports = [];
  for (const match of code.matchAll(/import\s+([^;]+?)\s+from\s+["']([^"']+)["']/g)) {
    const clause = match[1];
    const names = [];
    const braces = /\{([^}]*)\}/.exec(clause);
    if (braces) for (const part of braces[1].split(',')) if (part.trim()) names.push(part.trim().split(/\s+as\s+/)[0]);
    if (/^\s*[A-Za-z_$][\w$]*\s*(,|$)/.test(clause)) names.push('default');
    imports.push({ from: match[2], names });
  }
  return imports;
}

// ---------- Checkpoint files ----------
const styleSource = read('00-start', 'style.css');
for (const checkpoint of checkpoints) {
  const folder = join(EXAMPLES, checkpoint.id);
  check(existsSync(folder), `${checkpoint.id}: missing examples folder`);
  if (!existsSync(folder)) continue;
  const present = readdirSync(folder).map((name) => name.replace(/\.txt$/, '')).sort();
  check(JSON.stringify(present) === JSON.stringify([...checkpoint.files].sort()), `${checkpoint.id}: files on disk ${present} don't match checkpoints.json ${checkpoint.files}`);
  check(read(checkpoint.id, 'style.css') === styleSource, `${checkpoint.id}: style.css differs from 00-start`);

  const html = read(checkpoint.id, 'index.html');
  check(html.includes('href="style.css"'), `${checkpoint.id}: index.html doesn't link style.css`);
  const scripts = [...html.matchAll(/<script\b([^>]*)\bsrc="([^"]+)"/g)];
  check(scripts.length === 1, `${checkpoint.id}: expected one script tag, found ${scripts.length}`);
  const isModule = checkpoint.files.includes('main.js');
  for (const [, attributes, src] of scripts) {
    check(checkpoint.files.includes(src), `${checkpoint.id}: index.html loads ${src}, which isn't in the checkpoint`);
    check(isModule === /type="module"/.test(attributes), `${checkpoint.id}: ${src} should ${isModule ? '' : 'not '}be type="module"`);
  }

  for (const file of checkpoint.files.filter((name) => name.endsWith('.js'))) {
    const code = read(checkpoint.id, file);
    if (isModule) {
      moduleSyntax(code, `${checkpoint.id}/${file}`);
      for (const { from, names } of importsOf(code)) {
        const target = from.replace(/^\.\//, '');
        check(from.startsWith('./'), `${checkpoint.id}/${file}: import path "${from}" must start with ./`);
        check(checkpoint.files.includes(target), `${checkpoint.id}/${file}: imports missing file ${from}`);
        if (!checkpoint.files.includes(target)) continue;
        const exported = exportsOf(read(checkpoint.id, target));
        for (const name of names) check(exported.has(name), `${checkpoint.id}/${file}: ${target} has no export named ${name}`);
      }
    } else {
      try {
        new vm.Script(code, { filename: `${checkpoint.id}/${file}` });
      } catch (error) {
        problems.push(`${checkpoint.id}/${file}: ${error.message}`);
      }
    }
  }
}

// ---------- Lesson references ----------
const exerciseModule = await import(pathToFileURL(join(ROOT, 'web', 'src', 'data', 'exercises.mjs')).href);
const exercises = exerciseModule.default;
const usedExercises = new Set();
const pages = [];
(function walk(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (entry.isDirectory()) walk(join(folder, entry.name));
    else if (entry.name.endsWith('.mdx')) pages.push(join(folder, entry.name));
  }
})(DOCS);
for (const page of pages) {
  const text = readFileSync(page, 'utf8');
  for (const match of text.matchAll(/<Exercise id="([^"]+)"/g)) {
    usedExercises.add(match[1]);
    check(match[1] in exercises, `${page}: unknown exercise ${match[1]}`);
  }
  for (const match of text.matchAll(/<Checkpoint id="([^"]+)"/g)) {
    check(checkpoints.some((item) => item.id === match[1]), `${page}: unknown checkpoint ${match[1]}`);
  }
}
for (const id of Object.keys(exercises)) check(usedExercises.has(id), `exercise ${id} is never used in a lesson`);

// ---------- Exercise data ----------
for (const [id, exercise] of Object.entries(exercises)) {
  check(exercise.title && exercise.files?.length, `exercise ${id}: needs a title and starter files`);
  const scenarios = exercise.scenarios ?? [{ checks: exercise.checks }];
  check(scenarios.every((scenario) => (scenario.checks ?? exercise.checks ?? []).length > 0), `exercise ${id}: every scenario needs checks`);
  for (const file of exercise.solution ?? []) {
    if (exercise.module) moduleSyntax(file.code, `exercise ${id} solution ${file.name}`);
    else {
      try {
        new vm.Script(file.code);
      } catch (error) {
        problems.push(`exercise ${id} solution: ${error.message}`);
      }
    }
  }
}

if (problems.length) {
  console.error(`${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`Checked ${checkpoints.length} checkpoints, ${pages.length} lesson pages, and ${Object.keys(exercises).length} exercises.`);
