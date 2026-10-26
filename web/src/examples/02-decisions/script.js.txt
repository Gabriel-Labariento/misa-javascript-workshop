let playerName = prompt("What should we call you?") || "";
playerName = playerName.trim();
if (playerName === "") {
  playerName = "Player";
}

let speed = prompt("Choose a speed: slow, normal, or fast") || "";
speed = speed.trim().toLowerCase();

let popDelay;
if (speed === "slow") {
  popDelay = 1100;
} else if (speed === "fast") {
  popDelay = 600;
} else {
  speed = "normal";
  popDelay = 850;
}

const greeting = document.querySelector("#greeting");
greeting.textContent = `Hi, ${playerName}! Speed: ${speed}. MISAbot pops up every ${popDelay / 1000} seconds.`;
console.log("Pop delay in milliseconds:", popDelay);
