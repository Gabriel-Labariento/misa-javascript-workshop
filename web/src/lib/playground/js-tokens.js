// A small JavaScript tokenizer shared by the editor highlighter and the loop guard.
// It understands comments, strings, template literals (including `${...}`),
// regular expression literals, numbers, words, and punctuation. It never throws:
// unfinished code (which learners type all the time) still produces tokens.

const EXPRESSION_KEYWORDS = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
  'throw', 'case', 'do', 'else', 'yield', 'await',
]);

const OPERATOR = /^(?:>>>=|\.\.\.|===|!==|\*\*=|<<=|>>=|>>>|&&=|\|\|=|\?\?=|=>|==|!=|<=|>=|&&|\|\||\?\?|\?\.|\+\+|--|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|\*\*|<<|>>)/;
const NUMBER = /^(?:0[xX][\da-fA-F_]+n?|0[bB][01_]+n?|0[oO][0-7_]+n?|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?n?)/;
const WORD_START = /[A-Za-z_$À-￿]/;
const WORD = /^[A-Za-z_$À-￿][\w$À-￿]*/;
const REGEX = /^\/(?![*/])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n[])+\/[a-z]*/;

export function tokenizeJs(code) {
  const tokens = [];
  const braces = [];
  const length = code.length;
  let lastSignificant = null;
  let index = 0;

  function push(type, start, end) {
    const token = { type, value: code.slice(start, end), start, end };
    tokens.push(token);
    if (type !== 'ws' && type !== 'comment') lastSignificant = token;
  }

  function regexAllowed() {
    const last = lastSignificant;
    if (!last) return true;
    if (last.type === 'word') return EXPRESSION_KEYWORDS.has(last.value);
    if (last.type === 'punct') return !(last.value === ')' || last.value === ']' || last.value === '}');
    return last.type === 'tplOpen';
  }

  // Reads template text from `scan` until the closing backtick or the next `${`.
  function readTemplate(start, scan) {
    let cursor = scan;
    while (cursor < length) {
      const char = code[cursor];
      if (char === '\\') {
        cursor += 2;
        continue;
      }
      if (char === '`') {
        push('template', start, cursor + 1);
        return cursor + 1;
      }
      if (char === '$' && code[cursor + 1] === '{') {
        if (cursor > start) push('template', start, cursor);
        push('tplOpen', cursor, cursor + 2);
        braces.push('template');
        return cursor + 2;
      }
      cursor++;
    }
    push('template', start, length);
    return length;
  }

  while (index < length) {
    const char = code[index];
    const next = code[index + 1];

    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      let end = index + 1;
      while (end < length && /[ \t\n\r]/.test(code[end])) end++;
      push('ws', index, end);
      index = end;
      continue;
    }

    if (char === '/' && next === '/') {
      let end = code.indexOf('\n', index);
      if (end === -1) end = length;
      push('comment', index, end);
      index = end;
      continue;
    }

    if (char === '/' && next === '*') {
      const close = code.indexOf('*/', index + 2);
      const end = close === -1 ? length : close + 2;
      push('comment', index, end);
      index = end;
      continue;
    }

    if (char === '"' || char === "'") {
      let end = index + 1;
      while (end < length && code[end] !== char && code[end] !== '\n') {
        if (code[end] === '\\') end++;
        end++;
      }
      if (end < length && code[end] === char) end++;
      push('string', index, end);
      index = end;
      continue;
    }

    if (char === '`') {
      index = readTemplate(index, index + 1);
      continue;
    }

    if (char === '}' && braces[braces.length - 1] === 'template') {
      braces.pop();
      push('tplClose', index, index + 1);
      index = readTemplate(index + 1, index + 1);
      continue;
    }

    if (char === '{') {
      braces.push('brace');
      push('punct', index, index + 1);
      index++;
      continue;
    }

    if (char === '}') {
      braces.pop();
      push('punct', index, index + 1);
      index++;
      continue;
    }

    if (/\d/.test(char) || (char === '.' && /\d/.test(next || ''))) {
      const match = NUMBER.exec(code.slice(index, index + 64));
      const end = index + (match ? match[0].length : 1);
      push('number', index, end);
      index = end;
      continue;
    }

    if (WORD_START.test(char)) {
      const match = WORD.exec(code.slice(index, index + 256));
      const end = index + match[0].length;
      push('word', index, end);
      index = end;
      continue;
    }

    if (char === '/' && regexAllowed()) {
      const match = REGEX.exec(code.slice(index, index + 512));
      if (match) {
        push('regex', index, index + match[0].length);
        index += match[0].length;
        continue;
      }
    }

    const operator = OPERATOR.exec(code.slice(index, index + 4));
    const end = index + (operator ? operator[0].length : 1);
    push('punct', index, end);
    index = end;
  }

  return tokens;
}

export function isSignificant(token) {
  return token.type !== 'ws' && token.type !== 'comment';
}
