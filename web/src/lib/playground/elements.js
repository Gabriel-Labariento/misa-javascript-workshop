import { createEditor } from './editor.js';
import { Runner } from './runner.js';
import { el, button, codeBlock, createConsole, langFor, PREVIEW_STYLE, storage } from './ui.js';

// Custom elements used inside lessons:
//   <js-playground>  an editable example with a Run button, preview, and console
//   <js-exercise>    a practice task with automatic checks, hints, and a solution
//   <js-predict>     a "what will this print?" question

// Lets the page companion (src/lib/companion.js) react to what the learner does.
function announce(target, action, detail = {}) {
  target.dispatchEvent(new CustomEvent(`misa:${action}`, { bubbles: true, detail }));
}

function assetBase() {
  const base = import.meta.env.BASE_URL || '/';
  return new URL(`${base.replace(/\/?$/, '/')}workshop/`, window.location.href).href;
}

// Turns lesson files (an HTML fragment, CSS, and scripts) into a small website.
export function siteFiles(files, module) {
  let page = '';
  let css = '';
  const scripts = [];
  const result = {};
  for (const file of files) {
    if (file.lang === 'html') page = file.code;
    else if (file.lang === 'css') css = file.code;
    else {
      scripts.push(file.name);
      result[file.name] = file.code;
    }
  }
  let tags = '';
  if (module) {
    const entry = scripts.includes('main.js') ? 'main.js' : scripts[scripts.length - 1];
    if (entry) tags = `<script type="module" src="${entry}"></script>`;
  } else {
    tags = scripts.map((name) => `<script src="${name}"></script>`).join('\n');
  }
  if (css) result['style.css'] = css;
  result['index.html'] = `<!doctype html><html lang="en"><head><meta charset="utf-8">${css ? '<link rel="stylesheet" href="style.css">' : ''}</head><body>\n${page}\n${tags}\n</body></html>`;
  return result;
}

// Expressive Code puts its stylesheet next to the first code block on the page,
// which may sit inside our fallback. Hide the fallback instead of removing it.
function mount(host, shell) {
  const fallback = host.querySelector(':scope > .pg-fallback');
  if (fallback) {
    fallback.hidden = true;
    fallback.after(shell);
  } else {
    host.append(shell);
  }
}

function tabLabel(file) {
  if (file.label) return file.label;
  if (file.lang === 'html') return 'HTML';
  if (file.lang === 'css') return 'CSS';
  return file.name;
}

// The editing area shared by playgrounds and exercises: file tabs + editors + buttons.
function createWorkspace({ files, title, onRun, onChange, actions = [] }) {
  const root = el('div', 'pg-workspace');
  const bar = el('div', 'pg-bar');
  const tabs = el('div', 'pg-tabs');
  tabs.setAttribute('role', 'tablist');
  const editors = [];
  const panes = el('div', 'pg-panes');

  files.forEach((file, index) => {
    const editor = createEditor({
      value: file.code,
      lang: file.lang,
      label: `${title ? `${title}: ` : ''}${tabLabel(file)} editor`,
      onRun,
      onChange: () => onChange?.(),
    });
    editor.element.hidden = index !== 0;
    editors.push(editor);
    panes.append(editor.element);
    const tab = button(tabLabel(file), 'pg-tab', () => select(index));
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(index === 0));
    tabs.append(tab);
  });

  function select(index) {
    editors.forEach((editor, position) => {
      editor.element.hidden = position !== index;
    });
    [...tabs.children].forEach((tab, position) => tab.setAttribute('aria-selected', String(position === index)));
  }

  // Open on the first script: that's what learners usually edit.
  const firstScript = files.findIndex((file) => file.lang === 'js');
  select(firstScript === -1 ? 0 : firstScript);

  const buttons = el('div', 'pg-actions');
  for (const action of actions) buttons.append(action);
  if (title) bar.append(el('span', 'pg-title', title));
  bar.append(tabs, buttons);
  root.append(bar, panes);

  return {
    element: root,
    editors,
    select,
    current() {
      return files.map((file, index) => ({ ...file, code: editors[index].getValue() }));
    },
    reset(nextFiles = files) {
      nextFiles.forEach((file, index) => editors[index]?.setValue(file.code));
    },
    showError(info) {
      if (!info.file) return;
      const index = files.findIndex((file) => file.name === info.file);
      if (index === -1) return;
      editors[index].setErrorLine(info.line);
      select(index);
    },
  };
}

