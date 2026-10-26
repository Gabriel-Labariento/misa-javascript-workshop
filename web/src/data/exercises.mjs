// Practice exercises used by <Exercise id="..." />.
//
// Each check is [label, fn]. fn runs inside the exercise's sandboxed page after
// the learner's code, receives helpers as `t`, and returns true to pass or a
// string that tells the learner what to fix. Checks may be async.
//
// Helpers on t: logs, errors, prompts, alerts, listeners, MISSING,
// value(name), has(name), logged(text), $(selector), $$(selector), text(selector),
// click(element), mouse(type, element, init), key(type, key, init), press(key, init),
// wait(ms) (timers run 20× faster during checks), importFile(name).
//
// Checks are turned into text with fn.toString(), so they may only use `t`,
// their own local variables, and browser globals.

const exercises = {
  'hello-variables': {
    title: 'Introduce yourself',
    files: [{ name: 'script.js', code: `// 1. Make myName and course with const, and year with let.

// 2. Log one sentence that uses all three, with a template literal.

// 3. Add 1 to year, then log the new year.
` }],
    checks: [
      ['myName holds your name as text', (t) => {
        const value = t.value('myName');
        if (value === t.MISSING) return 'Create a variable called myName, for example: const myName = "Alex";';
        return (typeof value === 'string' && value.trim() !== '') || 'myName should hold text in quotes.';
      }],
      ['course holds text', (t) => {
        const value = t.value('course');
        if (value === t.MISSING) return 'Create a variable called course.';
        return (typeof value === 'string' && value.trim() !== '') || 'course should hold text in quotes.';
      }],
      ['year holds a number', (t) => {
        const value = t.value('year');
        if (value === t.MISSING) return 'Create a variable called year with let.';
        return typeof value === 'number' || `year should be a number like 1, without quotes. Right now it is ${JSON.stringify(value)}.`;
      }],
      ['one log line mentions your name and course', (t) => {
        const name = t.value('myName');
        const course = t.value('course');
        return t.logs.some((line) => line.includes(name) && line.includes(course)) || 'Log a sentence that includes both myName and course, like `Hi, I\'m ${myName}...`.';
      }],
      ['year went up by one, and the new year was logged', (t) => {
        if (t.errors.some((error) => error.includes('constant'))) return 'year changes, so make it with let instead of const.';
        const year = t.value('year');
        if (t.logs.length < 2) return 'Log twice: once for the sentence, once after year changes.';
        const last = t.logs[t.logs.length - 1];
        return last.includes(String(year)) || `The last log should show the new year (${year}).`;
      }],
    ],
    hints: [
      'Template literals use backticks: `Hi, I\'m ${myName}`. The ${...} parts are replaced with values.',
      'To add one, assign a new value: year = year + 1; (or year += 1;). That only works if year was made with let.',
    ],
    solution: [{ name: 'script.js', code: `const myName = "Alex";
const course = "BS MIS";
let year = 1;

console.log(\`Hi, I'm \${myName}, year \${year} of \${course}.\`);

year = year + 1;
console.log(\`Next school year, I'll be in year \${year}.\`);
` }],
  },

  'taho-answer': {
    title: 'Clean up an answer',
    files: [{ name: 'script.js', code: `let answer = prompt("Do you like taho? (yes/no)") || "";

// Clean the answer, then log one of the three messages.
` }],
    scenarios: [
      { label: 'Typing "yes"', prompts: ['yes'], checks: [
        ['logs "Great choice!"', (t) => t.logs.includes('Great choice!') || `Expected "Great choice!" but the console showed: ${JSON.stringify(t.logs)}`],
      ] },
      { label: 'Typing "  NO "', prompts: ['  NO '], checks: [
        ['logs "More for me!"', (t) => t.logs.includes('More for me!') || `Clean the answer with trim() and toLowerCase() first. The console showed: ${JSON.stringify(t.logs)}`],
      ] },
      { label: 'Pressing Cancel', prompts: [null], checks: [
        ['logs "Please answer yes or no."', (t) => t.logs.includes('Please answer yes or no.') || `Cancel gives null, which || "" turns into "". The console showed: ${JSON.stringify(t.logs)}`],
      ] },
      { label: 'Typing "maybe"', prompts: ['maybe'], checks: [
        ['logs "Please answer yes or no."', (t) => t.logs.includes('Please answer yes or no.') || `Use else for every other answer. The console showed: ${JSON.stringify(t.logs)}`],
        ['logs only one message', (t) => t.logs.length === 1 || 'Each answer should log exactly one message. Check that you used else if, not separate if blocks.'],
      ] },
    ],
    hints: [
      'answer = answer.trim().toLowerCase(); turns "  NO " into "no".',
      'Use if (answer === "yes") { ... } else if (answer === "no") { ... } else { ... }.',
    ],
    solution: [{ name: 'script.js', code: `let answer = prompt("Do you like taho? (yes/no)") || "";
answer = answer.trim().toLowerCase();

if (answer === "yes") {
  console.log("Great choice!");
} else if (answer === "no") {
  console.log("More for me!");
} else {
  console.log("Please answer yes or no.");
}
` }],
  },

  'ticket-price': {
    title: 'Price a movie ticket',
    given: 'const age = 19;\nconst hasStudentId = true;',
    files: [{ name: 'script.js', code: `let price;

// Kids under 12 and seniors 60 or older pay 120.
// Everyone else with a student ID pays 180.
// Everyone else pays 250.

console.log(\`Ticket: ₱\${price}\`);
` }],
    scenarios: [
      { label: 'Age 8, no ID', setup: 'const age = 8;\nconst hasStudentId = false;', checks: [['price is 120', (t) => t.value('price') === 120 || `Got ${t.value('price')}. Under 12 pays 120.`]] },
      { label: 'Age 65, no ID', setup: 'const age = 65;\nconst hasStudentId = false;', checks: [['price is 120', (t) => t.value('price') === 120 || `Got ${t.value('price')}. 60 or older pays 120.`]] },
      { label: 'Age 60 with ID', setup: 'const age = 60;\nconst hasStudentId = true;', checks: [['price is 120', (t) => t.value('price') === 120 || `Got ${t.value('price')}. Seniors pay 120 even with an ID, so check the age rule first.`]] },
      { label: 'Age 19 with ID', setup: 'const age = 19;\nconst hasStudentId = true;', checks: [['price is 180', (t) => t.value('price') === 180 || `Got ${t.value('price')}. A 19-year-old with an ID pays 180.`]] },
      { label: 'Age 12 with ID', setup: 'const age = 12;\nconst hasStudentId = true;', checks: [['price is 180', (t) => t.value('price') === 180 || `Got ${t.value('price')}. 12 is not under 12.`]] },
      { label: 'Age 30, no ID', setup: 'const age = 30;\nconst hasStudentId = false;', checks: [
        ['price is 250', (t) => t.value('price') === 250 || `Got ${t.value('price')}.`],
        ['logs the ticket line', (t) => t.logs.includes('Ticket: ₱250') || 'Keep the console.log line at the end.'],
      ] },
    ],
    hints: [
      'Combine the first rule with ||: if (age < 12 || age >= 60) { price = 120; }',
      'Order matters. Put the age rule before the student ID rule.',
    ],
    solution: [{ name: 'script.js', code: `let price;

if (age < 12 || age >= 60) {
  price = 120;
} else if (hasStudentId) {
  price = 180;
} else {
  price = 250;
}

console.log(\`Ticket: ₱\${price}\`);
` }],
  },

  'order-total': {
    title: 'Total a merienda order',
    given: `const order = [
  { name: "Taho", price: 25, quantity: 2 },
  { name: "Turon", price: 20, quantity: 3 },
  { name: "Banana cue", price: 30, quantity: 1 },
];`,
    files: [{ name: 'script.js', code: `let total = 0;

for (const item of order) {
  // Log a line like: 2 × Taho = ₱50
  // Then add this item's cost to total.
}

console.log(\`Total: ₱\${total}\`);
` }],
    scenarios: [
      { label: 'The given order', checks: [
        ['total is 140', (t) => t.value('total') === 140 || `total is ${t.value('total')}. Multiply price by quantity for each item, then add it to total.`],
        ['each item has its own line', (t) => [['Taho', 50], ['Turon', 60], ['Banana cue', 30]].every(([name, cost]) => t.logs.some((line) => line.includes(name) && line.includes(String(cost)))) || 'Log one line per item that includes its name and cost, like 2 × Taho = ₱50.'],
        ['logs the total', (t) => t.logs.includes('Total: ₱140') || 'Keep the final console.log line.'],
      ] },
      { label: 'A different order', setup: `const order = [
  { name: "Kwek-kwek", price: 15, quantity: 4 },
  { name: "Fishball", price: 1, quantity: 10 },
];`, checks: [
        ['total is 70', (t) => t.value('total') === 70 || `total is ${t.value('total')}. Your loop should work for any order, not just the first one.`],
      ] },
    ],
    hints: [
      'Inside the loop, item is one object. Read its parts with item.name, item.price, and item.quantity.',
      'const cost = item.price * item.quantity; then total += cost;',
    ],
    solution: [{ name: 'script.js', code: `let total = 0;

for (const item of order) {
  const cost = item.price * item.quantity;
  console.log(\`\${item.quantity} × \${item.name} = ₱\${cost}\`);
  total += cost;
}

console.log(\`Total: ₱\${total}\`);
` }],
  },

  'cluster-chips': {
    title: 'Make a button for each cluster',
    given: 'const clusters = ["Events", "Marketing", "eServices"];',
    html: '<div id="toolbar"></div>',
    css: '#toolbar { display: flex; flex-wrap: wrap; gap: 8px; }\n.chip { padding: 6px 14px; color: #08565c; font-weight: 600; background: #d9f3f2; border: 1px solid #19aab1; border-radius: 999px; }',
    height: 110,
    files: [{ name: 'script.js', code: `const toolbar = document.querySelector("#toolbar");

// For each cluster, create a <button> with the class "chip",
// put the cluster's name inside it, and add it to the toolbar.
` }],
    scenarios: [
      { label: 'Three clusters', checks: [
        ['three .chip buttons in #toolbar', (t) => {
          const chips = t.$$('#toolbar button.chip');
          return chips.length === 3 || `Found ${chips.length} buttons with class "chip" in #toolbar.`;
        }],
        ['buttons show the cluster names in order', (t) => {
          const names = t.$$('#toolbar button.chip').map((chip) => chip.textContent.trim());
          return JSON.stringify(names) === JSON.stringify(['Events', 'Marketing', 'eServices']) || `The buttons say ${JSON.stringify(names)}.`;
        }],
      ] },
      { label: 'Five clusters', setup: 'const clusters = ["Events", "Marketing", "eServices", "Human Resources", "Communications"];', checks: [
        ['five buttons, one per cluster', (t) => t.$$('#toolbar button.chip').length === 5 || 'Loop over clusters instead of writing each button by hand.'],
      ] },
    ],
    hints: [
      'Inside a for...of loop: const button = document.createElement("button");',
      'Then button.className = "chip"; button.textContent = cluster; toolbar.append(button);',
    ],
    solution: [{ name: 'script.js', code: `const toolbar = document.querySelector("#toolbar");

for (const cluster of clusters) {
  const button = document.createElement("button");
  button.className = "chip";
  button.textContent = cluster;
  toolbar.append(button);
}
` }],
  },

  'random-item': {
    title: 'Pick a random snack',
    files: [{ name: 'script.js', code: `const snacks = ["turon", "taho", "banana cue", "kwek-kwek"];

function randomItem(items) {
  // Return one random item from the items array.
}

console.log(\`Today's snack: \${randomItem(snacks)}\`);
` }],
    checks: [
      ['randomItem is a function', (t) => typeof t.value('randomItem') === 'function' || 'Keep the function named randomItem.'],
      ['it returns an item from the array', (t) => {
        const randomItem = t.value('randomItem');
        for (let round = 0; round < 50; round++) {
          const picked = randomItem([1, 2, 3]);
          if (![1, 2, 3].includes(picked)) return `randomItem([1, 2, 3]) returned ${JSON.stringify(picked)}. Use return with one of the items.`;
        }
        return true;
      }],
      ['every item can be picked', (t) => {
        const randomItem = t.value('randomItem');
        const seen = new Set();
        for (let round = 0; round < 400; round++) seen.add(randomItem(['a', 'b', 'c', 'd']));
        return seen.size === 4 || `In 400 tries, only ${[...seen].join(', ')} came up. Multiply Math.random() by items.length.`;
      }],
      ['works with a one-item array', (t) => t.value('randomItem')(['only']) === 'only' || 'randomItem(["only"]) should return "only".'],
      ['does not change the array', (t) => {
        const items = ['x', 'y', 'z'];
        t.value('randomItem')(items);
        return items.join() === 'x,y,z' || 'Read from the array without removing or reordering items.';
      }],
    ],
    hints: [
      'Math.random() gives a number from 0 up to (but not including) 1. Multiply it by items.length to get 0 up to the length.',
      'Math.floor() drops the decimal part, which gives a valid index: items[Math.floor(Math.random() * items.length)].',
    ],
    solution: [{ name: 'script.js', code: `const snacks = ["turon", "taho", "banana cue", "kwek-kwek"];

function randomItem(items) {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

console.log(\`Today's snack: \${randomItem(snacks)}\`);
` }],
  },

  countdown: {
    title: 'Count down to Go!',
    files: [{ name: 'script.js', code: `let count = 3;

// Every 1000 milliseconds, log count and make it one smaller.
// When count reaches 0, log "Go!" and stop the interval.
` }],
    checks: [
      ['logs 3, 2, 1, Go! in order', async (t) => {
        await t.wait(5500);
        return JSON.stringify(t.logs) === JSON.stringify(['3', '2', '1', 'Go!']) || `The console showed ${JSON.stringify(t.logs)}.`;
      }],
      ['the interval stops after Go!', async (t) => {
        const before = t.logs.length;
        await t.wait(3000);
        return t.logs.length === before || 'More lines appeared after "Go!". Call clearInterval with the id that setInterval returned.';
      }],
    ],
    hints: [
      'const timer = setInterval(() => { ... }, 1000); runs the arrow function every second and stores its id in timer.',
      'Inside, use if (count > 0) { log and subtract } else { log "Go!" and clearInterval(timer); }',
    ],
    solution: [{ name: 'script.js', code: `let count = 3;

const timer = setInterval(() => {
  if (count > 0) {
    console.log(count);
    count -= 1;
  } else {
    console.log("Go!");
    clearInterval(timer);
  }
}, 1000);
` }],
  },

  'like-button': {
    title: 'Build a like button',
    html: '<button id="like">♡ Like</button>\n<p><span id="count">0</span> likes</p>',
    css: '#like { padding: 8px 16px; color: #08565c; font-weight: 700; background: #fff; border: 2px solid #19aab1; border-radius: 999px; cursor: pointer; }\n#like.liked { color: #fff; background: #ef476f; border-color: #ef476f; }',
    height: 120,
    files: [{ name: 'script.js', code: `const likeButton = document.querySelector("#like");
const countDisplay = document.querySelector("#count");
let likes = 0;

// When likeButton is clicked: add 1 to likes, show it in countDisplay,
// and add the class "liked" to the button.
` }],
    checks: [
      ['nothing changes before a click', (t) => t.text('#count') === '0' || 'The count changed on its own. Pass the function to addEventListener without calling it.'],
      ['three clicks show 3', (t) => {
        const button = t.$('#like');
        t.click(button);
        t.click(button);
        t.click(button);
        return t.text('#count') === '3' || `After three clicks, #count shows "${t.text('#count')}".`;
      }],
      ['likes holds the same number', (t) => t.value('likes') === 3 || `likes is ${t.value('likes')} after three clicks.`],
      ['the button gets the "liked" class', (t) => t.$('#like').classList.contains('liked') || 'Add the class with likeButton.classList.add("liked").'],
    ],
    hints: [
      'likeButton.addEventListener("click", () => { ... }); The code inside the braces runs on every click.',
      'Inside: likes += 1; countDisplay.textContent = likes; likeButton.classList.add("liked");',
    ],
    solution: [{ name: 'script.js', code: `const likeButton = document.querySelector("#like");
const countDisplay = document.querySelector("#count");
let likes = 0;

likeButton.addEventListener("click", () => {
  likes += 1;
  countDisplay.textContent = likes;
  likeButton.classList.add("liked");
});
` }],
  },

  greeter: {
    title: 'Greet whoever types their name',
    html: '<input id="name" placeholder="Your name" />\n<button id="greet">Greet me</button>\n<p id="output"></p>',
    css: '#name { padding: 6px 8px; border: 2px solid #b9dcdc; border-radius: 6px; }\n#greet { padding: 6px 14px; color: #fff; font-weight: 700; background: #087a80; border: 0; border-radius: 6px; cursor: pointer; }\n#output { font-size: 18px; font-weight: 700; }',
    height: 120,
    files: [{ name: 'script.js', code: `const nameInput = document.querySelector("#name");
const greetButton = document.querySelector("#greet");
const output = document.querySelector("#output");

// When the button is clicked, show "Hi, NAME!" in output.
// Remove extra spaces. If the box is empty, show "Hi, stranger!".
` }],
    checks: [
      ['shows "Hi, Bea!" for "  Bea "', (t) => {
        t.$('#name').value = '  Bea ';
        t.click(t.$('#greet'));
        return t.text('#output') === 'Hi, Bea!' || `Got "${t.text('#output')}". Read the box with nameInput.value and trim it.`;
      }],
      ['shows "Hi, stranger!" for an empty box', (t) => {
        t.$('#name').value = '';
        t.click(t.$('#greet'));
        return t.text('#output') === 'Hi, stranger!' || `Got "${t.text('#output')}".`;
      }],
      ['spaces only also count as empty', (t) => {
        t.$('#name').value = '    ';
        t.click(t.$('#greet'));
        return t.text('#output') === 'Hi, stranger!' || 'Trim before checking whether the name is empty.';
      }],
    ],
    hints: [
      'Read the box inside the click listener, so you get what is there at the moment of the click.',
      'const name = nameInput.value.trim() || "stranger"; picks "stranger" when the trimmed text is "".',
    ],
    solution: [{ name: 'script.js', code: `const nameInput = document.querySelector("#name");
const greetButton = document.querySelector("#greet");
const output = document.querySelector("#output");

greetButton.addEventListener("click", () => {
  const name = nameInput.value.trim() || "stranger";
  output.textContent = \`Hi, \${name}!\`;
});
` }],
  },

  'follow-dot': {
    title: 'Make a dot follow the mouse',
    html: '<div id="dot"></div>\n<p class="tip">Move your mouse over this area.</p>',
    css: '#dot { position: fixed; left: 50%; top: 50%; width: 22px; height: 22px; background: #19aab1; border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; }\n.tip { color: #4a6668; }',
    height: 170,
    files: [{ name: 'script.js', code: `const dot = document.querySelector("#dot");

// Listen for mousemove on document.
// Move the dot by setting dot.style.left and dot.style.top to the mouse position.
` }],
    checks: [
      ['the dot moves to (40, 70)', (t) => {
        t.mouse('mousemove', document.body, { clientX: 40, clientY: 70 });
        const dot = t.$('#dot');
        return (dot.style.left === '40px' && dot.style.top === '70px') || `The dot is at left "${dot.style.left}", top "${dot.style.top}". Use event.clientX and event.clientY, plus "px".`;
      }],
      ['it keeps following', (t) => {
        t.mouse('mousemove', document.body, { clientX: 150, clientY: 25 });
        const dot = t.$('#dot');
        return (dot.style.left === '150px' && dot.style.top === '25px') || 'The dot should move on every mousemove.';
      }],
    ],
    hints: [
      'document.addEventListener("mousemove", (event) => { ... }); gives you event.clientX and event.clientY.',
      'CSS needs units: dot.style.left = `${event.clientX}px`;',
    ],
    solution: [{ name: 'script.js', code: `const dot = document.querySelector("#dot");

document.addEventListener("mousemove", (event) => {
  dot.style.left = \`\${event.clientX}px\`;
  dot.style.top = \`\${event.clientY}px\`;
});
` }],
  },

  palette: {
    title: 'One listener for a whole palette',
    html: '<div id="palette"><button class="swatch" data-color="#19aab1"><span>Teal</span></button><button class="swatch" data-color="#ffd166"><span>Sunny</span></button><button class="swatch" data-color="#ef476f"><span>Pink</span></button><button class="swatch" data-color="#073b4c"><span>Navy</span></button></div>\n<p id="preview">Pick a color</p>',
    css: '#palette { display: flex; gap: 12px; padding: 10px; background: #eef7f7; border-radius: 10px; }\n.swatch { padding: 8px 12px; font-weight: 700; background: #fff; border: 2px solid #b9dcdc; border-radius: 8px; cursor: pointer; }\n#preview { padding: 10px; font-weight: 700; border-radius: 8px; }',
    height: 150,
    files: [{ name: 'script.js', code: `const palette = document.querySelector("#palette");
const preview = document.querySelector("#preview");

// Add ONE click listener to palette.
// Find the clicked swatch with event.target.closest(".swatch").
// Set preview's background to the swatch's data-color,
// and preview's text to the swatch's text.
` }],
    checks: [
      ['clicking the text inside a swatch works', (t) => {
        const label = t.$$('.swatch span')[1];
        t.click(label);
        const preview = t.$('#preview');
        if (preview.textContent.trim() !== 'Sunny') return `Clicked "Sunny" but the preview says "${preview.textContent.trim()}". event.target is the <span>, so use closest(".swatch").`;
        return preview.style.backgroundColor === 'rgb(255, 209, 102)' || 'Set preview.style.backgroundColor to swatch.dataset.color.';
      }],
      ['clicking another swatch updates it', (t) => {
        t.click(t.$$('.swatch')[3]);
        return t.$('#preview').textContent.trim() === 'Navy' || 'The preview should change on every swatch click.';
      }],
      ['clicking the gap does nothing (and does not crash)', (t) => {
        t.click(t.$('#palette'));
        if (t.errors.length) return `Clicking between swatches threw: ${t.errors[0]}. closest() returns null there, so return early.`;
        return t.$('#preview').textContent.trim() === 'Navy' || 'Clicking the gap changed the preview.';
      }],
      ['uses one listener on #palette', (t) => {
        const clicks = t.listeners.filter((entry) => entry.type === 'click');
        if (clicks.some((entry) => entry.target.classList && entry.target.classList.contains('swatch'))) return 'Put a single listener on #palette instead of one per swatch.';
        return clicks.some((entry) => entry.target === t.$('#palette')) || 'Add the click listener to palette.';
      }],
    ],
    hints: [
      'const swatch = event.target.closest(".swatch"); gives the button even when you click its <span>.',
      'if (swatch === null) { return; } handles clicks between the swatches.',
    ],
    solution: [{ name: 'script.js', code: `const palette = document.querySelector("#palette");
const preview = document.querySelector("#preview");

palette.addEventListener("click", (event) => {
  const swatch = event.target.closest(".swatch");
  if (swatch === null) {
    return;
  }
  preview.style.backgroundColor = swatch.dataset.color;
  preview.textContent = swatch.textContent;
});
` }],
  },

  'arrow-mover': {
    title: 'Move a player with the arrow keys',
    html: '<div id="stage"><div id="player">🙂</div></div>\n<p class="tip">Click this preview first, then press the arrow keys.</p>',
    css: '#stage { position: relative; height: 110px; background: #eef7f7; border-radius: 10px; }\n#player { position: absolute; left: 0; top: 0; font-size: 28px; line-height: 1; transition: left 80ms, top 80ms; }\n.tip { margin: 6px 0 0; color: #4a6668; font-size: 14px; }',
    height: 170,
    files: [{ name: 'script.js', code: `const player = document.querySelector("#player");
let x = 0;
let y = 0;

// Listen for keydown on document.
// ArrowRight adds 20 to x, ArrowLeft subtracts 20,
// ArrowDown adds 20 to y, ArrowUp subtracts 20.
// Move the player with player.style.left and player.style.top.
// Call event.preventDefault() for arrow keys only.
` }],
    checks: [
      ['ArrowRight three times moves to 60px', (t) => {
        t.press('ArrowRight', { target: document.body });
        t.press('ArrowRight', { target: document.body });
        t.press('ArrowRight', { target: document.body });
        return t.$('#player').style.left === '60px' || `left is "${t.$('#player').style.left}". Check event.key === "ArrowRight".`;
      }],
      ['ArrowDown moves down, ArrowLeft moves back', (t) => {
        t.press('ArrowDown', { target: document.body });
        t.press('ArrowLeft', { target: document.body });
        const player = t.$('#player');
        return (player.style.top === '20px' && player.style.left === '40px') || `Player is at left "${player.style.left}", top "${player.style.top}".`;
      }],
      ['ArrowUp moves up', (t) => {
        t.press('ArrowUp', { target: document.body });
        return t.$('#player').style.top === '0px' || `top is "${t.$('#player').style.top}".`;
      }],
      ['arrow keys stop the page from scrolling', (t) => t.press('ArrowDown', { target: document.body }).defaultPrevented || 'Call event.preventDefault() when you handle an arrow key.'],
      ['other keys are left alone', (t) => {
        const before = t.$('#player').style.left;
        const event = t.press('a', { target: document.body });
        if (event.defaultPrevented) return 'Only prevent the default for arrow keys, or typing elsewhere would break.';
        return t.$('#player').style.left === before || 'Pressing "a" moved the player.';
      }],
    ],
    hints: [
      'Use an if / else if chain on event.key, ending with else { return; } for every other key.',
      'After the chain: event.preventDefault(); player.style.left = `${x}px`; player.style.top = `${y}px`;',
    ],
    solution: [{ name: 'script.js', code: `const player = document.querySelector("#player");
let x = 0;
let y = 0;

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    x += 20;
  } else if (event.key === "ArrowLeft") {
    x -= 20;
  } else if (event.key === "ArrowDown") {
    y += 20;
  } else if (event.key === "ArrowUp") {
    y -= 20;
  } else {
    return;
  }
  event.preventDefault();
  player.style.left = \`\${x}px\`;
  player.style.top = \`\${y}px\`;
});
` }],
  },

  'search-box': {
    title: 'Add keyboard shortcuts to a search box',
    html: '<input id="search" placeholder="Search snacks (press / to jump here)" />\n<p id="feedback"></p>',
    css: '#search { width: 100%; max-width: 320px; padding: 8px 10px; border: 2px solid #b9dcdc; border-radius: 8px; }\n#search:focus { border-color: #19aab1; outline: none; }\n#feedback { font-weight: 700; }',
    height: 120,
    files: [{ name: 'script.js', code: `const search = document.querySelector("#search");
const feedback = document.querySelector("#feedback");

// 1. In the search box: Enter shows  Searching for "QUERY"…  in feedback
//    (or "Type something first." if the box is empty). Escape clears both.
// 2. Anywhere else on the page: pressing / moves focus into the search box.
` }],
    checks: [
      ['Enter shows what you are searching for', (t) => {
        const search = t.$('#search');
        search.focus();
        search.value = '  taho ';
        t.press('Enter', { target: search });
        const text = (t.text('#feedback') || '').replace('...', '…');
        return text === 'Searching for "taho"…' || `feedback says "${t.text('#feedback')}".`;
      }],
      ['Enter on an empty box asks for text', (t) => {
        const search = t.$('#search');
        search.value = '   ';
        t.press('Enter', { target: search });
        return t.text('#feedback') === 'Type something first.' || `feedback says "${t.text('#feedback')}".`;
      }],
      ['Escape clears the box and the message', (t) => {
        const search = t.$('#search');
        search.value = 'turon';
        t.press('Enter', { target: search });
        t.press('Escape', { target: search });
        return (search.value === '' && t.text('#feedback') === '') || 'On Escape, set search.value and feedback.textContent to "".';
      }],
      ['/ elsewhere jumps to the search box', (t) => {
        t.$('#search').blur();
        const event = t.press('/', { target: document.body });
        if (document.activeElement !== t.$('#search')) return 'When / is pressed outside the box, call search.focus().';
        return event.defaultPrevented || 'Call event.preventDefault() too, or the / would be typed into the box.';
      }],
      ['/ inside the box still types normally', (t) => {
        const search = t.$('#search');
        search.focus();
        return !t.press('/', { target: search }).defaultPrevented || 'Skip the shortcut when event.target is the search box.';
      }],
    ],
    hints: [
      'Use two listeners: one on search for Enter and Escape, and one on document for /.',
      'In the document listener: if (event.key === "/" && event.target !== search) { event.preventDefault(); search.focus(); }',
    ],
    solution: [{ name: 'script.js', code: `const search = document.querySelector("#search");
const feedback = document.querySelector("#feedback");

search.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const query = search.value.trim();
    if (query === "") {
      feedback.textContent = "Type something first.";
    } else {
      feedback.textContent = \`Searching for "\${query}"…\`;
    }
  } else if (event.key === "Escape") {
    search.value = "";
    feedback.textContent = "";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && event.target !== search) {
    event.preventDefault();
    search.focus();
  }
});
` }],
  },

  'price-module': {
    title: 'Export from one file, import in another',
    module: true,
    files: [
      { name: 'main.js', code: `// Import addTax (the default export) and formatPeso (a named export)
// from "./prices.js" here.

console.log(formatPeso(addTax(100)));
` },
      { name: 'prices.js', code: `// formatPeso(amount) returns text like "₱25.00". Export it by name.

// addTax(amount) returns amount × 1.12. Make it the default export.
` },
    ],
    checks: [
      ['prices.js exports formatPeso by name', async (t) => {
        const prices = await t.importFile('prices.js');
        return typeof prices.formatPeso === 'function' || 'Write export function formatPeso(amount) { ... } in prices.js.';
      }],
      ['formatPeso shows two decimal places', async (t) => {
        const { formatPeso } = await t.importFile('prices.js');
        const results = [formatPeso(25), formatPeso(3.5)];
        return (results[0] === '₱25.00' && results[1] === '₱3.50') || `formatPeso(25) gave ${JSON.stringify(results[0])} and formatPeso(3.5) gave ${JSON.stringify(results[1])}. Use amount.toFixed(2).`;
      }],
      ['addTax is the default export', async (t) => {
        const prices = await t.importFile('prices.js');
        if (typeof prices.default !== 'function') return 'Write export default function addTax(amount) { ... } in prices.js.';
        return Math.abs(prices.default(100) - 112) < 1e-9 || `addTax(100) gave ${prices.default(100)}.`;
      }],
      ['main.js logs ₱112.00', (t) => t.logs.includes('₱112.00') || `main.js should log ₱112.00. The console showed ${JSON.stringify(t.logs)}${t.errors.length ? ` and an error: ${t.errors[0]}` : ''}.`],
    ],
    hints: [
      'In prices.js, put export in front: export function formatPeso(amount) { return `₱${amount.toFixed(2)}`; }',
      'In main.js, one line imports both: import addTax, { formatPeso } from "./prices.js";',
    ],
    solution: [
      { name: 'main.js', code: `import addTax, { formatPeso } from "./prices.js";

console.log(formatPeso(addTax(100)));
` },
      { name: 'prices.js', code: `export function formatPeso(amount) {
  return \`₱\${amount.toFixed(2)}\`;
}

export default function addTax(amount) {
  return amount * 1.12;
}
` },
    ],
  },

  'scoreboard-class': {
    title: 'Write a Scoreboard class',
    files: [{ name: 'script.js', code: `class Scoreboard {
  constructor(playerName) {
    // Store playerName, and start points at 0.
  }

  // add(amount): add amount to points

  // reset(): set points back to 0

  // get summary(): return text like "Alex: 5 points" ("1 point" for one)
}

const alex = new Scoreboard("Alex");
alex.add(2);
alex.add(3);
console.log(alex.summary);
` }],
    checks: [
      ['Scoreboard is a class', (t) => typeof t.value('Scoreboard') === 'function' || 'Keep the class named Scoreboard.'],
      ['a new scoreboard starts at 0 points', (t) => {
        const Scoreboard = t.value('Scoreboard');
        const board = new Scoreboard('Bea');
        if (board.playerName !== 'Bea') return 'In the constructor, store the name: this.playerName = playerName;';
        return board.points === 0 || `points starts at ${board.points}. Set this.points = 0; in the constructor.`;
      }],
      ['add() adds to points', (t) => {
        const board = new (t.value('Scoreboard'))('Cy');
        board.add(2);
        board.add(3);
        return board.points === 5 || `After add(2) and add(3), points is ${board.points}.`;
      }],
      ['summary is a getter with the right text', (t) => {
        const board = new (t.value('Scoreboard'))('Alex');
        board.add(5);
        if (typeof board.summary === 'function') return 'Write get summary() { ... } so it works without parentheses.';
        return board.summary === 'Alex: 5 points' || `summary was ${JSON.stringify(board.summary)}.`;
      }],
      ['one point says "point"', (t) => {
        const board = new (t.value('Scoreboard'))('Dana');
        board.add(1);
        return board.summary === 'Dana: 1 point' || `With one point, summary was ${JSON.stringify(board.summary)}.`;
      }],
      ['reset() and separate objects', (t) => {
        const Scoreboard = t.value('Scoreboard');
        const first = new Scoreboard('A');
        const second = new Scoreboard('B');
        first.add(4);
        if (second.points !== 0) return 'Each scoreboard needs its own points. Store them on this, not in a shared variable.';
        first.reset();
        return first.points === 0 || 'reset() should set this.points back to 0.';
      }],
    ],
    hints: [
      'Inside methods, this is the scoreboard you called the method on: this.points += amount;',
      'A getter looks like a method with get in front: get summary() { return `${this.playerName}: ${this.points} points`; }',
    ],
    solution: [{ name: 'script.js', code: `class Scoreboard {
  constructor(playerName) {
    this.playerName = playerName;
    this.points = 0;
  }

  add(amount) {
    this.points += amount;
  }

  reset() {
    this.points = 0;
  }

  get summary() {
    if (this.points === 1) {
      return \`\${this.playerName}: 1 point\`;
    }
    return \`\${this.playerName}: \${this.points} points\`;
  }
}

const alex = new Scoreboard("Alex");
alex.add(2);
alex.add(3);
console.log(alex.summary);
` }],
  },

  'click-counter-class': {
    title: 'Give each button its own counter',
    html: '<button id="left">Left: 0</button>\n<button id="right">Right: 0</button>',
    css: 'button { padding: 8px 16px; margin-right: 8px; color: #fff; font-weight: 700; background: #087a80; border: 0; border-radius: 8px; cursor: pointer; }',
    height: 90,
    files: [{ name: 'script.js', code: `class ClickCounter {
  constructor(button, label) {
    this.button = button;
    this.label = label;
    this.count = 0;
    // Listen for clicks on this.button and call this.increment().
  }

  increment() {
    // Add 1 to this.count, then show it on the button, like "Left: 1".
  }
}

const left = new ClickCounter(document.querySelector("#left"), "Left");
const right = new ClickCounter(document.querySelector("#right"), "Right");
` }],
    checks: [
      ['clicking Left twice shows "Left: 2"', (t) => {
        const button = t.$('#left');
        t.click(button);
        t.click(button);
        if (t.errors.length) return `A click threw: ${t.errors[0]}. If it mentions undefined, use an arrow function so this stays the counter.`;
        return button.textContent === 'Left: 2' || `The left button says "${button.textContent}".`;
      }],
      ['Right keeps its own count', (t) => {
        t.click(t.$('#right'));
        return t.$('#right').textContent === 'Right: 1' || `The right button says "${t.$('#right').textContent}".`;
      }],
      ['the counters store their counts', (t) => (t.value('left').count === 2 && t.value('right').count === 1) || 'Each counter should keep its own this.count.'],
    ],
    hints: [
      'this.button.addEventListener("click", () => this.increment()); The arrow function keeps this pointing at the counter.',
      'In increment: this.count += 1; this.button.textContent = `${this.label}: ${this.count}`;',
    ],
    solution: [{ name: 'script.js', code: `class ClickCounter {
  constructor(button, label) {
    this.button = button;
    this.label = label;
    this.count = 0;
    this.button.addEventListener("click", () => this.increment());
  }

  increment() {
    this.count += 1;
    this.button.textContent = \`\${this.label}: \${this.count}\`;
  }
}

const left = new ClickCounter(document.querySelector("#left"), "Left");
const right = new ClickCounter(document.querySelector("#right"), "Right");
` }],
  },
};

export default exercises;
