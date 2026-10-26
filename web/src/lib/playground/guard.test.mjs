import test from 'node:test';
import assert from 'node:assert/strict';
import { addLoopGuards } from './guard.js';
import { tokenizeJs } from './js-tokens.js';

const G = '__pgLoop();';

test('guards while, for, for...of, and do loops without changing lines', () => {
  const code = 'let n = 3;\nwhile (n > 0) {\n  n--;\n}\nfor (let i = 0; i < 3; i++) { }\nfor (const x of xs) {}\ndo { n++; } while (n < 2);';
  const guarded = addLoopGuards(code);
  assert.equal(guarded.split('\n').length, code.split('\n').length);
  assert.equal(guarded.split(G).length - 1, 4);
  assert.ok(guarded.includes(`while (n > 0) {${G}`));
  assert.ok(guarded.includes(`do {${G} n++; } while (n < 2);`));
});

test('ignores loops inside strings, comments, templates, and property names', () => {
  const code = 'const a = "while (x) {";\n// for (;;) {\nconst b = `for (${y}) {`;\nobj.while = 1;\nitems.forEach(() => {});';
  assert.equal(addLoopGuards(code), code);
});

test('handles nested parentheses in loop headers', () => {
  const code = 'while (holes[index] === getHole(other(1))) {\n  index = pick();\n}';
  assert.ok(addLoopGuards(code).startsWith(`while (holes[index] === getHole(other(1))) {${G}`));
});

test('guards loops inside template expressions and nested functions', () => {
  const code = 'const t = `${(() => { while (true) { break; } return 1; })()}`;';
  assert.equal(addLoopGuards(code).split(G).length - 1, 1);
});

test('does not guard brace-less loop bodies (left unchanged)', () => {
  const code = 'while (n) n--;';
  assert.equal(addLoopGuards(code), code);
});

test('tokenizer separates regex from division', () => {
  const division = tokenizeJs('total / count / 2').filter((t) => t.type === 'regex');
  assert.equal(division.length, 0);
  const regex = tokenizeJs('const r = /a\\/b/g; return /x/.test(s);').filter((t) => t.type === 'regex');
  assert.equal(regex.length, 2);
});

test('tokenizer survives unfinished code', () => {
  assert.doesNotThrow(() => tokenizeJs('const s = "unclosed\nconst t = `${a + {'));
});