function createOutput({ preview, height, title }) {
  const root = el('div', 'pg-output');
  const frameHost = el('div', preview ? 'pg-preview' : 'pg-preview pg-preview-hidden');
  if (preview) {
    frameHost.style.setProperty('--pg-preview-height', `${height}px`);
    frameHost.append(el('div', 'pg-preview-empty', 'Press Run to load the page.'));
  }
  const consolePanel = createConsole();
  if (preview) {
    const label = el('div', 'pg-preview-label', 'Preview');
    root.append(label, frameHost, consolePanel.element);
  } else {
    root.append(frameHost, consolePanel.element);
  }
  return { element: root, frameHost, console: consolePanel, title };
}

class PlaygroundElement extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    const config = JSON.parse(this.dataset.config || '{}');
    const files = config.files.map((file) => ({ ...file }));
    const preview = Boolean(config.preview);

    const runButton = button('▶ Run', 'pg-button pg-run');
    const resetButton = button('Reset', 'pg-button pg-quiet');
    const workspace = createWorkspace({
      files,
      title: config.title || (files.length === 1 ? 'Try it' : ''),
      onRun: () => userRun(),
      actions: [resetButton, runButton],
    });
    const output = createOutput({ preview, height: config.height || 180 });
    const runner = new Runner(output.frameHost, {
      onConsole: (level, text) => output.console.log(level, text),
      onClear: () => output.console.clear(),
      onError: (info) => {
        output.console.error(info);
        workspace.showError(info);
      },
    }, 'Playground preview');

    const run = () => {
      output.console.clear();
      runner.start({
        mode: 'run',
        files: siteFiles(workspace.current(), config.module),
        assetBase: assetBase(),
        baseStyle: PREVIEW_STYLE,
      });
    };
    const userRun = () => {
      run();
      announce(this, 'run');
    };
    runButton.addEventListener('click', userRun);
    resetButton.addEventListener('click', () => {
      workspace.reset();
      output.console.clear();
      runner.stop();
      if (preview) output.frameHost.replaceChildren(el('div', 'pg-preview-empty', 'Press Run to load the page.'));
    });

    const shell = el('div', 'pg');
    shell.append(workspace.element, output.element);
    if (config.note) shell.append(el('p', 'pg-note', config.note));
    mount(this, shell);
    if (config.autorun) run();
  }
}

