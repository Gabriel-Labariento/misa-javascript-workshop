import { storage } from './playground/ui.js';

// <misa-companion> (src/components/Companion.astro): the reading-progress bar,
// MISAbot's corner peek, and the end-of-page celebration. It listens for the
// misa:predict, misa:run, and misa:check events from the lesson elements.

const LINES = {
  hello: ["Hi, I'm MISAbot! I'll keep you company while you read."],
  welcomeBack: ['Welcome back! You already finished this one. Nice.', 'Back for a second look? Good idea.'],
  nudge: ['Make a guess before you scroll on!', 'Quick, what do you think happens?', 'Pick an answer. Guessing wrong still helps!'],
  right: ['Nailed it!', 'Correct! You read that code like a pro.', 'Yes! Big brain moment.', "That's it. You're getting good at this."],
  wrong: ['Tricky one! The explanation just below shows why.', 'Ooh, close. Read why, then try the next one.', 'Wrong guesses teach the most. Read on!'],
  run: ['You ran it! Now try changing something.', 'Ooh, it runs! What happens if you edit a line?', 'Nice! Poke at the code and run it again.'],
  solved: ['You solved it!', 'All checks passed. Look at you go!', 'Solved! MISAbot is proud of you.'],
  notYet: ['Almost! Read the first ✗ and try again.', 'Not yet. A hint might help!', 'So close. You can do this!'],
  halfway: ['Halfway there! Keep going.', "You're halfway through. Nice pace!"],
  finish: ['You did it!', 'Lesson done! High five!', 'Woohoo! On to the next one?'],
  poke: ['Hehe, that tickles!', 'Beep boop!', "I'm rooting for you!", 'Need a break? Stretch, then come back.', 'Every programmer started right where you are.'],
};
const MIN_READ_MS = 60_000;
const SAY_MS = 4500;
const CONFETTI = ['#19aab1', '#ffc94d', '#ff7aa8', '#8f7aff', '#7ad66b'];

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];
const clamp = (value) => Math.min(1, Math.max(0, value));

