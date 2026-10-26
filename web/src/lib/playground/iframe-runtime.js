// This file runs INSIDE the sandboxed preview frame, before the learner's code.
// runner.js reads it as text, so it must stay plain browser JavaScript with no imports.
// It captures console output and errors, guards loops, and (in check mode)
// replaces prompt/alert, speeds up timers, and records event listeners.
function __pgRuntime(CONFIG) {
  'use strict';
  var parentWindow = window.parent;
  var realSetTimeout = window.setTimeout.bind(window);
  var realSetInterval = window.setInterval.bind(window);
  var state = {
    logs: [],
    errors: [],
    prompts: [],
    alerts: [],
    listeners: [],
    realSetTimeout: realSetTimeout,
    timeScale: CONFIG.mode === 'check' ? CONFIG.timeScale || 20 : 1,
  };
  Object.defineProperty(window, '__pgState', { value: state });

  function send(type, data) {
    var message = { __pg: CONFIG.token, type: type };
    for (var key in data) message[key] = data[key];
    try {
      parentWindow.postMessage(message, '*');
    } catch (error) {
      /* the parent page is gone */
    }
  }

  // ---------- Formatting values the way a browser console would ----------
  function constructorName(value) {
    try {
      var proto = Object.getPrototypeOf(value);
      if (proto === null) return 'Object';
      return (proto.constructor && proto.constructor.name) || 'Object';
    } catch (error) {
      return 'Object';
    }
  }

  function quote(text) {
    return '"' + String(text).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
  }

  function propertyKey(key) {
    return /^[A-Za-z_$][\w$]*$/.test(key) ? key : quote(key);
  }

  function elementTag(element) {
    var tag = '<' + element.tagName.toLowerCase();
    if (element.id) tag += ' id="' + element.id + '"';
    if (element.className && typeof element.className === 'string') tag += ' class="' + element.className + '"';
    for (var name in element.dataset) tag += ' data-' + name.replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); }) + '="' + element.dataset[name] + '"';
    tag += '>';
    if (element.children.length || (element.textContent && element.textContent.trim())) tag += '…</' + element.tagName.toLowerCase() + '>';
    return tag;
  }

  function eventSummary(event) {
    var fields = ['type'];
    if (typeof MouseEvent !== 'undefined' && event instanceof MouseEvent) fields.push('clientX', 'clientY', 'button');
    if (typeof KeyboardEvent !== 'undefined' && event instanceof KeyboardEvent) fields.push('key', 'code', 'repeat');
    var parts = fields.map(function (field) {
      var value = event[field];
      return field + ': ' + (typeof value === 'string' ? quote(value) : String(value));
    });
    if (event.target && event.target.tagName) parts.push('target: ' + elementTag(event.target).replace(/….*$/, ''));
    return constructorName(event) + ' { ' + parts.join(', ') + ', … }';
  }

  function format(value, depth, seen, nested) {
    if (typeof value === 'string') return nested ? quote(value) : value;
    if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
    if (typeof value === 'bigint') return value + 'n';
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'symbol') return value.toString();
    if (typeof value === 'function') {
      var source = '';
      try { source = Function.prototype.toString.call(value); } catch (error) { /* ignore */ }
      if (/^class\b/.test(source)) return 'class ' + (value.name || '(anonymous)');
      return 'ƒ ' + (value.name || '(anonymous)') + '()';
    }
    if (value instanceof Error) return value.name + ': ' + value.message;
    if (typeof Element !== 'undefined' && value instanceof Element) return elementTag(value);
    if (typeof Event !== 'undefined' && value instanceof Event) return eventSummary(value);
    if (value === window) return 'Window';
    if (value === document) return '#document';
    if (seen.indexOf(value) !== -1) return '[Circular]';
    var name = constructorName(value);
    if (depth > 2) return Array.isArray(value) ? 'Array(' + value.length + ')' : (name === 'Object' ? '{…}' : name + ' {…}');
    seen.push(value);
    var text;
    try {
      if (Array.isArray(value) || (typeof NodeList !== 'undefined' && value instanceof NodeList) || (typeof HTMLCollection !== 'undefined' && value instanceof HTMLCollection)) {
        var items = [];
        for (var index = 0; index < Math.min(value.length, 100); index++) items.push(format(value[index], depth + 1, seen, true));
        if (value.length > 100) items.push('… ' + (value.length - 100) + ' more');
        text = (Array.isArray(value) ? '' : name + '(' + value.length + ') ') + '[' + items.join(', ') + ']';
      } else if (value instanceof Map) {
        var entries = [];
        value.forEach(function (entryValue, entryKey) { entries.push(format(entryKey, depth + 1, seen, true) + ' => ' + format(entryValue, depth + 1, seen, true)); });
        text = 'Map(' + value.size + ') {' + (entries.length ? ' ' + entries.join(', ') + ' ' : '') + '}';
      } else if (value instanceof Set) {
        var members = [];
        value.forEach(function (member) { members.push(format(member, depth + 1, seen, true)); });
        text = 'Set(' + value.size + ') {' + (members.length ? ' ' + members.join(', ') + ' ' : '') + '}';
      } else if (value instanceof Promise) {
        text = 'Promise {…}';
      } else {
        var keys = Object.keys(value);
        var props = keys.slice(0, 40).map(function (key) {
          var propertyValue;
          try { propertyValue = value[key]; } catch (error) { propertyValue = '(error)'; }
          return propertyKey(key) + ': ' + format(propertyValue, depth + 1, seen, true);
        });
        if (keys.length > 40) props.push('…');
        var prefix = name === 'Object' ? '' : name + ' ';
        text = prefix + '{' + (props.length ? ' ' + props.join(', ') + ' ' : '') + '}';
      }
    } finally {
      seen.pop();
    }
    return text;
  }

  function formatArgs(args) {
    var parts = [];
    var start = 0;
    if (typeof args[0] === 'string' && /%[sdifoOc]/.test(args[0]) && args.length > 1) {
      var argIndex = 1;
      var first = args[0].replace(/%([sdifoOc])/g, function (match, kind) {
        if (argIndex >= args.length) return match;
        var arg = args[argIndex++];
        if (kind === 'c') return '';
        if (kind === 'd' || kind === 'i') return String(parseInt(arg, 10));
        if (kind === 'f') return String(parseFloat(arg));
        if (kind === 's') return typeof arg === 'string' ? arg : format(arg, 0, [], false);
        return format(arg, 0, [], true);
      });
      parts.push(first);
      start = argIndex;
    }
    for (var index = start; index < args.length; index++) parts.push(format(args[index], 0, [], false));
    return parts.join(' ');
  }

  // ---------- Console ----------
  // Output is capped so a loop that logs forever can't flood the page.
  var MAX_SENT = 300;
  var MAX_KEPT = 5000;
  var sent = 0;
  ['log', 'info', 'warn', 'error', 'debug', 'table', 'dir'].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      var args = Array.prototype.slice.call(arguments);
      var text = formatArgs(args);
      if (state.logs.length < MAX_KEPT) state.logs.push(text);
      if (sent < MAX_SENT) {
        send('console', { level: level === 'table' || level === 'dir' ? 'log' : level, text: text });
      } else if (sent === MAX_SENT) {
        send('console', { level: 'warn', text: 'Output stopped after ' + MAX_SENT + ' lines. Is something logging inside a loop that never ends?' });
      }
      sent++;
      if (original && sent <= MAX_SENT) {
        try { original.apply(console, args); } catch (error) { /* ignore */ }
      }
    };
  });
  console.clear = function () {
    send('clear', {});
  };

  // ---------- Errors ----------
  window.addEventListener('error', function (event) {
    var message = event.message || (event.error ? String(event.error) : 'Unknown error');
    if (event.error && event.error.name && message.indexOf(event.error.name) === -1) message = event.error.name + ': ' + message;
    state.errors.push(message);
    send('error', { message: message, filename: event.filename || '', lineno: event.lineno || 0 });
  });
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    var message = reason && reason.message ? (reason.name || 'Error') + ': ' + reason.message : String(reason);
    state.errors.push(message);
    send('error', { message: 'Uncaught (in promise) ' + message, filename: '', lineno: 0 });
  });

  // ---------- Check mode: scripted answers, fast timers, listener tracking ----------
  if (CONFIG.mode === 'check') {
    var answers = (CONFIG.prompts || []).slice();
    window.prompt = function (message) {
      state.prompts.push(message === undefined ? '' : String(message));
      return answers.length ? answers.shift() : null;
    };
    window.alert = function (message) {
      state.alerts.push(String(message));
    };
    window.confirm = function (message) {
      state.alerts.push(String(message));
      return true;
    };
    var scale = state.timeScale;
    window.setTimeout = function (callback, delay) {
      var rest = Array.prototype.slice.call(arguments, 2);
      return realSetTimeout.apply(window, [callback, Math.max(0, (Number(delay) || 0) / scale)].concat(rest));
    };
    window.setInterval = function (callback, delay) {
      var rest = Array.prototype.slice.call(arguments, 2);
      return realSetInterval.apply(window, [callback, Math.max(1, (Number(delay) || 0) / scale)].concat(rest));
    };
    var realAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      state.listeners.push({ target: this, type: type });
      return realAddEventListener.call(this, type, listener, options);
    };
  }

  // ---------- Storage ----------
  // The sandbox has no origin, so the real localStorage throws. Give lessons an
  // in-memory version instead. It starts empty every time the code runs.
  function memoryStorage() {
    var data = {};
    return {
      getItem: function (key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
      setItem: function (key, value) { data[String(key)] = String(value); },
      removeItem: function (key) { delete data[key]; },
      clear: function () { data = {}; },
      key: function (index) { return Object.keys(data)[index] || null; },
      get length() { return Object.keys(data).length; },
    };
  }
  ['localStorage', 'sessionStorage'].forEach(function (name) {
    try {
      void window[name].length;
    } catch (error) {
      try { Object.defineProperty(window, name, { value: memoryStorage(), configurable: true }); } catch (ignored) { /* leave it */ }
    }
  });

  // ---------- Loop guard (see guard.js) ----------
  var loopCount = 0;
  var loopStart = 0;
  var resetScheduled = false;
  Object.defineProperty(window, '__pgLoop', {
    value: function () {
      if (!resetScheduled) {
        resetScheduled = true;
        loopStart = Date.now();
        realSetTimeout(function () {
          loopCount = 0;
          resetScheduled = false;
        }, 0);
      }
      loopCount++;
      // Checking the clock is slow, so only look every 1,024 passes.
      if ((loopCount & 1023) === 0 && Date.now() - loopStart > 1000) {
        loopCount = 0;
        throw new RangeError('This loop ran for over a second without stopping. Check that its condition can become false.');
      }
    },
  });

  window.addEventListener('load', function () {
    realSetTimeout(function () {
      send('loaded', {});
    }, 0);
  });

  // ---------- Helpers handed to exercise checks as `t` ----------
  var MISSING = Object.freeze({ missing: true });
  var keyCodes = { ' ': 'Space', Enter: 'Enter', Escape: 'Escape', Tab: 'Tab', Backspace: 'Backspace', '/': 'Slash', '?': 'Slash', '.': 'Period', ',': 'Comma' };
  function codeFor(key) {
    if (keyCodes[key]) return keyCodes[key];
    if (/^[a-z]$/i.test(key)) return 'Key' + key.toUpperCase();
    if (/^[0-9]$/.test(key)) return 'Digit' + key;
    return key;
  }
  function mouse(type, element, init) {
    var options = { bubbles: true, cancelable: true, view: window, button: 0 };
    for (var key in init) options[key] = init[key];
    if (options.buttons === undefined) options.buttons = type === 'mousedown' || type === 'mousemove' ? (options.button === 2 ? 2 : 1) : 0;
    var event = new MouseEvent(type, options);
    (element || document.body).dispatchEvent(event);
    return event;
  }
  var helpers = {
    MISSING: MISSING,
    logs: state.logs,
    errors: state.errors,
    prompts: state.prompts,
    alerts: state.alerts,
    listeners: state.listeners,
    value: function (name) {
      try {
        return (0, eval)(name);
      } catch (error) {
        return MISSING;
      }
    },
    has: function (name) {
      return helpers.value(name) !== MISSING;
    },
    logged: function (text) {
      return state.logs.some(function (line) { return line.indexOf(text) !== -1; });
    },
    $: function (selector) {
      return document.querySelector(selector);
    },
    $$: function (selector) {
      return Array.prototype.slice.call(document.querySelectorAll(selector));
    },
    text: function (selector) {
      var element = document.querySelector(selector);
      return element ? element.textContent : null;
    },
    mouse: mouse,
    click: function (element, init) {
      mouse('mousedown', element, init);
      mouse('mouseup', element, init);
      return mouse('click', element, init);
    },
    key: function (type, key, init) {
      var options = { key: key, code: codeFor(key), bubbles: true, cancelable: true };
      var target = document.activeElement || document.body;
      for (var name in init) {
        if (name === 'target') target = init[name];
        else options[name] = init[name];
      }
      var event = new KeyboardEvent(type, options);
      target.dispatchEvent(event);
      return event;
    },
    press: function (key, init) {
      var down = helpers.key('keydown', key, init);
      helpers.key('keyup', key, init);
      return down;
    },
    wait: function (ms) {
      return new Promise(function (resolve) {
        realSetTimeout(resolve, (ms || 0) / state.timeScale);
      });
    },
    importFile: function (name) {
      return import('pg:/' + name);
    },
  };
  Object.defineProperty(window, '__pgHelpers', { value: helpers });

  // Runs the exercise checks after the page (and any modules) have loaded.
  Object.defineProperty(window, '__pgRunChecks', {
    value: function (checks) {
      window.addEventListener('load', function () {
        realSetTimeout(function () {
          var results = [];
          var index = 0;
          function next() {
            if (index >= checks.length) {
              send('results', { results: results });
              return;
            }
            var check = checks[index++];
            var outcome;
            try {
              outcome = check.fn(helpers);
            } catch (error) {
              results.push({ label: check.label, pass: false, message: error && error.message ? error.message : String(error) });
              next();
              return;
            }
            Promise.resolve(outcome).then(function (value) {
              if (value === true) results.push({ label: check.label, pass: true });
              else results.push({ label: check.label, pass: false, message: typeof value === 'string' ? value : '' });
              next();
            }, function (error) {
              results.push({ label: check.label, pass: false, message: error && error.message ? error.message : String(error) });
              next();
            });
          }
          next();
        }, 30);
      });
    },
  });
}