class ExerciseElement extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    const config = JSON.parse(this.dataset.config || '{}');
    const store = storage();
    const saveKey = `misa-js:exercise:${config.id}`;
    const solvedKey = `misa-js:solved:${config.id}`;
    const starter = config.files.map((file) => ({ ...file }));

    let saved = null;
    try {
      saved = store ? JSON.parse(store.getItem(saveKey) || 'null') : null;
    } catch {
      saved = null;
    }
    const files = starter.map((file) => ({ ...file, code: saved && typeof saved[file.name] === 'string' ? saved[file.name] : file.code }));

    const status = this.querySelector('.pg-ex-status');
    const markSolved = (solved) => {
      if (status) status.hidden = !solved;
      this.classList.toggle('is-solved', solved);
    };
    markSolved(Boolean(store && store.getItem(solvedKey)));

    const runButton = button('▶ Run', 'pg-button pg-quiet');
    const checkButton = button('Check my answer', 'pg-button pg-run');
    const resetButton = button('Reset', 'pg-button pg-quiet');
    const workspace = createWorkspace({
      files,
      title: '',
      onRun: () => run(),
      onChange: () => save(),
      actions: [resetButton, runButton, checkButton],
    });

    const hasPage = Boolean(config.html);
    const output = createOutput({ preview: hasPage, height: config.height || 170 });
    const results = el('div', 'pg-results');
    results.setAttribute('aria-live', 'polite');
    results.hidden = true;

    const runner = new Runner(output.frameHost, {
      onConsole: (level, text) => output.console.log(level, text),
      onClear: () => output.console.clear(),
      onError: (info) => {
        output.console.error(info);
        workspace.showError(info);
      },
    }, `${config.title} preview`);

    const checkHost = el('div', 'pg-check-host');
    checkHost.setAttribute('aria-hidden', 'true');

    const pageFiles = () => {
      const list = [];
      if (config.html) list.push({ name: 'page.html', lang: 'html', code: config.html });
      if (config.css) list.push({ name: 'style.css', lang: 'css', code: config.css });
      return list.concat(workspace.current());
    };

    function save() {
      if (!store) return;
      const snapshot = {};
      for (const file of workspace.current()) snapshot[file.name] = file.code;
      try {
        store.setItem(saveKey, JSON.stringify(snapshot));
      } catch {
        /* storage full or blocked */
      }
    }

    const run = () => {
      output.console.clear();
      const first = config.scenarios[0] || {};
      runner.start({
        mode: 'run',
        files: siteFiles(pageFiles(), config.module),
        setup: first.setup || '',
        assetBase: assetBase(),
        baseStyle: PREVIEW_STYLE,
      });
    };

    const check = async () => {
      checkButton.disabled = true;
      checkButton.textContent = 'Checking…';
      results.hidden = false;
      results.replaceChildren(el('p', 'pg-results-wait', 'Running the checks…'));
      const rows = [];
      const errors = [];
      const checker = new Runner(checkHost, {
        onError: (info) => errors.push(info),
      }, 'Checks');
      for (const scenario of config.scenarios) {
        const outcome = await checker.check({
          files: siteFiles(pageFiles(), config.module),
          setup: scenario.setup || '',
          prompts: scenario.prompts || [],
          checks: scenario.checks,
          assetBase: assetBase(),
        });
        if (outcome.timedOut) {
          rows.push({ label: scenario.label ? `${scenario.label}: checks finished` : 'Checks finished', pass: false, message: 'The checks took too long. Look for a loop or timer that never stops.' });
          break;
        }
        for (const result of outcome.results) {
          rows.push({ ...result, label: scenario.label ? `${scenario.label}: ${result.label}` : result.label });
        }
      }
      checker.stop();

      const passed = rows.length > 0 && rows.every((row) => row.pass);
      const list = el('ul', 'pg-results-list');
      for (const row of rows) {
        const item = el('li', row.pass ? 'pg-pass' : 'pg-fail');
        item.append(el('span', 'pg-result-icon', row.pass ? '✓' : '✗'));
        const body = el('span', 'pg-result-body');
        body.append(el('span', 'pg-result-label', row.label));
        if (!row.pass && row.message) body.append(el('span', 'pg-result-message', row.message));
        item.append(body);
        list.append(item);
      }
      const summary = el('p', passed ? 'pg-results-summary pg-results-pass' : 'pg-results-summary', passed ? 'All checks passed. Nice work!' : `${rows.filter((row) => row.pass).length} of ${rows.length} checks passed. Read the first ✗ and try again.`);
      results.replaceChildren(summary, list);
      const uniqueErrors = [...new Map(errors.map((error) => [error.message, error])).values()].slice(0, 3);
      for (const error of uniqueErrors) {
        const note = el('p', 'pg-results-error', `Your code threw: ${error.message}${error.file ? ` (${error.file}${error.line ? `, line ${error.line}` : ''})` : ''}`);
        if (error.hint) note.append(el('span', 'pg-error-hint', error.hint));
        results.append(note);
      }
      if (passed && store) {
        try {
          store.setItem(solvedKey, '1');
        } catch {
          /* ignore */
        }
      }
      markSolved(passed || Boolean(store && store.getItem(solvedKey)));
      announce(this, 'check', { passed });
      checkButton.disabled = false;
      checkButton.textContent = 'Check my answer';
    };

    runButton.addEventListener('click', run);
    checkButton.addEventListener('click', check);
    resetButton.addEventListener('click', () => {
      workspace.reset(starter);
      output.console.clear();
      runner.stop();
      results.hidden = true;
      if (store) store.removeItem(saveKey);
      if (hasPage) output.frameHost.replaceChildren(el('div', 'pg-preview-empty', 'Press Run to load the page.'));
    });

    const shell = el('div', 'pg pg-exercise-body');
    if (config.html) {
      const page = el('details', 'pg-given');
      page.append(el('summary', '', 'The page’s HTML'), codeBlock(config.html, 'html'));
      shell.append(page);
    }
    if (config.given) {
      const given = el('details', 'pg-given');
      given.open = true;
      given.append(el('summary', '', 'Given: ready to use in your code'), codeBlock(config.given, 'js'));
      shell.append(given);
    }
    shell.append(workspace.element, output.element, results);

    const help = el('div', 'pg-help');
    (config.hints || []).forEach((hint, index) => {
      const details = el('details', 'pg-hint');
      details.append(el('summary', '', `Hint ${index + 1}`), el('p', '', hint));
      help.append(details);
    });
    if (config.solution && config.solution.length) {
      const details = el('details', 'pg-hint pg-solution');
      details.append(el('summary', '', 'Show one possible solution'));
      for (const file of config.solution) details.append(codeBlock(file.code, langFor(file.name), config.solution.length > 1 || file.name !== 'script.js' ? file.name : ''));
      details.append(button('Copy into the editor', 'pg-link-button', () => {
        workspace.reset(starter.map((file) => ({ ...file, code: config.solution.find((candidate) => candidate.name === file.name)?.code ?? file.code })));
        save();
      }));
      help.append(details);
    }
    shell.append(help, checkHost);

    mount(this, shell);
  }
}

