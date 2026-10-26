const KEYS = ["q", "w", "e", "a", "s", "d", "z", "x", "c"];
const POP_DELAYS = { slow: 1100, normal: 850, fast: 600 };
const ROUND_SECONDS = 30;

const controls = document.querySelector("#controls");
const nameInput = document.querySelector("#player-name");
const speedSelect = document.querySelector("#speed");
const startButton = document.querySelector("#start-button");
const scoreDisplay = document.querySelector("#score");
const timeDisplay = document.querySelector("#time");
const message = document.querySelector("#message");

function createHole(key) {
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
  return hole;
}

function createBoard(boardElement) {
  const holes = [];
  for (const key of KEYS) {
    const hole = createHole(key);
    boardElement.append(hole);
    holes.push(hole);
  }
  return holes;
}

function randomHole(holes, previousHole) {
  let index = Math.floor(Math.random() * holes.length);
  while (holes[index] === previousHole) {
    index = Math.floor(Math.random() * holes.length);
  }
  return holes[index];
}

function showBot(hole) {
  hole.classList.add("up");
}

function hideBot(hole) {
  hole.classList.remove("up");
}

function rankFor(score) {
  if (score >= 25) {
    return "Legendary bopper";
  }
  if (score >= 15) {
    return "Quick hands";
  }
  if (score >= 5) {
    return "Nice warm-up";
  }
  return "MISAbot got away this time";
}

const holes = createBoard(document.querySelector("#board"));

let playerName = "Player";
let score = 0;
let misses = 0;
let timeLeft = ROUND_SECONDS;
let currentHole = null;
let isPlaying = false;
let popTimer = null;
let clockTimer = null;

function updateStats() {
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;
}

function popUp() {
  if (currentHole !== null) {
    hideBot(currentHole);
  }
  currentHole = randomHole(holes, currentHole);
  showBot(currentHole);
}

function startGame() {
  if (isPlaying) {
    return;
  }
  playerName = nameInput.value.trim() || "Player";
  score = 0;
  misses = 0;
  timeLeft = ROUND_SECONDS;
  isPlaying = true;
  controls.disabled = true;
  message.textContent = `Go, ${playerName}!`;
  updateStats();

  popUp();
  popTimer = setInterval(popUp, POP_DELAYS[speedSelect.value]);
  clockTimer = setInterval(tick, 1000);
}

function tick() {
  timeLeft -= 1;
  updateStats();
  if (timeLeft <= 0) {
    endGame();
  }
}

function endGame() {
  if (!isPlaying) {
    return;
  }
  isPlaying = false;
  clearInterval(popTimer);
  clearInterval(clockTimer);
  if (currentHole !== null) {
    hideBot(currentHole);
    currentHole = null;
  }
  controls.disabled = false;
  message.textContent = `${playerName}, you bopped ${score} bots and missed ${misses}. ${rankFor(score)}!`;
}

function bop(hole) {
  if (!isPlaying) {
    return;
  }
  if (hole === currentHole) {
    score += 1;
    hideBot(hole);
    currentHole = null;
    hole.classList.add("bopped");
    setTimeout(() => hole.classList.remove("bopped"), 250);
  } else {
    misses += 1;
  }
  updateStats();
}

function handleHoleClick(event) {
  bop(event.currentTarget);
}

for (const hole of holes) {
  hole.addEventListener("click", handleHoleClick);
}

startButton.addEventListener("click", startGame);
