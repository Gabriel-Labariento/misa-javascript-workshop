const KEYS = ["q", "w", "e", "a", "s", "d", "z", "x", "c"];
const POP_DELAYS = { slow: 1100, normal: 850, fast: 600 };

let playerName = prompt("What should we call you?") || "";
playerName = playerName.trim();
if (playerName === "") {
  playerName = "Player";
}

let speed = prompt("Choose a speed: slow, normal, or fast") || "";
speed = speed.trim().toLowerCase();

let popDelay = POP_DELAYS[speed];
if (popDelay === undefined) {
  speed = "normal";
  popDelay = POP_DELAYS.normal;
}

const greeting = document.querySelector("#greeting");
greeting.textContent = `Hi, ${playerName}! Speed: ${speed}. MISAbot pops up every ${popDelay / 1000} seconds.`;

const board = document.querySelector("#board");
const holes = [];

for (const key of KEYS) {
  const hole = document.createElement("div");
  hole.className = "hole";
  hole.dataset.key = key;

  const bot = document.createElement("img");
  bot.className = "bot";
  bot.src = "assets/misabot.png";
  bot.alt = "";

  const label = document.createElement("span");
  label.className = "key";
  label.textContent = key.toUpperCase();

  hole.append(bot, label);
  board.append(hole);
  holes.push(hole);
}

console.log("Holes on the board:", holes.length);

// Peek: show MISAbot in the middle hole so you can see the board working.
holes[4].classList.add("up");
