# MISA JavaScript workshop

Build **Bop the Bot**, a small browser game, while learning JavaScript basics, mouse and keyboard events, and modules and classes. This workshop is for beginner programmers; no JavaScript experience is needed.

[Website source](web/) · [Setup](web/src/content/docs/setup.mdx) · [Recovery](web/src/content/docs/checkpoints.mdx)

## Get started

```bash
git clone https://github.com/youth-of-may/misa-javascript-workshop.git
cd misa-javascript-workshop
git checkout 00-start
git checkout -b my-game
cd workshop
code .
```

Install the **Live Preview** extension (`code --install-extension ms-vscode.live-server`), right-click `index.html`, and choose **Show Preview**. Open the page's address in your browser and open the console: you should see `Hello, world!`. You need Git, VS Code, and a current browser. Students do not need Node.js.

`main` contains the guide and website. The learner files start on `00-start`; the finished game is on `09-classes`. Stay on your own branch as you edit. Save and commit your work before using a reference checkpoint.

<!-- CHECKPOINTS:START -->
| Checkpoint | Lesson |
| --- | --- |
| [00-start](https://github.com/youth-of-may/misa-javascript-workshop/tree/00-start/workshop) | [01 · Say hello](web/src/content/docs/build/hello.mdx) |
| [01-hello](https://github.com/youth-of-may/misa-javascript-workshop/tree/01-hello/workshop) | [01 · Say hello](web/src/content/docs/build/hello.mdx) |
| [02-decisions](https://github.com/youth-of-may/misa-javascript-workshop/tree/02-decisions/workshop) | [02 · Make decisions](web/src/content/docs/build/decisions.mdx) |
| [03-board](https://github.com/youth-of-may/misa-javascript-workshop/tree/03-board/workshop) | [03 · Build the board](web/src/content/docs/build/board.mdx) |
| [04-functions](https://github.com/youth-of-may/misa-javascript-workshop/tree/04-functions/workshop) | [04 · Give your code a job](web/src/content/docs/build/functions.mdx) |
| [05-clicks](https://github.com/youth-of-may/misa-javascript-workshop/tree/05-clicks/workshop) | [05 · Listen for clicks](web/src/content/docs/build/clicks.mdx) |
| [06-mouse](https://github.com/youth-of-may/misa-javascript-workshop/tree/06-mouse/workshop) | [06 · Follow the mouse](web/src/content/docs/build/mouse.mdx) |
| [07-keyboard](https://github.com/youth-of-may/misa-javascript-workshop/tree/07-keyboard/workshop) | [07 · Use the keyboard](web/src/content/docs/build/keyboard.mdx) |
| [08-modules](https://github.com/youth-of-may/misa-javascript-workshop/tree/08-modules/workshop) | [08 · Split code into modules](web/src/content/docs/build/modules.mdx) |
| [09-classes](https://github.com/youth-of-may/misa-javascript-workshop/tree/09-classes/workshop) | [09 · Build a class](web/src/content/docs/build/classes.mdx) |
<!-- CHECKPOINTS:END -->

The website's [browser playground](web/src/content/docs/playground.mdx) runs every checkpoint without local setup. It is the fallback when installing tools gets in the way.

## Work on the website

Use Node.js 22.12 or newer:

```bash
cd web
pnpm install
pnpm dev
pnpm test
pnpm check
pnpm build
```

The lessons are MDX files under `web/src/content/docs`. Interactive pieces are Astro components in `web/src/components`:

| Component | What it does |
| --- | --- |
| `Playground` | Wraps fenced code blocks (`html`, `css`, `js`) in an editor with **Run**, a sandboxed preview, and a console. Add `module` for multi-file `import`/`export` examples; give each file a `title="name.js"`. |
| `Exercise` | A practice task with automatic checks, hints, and a solution. Task text goes between the tags; code and checks live in `web/src/data/exercises.mjs`. |
| `Predict` | A multiple-choice "what will this do?" question. The first code block is shown; the text after it is revealed once the learner answers. |
| `EventLab` | A live inspector for mouse or keyboard events (`kind="mouse"` or `kind="keyboard"`). |
| `Stepper` | Steps through a short program one line at a time (`kind="loop"`, `"event"`, or `"class"`). |
| `Checkpoint` | Recovery links and the full working files for a checkpoint. |

Learner code runs in a sandboxed `iframe` with its own origin. Loops get a small guard inserted so an infinite loop stops with a message instead of freezing the page (`web/src/lib/playground/guard.js`).

`web/src/examples` holds the checkpoint files as `.txt` sources; they are displayed in lessons, loaded by the playground, and copied into checkpoint branches. `web/src/data/checkpoints.json` defines checkpoint names, lessons, files, and expected behavior.

From the repository root, check the examples, then sync a checkpoint branch:

```bash
node scripts/validate_workshop.mjs
git checkout 05-clicks
node scripts/sync_checkpoint.mjs 05-clicks
```

The repository URL appears in the guides, `web/src/data/site.json`, and `web/astro.config.mjs`. If you publish under a different account or organization, replace `youth-of-may/misa-javascript-workshop` everywhere it appears.

The site deploys as a static Astro build. On Vercel, use `web` as the project root.
