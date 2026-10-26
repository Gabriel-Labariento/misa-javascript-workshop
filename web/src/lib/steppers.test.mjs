import test from 'node:test';
import assert from 'node:assert/strict';
import { loopState, loopStatus, eventState, classState, describeObject } from './steppers.mjs';

test('loop assigns, logs, then ends with snack out of scope', () => {
  assert.deepEqual(loopState(0), { lines: [], snack: null, output: [], done: false });
  assert.deepEqual(loopState(1), { lines: [1], snack: 'turon', output: [], done: false });
  assert.deepEqual(loopState(2), { lines: [2], snack: 'turon', output: ['turon'], done: false });
  assert.deepEqual(loopState(4).output, ['turon', 'taho']);
  assert.equal(loopState(5).done, true);
  assert.equal(loopState(99).done, true);
  assert.match(loopStatus(5), /only existed inside the loop/);
});

test('event listener waits until the script ends, then runs once per click', () => {
  assert.deepEqual(eventState(2).output, []);
  assert.equal(eventState(2).canClick, false);
  assert.deepEqual(eventState(3).output, ['Listening for clicks…']);
  const waiting = eventState(4, 0);
  assert.equal(waiting.canStep, false);
  assert.equal(waiting.canClick, true);
  assert.deepEqual(eventState(4, 2).output, ['Listening for clicks…', 'Clicked 1 times', 'Clicked 2 times']);
  assert.equal(eventState(4, 2).clicks, 2);
  // Clicks before the script finishes are ignored
  assert.deepEqual(eventState(3, 5).output, ['Listening for clicks…']);
});

test('class stepper builds one object and calls a method on it', () => {
  assert.equal(describeObject(classState(1)), 'Objects: (none yet)');
  assert.equal(describeObject(classState(3)), '(new object) Counter { count: 5 }');
  assert.equal(describeObject(classState(4)), 'a → Counter { count: 5 }');
  assert.equal(describeObject(classState(5)), 'a → Counter { count: 6 }');
  assert.equal(classState(6).done, true);
});
