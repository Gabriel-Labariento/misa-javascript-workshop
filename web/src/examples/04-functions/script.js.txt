const KEYS = ["q", "w", "e", "a", "s", "d", "z", "x", "c"];
const POP_DELAYS = { slow: 1100, normal: 850, fast: 600 };

function askName() {
  let answer = prompt("What should we call you?") || "";
  answer = answer.trim();
  if (answer === "") {
    return "Player";
  }
  return answer;
}

function askSpeed() {
  let answer = prompt("Choose a speed: slow, normal, or fast") || "";
  answer = answer.trim().toLowerCase();
  if (POP_DELAYS[answer] === undefined) {
    return "normal";
  }
  return answer;
}

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

const playerName = askName();
const speed = askSpeed();
const popDelay = POP_DELAYS[speed];

const greeting = document.querySelector("#greeting");
greeting.textContent = `Hi, ${playerName}! Speed: ${speed}. Watch MISAbot pop up for 10 seconds.`;

const holes = createBoard(document.querySelector("#board"));
let currentHole = null;

function popUp() {
  if (currentHole !== null) {
    hideBot(currentHole);
  }
  currentHole = randomHole(holes, currentHole);
  showBot(currentHole);
}

const popTimer = setInterval(popUp, popDelay);

setTimeout(() => {
  clearInterval(popTimer);
  hideBot(currentHole);
  greeting.textContent = `Demo over, ${playerName}. Next, you'll get to bop it.`;
}, 10000);
