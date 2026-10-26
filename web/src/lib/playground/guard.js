import { tokenizeJs, isSignificant } from './js-tokens.js';

// Puts a tiny check at the start of every loop body:
//
//   while (count > 0) {        becomes      while (count > 0) {__pgLoop();
//
// The check throws an error when a loop runs for too long, so a loop whose
// condition never becomes false stops with a message instead of freezing the page.
// Insertions stay on the same line, so error line numbers still match the editor.
export function addLoopGuards(code, call = '__pgLoop();') {
  const tokens = tokenizeJs(code).filter(isSignificant);
  const positions = [];

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.type !== 'word') continue;

    const previous = tokens[index - 1];
    if (previous && previous.type === 'punct' && (previous.value === '.' || previous.value === '?.')) continue;

    if (token.value === 'do') {
      const body = tokens[index + 1];
      if (body && body.type === 'punct' && body.value === '{') positions.push(body.end);
      continue;
    }

    if (token.value !== 'for' && token.value !== 'while') continue;

    let cursor = index + 1;
    if (tokens[cursor] && tokens[cursor].type === 'word' && tokens[cursor].value === 'await') cursor++;
    if (!tokens[cursor] || tokens[cursor].value !== '(') continue;

    let depth = 0;
    for (; cursor < tokens.length; cursor++) {
      const candidate = tokens[cursor];
      if (candidate.type !== 'punct') continue;
      if (candidate.value === '(') depth++;
      if (candidate.value === ')') {
        depth--;
        if (depth === 0) break;
      }
    }

    const body = tokens[cursor + 1];
    if (body && body.type === 'punct' && body.value === '{') positions.push(body.end);
  }

  let guarded = code;
  for (const position of positions.sort((a, b) => b - a)) {
    guarded = guarded.slice(0, position) + call + guarded.slice(position);
  }
  return guarded;
}
