import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { remarkPlayground } from './src/plugins/remark-playground.mjs';
const SITE = 'https://js.gmpl.dev';
// The link-preview image; redraw it with scripts/make_share_image.mjs.
const SHARE_IMAGE = `${SITE}/og.png`;
const SHARE_ALT = 'MISAbot cheering next to the words JavaScript Workshop. Build Bop the Bot, a little browser game, and learn JS one step at a time.';

export default defineConfig({
  site: SITE,
  // Old JS-only addresses, kept working after lessons moved under /javascript/.
  redirects: {
    '/bop-the-bot': '/javascript/bop-the-bot',
    '/build/hello': '/javascript/hello',
    '/build/decisions': '/javascript/decisions',
    '/build/board': '/javascript/board',
    '/build/functions': '/javascript/functions',
    '/build/clicks': '/javascript/clicks',
    '/build/mouse': '/javascript/mouse',
    '/build/keyboard': '/javascript/keyboard',
    '/build/modules': '/javascript/modules',
    '/build/classes': '/javascript/classes',
    '/build/test': '/javascript/test',
    '/moving-forward': '/javascript/moving-forward',
    '/moving-forward/arrays': '/javascript/moving-forward/arrays',
    '/moving-forward/text': '/javascript/moving-forward/text',
    '/moving-forward/events': '/javascript/moving-forward/events',
    '/moving-forward/pointer-events': '/javascript/moving-forward/pointer-events',
    '/moving-forward/inheritance': '/javascript/moving-forward/inheritance',
    '/moving-forward/storage': '/javascript/moving-forward/storage',
    '/moving-forward/publishing': '/javascript/moving-forward/publishing',
    '/projects': '/javascript/projects',
    '/projects/typing-trainer': '/javascript/projects/typing-trainer',
    '/projects/sticker-board': '/javascript/projects/sticker-board',
    '/projects/flashcards': '/javascript/projects/flashcards',
  },
  markdown: { remarkPlugins: [remarkPlayground] },
  integrations: [starlight({
    title: 'Web Development Workshop',
    head: [
      { tag: 'meta', attrs: { property: 'og:image', content: SHARE_IMAGE } },
      { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
      { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
      { tag: 'meta', attrs: { property: 'og:image:alt', content: SHARE_ALT } },
      { tag: 'meta', attrs: { name: 'twitter:image', content: SHARE_IMAGE } },
      { tag: 'meta', attrs: { name: 'twitter:image:alt', content: SHARE_ALT } },
    ],
    logo: { src: './public/assets/misa-mark.svg', replacesTitle: false },
    favicon: '/assets/misa-mark.svg',
    social: [{ icon: 'github', label: 'Workshop repository', href: 'https://github.com/Gabriel-Labariento/misa-javascript-workshop' }],
    customCss: ['./src/styles/custom.css', './src/styles/playground.css', './src/styles/companion.css'],
    components: { Footer: './src/components/Footer.astro' },
    sidebar: [
      { label: 'Start here', collapsed: false, items: [
        {label:'Welcome',slug:''},
        {label:'Setup and playground',slug:'setup'}
      ] },
      { label: '1 · HTML', collapsed: true, items: [
        {label:'What is HTML?',slug:'html'},
        {label:'Text and links',slug:'html/text'},
        {label:'Images and attributes',slug:'html/images'},
        {label:'Page structure',slug:'html/structure'},
        {label:'Forms and buttons',slug:'html/forms'}
      ] },
      { label: '2 · CSS', collapsed: true, items: [
        {label:'What is CSS?',slug:'css'},
        {label:'Selectors',slug:'css/selectors'},
        {label:'Colors and text',slug:'css/text'},
        {label:'The box model',slug:'css/box-model'},
        {label:'Flexbox',slug:'css/flexbox'},
        {label:'Grid',slug:'css/grid'},
        {label:'Centering',slug:'css/centering'},
        {label:'Practice as a team',slug:'css/practice'}
      ] },
      { label: '3 · Git', collapsed: true, items: [
        {label:'Git and GitHub',slug:'git-github'},
        {label:'Set up GitHub',slug:'git/setup'},
        {label:'Everyday actions',slug:'git/actions'},
        {label:'One change, start to finish',slug:'git/workflow'},
        {label:'Git in the terminal',slug:'git/terminal'},
        {label:'Class Wall',slug:'git/class-wall'}
      ] },
      { label: '4 · Tailwind', collapsed: true, items: [{label:'Coming soon',slug:'tailwind'}] },
      { label: '5 · JavaScript', collapsed: true, items: [
        {label:'Build Bop the Bot',slug:'javascript/bop-the-bot'},
        {label:'What is JavaScript?',slug:'javascript'},
        { label: 'Part 1 · Intro to JavaScript', items: [
          {label:'01 · Say hello',slug:'javascript/hello'},
          {label:'02 · Make decisions',slug:'javascript/decisions'},
          {label:'03 · Build the board',slug:'javascript/board'},
          {label:'04 · Give your code a job',slug:'javascript/functions'}
        ] },
        { label: 'Part 2 · Mouse and keyboard', collapsed: true, items: [
          {label:'05 · Listen for clicks',slug:'javascript/clicks'},
          {label:'06 · Follow the mouse',slug:'javascript/mouse'},
          {label:'07 · Use the keyboard',slug:'javascript/keyboard'}
        ] },
        { label: 'Part 3 · Modules and classes', collapsed: true, items: [
          {label:'08 · Split code into modules',slug:'javascript/modules'},
          {label:'09 · Build a class',slug:'javascript/classes'},
          {label:'10 · Test and personalize',slug:'javascript/test'}
        ] },
        { label: 'Moving forward', collapsed: true, items: [
          {label:'Where to go next',slug:'javascript/moving-forward'},
          {label:'More with arrays',slug:'javascript/moving-forward/arrays'},
          {label:'Work with text',slug:'javascript/moving-forward/text'},
          {label:'Events in depth',slug:'javascript/moving-forward/events'},
          {label:'Mouse, touch, and pen',slug:'javascript/moving-forward/pointer-events'},
          {label:'Reuse with inheritance',slug:'javascript/moving-forward/inheritance'},
          {label:'Remember a high score',slug:'javascript/moving-forward/storage'},
          {label:'Put your game online',slug:'javascript/moving-forward/publishing'}
        ] },
        { label: 'Projects', collapsed: true, items: [
          {label:'Pick a project',slug:'javascript/projects'},
          {label:'Typing trainer',slug:'javascript/projects/typing-trainer'},
          {label:'Sticker board',slug:'javascript/projects/sticker-board'},
          {label:'Flashcard deck',slug:'javascript/projects/flashcards'}
        ] }
      ] },
      { label: '6 · React', collapsed: true, items: [{label:'Coming soon',slug:'react'}] },
      { label: '7 · Next.js', collapsed: true, items: [{label:'Coming soon',slug:'next'}] },
      { label: '★ Final project', collapsed: true, items: [{label:'About the project',slug:'final-project'}] },
      { label: 'Keep these handy', collapsed: false, items: [{label:'Checkpoints and recovery',slug:'checkpoints'},{label:'Troubleshooting',slug:'help'},{label:'Open the playground',slug:'playground'}] }
    ]
  })]
});
