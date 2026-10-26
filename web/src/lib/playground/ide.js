import { createEditor } from './editor.js';
import { Runner } from './runner.js';
import { el, button, createConsole, langFor, storage } from './ui.js';

// <js-ide>: the browser playground page. It loads any checkpoint's files into
// tabs, runs index.html in a sandboxed preview, and keeps edits in this browser.

const NAME_PATTERN = /^[A-Za-z0-9_-]+\.(js|css|html)$/;

class IdeElement extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    this.checkpoints = JSON.parse(this.dataset.checkpoints || '[]');
    this.store = storage();
    this.base = new URL(`${(import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')}workshop/`, window.location.href).href;

    const params = new URLSearchParams(window.location.search);
    const requested = params.get('checkpoint');
    const fallback = this.checkpoints[this.checkpoints.length - 1]?.id;
    this.current = this.checkpoints.some((item) => item.id === requested) ? requested : fallback;

    this.build();
    this.load(this.current);
  }

  build() {
    const toolbar = el('div', 'ide-toolbar');
    const picker = el('label', 'ide-picker');
    picker.append(document.createTextNode('Checkpoint '));
    this.select = el('select');
    for (const item of this.checkpoints) {
      const option = el('option', '', `${item.id} · ${item.title}`);
      option.value = item.id;
      this.select.append(option);
    }
    this.select.addEventListener('change', () => {
      this.load(this.select.value);
      const url = new URL(window.location.href);
      url.searchParams.set('checkpoint', this.select.value);
      window.history.replaceState(null, '', url);
    });
    picker.append(this.select);

    this.runButton = button('▶ Run', 'pg-button pg-run', () => this.run());
    const resetButton = button('Reset checkpoint', 'pg-button pg-quiet', () => this.reset());
    const newButton = button('New file', 'pg-button pg-quiet', () => this.newFile());
    const downloadButton = button('Download file', 'pg-button pg-quiet', () => this.download());
    const actions = el('div', 'ide-actions');
    actions.append(newButton, downloadButton, resetButton, this.runButton);
    toolbar.append(picker, actions);

    this.tabs = el('div', 'pg-tabs ide-tabs');
    this.tabs.setAttribute('role', 'tablist');
    this.panes = el('div', 'pg-panes ide-panes');

    const workspace = el('div', 'pg-workspace');
    const bar = el('div', 'pg-bar');
    bar.append(this.tabs);
    workspace.append(bar, this.panes);

    this.frameHost = el('div', 'pg-preview ide-preview');
    this.frameHost.style.setProperty('--pg-preview-height', '560px');
    this.console = createConsole({ emptyText: 'Console output from your page appears here.' });
    this.runner = new Runner(this.frameHost, {
      onConsole: (level, text) => this.console.log(level, text),
      onClear: () => this.console.clear(),
      onError: (info) => {
        this.console.error(info);
        const entry = this.files.find((file) => file.name === info.file);
        if (entry) {
          entry.editor.setErrorLine(info.line);
          this.show(info.file);
        }
      },
    }, 'Your page');

    this.status = el('p', 'ide-status');
    this.status.setAttribute('aria-live', 'polite');

    const shell = el('div', 'pg ide');
    shell.append(toolbar, this.status, workspace, el('div', 'pg-preview-label', 'Preview'), this.frameHost, this.console.element);
    this.querySelector(':scope > .ide-fallback')?.replaceWith(shell);
    if (!shell.isConnected) this.append(shell);
  }

  checkpoint(id) {
    return this.checkpoints.find((item) => item.id === id);
  }

  saved(id) {
    if (!this.store) return null;
    try {
      return JSON.parse(this.store.getItem(`misa-js:ide:${id}`) || 'null');
    } catch {
      return null;
    }
  }

  save() {
    if (!this.store) return;
    const files = this.files.map((file) => ({ name: file.name, code: file.editor.getValue() }));
    try {
      this.store.setItem(`misa-js:ide:${this.current}`, JSON.stringify(files));
    } catch {
      /* storage full or blocked */
    }
  }

  load(id) {
    this.current = id;
    this.select.value = id;
    const original = this.checkpoint(id);
    const saved = this.saved(id);
    const list = saved || original.files;
    this.files = [];
    this.tabs.replaceChildren();
    this.panes.replaceChildren();
    for (const file of list) this.addFile(file.name, file.code);
    this.show(this.files.find((file) => file.name.endsWith('.js'))?.name || this.files[0].name);
    this.status.textContent = saved ? `Loaded your saved edits for ${id}. “Reset checkpoint” brings back the original files.` : `Loaded ${id}: ${original.expected}.`;
    this.runner.stop();
    this.console.clear();
    this.frameHost.replaceChildren(el('div', 'pg-preview-empty', 'Press Run to load the page.'));
    const usesPrompt = this.files.some((file) => file.name.endsWith('.js') && file.editor.getValue().includes('prompt('));
    if (!usesPrompt) this.run();
  }

  addFile(name, code) {
    const editor = createEditor({
      value: code,
      lang: langFor(name),
      label: `${name} editor`,
      onRun: () => this.run(),
      onChange: () => this.save(),
    });
    const tab = button(name, 'pg-tab', () => this.show(name));
    tab.setAttribute('role', 'tab');
    const entry = { name, editor, tab };
    this.files.push(entry);
    this.tabs.append(tab);
    this.panes.append(editor.element);
    return entry;
  }

  show(name) {
    this.active = name;
    for (const file of this.files) {
      file.editor.element.hidden = file.name !== name;
      file.tab.setAttribute('aria-selected', String(file.name === name));
    }
  }

  run() {
    this.console.clear();
    const files = {};
    for (const file of this.files) files[file.name] = file.editor.getValue();
    if (!files['index.html']) {
      this.console.note('This checkpoint needs an index.html file to run.');
      return;
    }
    this.runner.start({ mode: 'run', files, assetBase: this.base });
  }

  reset() {
    if (!window.confirm(`Replace your edits to ${this.current} with the original checkpoint files?`)) return;
    if (this.store) this.store.removeItem(`misa-js:ide:${this.current}`);
    this.load(this.current);
  }

  newFile() {
    const name = (window.prompt('New file name, for example board.js') || '').trim();
    if (!name) return;
    if (!NAME_PATTERN.test(name)) {
      this.status.textContent = 'Use letters, numbers, dashes, or underscores, ending in .js, .css, or .html.';
      return;
    }
    if (this.files.some((file) => file.name === name)) {
      this.status.textContent = `${name} already exists.`;
      this.show(name);
      return;
    }
    this.addFile(name, '');
    this.show(name);
    this.save();
    this.status.textContent = `Created ${name}. Import it with "./${name}" from a module.`;
  }

  download() {
    const file = this.files.find((entry) => entry.name === this.active);
    if (!file) return;
    const type = file.name.endsWith('.html') ? 'text/html' : file.name.endsWith('.css') ? 'text/css' : 'text/javascript';
    const url = URL.createObjectURL(new Blob([file.editor.getValue()], { type }));
    const link = el('a');
    link.href = url;
    link.download = file.name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

if (!customElements.get('js-ide')) customElements.define('js-ide', IdeElement);
