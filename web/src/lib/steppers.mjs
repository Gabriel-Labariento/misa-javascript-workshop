// Pure state functions behind the Stepper component. Each returns what the
// stepper should show after `step` presses, so they can be tested without a page.

export const LOOP_LINES = [
  'const snacks = ["turon", "taho"];',
  'for (const snack of snacks) {',
  '  console.log(snack);',
  '}',
];

export function loopState(step) {
  const states = [
    { lines: [], snack: null, output: [], done: false },
    { lines: [1], snack: 'turon', output: [], done: false },
    { lines: [2], snack: 'turon', output: ['turon'], done: false },
    { lines: [1], snack: 'taho', output: ['turon'], done: false },
    { lines: [2], snack: 'taho', output: ['turon', 'taho'], done: false },
    { lines: [1], snack: null, output: ['turon', 'taho'], done: true },
  ];
  return states[Math.max(0, Math.min(5, step))];
}

export function loopStatus(step) {
  const state = loopState(step);
  if (step <= 0) return 'Ready. Press Step to start the loop.';
  if (state.done) return 'Done. No items remain, so the loop ends. snack only existed inside the loop.';
  return state.lines[0] === 1
    ? `Step ${step} of 5. Line 2 puts the next item in snack: "${state.snack}".`
    : `Step ${step} of 5. Line 3 logs snack, which holds "${state.snack}".`;
}

export const EVENT_LINES = [
  'let clicks = 0;',
  'button.addEventListener("click", () => {',
  '  clicks += 1;',
  '  console.log(`Clicked ${clicks} times`);',
  '});',
  'console.log("Listening for clicks…");',
];

// step: presses of Step (0–4). clicks: presses of the simulated button after the script ends.
export function eventState(step, clicks = 0) {
  const position = Math.max(0, Math.min(4, step));
  const output = position >= 3 ? ['Listening for clicks…'] : [];
  const waiting = position === 4;
  const count = waiting ? Math.max(0, clicks) : 0;
  for (let index = 1; index <= count; index++) output.push(`Clicked ${index} times`);
  const lines = [[], [0], [1, 4], [5], count > 0 ? [2, 3] : []][position];
  let status;
  if (position === 0) status = 'Ready. Press Step to run the script from the top.';
  else if (position === 1) status = 'Line 1 creates clicks and sets it to 0.';
  else if (position === 2) status = 'Lines 2–5 register a listener. The function inside does not run yet.';
  else if (position === 3) status = 'Line 6 runs. The script has finished, but the page keeps listening.';
  else if (count === 0) status = 'Waiting for a click. Press “Click the button” to fire a click event.';
  else status = `A click happened, so the listener ran: clicks is now ${count}.`;
  return { lines, output, clicks: position >= 1 ? count : null, status, canStep: position < 4, canClick: waiting };
}

export const CLASS_LINES = [
  'class Counter {',
  '  constructor(start) {',
  '    this.count = start;',
  '  }',
  '  add() {',
  '    this.count += 1;',
  '  }',
  '}',
  'const a = new Counter(5);',
  'a.add();',
];

export function classState(step) {
  const states = [
    { lines: [], object: null, stored: false, status: 'Ready. Press Step to run the code.' },
    { lines: [0, 1, 2, 3, 4, 5, 6, 7], object: null, stored: false, status: 'Lines 1–8 describe Counter. Nothing runs yet: a class is a blueprint.' },
    { lines: [8], object: {}, stored: false, status: 'new makes a brand-new empty object, then calls constructor with start = 5.' },
    { lines: [2], object: { count: 5 }, stored: false, status: 'Inside constructor, this is the new object. this.count = start stores 5 on it.' },
    { lines: [8], object: { count: 5 }, stored: true, status: 'The finished object goes into a.' },
    { lines: [9, 5], object: { count: 6 }, stored: true, status: 'a.add() runs add with this = a, so this.count goes from 5 to 6.' },
    { lines: [], object: { count: 6 }, stored: true, status: 'Done. Another new Counter(…) would get its own separate count.', done: true },
  ];
  const state = states[Math.max(0, Math.min(6, step))];
  return { done: false, ...state };
}

export function describeObject(state) {
  if (state.object === null) return 'Objects: (none yet)';
  const props = Object.entries(state.object).map(([key, value]) => `${key}: ${value}`).join(', ');
  const body = props ? `Counter { ${props} }` : 'Counter { }';
  return state.stored ? `a → ${body}` : `(new object) ${body}`;
}
