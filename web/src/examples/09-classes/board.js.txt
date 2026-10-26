// Everything about building and changing the board lives here.
export const KEYS = ["q", "w", "e", "a", "s", "d", "z", "x", "c"];

// Not exported: only createBoard needs it.
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

export function createBoard(boardElement) {
  const holes = [];
  for (const key of KEYS) {
    const hole = createHole(key);
    boardElement.append(hole);
    holes.push(hole);
  }
  return holes;
}

export function randomHole(holes, previousHole) {
  let index = Math.floor(Math.random() * holes.length);
  while (holes[index] === previousHole) {
    index = Math.floor(Math.random() * holes.length);
  }
  return holes[index];
}

export function findHole(holes, key) {
  for (const hole of holes) {
    if (hole.dataset.key === key) {
      return hole;
    }
  }
  return null;
}

export function showBot(hole) {
  hole.classList.add("up");
}

export function hideBot(hole) {
  hole.classList.remove("up");
}
