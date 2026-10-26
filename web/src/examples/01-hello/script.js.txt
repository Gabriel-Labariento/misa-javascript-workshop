console.log("Hello, world!");

const playerName = prompt("What should we call you?");
const greeting = document.querySelector("#greeting");
greeting.textContent = `Hi, ${playerName}! Get ready to bop the bot.`;
console.log("Greeting shown for", playerName);