class CompanionElement extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    const config = JSON.parse(this.dataset.config || '{}');
    const store = storage();
    const doneKey = (id) => `misa-js:read:${id}`;
    const isLesson = config.lessonNumber > 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const startedAt = performance.now();
    let engaged = false;

    const content = document.querySelector('.sl-markdown-content');
    const fill = this.querySelector('.misa-progress-fill');
    const rider = this.querySelector('.misa-progress-rider');
    const dock = this.querySelector('.misa-dock');
    const bubble = this.querySelector('.misa-bubble');
    const dockBot = this.querySelector('.misa-dock-bot');
    const dockFace = dockBot.querySelector('.misabot');
    const finish = this.querySelector('.misa-finish');
    const sentinel = this.querySelector('.misa-finish-sentinel');
    // The fixed pieces leave the content column so the page's sticky bars can't cover them.
    const progressBar = this.querySelector('.misa-progress');
    document.body.append(progressBar, dock);
    const setProgress = (value) => progressBar.style.setProperty('--misa-progress', value);

    // MISAbot pops up in the corner, says a line, then sinks back to a peek.
    let sayTimer = 0;
    const say = (text, mood = '') => {
      bubble.textContent = text;
      dockFace.classList.remove('is-happy', 'is-curious', 'is-cheering');
      if (mood) {
        void dockFace.getBoundingClientRect();
        dockFace.classList.add(`is-${mood}`);
      }
      dock.classList.add('is-up');
      clearTimeout(sayTimer);
      sayTimer = setTimeout(() => {
        dock.classList.remove('is-up');
        dockFace.classList.remove('is-happy', 'is-curious', 'is-cheering');
      }, SAY_MS);
    };

    const confetti = (from) => {
      if (reduceMotion.matches) return;
      const box = from.getBoundingClientRect();
      const burst = document.createElement('div');
      burst.className = 'misa-confetti';
      burst.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < 28; i++) {
        const piece = document.createElement('span');
        const angle = (Math.PI * 2 * i) / 28 + Math.random() * 0.4;
        const distance = 70 + Math.random() * 90;
        piece.style.left = `${box.left + box.width / 2}px`;
        piece.style.top = `${box.top + box.height / 3}px`;
        piece.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
        piece.style.setProperty('--dy', `${Math.sin(angle) * distance - 60}px`);
        piece.style.setProperty('--spin', `${Math.round(Math.random() * 720 - 360)}deg`);
        piece.style.background = CONFETTI[i % CONFETTI.length];
        burst.append(piece);
      }
      document.body.append(burst);
      setTimeout(() => burst.remove(), 1600);
    };

    // Reading progress: how far the article has scrolled past the top of the window.
    let saidHalfway = false;
    let movingTimer = 0;
    let frame = 0;
    const updateProgress = () => {
      frame = 0;
      if (!content) return;
      const box = content.getBoundingClientRect();
      const top = box.top + window.scrollY;
      const distance = box.height - window.innerHeight * 0.6;
      const progress = distance > 0 ? clamp((window.scrollY + window.innerHeight * 0.25 - top) / distance) : 1;
      setProgress(progress.toFixed(4));
      rider.querySelector('.misabot').classList.toggle('is-happy', progress >= 0.995);
      if (isLesson && !saidHalfway && progress >= 0.5 && progress < 0.9) {
        saidHalfway = true;
        say(pick(LINES.halfway), 'happy');
      }
    };
    const onScroll = () => {
      rider.classList.add('is-moving');
      clearTimeout(movingTimer);
      movingTimer = setTimeout(() => rider.classList.remove('is-moving'), 180);
      if (!frame) frame = requestAnimationFrame(updateProgress);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateProgress();

    // Reactions to the lesson's interactive pieces.
    let ranOnce = false;
    document.addEventListener('misa:predict', (event) => {
      engaged = true;
      say(pick(event.detail.correct ? LINES.right : LINES.wrong), event.detail.correct ? 'happy' : 'curious');
    });
    document.addEventListener('misa:run', () => {
      engaged = true;
      if (ranOnce) return;
      ranOnce = true;
      say(pick(LINES.run), 'happy');
    });
    document.addEventListener('misa:check', (event) => {
      engaged = true;
      if (event.detail.passed) {
        say(pick(LINES.solved), 'cheering');
        confetti(event.target);
      } else {
        say(pick(LINES.notYet), 'curious');
      }
    });
    dockBot.addEventListener('click', () => say(pick(LINES.poke), 'happy'));

    // Nudge passive readers once, when the first unanswered prediction comes into view.
    const firstPredict = document.querySelector('js-predict');
    if (firstPredict && 'IntersectionObserver' in window) {
      const watcher = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        watcher.disconnect();
        if (!firstPredict.querySelector('.pg-choice:disabled')) say(pick(LINES.nudge), 'curious');
      }, { threshold: 0.6 });
      watcher.observe(firstPredict);
    }

    // The end-of-page card. It counts toward the lesson total only after a real read.
    const finishTitle = finish.querySelector('.misa-finish-title');
    const count = finish.querySelector('.misa-finish-count');
    const showFinish = () => {
      const counted = engaged || performance.now() - startedAt >= MIN_READ_MS;
      if (isLesson && counted && store) {
        try {
          store.setItem(doneKey(config.id), '1');
        } catch {
          /* storage full or blocked */
        }
      }
      if (isLesson && store) {
        const done = config.lessons.filter((id) => store.getItem(doneKey(id))).length;
        if (done > 0) {
          count.textContent = done === config.lessons.length
            ? `That's all ${done} lessons. You built the whole game!`
            : `You've finished ${done} of ${config.lessons.length} lessons.`;
          count.hidden = false;
        }
      }
      if (isLesson && !counted) {
        // Skimmed straight to the bottom: no "complete" yet.
        finish.querySelector('.misa-finish-kicker').textContent = `End of lesson ${String(config.lessonNumber).padStart(2, '0')}`;
        finishTitle.textContent = 'You reached the end!';
      }
      finish.hidden = false;
      requestAnimationFrame(() => finish.classList.add('is-in'));
      if (isLesson && counted) {
        say(pick(LINES.finish), 'cheering');
        confetti(finish.querySelector('.misa-finish-bot'));
      }
    };
    if ('IntersectionObserver' in window) {
      const watcher = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        watcher.disconnect();
        showFinish();
      });
      watcher.observe(sentinel);
    } else {
      finish.hidden = false;
    }

    // A first hello, or a welcome back on a lesson already finished.
    let greeting = '';
    if (store && !store.getItem('misa-js:met')) {
      greeting = LINES.hello[0];
      try {
        store.setItem('misa-js:met', '1');
      } catch {
        /* storage full or blocked */
      }
    } else if (isLesson && store && store.getItem(doneKey(config.id))) {
      greeting = pick(LINES.welcomeBack);
    }
    if (greeting) setTimeout(() => say(greeting, 'happy'), 1200);
  }
}

if (!customElements.get('misa-companion')) customElements.define('misa-companion', CompanionElement);
