import { tokenizeJs, isSignificant } from './js-tokens.js';

// Turns code into HTML with <span class="tk-*"> tokens for the lesson editors.
// Colors live in playground.css and follow Starlight's light and dark themes.

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
  'break', 'continue', 'class', 'extends', 'new', 'this', 'super', 'import', 'export',
  'default', 'from', 'as', 'async', 'await', 'try', 'catch', 'finally', 'throw',
  'typeof', 'instanceof', 'in', 'of', 'switch', 'case', 'delete', 'void', 'yield',
  'static', 'get', 'set',
]);
const LITERALS = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity']);
const GLOBALS = new Set([
  'console', 'document', 'window', 'Math', 'JSON', 'Number', 'String', 'Boolean',
  'Array', 'Object', 'Date', 'Promise', 'Error', 'Map', 'Set', 'localStorage',
  'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'prompt', 'alert',
  'confirm', 'parseInt', 'parseFloat',
]);
const BRACKETS = new Set(['(', ')', '[', ']', '{', '}', ',', ';', '.', '?.']);

export function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function span(kind, text) {
  return `<span class="tk-${kind}">${escapeHtml(text)}</span>`;
}

function neighbor(tokens, index, step) {
  for (let cursor = index + step; cursor >= 0 && cursor < tokens.length; cursor += step) {
    if (isSignificant(tokens[cursor])) return tokens[cursor];
  }
  return null;
}

function classifyWord(tokens, index) {
  const word = tokens[index].value;
  const previous = neighbor(tokens, index, -1);
  const next = neighbor(tokens, index, 1);
  const calls = next && next.type === 'punct' && next.value === '(';
  if (previous && previous.type === 'punct' && (previous.value === '.' || previous.value === '?.')) {
    return calls ? 'fn' : 'prop';
  }
  if (KEYWORDS.has(word)) return 'kw';
  if (LITERALS.has(word)) return 'lit';
  if (GLOBALS.has(word)) return 'glob';
  if (calls) return 'fn';
  if (/^[A-Z]/.test(word)) return 'cls';
  return 'id';
}

export function highlightJs(code) {
  const tokens = tokenizeJs(code);
  let html = '';
  tokens.forEach((token, index) => {
    switch (token.type) {
      case 'ws':
        html += token.value;
        break;
      case 'comment':
        html += span('com', token.value);
        break;
      case 'string':
      case 'template':
      case 'regex':
        html += span('str', token.value);
        break;
      case 'tplOpen':
      case 'tplClose':
        html += span('tpl', token.value);
        break;
      case 'number':
        html += span('num', token.value);
        break;
      case 'word':
        html += span(classifyWord(tokens, index), token.value);
        break;
      default:
        html += BRACKETS.has(token.value) ? escapeHtml(token.value) : span('op', token.value);
    }
  });
  return html;
}

export function highlightHtml(code) {
  let html = '';
  let index = 0;
  while (index < code.length) {
    if (code.startsWith('<!--', index)) {
      const close = code.indexOf('-->', index + 4);
      const end = close === -1 ? code.length : close + 3;
      html += span('com', code.slice(index, end));
      index = end;
      continue;
    }
    const tag = /^<\/?[A-Za-z][\w-]*/.exec(code.slice(index, index + 64));
    if (tag) {
      html += span('tag', tag[0]);
      index += tag[0].length;
      // Attributes until the closing angle bracket
      while (index < code.length && code[index] !== '>') {
        const rest = code.slice(index, index + 2048);
        const space = /^\s+/.exec(rest);
        if (space) {
          html += space[0];
          index += space[0].length;
          continue;
        }
        const value = /^=\s*("[^"]*"?|'[^']*'?|[^\s>]+)/.exec(rest);
        if (value) {
          html += escapeHtml('=') + span('str', value[0].slice(1).trimStart());
          index += value[0].length;
          continue;
        }
        const name = /^[^\s=>]+/.exec(rest);
        if (name) {
          html += name[0] === '/' ? span('tag', '/') : span('attr', name[0]);
          index += name[0].length;
          continue;
        }
        html += escapeHtml(code[index]);
        index++;
      }
      if (code[index] === '>') {
        html += span('tag', '>');
        index++;
      }
      continue;
    }
    const text = /^[^<]+/.exec(code.slice(index));
    if (text) {
      html += escapeHtml(text[0]);
      index += text[0].length;
    } else {
      html += escapeHtml(code[index]);
      index++;
    }
  }
  return html;
}

export function highlightCss(code) {
  let html = '';
  let index = 0;
  let depth = 0;
  let inValue = false;
  while (index < code.length) {
    const rest = code.slice(index, index + 1024);
    const char = code[index];
    if (rest.startsWith('/*')) {
      const close = code.indexOf('*/', index + 2);
      const end = close === -1 ? code.length : close + 2;
      html += span('com', code.slice(index, end));
      index = end;
      continue;
    }
    if (char === '"' || char === "'") {
      let end = index + 1;
      while (end < code.length && code[end] !== char && code[end] !== '\n') end++;
      end = Math.min(end + 1, code.length);
      html += span('str', code.slice(index, end));
      index = end;
      continue;
    }
    if (char === '{') {
      depth++;
      inValue = false;
      html += '{';
      index++;
      continue;
    }
    if (char === '}') {
      depth = Math.max(0, depth - 1);
      inValue = false;
      html += '}';
      index++;
      continue;
    }
    if (char === ';') {
      inValue = false;
      html += ';';
      index++;
      continue;
    }
    if (depth > 0 && !inValue) {
      const property = /^(\s*)([-\w]+)(\s*):/.exec(rest);
      if (property) {
        html += property[1] + span('prop', property[2]) + property[3] + ':';
        index += property[0].length;
        inValue = true;
        continue;
      }
    }
    if (depth === 0) {
      const selector = /^[^{/"']+/.exec(rest);
      if (selector) {
        html += span('sel', selector[0].replace(/\s+$/, '')) + selector[0].slice(selector[0].replace(/\s+$/, '').length);
        index += selector[0].length;
        continue;
      }
    }
    const number = /^(#[\da-fA-F]{3,8}\b|-?\d*\.?\d+(?:%|[a-z]+)?)/.exec(rest);
    if (inValue && number) {
      html += span('num', number[0]);
      index += number[0].length;
      continue;
    }
    html += escapeHtml(char);
    index++;
  }
  return html;
}

export function highlight(code, lang) {
  if (lang === 'html') return highlightHtml(code);
  if (lang === 'css') return highlightCss(code);
  return highlightJs(code);
}
