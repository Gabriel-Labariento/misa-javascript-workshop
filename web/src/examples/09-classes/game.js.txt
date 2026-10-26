import { randomHole, showBot, hideBot } from "./board.js";
import rankFor from "./rank.js";

const POP_DELAYS = { slow: 1100, normal: 850, fast: 600 };
const ROUND_SECONDS = 30;

export default class Game {
  constructor(holes, ui) {
    this.holes = holes;
    this.ui = ui;
    this.playerName = "Player";
    this.score = 0;
    this.misses = 0;
    this.timeLeft = ROUND_SECONDS;
    this.currentHole = null;
    this.isPlaying = false;
    this.popTimer = null;
    this.clockTimer = null;
  }

  start(playerName, speed) {
    if (this.isPlaying) {
      return;
    }
    this.playerName = playerName;
    this.score = 0;
    this.misses = 0;
    this.timeLeft = ROUND_SECONDS;
    this.isPlaying = true;
    this.ui.controls.disabled = true;
    this.ui.message.textContent = `Go, ${playerName}!`;
    this.updateStats();

    this.popUp();
    this.popTimer = setInterval(() => this.popUp(), POP_DELAYS[speed]);
    this.clockTimer = setInterval(() => this.tick(), 1000);
  }

  popUp() {
    if (this.currentHole !== null) {
      hideBot(this.currentHole);
    }
    this.currentHole = randomHole(this.holes, this.currentHole);
    showBot(this.currentHole);
  }

  tick() {
    this.timeLeft -= 1;
    this.updateStats();
    if (this.timeLeft <= 0) {
      this.stop();
    }
  }

  bop(hole) {
    if (!this.isPlaying) {
      return;
    }
    if (hole === this.currentHole) {
      this.score += 1;
      hideBot(hole);
      this.currentHole = null;
      hole.classList.add("bopped");
      setTimeout(() => hole.classList.remove("bopped"), 250);
    } else {
      this.misses += 1;
    }
    this.updateStats();
  }

  stop() {
    if (!this.isPlaying) {
      return;
    }
    this.isPlaying = false;
    clearInterval(this.popTimer);
    clearInterval(this.clockTimer);
    if (this.currentHole !== null) {
      hideBot(this.currentHole);
      this.currentHole = null;
    }
    this.ui.controls.disabled = false;
    this.ui.message.textContent = `${this.playerName}, you bopped ${this.score} bots with ${this.accuracy}% accuracy. ${rankFor(this.score)}!`;
  }

  get accuracy() {
    const attempts = this.score + this.misses;
    if (attempts === 0) {
      return 0;
    }
    return Math.round((this.score / attempts) * 100);
  }

  updateStats() {
    this.ui.score.textContent = this.score;
    this.ui.time.textContent = this.timeLeft;
  }
}