class PredictElement extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    const options = JSON.parse(this.dataset.options || '[]');
    const answer = Number(this.dataset.answer);
    const body = this.querySelector(':scope > .pg-predict-body');
    if (!body) return;
    const children = [...body.children];
    const codeIndex = children.findIndex((child) => child.matches('.expressive-code, pre'));
    const explanation = el('div', 'pg-predict-explain');
    explanation.hidden = true;
    for (const child of children.slice(codeIndex + 1)) explanation.append(child);

    const choices = el('div', 'pg-choices');
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', 'Answer choices');
    const feedback = el('p', 'pg-feedback');
    feedback.setAttribute('aria-live', 'polite');
    options.forEach((option, index) => {
      const choice = button(option, 'pg-choice', () => {
        for (const other of choices.children) other.disabled = true;
        choice.classList.add(index === answer ? 'is-right' : 'is-wrong');
        choices.children[answer].classList.add('is-right');
        feedback.textContent = index === answer ? 'Correct!' : `Not quite. The answer is ${options[answer]}.`;
        feedback.className = `pg-feedback ${index === answer ? 'is-right' : 'is-wrong'}`;
        explanation.hidden = false;
        announce(this, 'predict', { correct: index === answer });
      });
      choices.append(choice);
    });
    body.append(choices, feedback, explanation);
    this.querySelector(':scope > noscript')?.remove();
  }
}

if (!customElements.get('js-playground')) customElements.define('js-playground', PlaygroundElement);
if (!customElements.get('js-exercise')) customElements.define('js-exercise', ExerciseElement);
if (!customElements.get('js-predict')) customElements.define('js-predict', PredictElement);
