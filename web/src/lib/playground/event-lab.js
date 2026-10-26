import { el, button } from './ui.js';

// <js-event-lab kind="mouse|keyboard">: a live inspector that lists events as
// they fire, so learners can see the order and the event object's properties.

function describeKeyValue(key) {
  return key === ' ' ? '" " (Space)' : JSON.stringify(key);
}

class EventLabElement extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    const kind = this.dataset.kind === 'keyboard' ? 'keyboard' : 'mouse';
    const root = el('div', 'lab');
    const fallback = this.querySelector(':scope > .lab-fallback');
    if (kind === 'mouse') this.buildMouse(root);
    else this.buildKeyboard(root);
    if (fallback) fallback.replaceWith(root);
    else this.append(root);
  }

  buildLog() {
    const log = el('ol', 'lab-log');
    log.setAttribute('aria-live', 'polite');
    log.setAttribute('aria-label', 'Events, newest first');
    const empty = el('li', 'lab-log-empty', 'Nothing yet.');
    log.append(empty);
    let last = null;
    const add = (type, detail) => {
      if (empty.isConnected) empty.remove();
      if (last && last.dataset.type === type && type.endsWith('move')) {
        const count = Number(last.dataset.count) + 1;
        last.dataset.count = String(count);
        last.querySelector('.lab-count').textContent = `×${count}`;
        last.querySelector('.lab-detail').textContent = detail;
        return;
      }
      const item = el('li', 'lab-item');
      item.dataset.type = type;
      item.dataset.count = '1';
      item.append(el('code', 'lab-type', type), el('span', 'lab-count', ''), el('span', 'lab-detail', detail));
      log.prepend(item);
      last = item;
      while (log.children.length > 14) log.lastElementChild.remove();
    };
    const clear = () => {
      log.replaceChildren(empty);
      last = null;
    };
    return { log, add, clear };
  }

  buildMouse(root) {
    const pad = el('div', 'lab-pad');
    pad.tabIndex = -1;
    const inner = el('div', 'lab-pad-inner', 'Move, click, double-click, or right-click here');
    pad.append(inner);

    const readout = el('dl', 'lab-readout');
    const fields = {};
    for (const name of ['type', 'clientX / clientY', 'offsetX / offsetY', 'button', 'target']) {
      readout.append(el('dt', '', name));
      fields[name] = el('dd', '', '–');
      readout.append(fields[name]);
    }

    const options = el('div', 'lab-options');
    const toggle = (label, checked) => {
      const wrapper = el('label', 'lab-toggle');
      const input = el('input');
      input.type = 'checkbox';
      input.checked = checked;
      wrapper.append(input, document.createTextNode(` ${label}`));
      options.append(wrapper);
      return input;
    };
    const showMoves = toggle('Show mousemove', true);
    const showOver = toggle('Show mouseover / mouseout', false);
    const blockMenu = toggle('preventDefault() on contextmenu', true);

    const { log, add, clear } = this.buildLog();
    const types = ['mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'mouseenter', 'mouseleave', 'mousemove', 'mouseover', 'mouseout'];
    for (const type of types) {
      pad.addEventListener(type, (event) => {
        if (type === 'contextmenu' && blockMenu.checked) event.preventDefault();
        if (type === 'mousemove' && !showMoves.checked) return;
        if ((type === 'mouseover' || type === 'mouseout') && !showOver.checked) return;
        const target = event.target === inner ? 'the inner text box' : 'the pad';
        fields.type.textContent = type;
        fields['clientX / clientY'].textContent = `${event.clientX} / ${event.clientY}`;
        fields['offsetX / offsetY'].textContent = `${event.offsetX} / ${event.offsetY}`;
        fields.button.textContent = `${event.button}${['  (main)', '  (middle)', '  (secondary)'][event.button] || ''}`;
        fields.target.textContent = target;
        const extra = type.startsWith('mouse') && (type === 'mousedown' || type === 'mouseup') ? `button ${event.button}` : `x ${event.offsetX}, y ${event.offsetY}`;
        add(type, extra);
      });
    }

    const head = el('div', 'lab-head');
    head.append(el('strong', '', 'Mouse event lab'), button('Clear log', 'pg-link-button', clear));
    const grid = el('div', 'lab-grid');
    const left = el('div', 'lab-col');
    left.append(pad, options);
    const right = el('div', 'lab-col');
    right.append(readout, el('p', 'lab-log-title', 'Events, newest first'), log);
    grid.append(left, right);
    root.append(head, grid);
  }

  buildKeyboard(root) {
    const pad = el('div', 'lab-pad lab-keys');
    pad.tabIndex = 0;
    pad.setAttribute('role', 'textbox');
    pad.setAttribute('aria-label', 'Keyboard test area. Press keys while this is focused.');
    const prompt = el('div', 'lab-pad-inner', 'Click here, then press keys. Try Shift + 1, arrows, and holding a key down.');
    const big = el('div', 'lab-big', '');
    pad.append(prompt, big);

    const readout = el('dl', 'lab-readout');
    const fields = {};
    for (const name of ['event.key', 'event.code', 'event.repeat', 'modifiers']) {
      readout.append(el('dt', '', name));
      fields[name] = el('dd', '', '–');
      readout.append(fields[name]);
    }
    const options = el('div', 'lab-options');
    const wrapper = el('label', 'lab-toggle');
    const showRepeats = el('input');
    showRepeats.type = 'checkbox';
    showRepeats.checked = true;
    wrapper.append(showRepeats, document.createTextNode(' Show repeated keydown'));
    options.append(wrapper);

    const { log, add, clear } = this.buildLog();
    const handle = (event) => {
      // Keep the page still while testing, but let Tab move focus out.
      if (event.key === ' ' || event.key.startsWith('Arrow') || event.key === 'PageDown' || event.key === 'PageUp') event.preventDefault();
      if (event.repeat && !showRepeats.checked) return;
      const modifiers = ['shiftKey', 'ctrlKey', 'altKey', 'metaKey'].filter((name) => event[name]);
      fields['event.key'].textContent = describeKeyValue(event.key);
      fields['event.code'].textContent = JSON.stringify(event.code);
      fields['event.repeat'].textContent = String(event.repeat);
      fields.modifiers.textContent = modifiers.length ? modifiers.join(' + ') : 'none';
      if (event.type === 'keydown') big.textContent = event.key === ' ' ? 'Space' : event.key;
      add(event.type, `key ${describeKeyValue(event.key)} · code "${event.code}"${event.repeat ? ' · repeat' : ''}`);
    };
    pad.addEventListener('keydown', handle);
    pad.addEventListener('keyup', handle);
    pad.addEventListener('focus', () => pad.classList.add('is-focused'));
    pad.addEventListener('blur', () => pad.classList.remove('is-focused'));

    const head = el('div', 'lab-head');
    head.append(el('strong', '', 'Keyboard event lab'), button('Clear log', 'pg-link-button', clear));
    const grid = el('div', 'lab-grid');
    const left = el('div', 'lab-col');
    left.append(pad, options);
    const right = el('div', 'lab-col');
    right.append(readout, el('p', 'lab-log-title', 'Events, newest first'), log);
    grid.append(left, right);
    root.append(head, grid);
  }
}

if (!customElements.get('js-event-lab')) customElements.define('js-event-lab', EventLabElement);
