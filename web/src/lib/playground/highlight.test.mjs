import test from 'node:test';
import assert from 'node:assert/strict';
import { highlightJs, highlightHtml, highlightCss } from './highlight.js';

const strip = (html) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

test('highlighting never changes the text', () => {
  const samples = [
    'const name = `Hi, ${user.name}!`;\nconsole.log(name.trim()); // done',
    'if (a < b && c > d) { x = /re/g.test(s) ? 1 : 2; }',
    'class Game { get accuracy() { return 1; } }',
  ];
  for (const code of samples) assert.equal(strip(highlightJs(code)), code);
  assert.equal(strip(highlightHtml('<button id="like" class=\'big\' disabled>♡ Like</button>\n<!-- note -->')), '<button id="like" class=\'big\' disabled>♡ Like</button>\n<!-- note -->');
  assert.equal(strip(highlightCss('.hole.up .bot { transform: translateY(6%); color: #19aab1; }\n/* c */')), '.hole.up .bot { transform: translateY(6%); color: #19aab1; }\n/* c */');
});

test('classifies the main token kinds', () => {
  const html = highlightJs('const total = Math.floor(3.5); doThing(); user.name; true;');
  assert.match(html, /tk-kw">const/);
  assert.match(html, /tk-glob">Math/);
  assert.match(html, /tk-fn">floor/);
  assert.match(html, /tk-num">3\.5/);
  assert.match(html, /tk-fn">doThing/);
  assert.match(html, /tk-prop">name/);
  assert.match(html, /tk-lit">true/);
});

test('escapes HTML inside code', () => {
  assert.ok(!highlightJs('el.innerHTML = "<b>hi</b>";').includes('<b>'));
});
