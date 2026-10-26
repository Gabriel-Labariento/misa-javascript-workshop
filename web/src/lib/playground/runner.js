import runtimeSource from './iframe-runtime.js?raw';
import { addLoopGuards } from './guard.js';

// Builds a complete HTML document from a set of files and runs it in a sandboxed
// iframe. The sandbox keeps learner code away from this page: it gets its own
// origin, can't navigate the tab, and talks to us only through postMessage.

const MODULE_PREFIX = 'pg:/';
const SANDBOX = 'allow-scripts allow-modals';

function inlineScript(code) {
  // Stop the code from closing its own <script> tag early.
  return code.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
}

function rewriteSpecifiers(code) {
  return code.replace(/(\bfrom\s*|\bimport\s*\(?\s*)(["'])\.\/([^"'\n]+)\2/g, (match, before, quoteMark, path) => `${before}${quoteMark}${MODULE_PREFIX}${path}${quoteMark}`);
}

function moduleUrl(code) {
  return `data:text/javascript;charset=utf-8,${encodeURIComponent(rewriteSpecifiers(addLoopGuards(code)))}`;
}

// Inserts text before </body> with slicing, not String.replace: a replacement
// string would turn "$$" into "$" and corrupt code such as t.$$(".hole").
function insertBeforeBodyEnd(html, text) {
  const at = html.search(/<\/body>/i);
  return at === -1 ? html + text : html.slice(0, at) + text + html.slice(at);
}

function lineOf(text, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor++) if (text.charCodeAt(cursor) === 10) line++;
  return line;
}

function attribute(tag, name) {
  const match = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

/**
 * @param {object} options
 * @param {Record<string,string>} options.files  File name → contents. Must include index.html.
 * @param {'run'|'check'} options.mode
 * @param {string} [options.setup]   Code that runs before the learner's scripts.
 * @param {Array<string|null>} [options.prompts]   Answers for prompt() in check mode.
 * @param {Array<{label:string, source:string}>} [options.checks]
 * @param {string} options.token
 * @param {string} [options.assetBase]   Where relative URLs such as assets/misabot.png resolve.
 * @param {string} [options.baseStyle]   CSS added before the learner's own styles.
 */
export function buildDocument({ files, mode, setup = '', prompts = [], checks = [], token, assetBase = '', baseStyle = '' }) {
  let html = files['index.html'] ?? '<!doctype html><html><head></head><body></body></html>';
  const classicFiles = [];
  const moduleFiles = {};
  const placeholders = [];

  // Replace links to stylesheets we have with the stylesheet itself.
  html = html.replace(/<link\b[^>]*>/gi, (tag) => {
    const href = attribute(tag, 'href');
    const rel = (attribute(tag, 'rel') || '').toLowerCase();
    if (rel !== 'stylesheet' || !href) return tag;
    const name = href.replace(/^\.\//, '');
    if (!(name in files)) return tag;
    return `<style data-pg-file="${name}">\n${files[name]}\n</style>`;
  });

  // Replace <script src> for files we have. Classic scripts are inlined;
  // module scripts are loaded through an import map so import/export works.
  let firstScript = -1;
  html = html.replace(/<script\b([^>]*)>\s*<\/script>/gi, (tag, attributes, offset) => {
    const src = attribute(attributes, 'src');
    if (!src) return tag;
    const name = src.replace(/^\.\//, '');
    if (!(name in files)) return tag;
    if (firstScript === -1) firstScript = offset;
    const isModule = (attribute(attributes, 'type') || '').toLowerCase() === 'module';
    if (isModule) return `<script type="module">import "${MODULE_PREFIX}${name}";</script>`;
    const marker = `__PG_CLASSIC_${placeholders.length}__`;
    placeholders.push({ marker, name });
    return `<script data-pg-file="${name}">${marker}</script>`;
  });

  // Every .js file is available as a module, so imports between files resolve.
  const imports = {};
  for (const [name, code] of Object.entries(files)) {
    if (!name.endsWith('.js')) continue;
    const url = moduleUrl(code);
    imports[`${MODULE_PREFIX}${name}`] = url;
    moduleFiles[url] = name;
  }

  const config = { token, mode, prompts, timeScale: 20 };
  const head = [
    assetBase ? `<base href="${assetBase}">` : '',
    `<script>${inlineScript(runtimeSource)}\n__pgRuntime(${inlineScript(JSON.stringify(config))});</script>`,
    `<script type="importmap">${JSON.stringify({ imports })}</script>`,
    baseStyle ? `<style data-pg-base>${baseStyle}</style>` : '',
  ].join('');

  if (/<head\b[^>]*>/i.test(html)) html = html.replace(/<head\b[^>]*>/i, (tag) => `${tag}${head}`);
  else if (/<html\b[^>]*>/i.test(html)) html = html.replace(/<html\b[^>]*>/i, (tag) => `${tag}<head>${head}</head>`);
  else html = `<!doctype html><html><head>${head}</head><body>${html}</body></html>`;

  // Setup code runs right before the learner's first script.
  if (setup) {
    const setupTag = `<script data-pg-setup>${inlineScript(setup)}</script>`;
    const scriptAt = html.search(/<script data-pg-file=|<script type="module">import "pg:\//);
    html = scriptAt === -1 ? insertBeforeBodyEnd(html, setupTag) : html.slice(0, scriptAt) + setupTag + html.slice(scriptAt);
  }

  if (mode === 'check' && checks.length) {
    const list = checks.map((check) => `{label:${JSON.stringify(check.label)},fn:(${check.source})}`).join(',\n');
    const checkTag = `<script data-pg-checks>window.__pgRunChecks([\n${inlineScript(list)}\n]);</script>`;
    html = insertBeforeBodyEnd(html, checkTag);
  }

  // Fill in classic scripts last, top to bottom, so we know which document line
  // each one starts on. That lets errors report the line number in the editor.
  for (const { marker, name } of placeholders) {
    const at = html.indexOf(marker);
    const code = inlineScript(addLoopGuards(files[name]));
    classicFiles.push({ name, offset: lineOf(html, at) - 1, lines: files[name].split('\n').length });
    html = html.slice(0, at) + code + html.slice(at + marker.length);
  }

  return { html, lineMap: { classicFiles, moduleFiles } };
}

const HINTS = [
  [/Cannot read properties of null/, 'querySelector found nothing. Check the selector (# for an id, . for a class) and that the element exists.'],
  [/Cannot set properties of null/, 'querySelector found nothing. Check the selector (# for an id, . for a class) and that the element exists.'],
  [/is not defined/, 'Check the spelling and capital letters, and that the name was created before this line.'],
  [/Assignment to constant variable/, 'This value was made with const. Use let when a variable needs a new value later.'],
  [/has already been declared/, 'This name was created twice. Exercises sometimes give you variables already; use them instead of making new ones.'],
  [/is not a function/, 'Check the name, and add parentheses only to things that are functions.'],
  [/does not provide an export named/, 'Check the export in that file and the name inside the import braces.'],
  [/Failed to resolve module specifier/, 'File paths in imports need to start with ./, like "./board.js".'],
  [/Failed to fetch|error loading dynamically imported module|Importing a module script failed|Failed to load module/, 'That file does not exist here. Check the file name after ./ in your import.'],
  [/Unexpected token|Unexpected identifier|missing \) after|Unexpected end of input|Invalid or unexpected token/, 'Look for a missing or extra bracket, quote, or comma on this line or the one before it.'],
];

export function hintFor(message) {
  for (const [pattern, hint] of HINTS) if (pattern.test(message)) return hint;
  return '';
}

export function locateError(error, lineMap) {
  const message = (error.message || '').replace(/^Uncaught\s+/, '').split(MODULE_PREFIX).join('./');
  let file = null;
  let line = 0;
  if (error.filename && lineMap.moduleFiles[error.filename]) {
    file = lineMap.moduleFiles[error.filename];
    line = error.lineno;
  } else if (error.lineno) {
    for (const entry of lineMap.classicFiles) {
      if (error.lineno > entry.offset && error.lineno <= entry.offset + entry.lines) {
        file = entry.name;
        line = error.lineno - entry.offset;
      }
    }
  }
  return { message, file, line, hint: hintFor(message) };
}

// ---------- Running documents ----------
const active = new Map();

if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data.__pg !== 'string') return;
    const runner = active.get(data.__pg);
    if (!runner || !runner.iframe || event.source !== runner.iframe.contentWindow) return;
    runner.receive(data);
  });
}

function randomToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export class Runner {
  /**
   * @param {HTMLElement} host  Where the iframe goes.
   * @param {object} handlers  { onConsole(level, text), onError(info), onClear(), onLoaded() }
   */
  constructor(host, handlers = {}, title = 'Code preview') {
    this.host = host;
    this.handlers = handlers;
    this.title = title;
    this.token = null;
    this.iframe = null;
    this.lineMap = { classicFiles: [], moduleFiles: {} };
    this.pending = null;
  }

  start(options) {
    this.stop();
    this.token = randomToken();
    active.set(this.token, this);
    const { html, lineMap } = buildDocument({ ...options, token: this.token });
    this.lineMap = lineMap;
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', SANDBOX);
    iframe.setAttribute('title', this.title);
    iframe.className = 'pg-frame';
    iframe.srcdoc = html;
    this.iframe = iframe;
    this.host.replaceChildren(iframe);
    return iframe;
  }

  // Runs once in check mode and resolves with the check results.
  check(options, timeout = 8000) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pending = null;
        resolve({ results: null, timedOut: true });
      }, timeout);
      this.pending = (results) => {
        clearTimeout(timer);
        this.pending = null;
        resolve({ results, timedOut: false });
      };
      this.start({ ...options, mode: 'check' });
    });
  }

  stop() {
    if (this.token) active.delete(this.token);
    this.token = null;
    if (this.iframe) this.iframe.remove();
    this.iframe = null;
  }

  receive(data) {
    const { onConsole, onError, onClear, onLoaded } = this.handlers;
    if (data.type === 'console') onConsole?.(data.level, data.text);
    else if (data.type === 'error') onError?.(locateError(data, this.lineMap));
    else if (data.type === 'clear') onClear?.();
    else if (data.type === 'loaded') onLoaded?.();
    else if (data.type === 'results') this.pending?.(data.results);
  }
}
