import { highlight } from './highlight.js';

// A lightweight code editor: a transparent <textarea> stacked on top of a
// highlighted <pre>. Typing, selection, undo, and screen readers all use the
// real textarea; the <pre> only paints the colors underneath it.

const OPENERS = { '{': '}', '[': ']', '(': ')' };
let editorCount = 0;

export function createEditor({ value = '', lang = 'js', label = 'Code editor', onRun, onChange } = {}) {
  const id = `pg-editor-${++editorCount}`;
  const root = document.createElement('div');
  root.className = 'pg-editor';

  const gutter = document.createElement('pre');
  gutter.className = 'pg-gutter';
  gutter.setAttribute('aria-hidden', 'true');

  const stack = document.createElement('div');
  stack.className = 'pg-stack';

  const paint = document.createElement('pre');
  paint.className = 'pg-paint';
  paint.setAttribute('aria-hidden', 'true');
  const paintCode = document.createElement('code');
  paint.append(paintCode);

  const help = document.createElement('span');
  help.id = `${id}-help`;
  help.className = 'sr-only';
  help.textContent = 'Tab indents. Press Escape, then Tab, to leave the editor. Control or Command plus Enter runs the code.';

  const textarea = document.createElement('textarea');
  textarea.className = 'pg-input';
  textarea.value = value;
  textarea.rows = 1;
  textarea.spellcheck = false;
  textarea.setAttribute('wrap', 'off');
  textarea.setAttribute('autocapitalize', 'off');
  textarea.setAttribute('autocomplete', 'off');
  textarea.setAttribute('autocorrect', 'off');
  textarea.setAttribute('aria-label', label);
  textarea.setAttribute('aria-describedby', help.id);

  stack.append(paint, textarea);
  root.append(gutter, stack, help);

  let errorLine = 0;
  let leaving = false;

  function render() {
    const text = textarea.value;
    paintCode.innerHTML = `${highlight(text, lang)}\n`;
    const count = text.split('\n').length;
    let numbers = '';
    for (let line = 1; line <= count; line++) {
      numbers += line === errorLine ? `<span class="pg-gutter-error">${line}</span>` : String(line);
      if (line < count) numbers += '\n';
    }
    gutter.innerHTML = numbers;
  }

  function changed() {
    errorLine = 0;
    render();
    onChange?.(textarea.value);
  }

  function insert(text) {
    textarea.focus();
    // execCommand keeps the browser's undo history; setRangeText is the fallback.
    let inserted = false;
    try {
      inserted = document.execCommand('insertText', false, text);
    } catch {
      inserted = false;
    }
    if (!inserted) {
      textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, 'end');
      changed();
    }
  }

  function lineStart(position) {
    return textarea.value.lastIndexOf('\n', position - 1) + 1;
  }

  function indentSelection(outdent) {
    const { selectionStart, selectionEnd, value: text } = textarea;
    if (!outdent && selectionStart === selectionEnd) {
      insert('  ');
      return;
    }
    const start = lineStart(selectionStart);
    const endIndex = text.indexOf('\n', selectionEnd - (selectionEnd > selectionStart && text[selectionEnd - 1] === '\n' ? 1 : 0));
    const end = endIndex === -1 ? text.length : endIndex;
    const block = text.slice(start, end);
    const lines = block.split('\n');
    const updated = lines.map((line) => (outdent ? line.replace(/^ {1,2}/, '') : `  ${line}`)).join('\n');
    if (updated === block) return;
    textarea.setSelectionRange(start, end);
    insert(updated);
    const firstShift = outdent ? -(lines[0].length - lines[0].replace(/^ {1,2}/, '').length) : 2;
    textarea.setSelectionRange(Math.max(start, selectionStart + firstShift), start + updated.length);
  }

  function newline() {
    const { selectionStart, value: text } = textarea;
    const start = lineStart(selectionStart);
    const indent = /^[ \t]*/.exec(text.slice(start, selectionStart))[0];
    const before = text[selectionStart - 1];
    const after = text[textarea.selectionEnd];
    if (OPENERS[before]) {
      if (after === OPENERS[before]) {
        insert(`\n${indent}  \n${indent}`);
        const caret = textarea.selectionStart - indent.length - 1;
        textarea.setSelectionRange(caret, caret);
      } else {
        insert(`\n${indent}  `);
      }
      return;
    }
    insert(`\n${indent}`);
  }

  textarea.addEventListener('input', changed);
  textarea.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      onRun?.();
      return;
    }
    if (event.key === 'Escape') {
      leaving = true;
      return;
    }
    if (event.key === 'Tab') {
      if (leaving) {
        leaving = false;
        return;
      }
      event.preventDefault();
      indentSelection(event.shiftKey);
      return;
    }
    leaving = false;
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && !event.altKey) {
      event.preventDefault();
      newline();
    }
  });
  textarea.addEventListener('blur', () => {
    leaving = false;
  });

  render();

  return {
    element: root,
    textarea,
    getValue: () => textarea.value,
    setValue(next) {
      textarea.value = next;
      changed();
    },
    setErrorLine(line) {
      errorLine = line || 0;
      render();
    },
    focus: () => textarea.focus(),
  };
}
