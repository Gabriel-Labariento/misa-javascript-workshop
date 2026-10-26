import { highlight } from './highlight.js';

// Small DOM helpers and the console panel shared by every interactive block.

export function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function button(label, className, onClick) {
  const element = el('button', className, label);
  element.type = 'button';
  if (onClick) element.addEventListener('click', onClick);
  return element;
}

export function codeBlock(code, lang, title) {
  const figure = el('div', 'pg-static');
  if (title) figure.append(el('div', 'pg-static-title', title));
  const pre = el('pre', 'pg-static-code');
  const inner = el('code');
  inner.innerHTML = highlight(code, lang);
  pre.append(inner);
  figure.append(pre);
  return figure;
}

export function langFor(name) {
  if (name.endsWith('.html')) return 'html';
  if (name.endsWith('.css')) return 'css';
  return 'js';
}

export const PREVIEW_STYLE = 'html{color-scheme:light}body{margin:0;padding:12px 14px;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#102a2c;background:#fff}button,input,select{font:inherit}';

export function storage() {
  try {
    const store = window.localStorage;
    const probe = '__misa_js_probe__';
    store.setItem(probe, probe);
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

export function createConsole({ emptyText = 'Press Run to see output here.' } = {}) {
  const root = el('div', 'pg-console');
  const head = el('div', 'pg-console-head');
  head.append(el('span', 'pg-console-label', 'Console'));
  const clearButton = button('Clear', 'pg-link-button', () => api.clear());
  head.append(clearButton);
  const body = el('div', 'pg-console-body');
  body.setAttribute('role', 'log');
  body.setAttribute('aria-live', 'polite');
  body.setAttribute('aria-label', 'Console output');
  const empty = el('div', 'pg-console-empty', emptyText);
  body.append(empty);
  root.append(head, body);

  let count = 0;
  function add(line) {
    if (empty.isConnected) empty.remove();
    body.append(line);
    count++;
    if (count > 400) {
      body.firstElementChild?.remove();
      count--;
    }
    body.scrollTop = body.scrollHeight;
  }

  const api = {
    element: root,
    clear() {
      body.replaceChildren(empty);
      count = 0;
    },
    log(level, text) {
      const line = el('div', `pg-line pg-line-${level}`);
      line.textContent = text;
      add(line);
    },
    error({ message, file, line, hint }) {
      const row = el('div', 'pg-line pg-line-error');
      const where = file ? ` (${file}${line ? `, line ${line}` : ''})` : '';
      row.append(el('span', 'pg-error-text', `Uncaught ${message}${where}`));
      if (hint) row.append(el('span', 'pg-error-hint', hint));
      add(row);
    },
    note(text) {
      add(el('div', 'pg-line pg-line-note', text));
    },
  };
  return api;
}
